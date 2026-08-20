import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { clearAccessToken } from "../auth/auth-session"
import {
  adaptNotification,
  adaptStore,
  addFavorite,
  getFavoriteStores,
  getNotifications,
  getStores,
  getStore,
  getUnreadNotificationCount,
  markNotificationAsRead,
  parseNumericStoreId,
  removeFavorite,
} from "./customer-api"

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  })
}

const storeDto = {
  id: 17,
  name: "남았당 테스트 가게",
  address: "서울특별시 성동구 성수동",
  addressDetail: "1층",
  phoneNumber: "02-1234-5678",
  description: "오늘 만든 빵을 소개해요.",
  latitude: 37.5445,
  longitude: 127.056,
}

describe("customer API adapter", () => {
  test("nullable 매장 필드를 화면용 문구와 경로 ID로 변환한다", () => {
    expect(
      adaptStore({
        ...storeDto,
        name: null,
        address: null,
        addressDetail: null,
        phoneNumber: null,
        description: null,
        latitude: null,
        longitude: null,
      }),
    ).toEqual({
      id: 17,
      routeId: "17",
      name: "이름을 준비 중인 가게",
      description: "가게 소개를 준비하고 있어요.",
      address: "주소 정보가 아직 없어요.",
      district: "지역 정보 준비 중",
      phoneNumber: null,
      latitude: null,
      longitude: null,
    })
  })

  test("알림 DTO 필드와 안전한 내부 링크를 화면 모델로 변환한다", () => {
    expect(
      adaptNotification({
        id: 9,
        type: "DEAL_PUBLISHED",
        title: "새 할인이 열렸어요",
        body: "가게의 오늘 할인을 확인해 보세요.",
        linkUrl: "https://example.com/unsafe",
        read: false,
        readAt: null,
        createdAt: "2026-08-19T09:30:00",
      }),
    ).toMatchObject({
      id: 9,
      type: "DEAL_PUBLISHED",
      description: "가게의 오늘 할인을 확인해 보세요.",
      href: "/notifications",
      isRead: false,
      createdAt: "2026-08-19T09:30:00+09:00",
    })
  })

  test.each([
    "https://evil.example/phishing",
    "//evil.example/phishing",
    "/%5Cevil.com",
    "/\\evil.com",
  ])("알림의 외부·백슬래시 링크 %s을 알림 센터로 대체한다", (linkUrl) => {
    expect(
      adaptNotification({
        id: 10,
        type: "DEAL_PUBLISHED",
        title: "새 할인이 열렸어요",
        body: "알림 내용",
        linkUrl,
        read: false,
        readAt: null,
        createdAt: "2026-08-19T09:30:00+09:00",
      }),
    ).toMatchObject({ href: "/notifications" })
  })

  test("알림의 정상 내부 링크는 query와 hash까지 유지한다", () => {
    expect(
      adaptNotification({
        id: 11,
        type: "DEAL_PUBLISHED",
        title: "새 할인이 열렸어요",
        body: "알림 내용",
        linkUrl: "/stores/17?from=notification#deal",
        read: false,
        readAt: null,
        createdAt: "2026-08-19T09:30:00+09:00",
      }),
    ).toMatchObject({ href: "/stores/17?from=notification#deal" })
  })

  test("실제 서버 상세에 사용할 양의 정수 ID만 허용한다", () => {
    expect(parseNumericStoreId("31")).toBe(31)
    expect(parseNumericStoreId("seongsu-bread-lab")).toBeNull()
    expect(parseNumericStoreId("0")).toBeNull()
    expect(parseNumericStoreId("1.5")).toBeNull()
  })
})

describe("customer API request", () => {
  beforeEach(() => {
    clearAccessToken()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test("매장·즐겨찾기·알림 조회가 서버 계약 경로를 사용한다", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          content: [storeDto],
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        }),
      )
      .mockResolvedValueOnce(jsonResponse(storeDto))
      .mockResolvedValueOnce(jsonResponse([storeDto]))
      .mockResolvedValueOnce(
        jsonResponse({ notifications: [], nextCursor: null, hasNext: false }),
      )
      .mockResolvedValueOnce(jsonResponse({ unreadCount: 0 }))

    await getStores({ keyword: " 성수 ", page: 0, size: 20 })
    await getStore(17)
    await getFavoriteStores()
    await getNotifications()
    await getUnreadNotificationCount()

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/v1/stores?page=0&size=20&keyword=%EC%84%B1%EC%88%98",
      "/api/v1/stores/17",
      "/api/v1/favorites",
      "/api/v1/notifications?size=100",
      "/api/v1/notifications/unread-count",
    ])
  })

  test("찜과 알림 변경이 각 서버 HTTP 메서드를 사용한다", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }))

    await addFavorite(17)
    await removeFavorite(17)
    await markNotificationAsRead(9)

    expect(
      fetchMock.mock.calls.map(([url, init]) => [url, init?.method]),
    ).toEqual([
      ["/api/v1/favorites/17", "PUT"],
      ["/api/v1/favorites/17", "DELETE"],
      ["/api/v1/notifications/9/read", "PATCH"],
    ])
  })
})
