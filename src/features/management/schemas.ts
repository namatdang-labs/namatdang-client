import { z } from "zod"

const phonePattern = /^(0\d{1,2})-?\d{3,4}-?\d{4}$/

export const storeFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "가게 이름을 2자 이상 입력해 주세요.")
      .max(40, "가게 이름은 40자까지 입력할 수 있어요."),
    category: z.string().min(1, "가게 종류를 선택해 주세요."),
    phone: z
      .string()
      .trim()
      .regex(phonePattern, "연락처를 02-1234-5678 형식으로 입력해 주세요."),
    address: z.string().trim().min(5, "도로명 주소를 입력해 주세요."),
    addressDetail: z
      .string()
      .trim()
      .max(60, "상세 주소는 60자까지 입력할 수 있어요."),
    pickupStart: z.string().min(1, "픽업 시작 시간을 선택해 주세요."),
    pickupEnd: z.string().min(1, "픽업 종료 시간을 선택해 주세요."),
    pickupGuide: z
      .string()
      .trim()
      .max(200, "픽업 안내는 200자까지 입력할 수 있어요."),
    description: z
      .string()
      .trim()
      .max(300, "가게 소개는 300자까지 입력할 수 있어요."),
  })
  .refine((values) => values.pickupEnd > values.pickupStart, {
    path: ["pickupEnd"],
    message: "종료 시간은 시작 시간보다 늦게 선택해 주세요.",
  })

export type StoreFormValues = z.infer<typeof storeFormSchema>

const dealItemSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "품목 이름을 입력해 주세요.")
      .max(60, "품목 이름은 60자까지 입력할 수 있어요."),
    originalPrice: z
      .number({ error: "정가를 숫자로 입력해 주세요." })
      .int("정가는 원 단위로 입력해 주세요.")
      .min(100, "정가는 100원 이상 입력해 주세요."),
    salePrice: z
      .number({ error: "할인가를 숫자로 입력해 주세요." })
      .int("할인가는 원 단위로 입력해 주세요.")
      .min(100, "할인가는 100원 이상 입력해 주세요."),
    stock: z
      .number({ error: "판매 수량을 숫자로 입력해 주세요." })
      .int("판매 수량은 정수로 입력해 주세요.")
      .min(1, "판매 수량을 1개 이상 입력해 주세요.")
      .max(999, "판매 수량은 999개까지 입력할 수 있어요."),
  })
  .refine((values) => values.salePrice < values.originalPrice, {
    path: ["salePrice"],
    message: "할인가는 정가보다 낮게 입력해 주세요.",
  })

export const dealFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "할인 이름을 2자 이상 입력해 주세요.")
      .max(60, "할인 이름은 60자까지 입력할 수 있어요."),
    description: z
      .string()
      .trim()
      .max(300, "상품 설명은 300자까지 입력할 수 있어요."),
    items: z.array(dealItemSchema).min(1, "품목을 한 개 이상 등록해 주세요."),
    pickupStart: z.string().min(1, "픽업 시작 시간을 선택해 주세요."),
    pickupEnd: z.string().min(1, "픽업 종료 시간을 선택해 주세요."),
  })
  .refine((values) => values.pickupEnd > values.pickupStart, {
    path: ["pickupEnd"],
    message: "픽업 종료 시간은 시작 시간보다 늦게 선택해 주세요.",
  })

export type DealFormValues = z.infer<typeof dealFormSchema>
