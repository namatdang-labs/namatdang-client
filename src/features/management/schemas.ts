import { z } from "zod"

const phonePattern = /^(0\d{1,2})-?\d{3,4}-?\d{4}$/

const latitudeSchema = z
  .number()
  .finite("위도 정보가 올바르지 않아요.")
  .min(-90, "위도 정보가 올바르지 않아요.")
  .max(90, "위도 정보가 올바르지 않아요.")
  .nullable()

const longitudeSchema = z
  .number()
  .finite("경도 정보가 올바르지 않아요.")
  .min(-180, "경도 정보가 올바르지 않아요.")
  .max(180, "경도 정보가 올바르지 않아요.")
  .nullable()

export const storeFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "가게 이름을 2자 이상 입력해 주세요.")
      .max(100, "가게 이름은 100자까지 입력할 수 있어요."),
    phone: z
      .string()
      .trim()
      .refine(
        (value) => !value || phonePattern.test(value),
        "연락처를 02-1234-5678 형식으로 입력해 주세요.",
      ),
    address: z
      .string()
      .trim()
      .min(5, "도로명 주소를 입력해 주세요.")
      .max(255, "주소는 255자까지 입력할 수 있어요."),
    addressDetail: z
      .string()
      .trim()
      .max(255, "상세 주소는 255자까지 입력할 수 있어요."),
    description: z
      .string()
      .trim()
      .max(1000, "가게 소개는 1000자까지 입력할 수 있어요."),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
  })
  .superRefine(({ latitude, longitude }, context) => {
    const hasLatitude = latitude !== null
    const hasLongitude = longitude !== null

    if (hasLatitude !== hasLongitude) {
      const message =
        "위치 정보가 완전하지 않아요. 주소로 위치를 다시 찾아 주세요."
      context.addIssue({ code: "custom", path: ["latitude"], message })
      context.addIssue({ code: "custom", path: ["longitude"], message })
    }
  })

export type StoreFormValues = z.infer<typeof storeFormSchema>

export const storeRegistrationFormSchema = storeFormSchema.superRefine(
  ({ latitude, longitude }, context) => {
    if (latitude === null && longitude === null) {
      context.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "주소로 위치를 찾은 뒤 지도에서 확인해 주세요.",
      })
    }
  },
)

const dealItemSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "품목 이름을 입력해 주세요.")
      .max(50, "품목 이름은 50자까지 입력할 수 있어요."),
    originalPrice: z
      .number({ error: "정가를 숫자로 입력해 주세요." })
      .int("정가는 원 단위로 입력해 주세요.")
      .min(100, "정가는 100원 이상 입력해 주세요.")
      .max(1_000_000, "정가는 1,000,000원까지 입력할 수 있어요."),
    salePrice: z
      .number({ error: "할인가를 숫자로 입력해 주세요." })
      .int("할인가는 원 단위로 입력해 주세요.")
      .min(100, "할인가는 100원 이상 입력해 주세요.")
      .max(1_000_000, "할인가는 1,000,000원까지 입력할 수 있어요."),
    totalQuantity: z
      .number({ error: "판매 수량을 숫자로 입력해 주세요." })
      .int("판매 수량은 정수로 입력해 주세요.")
      .min(1, "판매 수량을 1개 이상 입력해 주세요.")
      .max(99, "판매 수량은 99개까지 입력할 수 있어요."),
  })
  .refine((values) => values.salePrice < values.originalPrice, {
    path: ["salePrice"],
    message: "할인가는 정가보다 낮게 입력해 주세요.",
  })

export const dealFormSchema = z
  .object({
    description: z
      .string()
      .trim()
      .max(500, "할인 안내는 500자까지 입력할 수 있어요."),
    items: z
      .array(dealItemSchema)
      .min(1, "품목을 한 개 이상 등록해 주세요.")
      .max(10, "품목은 10개까지 등록할 수 있어요."),
    salesEndsAt: z.string().min(1, "예약 마감 시각을 선택해 주세요."),
  })
  .superRefine(({ salesEndsAt }, context) => {
    if (!salesEndsAt) return

    const endTime = new Date(salesEndsAt).getTime()
    if (!Number.isFinite(endTime)) {
      context.addIssue({
        code: "custom",
        path: ["salesEndsAt"],
        message: "예약 마감 시각을 다시 선택해 주세요.",
      })
      return
    }

    const timeUntilEnd = endTime - Date.now()
    if (timeUntilEnd < 10 * 60 * 1000) {
      context.addIssue({
        code: "custom",
        path: ["salesEndsAt"],
        message: "예약 마감은 지금부터 10분 이후로 선택해 주세요.",
      })
    } else if (timeUntilEnd > 24 * 60 * 60 * 1000) {
      context.addIssue({
        code: "custom",
        path: ["salesEndsAt"],
        message: "예약 마감은 지금부터 24시간 안으로 선택해 주세요.",
      })
    }
  })

export type DealFormValues = z.infer<typeof dealFormSchema>
