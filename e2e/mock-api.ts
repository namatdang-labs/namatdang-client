import type { Page, Route } from "@playwright/test"

import { FUTURE_ACCESS_TOKEN } from "../src/test/auth-token"

type StoreDto = {
  id: number
  name: string
  address: string
  addressDetail: string | null
  phoneNumber: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
}

type NotificationDto = {
  id: number
  type: string
  title: string
  body: string
  linkUrl: string
  read: boolean
  readAt: string | null
  createdAt: string
}

export type BrowserMockApiState = {
  stores: StoreDto[]
  favorites: StoreDto[]
  notifications: NotificationDto[]
  ownerStores: StoreDto[]
  requests: Array<{
    method: string
    pathname: string
    authorization: string | undefined
  }>
}

const customerStores: StoreDto[] = [
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

const ownerStore: StoreDto = {
  id: 301,
  name: "남았당 테스트 가게",
  address: "서울 성동구 성수일로 10",
  addressDetail: "1층",
  phoneNumber: "02-1111-2222",
  description: "오늘 만든 상품을 만나 보세요.",
  latitude: null,
  longitude: null,
}

const notifications: NotificationDto[] = [
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
]

function clone<T>(value: T): T {
  return structuredClone(value)
}

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    json: payload,
  })
}

export async function installMockApi(
  page: Page,
  options: { hasOwnerStore?: boolean } = {},
) {
  const state: BrowserMockApiState = {
    stores: clone(customerStores),
    favorites: clone(customerStores),
    notifications: clone(notifications),
    ownerStores: options.hasOwnerStore === false ? [] : [clone(ownerStore)],
    requests: [],
  }

  await page.addInitScript((accessToken) => {
    window.localStorage.setItem("namatdang.auth.access-token", accessToken)
  }, FUTURE_ACCESS_TOKEN)

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request()
    const method = request.method()
    const url = new URL(request.url())
    state.requests.push({
      method,
      pathname: `${url.pathname}${url.search}`,
      authorization: request.headers().authorization,
    })

    if (method === "GET" && url.pathname === "/api/v1/stores") {
      return fulfillJson(route, {
        content: state.stores,
        page: 0,
        size: 20,
        totalElements: state.stores.length,
        totalPages: 1,
        first: true,
        last: true,
      })
    }

    const storeMatch = url.pathname.match(/^\/api\/v1\/stores\/(\d+)$/)
    if (method === "GET" && storeMatch) {
      const store = state.stores.find(({ id }) => id === Number(storeMatch[1]))
      return fulfillJson(
        route,
        store ?? { message: "not found" },
        store ? 200 : 404,
      )
    }

    if (method === "GET" && url.pathname === "/api/v1/favorites") {
      return fulfillJson(route, state.favorites)
    }

    const favoriteMatch = url.pathname.match(/^\/api\/v1\/favorites\/(\d+)$/)
    if (favoriteMatch && (method === "PUT" || method === "DELETE")) {
      const storeId = Number(favoriteMatch[1])
      if (method === "PUT") {
        const store = state.stores.find(({ id }) => id === storeId)
        if (store && !state.favorites.some(({ id }) => id === storeId)) {
          state.favorites.push(clone(store))
        }
      } else {
        state.favorites = state.favorites.filter(({ id }) => id !== storeId)
      }
      return route.fulfill({ status: 204, body: "" })
    }

    if (
      method === "GET" &&
      url.pathname === "/api/v1/notifications/unread-count"
    ) {
      return fulfillJson(route, {
        unreadCount: state.notifications.filter(({ read }) => !read).length,
      })
    }

    if (method === "GET" && url.pathname === "/api/v1/notifications") {
      return fulfillJson(route, {
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
      return route.fulfill({ status: 204, body: "" })
    }

    if (method === "GET" && url.pathname === "/api/v1/users/me") {
      return fulfillJson(route, {
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
      return fulfillJson(route, state.ownerStores)
    }

    if (method === "POST" && url.pathname === "/api/v1/owner/stores") {
      const body = request.postDataJSON() as Omit<StoreDto, "id">
      const createdStore: StoreDto = {
        id: 301,
        ...body,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
      }
      state.ownerStores = [createdStore]
      return fulfillJson(route, createdStore, 201)
    }

    const ownerStoreMatch = url.pathname.match(
      /^\/api\/v1\/owner\/stores\/(\d+)$/,
    )
    if (method === "PATCH" && ownerStoreMatch) {
      const storeId = Number(ownerStoreMatch[1])
      const body = request.postDataJSON() as Partial<StoreDto>
      const index = state.ownerStores.findIndex(({ id }) => id === storeId)
      if (index < 0) return fulfillJson(route, { message: "not found" }, 404)
      state.ownerStores[index] = {
        ...state.ownerStores[index],
        ...body,
        id: storeId,
      }
      return fulfillJson(route, state.ownerStores[index])
    }

    return fulfillJson(
      route,
      { message: `unhandled mock API: ${method} ${url.pathname}` },
      404,
    )
  })

  return state
}
