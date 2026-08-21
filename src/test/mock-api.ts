import { vi } from "vitest"

import type {
  DealDetailDto,
  ReservationDetailDto,
  ReservationSummaryDto,
  SellingDealDto,
} from "../features/customer/customer-api"
import { getDistanceKilometers } from "../features/customer/location-preference"
import type {
  OwnerDealCreateRequest,
  OwnerDealDetail,
  OwnerDealSummary,
  OwnerReservationDetail,
  OwnerReservationSummary,
} from "../features/management/management-api"

export type MockStoreDto = {
  id: number
  name: string
  address: string
  addressDetail: string | null
  phoneNumber: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
}

export type MockNotificationDto = {
  id: number
  type: string
  title: string
  body: string
  linkUrl: string
  read: boolean
  readAt: string | null
  createdAt: string
}

export type MockCurrentUser = {
  id: number
  email: string
  name: string
  phoneNumber: string
  roles: Array<"CONSUMER" | "OWNER">
  createdAt: string
  updatedAt: string
}

export type MockApiState = {
  currentUser: MockCurrentUser | null
  stores: MockStoreDto[]
  favorites: MockStoreDto[]
  notifications: MockNotificationDto[]
  deals: SellingDealDto[]
  dealDetails: DealDetailDto[]
  reservations: ReservationDetailDto[]
  ownerStores: MockStoreDto[]
  ownerDeals: OwnerDealSummary[]
  ownerDealDetails: OwnerDealDetail[]
  ownerReservations: OwnerReservationDetail[]
  requests: Array<{
    method: string
    pathname: string
    authorization: string | null
    idempotencyKey: string | null
  }>
}

export const mockStores: MockStoreDto[] = [
  {
    id: 101,
    name: "성수 빵연구소",
    address: "서울 성동구 연무장길 18",
    addressDetail: "1층",
    phoneNumber: "02-1234-5678",
    description: "매일 오전 국산 밀가루로 빵을 굽는 동네 베이커리예요.",
    latitude: 37.5445,
    longitude: 127.056,
  },
  {
    id: 202,
    name: "망원 케이크룸",
    address: "서울 마포구 망원로 72",
    addressDetail: "2층",
    phoneNumber: "02-9876-5432",
    description: "매일 다른 크림과 과일로 조각 케이크를 만들어요.",
    latitude: 37.556,
    longitude: 126.91,
  },
]

export const mockOwnerStore: MockStoreDto = {
  id: 301,
  name: "남았당 테스트 가게",
  address: "서울 성동구 성수일로 10",
  addressDetail: "1층",
  phoneNumber: "02-1111-2222",
  description: "오늘 만든 상품을 만나 보세요.",
  latitude: null,
  longitude: null,
}

export const mockDeals: SellingDealDto[] = [
  {
    dealId: 501,
    storeId: 101,
    storeName: "성수 빵연구소",
    salesEndsAt: "2026-08-20T20:00:00",
    status: "SELLING",
    description: "오늘의 소금빵 모음",
    itemCount: 2,
    lowestSalePrice: 3500,
    headlineItemName: "소금빵",
    totalRemainingQuantity: 5,
    maxDiscountRate: 30,
    distanceMeters: null,
    createdAt: "2026-08-20T10:00:00",
  },
]

export const mockDealDetails: DealDetailDto[] = [
  {
    dealId: 501,
    storeId: 101,
    storeName: "성수 빵연구소",
    salesEndsAt: "2026-08-20T20:00:00",
    status: "SELLING",
    description: "오늘의 소금빵 모음",
    items: [
      {
        dealItemId: 601,
        name: "소금빵",
        totalQuantity: 5,
        remainingQuantity: 3,
        originalPrice: 5000,
        salePrice: 3500,
        discountRate: 30,
        status: "SELLING",
      },
      {
        dealItemId: 602,
        name: "버터 크루아상",
        totalQuantity: 4,
        remainingQuantity: 2,
        originalPrice: 6000,
        salePrice: 4200,
        discountRate: 30,
        status: "SELLING",
      },
    ],
    createdAt: "2026-08-20T10:00:00",
  },
]

export const mockReservations: ReservationDetailDto[] = [
  {
    reservationId: 91,
    dealId: 501,
    storeId: 101,
    storeName: "성수 빵연구소",
    status: "RESERVED",
    totalAmount: 3500,
    createdAt: "2026-08-20T16:00:00",
    canceledAt: null,
    pickedUpAt: null,
    items: [
      {
        dealItemId: 601,
        name: "소금빵",
        salePrice: 3500,
        quantity: 1,
        subtotal: 3500,
      },
    ],
  },
]

export const mockOwnerDeals: OwnerDealSummary[] = [
  {
    dealId: 41,
    storeId: 301,
    storeName: mockOwnerStore.name,
    salesEndsAt: "2026-08-20T21:00:00",
    status: "SELLING",
    description: "오늘의 빵 할인",
    itemCount: 1,
    lowestSalePrice: 3500,
    createdAt: "2026-08-20T11:00:00",
  },
]

export const mockOwnerDealDetails: OwnerDealDetail[] = [
  {
    dealId: 41,
    storeId: 301,
    storeName: mockOwnerStore.name,
    salesEndsAt: "2026-08-20T21:00:00",
    status: "SELLING",
    description: "오늘의 빵 할인",
    createdAt: "2026-08-20T11:00:00",
    items: [
      {
        dealItemId: 641,
        name: "버터 크루아상",
        totalQuantity: 6,
        remainingQuantity: 4,
        originalPrice: 5000,
        salePrice: 3500,
        discountRate: 30,
        status: "SELLING",
      },
    ],
  },
]

export const mockOwnerReservations: OwnerReservationDetail[] = [
  {
    reservationId: 91,
    dealId: 41,
    storeId: 301,
    storeName: mockOwnerStore.name,
    status: "RESERVED",
    totalAmount: 3500,
    createdAt: "2026-08-20T16:10:00",
    canceledAt: null,
    pickedUpAt: null,
    items: [
      {
        dealItemId: 641,
        name: "버터 크루아상",
        salePrice: 3500,
        quantity: 1,
        subtotal: 3500,
      },
    ],
  },
]

export const mockNotifications: MockNotificationDto[] = [
  {
    id: 11,
    type: "DEAL_CREATED",
    title: "성수 빵연구소에 새 할인이 열렸어요",
    body: "오늘의 소금빵 모음을 확인해 보세요.",
    linkUrl: "/deals/501",
    read: false,
    readAt: null,
    createdAt: "2026-08-19T10:00:00+09:00",
  },
  {
    id: 12,
    type: "RESERVATION_CONFIRMED",
    title: "예약이 확정됐어요",
    body: "오후 6시 30분부터 픽업할 수 있어요.",
    linkUrl: "/reservations/91",
    read: false,
    readAt: null,
    createdAt: "2026-08-19T09:30:00+09:00",
  },
  {
    id: 13,
    type: "RESERVATION_CANCELED",
    title: "예약이 취소됐어요",
    body: "취소된 예약 내역을 확인해 주세요.",
    linkUrl: "/reservations/92",
    read: true,
    readAt: "2026-08-18T20:10:00+09:00",
    createdAt: "2026-08-18T20:00:00+09:00",
  },
]

export function createMockApiState(
  overrides: Partial<Omit<MockApiState, "requests">> = {},
): MockApiState {
  const ownerStores = structuredClone(overrides.ownerStores ?? [mockOwnerStore])

  return {
    currentUser: structuredClone(
      overrides.currentUser ?? {
        id: 1,
        email: "owner@namatdang.test",
        name: "남았당",
        phoneNumber: "010-1234-5678",
        roles:
          ownerStores.length > 0
            ? (["CONSUMER", "OWNER"] as MockCurrentUser["roles"])
            : (["CONSUMER"] as MockCurrentUser["roles"]),
        createdAt: "2026-08-01T09:00:00+09:00",
        updatedAt: "2026-08-19T09:00:00+09:00",
      },
    ),
    stores: structuredClone(overrides.stores ?? mockStores),
    favorites: structuredClone(overrides.favorites ?? mockStores),
    notifications: structuredClone(
      overrides.notifications ?? mockNotifications,
    ),
    deals: structuredClone(overrides.deals ?? mockDeals),
    dealDetails: structuredClone(overrides.dealDetails ?? mockDealDetails),
    reservations: structuredClone(overrides.reservations ?? mockReservations),
    ownerStores,
    ownerDeals: structuredClone(overrides.ownerDeals ?? mockOwnerDeals),
    ownerDealDetails: structuredClone(
      overrides.ownerDealDetails ?? mockOwnerDealDetails,
    ),
    ownerReservations: structuredClone(
      overrides.ownerReservations ?? mockOwnerReservations,
    ),
    requests: [],
  }
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function parseRequestUrl(input: RequestInfo | URL) {
  const rawUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url
  return new URL(rawUrl, "http://localhost")
}

function pageResponse<T>(content: T[], url: URL, defaultSize: number) {
  const page = Number(url.searchParams.get("page") ?? 0)
  const size = Number(url.searchParams.get("size") ?? defaultSize)

  return {
    content,
    page,
    size,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
    first: page === 0,
    last: true,
  }
}

function getVisibleDeals(state: MockApiState, url: URL) {
  const keyword = (url.searchParams.get("keyword") ?? "").trim().toLowerCase()
  const centerLatValue = url.searchParams.get("centerLat")
  const centerLngValue = url.searchParams.get("centerLng")
  const centerLat = Number(centerLatValue)
  const centerLng = Number(centerLngValue)
  const hasCenter =
    centerLatValue !== null &&
    centerLngValue !== null &&
    Number.isFinite(centerLat) &&
    Number.isFinite(centerLng)
  const radiusMeters = Number(url.searchParams.get("radiusMeters") ?? 5_000)

  return state.deals
    .flatMap((deal) => {
      const store = state.stores.find(({ id }) => id === deal.storeId)
      const detail = state.dealDetails.find(
        ({ dealId }) => dealId === deal.dealId,
      )
      const searchableText = [
        deal.description,
        store?.name,
        store?.address,
        ...(detail?.items.map(({ name }) => name) ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      if (keyword && !searchableText.includes(keyword)) return []

      let distanceMeters: number | null = null
      if (hasCenter) {
        if (store?.latitude == null || store.longitude == null) return []
        distanceMeters = Math.round(
          getDistanceKilometers(
            { latitude: centerLat, longitude: centerLng },
            { latitude: store.latitude, longitude: store.longitude },
          ) * 1_000,
        )
        if (distanceMeters > radiusMeters) return []
      }

      return [{ ...deal, distanceMeters }]
    })
    .sort(
      (left, right) =>
        (left.distanceMeters ?? Number.POSITIVE_INFINITY) -
          (right.distanceMeters ?? Number.POSITIVE_INFINITY) ||
        right.dealId - left.dealId,
    )
}

function toReservationSummary(
  reservation: ReservationDetailDto,
): ReservationSummaryDto {
  return {
    reservationId: reservation.reservationId,
    dealId: reservation.dealId,
    storeId: reservation.storeId,
    storeName: reservation.storeName,
    status: reservation.status,
    totalAmount: reservation.totalAmount,
    createdAt: reservation.createdAt,
    canceledAt: reservation.canceledAt,
    pickedUpAt: reservation.pickedUpAt,
  }
}

function toOwnerReservationSummary(
  reservation: OwnerReservationDetail,
): OwnerReservationSummary {
  return {
    reservationId: reservation.reservationId,
    dealId: reservation.dealId,
    storeId: reservation.storeId,
    storeName: reservation.storeName,
    status: reservation.status,
    totalAmount: reservation.totalAmount,
    createdAt: reservation.createdAt,
    canceledAt: reservation.canceledAt,
    pickedUpAt: reservation.pickedUpAt,
  }
}

function toOwnerDealSummary(deal: OwnerDealDetail): OwnerDealSummary {
  return {
    dealId: deal.dealId,
    storeId: deal.storeId,
    storeName: deal.storeName,
    salesEndsAt: deal.salesEndsAt,
    status: deal.status,
    description: deal.description,
    itemCount: deal.items.length,
    lowestSalePrice:
      deal.items.length > 0
        ? Math.min(...deal.items.map(({ salePrice }) => salePrice))
        : 0,
    createdAt: deal.createdAt,
  }
}

export function createMockApiFetch(state: MockApiState) {
  return vi.fn<typeof fetch>(async (input, init) => {
    const url = parseRequestUrl(input)
    const sourceRequest = input instanceof Request ? input : null
    const method = (
      init?.method ??
      sourceRequest?.method ??
      "GET"
    ).toUpperCase()
    const headers = new Headers(init?.headers ?? sourceRequest?.headers)

    state.requests.push({
      method,
      pathname: `${url.pathname}${url.search}`,
      authorization: headers.get("Authorization"),
      idempotencyKey: headers.get("Idempotency-Key"),
    })

    if (method === "GET" && url.pathname === "/api/v1/stores/map") {
      const minLat = Number(url.searchParams.get("minLat") ?? -90)
      const maxLat = Number(url.searchParams.get("maxLat") ?? 90)
      const minLng = Number(url.searchParams.get("minLng") ?? -180)
      const maxLng = Number(url.searchParams.get("maxLng") ?? 180)
      const onlyDiscounting = url.searchParams.get("onlyDiscounting") === "true"
      const keyword = (url.searchParams.get("keyword") ?? "")
        .trim()
        .toLowerCase()

      const mapStores = state.stores
        .filter((store) => {
          if (store.latitude === null || store.longitude === null) return false
          if (store.latitude < minLat || store.latitude > maxLat) return false
          if (store.longitude < minLng || store.longitude > maxLng) return false
          const activeDeals = state.deals.filter(
            (deal) => deal.storeId === store.id,
          )
          const matchesDealKeyword = activeDeals.some((deal) => {
            const detail = state.dealDetails.find(
              ({ dealId }) => dealId === deal.dealId,
            )
            return [
              deal.description,
              ...(detail?.items.map(({ name }) => name) ?? []),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(keyword)
          })
          if (
            keyword &&
            !store.name.toLowerCase().includes(keyword) &&
            !store.address.toLowerCase().includes(keyword) &&
            !matchesDealKeyword
          ) {
            return false
          }
          const hasActiveDeal = activeDeals.length > 0
          if (onlyDiscounting && !hasActiveDeal) return false
          return true
        })
        .map((store) => {
          const activeDeals = state.deals.filter((d) => d.storeId === store.id)
          return {
            id: store.id,
            name: store.name,
            address: store.address,
            addressDetail: store.addressDetail,
            phoneNumber: store.phoneNumber,
            latitude: store.latitude!,
            longitude: store.longitude!,
            hasActiveDeal: activeDeals.length > 0,
            activeDealCount: activeDeals.length,
          }
        })

      return jsonResponse(mapStores)
    }

    if (method === "GET" && url.pathname === "/api/v1/stores") {
      return jsonResponse(pageResponse(state.stores, url, 20))
    }

    if (method === "GET" && url.pathname === "/api/v1/deals") {
      return jsonResponse(pageResponse(getVisibleDeals(state, url), url, 100))
    }

    const storeDealsMatch = url.pathname.match(
      /^\/api\/v1\/stores\/(\d+)\/deals$/,
    )
    if (method === "GET" && storeDealsMatch) {
      const storeId = Number(storeDealsMatch[1])
      return jsonResponse(
        pageResponse(
          state.deals.filter((deal) => deal.storeId === storeId),
          url,
          20,
        ),
      )
    }

    const dealMatch = url.pathname.match(/^\/api\/v1\/deals\/(\d+)$/)
    if (method === "GET" && dealMatch) {
      const deal = state.dealDetails.find(
        ({ dealId }) => dealId === Number(dealMatch[1]),
      )
      return deal
        ? jsonResponse(deal)
        : jsonResponse({ message: "할인을 찾을 수 없어요." }, 404)
    }

    const storeMatch = url.pathname.match(/^\/api\/v1\/stores\/(\d+)$/)
    if (method === "GET" && storeMatch) {
      const store = state.stores.find(({ id }) => id === Number(storeMatch[1]))
      return store
        ? jsonResponse(store)
        : jsonResponse({ message: "가게를 찾을 수 없어요." }, 404)
    }

    if (method === "GET" && url.pathname === "/api/v1/favorites") {
      return jsonResponse(state.favorites)
    }

    const favoriteMatch = url.pathname.match(/^\/api\/v1\/favorites\/(\d+)$/)
    if (favoriteMatch && (method === "PUT" || method === "DELETE")) {
      const storeId = Number(favoriteMatch[1])
      if (method === "PUT") {
        const store = state.stores.find(({ id }) => id === storeId)
        if (store && !state.favorites.some(({ id }) => id === storeId)) {
          state.favorites.push(structuredClone(store))
        }
      } else {
        state.favorites = state.favorites.filter(({ id }) => id !== storeId)
      }
      return new Response(null, { status: 204 })
    }

    if (method === "GET" && url.pathname === "/api/v1/reservations") {
      const status = url.searchParams.get("status")
      const reservations = state.reservations
        .filter((reservation) => !status || reservation.status === status)
        .map(toReservationSummary)
      return jsonResponse(pageResponse(reservations, url, 100))
    }

    if (method === "POST" && url.pathname === "/api/v1/reservations") {
      const body = JSON.parse(String(init?.body)) as {
        dealId: number
        items: Array<{ dealItemId: number; quantity: number }>
      }
      const deal = state.dealDetails.find(
        ({ dealId }) => dealId === body.dealId,
      )
      if (!deal) {
        return jsonResponse({ message: "할인을 찾을 수 없어요." }, 404)
      }

      const items = body.items.flatMap((selectedItem) => {
        const item = deal.items.find(
          ({ dealItemId }) => dealItemId === selectedItem.dealItemId,
        )
        if (!item || selectedItem.quantity < 1) return []
        return [
          {
            dealItemId: item.dealItemId,
            name: item.name,
            salePrice: item.salePrice,
            quantity: selectedItem.quantity,
            subtotal: item.salePrice * selectedItem.quantity,
          },
        ]
      })
      const reservation: ReservationDetailDto = {
        reservationId: 91,
        dealId: deal.dealId,
        storeId: deal.storeId,
        storeName: deal.storeName,
        status: "RESERVED",
        totalAmount: items.reduce((total, item) => total + item.subtotal, 0),
        createdAt: "2026-08-20T16:00:00",
        canceledAt: null,
        pickedUpAt: null,
        items,
      }
      state.reservations = [
        reservation,
        ...state.reservations.filter(
          ({ reservationId }) => reservationId !== 91,
        ),
      ]
      return jsonResponse(reservation, 201)
    }

    const reservationCancelMatch = url.pathname.match(
      /^\/api\/v1\/reservations\/(\d+)\/cancel$/,
    )
    if (method === "POST" && reservationCancelMatch) {
      const reservation = state.reservations.find(
        ({ reservationId }) =>
          reservationId === Number(reservationCancelMatch[1]),
      )
      if (!reservation) {
        return jsonResponse({ message: "예약을 찾을 수 없어요." }, 404)
      }
      reservation.status = "CANCELED"
      reservation.canceledAt = "2026-08-20T17:00:00"
      return jsonResponse(reservation)
    }

    const reservationMatch = url.pathname.match(
      /^\/api\/v1\/reservations\/(\d+)$/,
    )
    if (method === "GET" && reservationMatch) {
      const reservation = state.reservations.find(
        ({ reservationId }) => reservationId === Number(reservationMatch[1]),
      )
      return reservation
        ? jsonResponse(reservation)
        : jsonResponse({ message: "예약을 찾을 수 없어요." }, 404)
    }

    if (
      method === "GET" &&
      url.pathname === "/api/v1/notifications/unread-count"
    ) {
      return jsonResponse({
        unreadCount: state.notifications.filter(({ read }) => !read).length,
      })
    }

    if (method === "GET" && url.pathname === "/api/v1/notifications") {
      const size = Number(url.searchParams.get("size") ?? 20)
      const cursor = url.searchParams.get("cursor")
      const cursorIndex = cursor
        ? state.notifications.findIndex(({ id }) => id === Number(cursor))
        : -1
      const start = cursorIndex >= 0 ? cursorIndex + 1 : 0
      const notifications = state.notifications.slice(start, start + size)
      const hasNext = start + notifications.length < state.notifications.length

      return jsonResponse({
        notifications,
        nextCursor:
          hasNext && notifications.length > 0 ? notifications.at(-1)?.id : null,
        hasNext,
      })
    }

    const notificationMatch = url.pathname.match(
      /^\/api\/v1\/notifications\/(\d+)\/read$/,
    )
    if (method === "PATCH" && notificationMatch) {
      const notification = state.notifications.find(
        ({ id }) => id === Number(notificationMatch[1]),
      )
      if (notification) {
        notification.read = true
        notification.readAt = "2026-08-19T11:00:00+09:00"
      }
      return new Response(null, { status: 204 })
    }

    if (url.pathname === "/api/v1/users/me") {
      if (!state.currentUser) {
        return jsonResponse({ message: "회원을 찾을 수 없어요." }, 404)
      }

      if (method === "GET") return jsonResponse(state.currentUser)

      if (method === "PATCH") {
        const body = JSON.parse(String(init?.body)) as {
          name?: string
          phoneNumber?: string
        }
        state.currentUser = {
          ...state.currentUser,
          ...body,
          updatedAt: "2026-08-21T10:00:00+09:00",
        }
        return jsonResponse(state.currentUser)
      }

      if (method === "DELETE") {
        if (state.ownerStores.length > 0) {
          return jsonResponse(
            {
              code: "OWNER_HAS_STORES",
              message: "가게를 보유한 회원은 탈퇴할 수 없어요.",
            },
            409,
          )
        }
        state.currentUser = null
        return new Response(null, { status: 204 })
      }
    }

    if (method === "GET" && url.pathname === "/api/v1/owner/stores") {
      return jsonResponse(state.ownerStores)
    }

    if (method === "POST" && url.pathname === "/api/v1/owner/stores") {
      const body = JSON.parse(String(init?.body)) as Omit<MockStoreDto, "id">
      const createdStore: MockStoreDto = {
        id: 301,
        ...body,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
      }
      state.ownerStores = [createdStore]
      if (state.currentUser) {
        state.currentUser.roles = ["CONSUMER", "OWNER"]
      }
      return jsonResponse(createdStore, 201)
    }

    const ownerStoreDealsMatch = url.pathname.match(
      /^\/api\/v1\/owner\/stores\/(\d+)\/deals$/,
    )
    if (method === "GET" && ownerStoreDealsMatch) {
      const storeId = Number(ownerStoreDealsMatch[1])
      return jsonResponse(
        pageResponse(
          state.ownerDeals.filter((deal) => deal.storeId === storeId),
          url,
          100,
        ),
      )
    }
    if (method === "POST" && ownerStoreDealsMatch) {
      const storeId = Number(ownerStoreDealsMatch[1])
      const store = state.ownerStores.find(({ id }) => id === storeId)
      if (!store) {
        return jsonResponse({ message: "가게를 찾을 수 없어요." }, 404)
      }
      const body = JSON.parse(String(init?.body)) as OwnerDealCreateRequest
      const detail: OwnerDealDetail = {
        dealId: 42,
        storeId,
        storeName: store.name,
        salesEndsAt: body.salesEndsAt,
        status: "SELLING",
        description: body.description,
        createdAt: "2026-08-20T17:00:00",
        items: body.items.map((item, index) => ({
          dealItemId: 700 + index,
          ...item,
          remainingQuantity: item.totalQuantity,
          discountRate:
            item.originalPrice > 0
              ? Math.round(
                  ((item.originalPrice - item.salePrice) / item.originalPrice) *
                    100,
                )
              : 0,
          status: "SELLING",
        })),
      }
      state.ownerDealDetails.push(detail)
      state.ownerDeals.push(toOwnerDealSummary(detail))
      return jsonResponse(detail, 201)
    }

    const ownerDealMatch = url.pathname.match(
      /^\/api\/v1\/owner\/deals\/(\d+)$/,
    )
    if (method === "GET" && ownerDealMatch) {
      const deal = state.ownerDealDetails.find(
        ({ dealId }) => dealId === Number(ownerDealMatch[1]),
      )
      return deal
        ? jsonResponse(deal)
        : jsonResponse({ message: "할인을 찾을 수 없어요." }, 404)
    }

    const ownerStoreReservationsMatch = url.pathname.match(
      /^\/api\/v1\/owner\/stores\/(\d+)\/reservations$/,
    )
    if (method === "GET" && ownerStoreReservationsMatch) {
      const storeId = Number(ownerStoreReservationsMatch[1])
      const reservations = state.ownerReservations
        .filter((reservation) => reservation.storeId === storeId)
        .map(toOwnerReservationSummary)
      return jsonResponse(pageResponse(reservations, url, 100))
    }

    const ownerPickupMatch = url.pathname.match(
      /^\/api\/v1\/owner\/reservations\/(\d+)\/pickup$/,
    )
    if (method === "POST" && ownerPickupMatch) {
      const reservation = state.ownerReservations.find(
        ({ reservationId }) => reservationId === Number(ownerPickupMatch[1]),
      )
      if (!reservation) {
        return jsonResponse({ message: "예약을 찾을 수 없어요." }, 404)
      }
      reservation.status = "PICKED_UP"
      reservation.pickedUpAt = "2026-08-20T17:10:00"
      return jsonResponse(reservation)
    }

    const ownerReservationMatch = url.pathname.match(
      /^\/api\/v1\/owner\/reservations\/(\d+)$/,
    )
    if (method === "GET" && ownerReservationMatch) {
      const reservation = state.ownerReservations.find(
        ({ reservationId }) =>
          reservationId === Number(ownerReservationMatch[1]),
      )
      return reservation
        ? jsonResponse(reservation)
        : jsonResponse({ message: "예약을 찾을 수 없어요." }, 404)
    }

    const ownerStoreMatch = url.pathname.match(
      /^\/api\/v1\/owner\/stores\/(\d+)$/,
    )
    if (method === "PATCH" && ownerStoreMatch) {
      const storeId = Number(ownerStoreMatch[1])
      const body = JSON.parse(String(init?.body)) as Partial<MockStoreDto>
      const storeIndex = state.ownerStores.findIndex(({ id }) => id === storeId)
      if (storeIndex < 0) {
        return jsonResponse({ message: "가게를 찾을 수 없어요." }, 404)
      }
      state.ownerStores[storeIndex] = {
        ...state.ownerStores[storeIndex],
        ...body,
        id: storeId,
      }
      return jsonResponse(state.ownerStores[storeIndex])
    }

    return jsonResponse(
      {
        message: `테스트에 등록되지 않은 API입니다: ${method} ${url.pathname}`,
      },
      404,
    )
  })
}
