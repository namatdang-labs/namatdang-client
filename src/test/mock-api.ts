import { vi } from "vitest"

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

export type MockApiState = {
  stores: MockStoreDto[]
  favorites: MockStoreDto[]
  notifications: MockNotificationDto[]
  ownerStores: MockStoreDto[]
  requests: Array<{
    method: string
    pathname: string
    authorization: string | null
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

export const mockNotifications: MockNotificationDto[] = [
  {
    id: 11,
    type: "DEAL_PUBLISHED",
    title: "성수 빵연구소에 새 할인이 열렸어요",
    body: "오늘의 소금빵 모음을 확인해 보세요.",
    linkUrl: "/deals/salt-bread-today",
    read: false,
    readAt: null,
    createdAt: "2026-08-19T10:00:00+09:00",
  },
  {
    id: 12,
    type: "RESERVATION_CONFIRMED",
    title: "예약이 확정됐어요",
    body: "오후 6시 30분부터 픽업할 수 있어요.",
    linkUrl: "/reservations/reservation-1042",
    read: false,
    readAt: null,
    createdAt: "2026-08-19T09:30:00+09:00",
  },
  {
    id: 13,
    type: "RESERVATION_CANCELED",
    title: "예약이 취소됐어요",
    body: "취소된 예약 내역을 확인해 주세요.",
    linkUrl: "/reservations/reservation-0913",
    read: true,
    readAt: "2026-08-18T20:10:00+09:00",
    createdAt: "2026-08-18T20:00:00+09:00",
  },
]

export function createMockApiState(
  overrides: Partial<Omit<MockApiState, "requests">> = {},
): MockApiState {
  return {
    stores: structuredClone(overrides.stores ?? mockStores),
    favorites: structuredClone(overrides.favorites ?? mockStores),
    notifications: structuredClone(
      overrides.notifications ?? mockNotifications,
    ),
    ownerStores: structuredClone(overrides.ownerStores ?? [mockOwnerStore]),
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

export function createMockApiFetch(state: MockApiState) {
  return vi.fn<typeof fetch>(async (input, init) => {
    const url = parseRequestUrl(input)
    const method = (init?.method ?? "GET").toUpperCase()
    const headers = new Headers(init?.headers)

    state.requests.push({
      method,
      pathname: `${url.pathname}${url.search}`,
      authorization: headers.get("Authorization"),
    })

    if (method === "GET" && url.pathname === "/api/v1/stores") {
      return jsonResponse({
        content: state.stores,
        page: Number(url.searchParams.get("page") ?? 0),
        size: Number(url.searchParams.get("size") ?? 20),
        totalElements: state.stores.length,
        totalPages: state.stores.length > 0 ? 1 : 0,
        first: true,
        last: true,
      })
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

    if (
      method === "GET" &&
      url.pathname === "/api/v1/notifications/unread-count"
    ) {
      return jsonResponse({
        unreadCount: state.notifications.filter(({ read }) => !read).length,
      })
    }

    if (method === "GET" && url.pathname === "/api/v1/notifications") {
      return jsonResponse({
        notifications: state.notifications,
        nextCursor: null,
        hasNext: false,
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

    if (method === "GET" && url.pathname === "/api/v1/users/me") {
      return jsonResponse({
        id: 1,
        email: "owner@namatdang.test",
        name: "남았당",
        phoneNumber: "010-1234-5678",
        role: state.ownerStores.length > 0 ? "OWNER" : "CONSUMER",
        createdAt: "2026-08-01T09:00:00+09:00",
        updatedAt: "2026-08-19T09:00:00+09:00",
      })
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
      return jsonResponse(createdStore, 201)
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
