import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { clearAccessToken } from "../auth/auth-session"
import {
  adaptNotification,
  adaptStore,
  addFavorite,
  cancelReservation,
  createReservation,
  getDeal,
  getFavoriteStores,
  getNotifications,
  getReservation,
  getReservations,
  getSellingDealCatalog,
  getSellingDeals,
  getStores,
  getStoresOnMap,
  getStore,
  getStoreDeals,
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
      name: "이름이 등록되지 않은 가게",
      description: "등록된 가게 소개가 없어요.",
      address: "등록된 주소가 없어요.",
      district: "지역 정보 없음",
      phoneNumber: null,
      latitude: null,
      longitude: null,
    })
  })

  test("알림 DTO 필드와 안전한 내부 링크를 화면 모델로 변환한다", () => {
    expect(
      adaptNotification({
        id: 9,
        type: "DEAL_CREATED",
        title: "새 할인이 열렸어요",
        body: "가게의 오늘 할인을 확인해 보세요.",
        linkUrl: "https://example.com/unsafe",
        read: false,
        readAt: null,
        createdAt: "2026-08-19T09:30:00",
      }),
    ).toMatchObject({
      id: 9,
      type: "DEAL_CREATED",
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
        type: "DEAL_CREATED",
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
        type: "DEAL_CREATED",
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
      "/api/v1/notifications?size=20",
      "/api/v1/notifications/unread-count",
    ])
  })

  test("지도 가게 조회에 좌표 범위와 독립적인 검색어를 전달한다", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse([]))

    await getStoresOnMap({
      minLat: 37.5,
      maxLat: 37.6,
      minLng: 126.9,
      maxLng: 127.1,
      keyword: "  소금빵  ",
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/stores/map?minLat=37.5&maxLat=37.6&minLng=126.9&maxLng=127.1&limit=50&keyword=%EC%86%8C%EA%B8%88%EB%B9%B5",
      expect.objectContaining({ method: "GET" }),
    )
  })

  test("할인 조회에 선택 위치와 검색어를 함께 전달한다", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }),
    )

    await getSellingDeals({
      page: 0,
      size: 20,
      keyword: "  소금빵  ",
      centerLat: 37.5445,
      centerLng: 127.056,
      radiusMeters: 5_000,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/deals?page=0&size=20&keyword=%EC%86%8C%EA%B8%88%EB%B9%B5&centerLat=37.5445&centerLng=127.056&radiusMeters=5000",
      expect.objectContaining({ method: "GET" }),
    )
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

  test("판매 중 딜을 마지막 페이지까지 조회해 지도용 목록을 만든다", async () => {
    const firstDeal = {
      dealId: 31,
      storeId: 17,
      storeName: "남았당 테스트 가게",
      salesEndsAt: "2026-08-20T20:00:00",
      status: "SELLING",
      description: "오늘의 빵 할인",
      itemCount: 2,
      lowestSalePrice: 3500,
      createdAt: "2026-08-20T10:00:00",
    }
    const secondDeal = { ...firstDeal, dealId: 32, storeId: 18 }
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          content: [firstDeal],
          page: 0,
          size: 1,
          totalElements: 2,
          totalPages: 2,
          first: true,
          last: false,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          content: [secondDeal],
          page: 1,
          size: 1,
          totalElements: 2,
          totalPages: 2,
          first: false,
          last: true,
        }),
      )

    await expect(getSellingDealCatalog(1)).resolves.toEqual({
      content: [firstDeal, secondDeal].map((deal) => ({
        ...deal,
        salesEndsAt: `${deal.salesEndsAt}+09:00`,
        createdAt: `${deal.createdAt}+09:00`,
      })),
      complete: true,
    })
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/v1/deals?page=0&size=1",
      "/api/v1/deals?page=1&size=1",
    ])
  })

  test("할인·예약 조회와 예약 변경이 운영 API 계약을 사용한다", async () => {
    const dealSummary = {
      dealId: 31,
      storeId: 17,
      storeName: "남았당 가게",
      salesEndsAt: "2026-08-20T20:00:00",
      status: "SELLING",
      description: "오늘의 빵",
      itemCount: 1,
      lowestSalePrice: 3000,
      createdAt: "2026-08-20T10:00:00",
    }
    const dealDetail = {
      ...dealSummary,
      items: [
        {
          dealItemId: 41,
          name: "소금빵",
          totalQuantity: 5,
          remainingQuantity: 3,
          originalPrice: 5000,
          salePrice: 3000,
          discountRate: 40,
          status: "SELLING",
        },
      ],
    }
    const reservation = {
      reservationId: 51,
      dealId: 31,
      storeId: 17,
      storeName: "남았당 가게",
      status: "RESERVED",
      totalAmount: 3000,
      createdAt: "2026-08-20T11:00:00",
      canceledAt: null,
      pickedUpAt: null,
      items: [
        {
          dealItemId: 41,
          name: "소금빵",
          salePrice: 3000,
          quantity: 1,
          subtotal: 3000,
        },
      ],
    }
    const reservationPage = {
      content: [reservation],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    }
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          content: [dealSummary],
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        }),
      )
      .mockResolvedValueOnce(jsonResponse(dealDetail))
      .mockResolvedValueOnce(jsonResponse(reservationPage))
      .mockResolvedValueOnce(jsonResponse(reservation))
      .mockResolvedValueOnce(jsonResponse(reservation))
      .mockResolvedValueOnce(
        jsonResponse({ ...reservation, status: "CANCELED" }),
      )

    await getStoreDeals(17)
    await getDeal(31)
    await getReservations({ status: "RESERVED" })
    await getReservation(51)
    await createReservation(
      { dealId: 31, items: [{ dealItemId: 41, quantity: 1 }] },
      "create-key",
    )
    await cancelReservation(51, "cancel-key")

    expect(
      fetchMock.mock.calls.map(([url, init]) => [url, init?.method]),
    ).toEqual([
      ["/api/v1/stores/17/deals?page=0&size=20", "GET"],
      ["/api/v1/deals/31", "GET"],
      ["/api/v1/reservations?page=0&size=100&status=RESERVED", "GET"],
      ["/api/v1/reservations/51", "GET"],
      ["/api/v1/reservations", "POST"],
      ["/api/v1/reservations/51/cancel", "POST"],
    ])
    expect(
      new Headers(fetchMock.mock.calls[4][1]?.headers).get("Idempotency-Key"),
    ).toBe("create-key")
    expect(
      new Headers(fetchMock.mock.calls[5][1]?.headers).get("Idempotency-Key"),
    ).toBe("cancel-key")
  })
})
