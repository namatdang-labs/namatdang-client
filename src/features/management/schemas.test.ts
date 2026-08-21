import { describe, expect, test } from "vitest"
import {
  dealFormSchema,
  storeFormSchema,
  storeRegistrationFormSchema,
  type DealFormValues,
  type StoreFormValues,
} from "./schemas"

const validStoreValues: StoreFormValues = {
  name: "성수 오늘빵",
  phone: "02-1234-5678",
  address: "서울 성동구 연무장길 18",
  addressDetail: "1층",
  description: "오늘 구운 빵을 준비해요.",
  latitude: 37.54291,
  longitude: 127.05481,
}

describe("가게 위치 폼 검증", () => {
  test("위도와 경도가 모두 있고 범위가 올바르면 통과한다", () => {
    expect(storeFormSchema.safeParse(validStoreValues).success).toBe(true)
  })

  test("위도와 경도 중 하나만 있으면 양쪽 필드에 무결성 오류를 남긴다", () => {
    const result = storeFormSchema.safeParse({
      ...validStoreValues,
      longitude: null,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(({ path }) => path[0])).toEqual(
        expect.arrayContaining(["latitude", "longitude"]),
      )
    }
  })

  test("좌표가 저장 범위를 벗어나면 거부한다", () => {
    const result = storeFormSchema.safeParse({
      ...validStoreValues,
      latitude: 91,
      longitude: -181,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(({ path }) => path[0])).toEqual(
        expect.arrayContaining(["latitude", "longitude"]),
      )
    }
  })

  test("기존 가게 설정은 레거시 null 좌표 쌍을 허용한다", () => {
    expect(
      storeFormSchema.safeParse({
        ...validStoreValues,
        latitude: null,
        longitude: null,
      }).success,
    ).toBe(true)
  })

  test("신규 가게 등록은 null 좌표 쌍을 허용하지 않는다", () => {
    const result = storeRegistrationFormSchema.safeParse({
      ...validStoreValues,
      latitude: null,
      longitude: null,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.latitude).toContain(
        "주소로 위치를 찾은 뒤 지도에서 확인해 주세요.",
      )
    }
  })
})

function toDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const validDealValues = (): DealFormValues => ({
  description: "오늘 구운 빵을 준비했어요.",
  salesEndsAt: toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
  items: [
    {
      name: "버터 크루아상",
      totalQuantity: 5,
      originalPrice: 6000,
      salePrice: 3900,
    },
  ],
})

describe("할인 등록 폼 검증", () => {
  test("실제 딜 생성 계약에 맞는 입력을 허용한다", () => {
    expect(dealFormSchema.safeParse(validDealValues()).success).toBe(true)
  })

  test("품목명 50자와 수량 99개의 서버 제한을 적용한다", () => {
    const result = dealFormSchema.safeParse({
      ...validDealValues(),
      items: [
        {
          ...validDealValues().items[0],
          name: "가".repeat(51),
          totalQuantity: 100,
        },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(({ path }) => path.at(-1))).toEqual(
        expect.arrayContaining(["name", "totalQuantity"]),
      )
    }
  })

  test("예약 마감은 10분 이후 24시간 안으로 제한한다", () => {
    expect(
      dealFormSchema.safeParse({
        ...validDealValues(),
        salesEndsAt: toDateTimeLocal(new Date(Date.now() + 5 * 60 * 1000)),
      }).success,
    ).toBe(false)
    expect(
      dealFormSchema.safeParse({
        ...validDealValues(),
        salesEndsAt: toDateTimeLocal(
          new Date(Date.now() + 25 * 60 * 60 * 1000),
        ),
      }).success,
    ).toBe(false)
  })
})
