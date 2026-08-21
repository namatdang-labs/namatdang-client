import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router"

import {
  clearAccessToken,
  saveAccessToken,
} from "../../features/auth/auth-session"
import { FUTURE_ACCESS_TOKEN } from "../../test/auth-token"
import { renderWithProviders } from "../../test/render"
import { DealDetailPage } from "./deal-detail-page"
import { FavoritesPage } from "./favorites-page"
import { NotificationsPage } from "./notifications-page"
import { ReservationCompletePage } from "./reservation-complete-page"
import { StoreDetailPage } from "./store-detail-page"

vi.mock("../../features/map", () => ({
  StoreLocationMap: ({ ariaLabel }: { ariaLabel?: string }) => (
    <div role="img" aria-label={ariaLabel} />
  ),
}))

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status,
  })
}

const storeDto = {
  id: 17,
  name: "성수 테스트 빵집",
  address: "서울특별시 성동구 성수동",
  addressDetail: "1층",
  phoneNumber: "02-1234-5678",
  description: "오늘 만든 빵을 소개해요.",
  latitude: 37.5445,
  longitude: 127.056,
}

afterEach(() => {
  clearAccessToken()
  vi.restoreAllMocks()
})

test("즐겨찾기 서버 목록을 렌더링하고 해제 후 다시 동기화한다", async () => {
  const user = userEvent.setup()
  let isFavorite = true

  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input, init) => {
      const url = String(input)
      if (url === "/api/v1/favorites" && init?.method === "GET") {
        return jsonResponse(isFavorite ? [storeDto] : [])
      }
      if (url === "/api/v1/deals?page=0&size=100") {
        return jsonResponse({
          content: [],
          page: 0,
          size: 100,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        })
      }
      if (url === "/api/v1/favorites/17" && init?.method === "DELETE") {
        isFavorite = false
        return new Response(null, { status: 204 })
      }
      throw new Error(`Unexpected request: ${init?.method} ${url}`)
    })

  renderWithProviders(
    <MemoryRouter>
      <FavoritesPage />
    </MemoryRouter>,
  )

  expect(await screen.findByText("1개의 가게")).toBeInTheDocument()
  expect(screen.getByText("성수 테스트 빵집")).toBeInTheDocument()

  await user.click(
    screen.getByRole("button", { name: "성수 테스트 빵집 찜 해제" }),
  )

  expect(
    await screen.findByRole("heading", {
      level: 2,
      name: "아직 찜한 가게가 없어요",
    }),
  ).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/favorites/17",
    expect.objectContaining({ method: "DELETE" }),
  )
})

test("숫자 가게 상세에서 실제 정보와 찜 상태를 변경한다", async () => {
  saveAccessToken(FUTURE_ACCESS_TOKEN)
  const user = userEvent.setup()
  let isFavorite = false

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input)
    if (url === "/api/v1/stores/17") return jsonResponse(storeDto)
    if (url === "/api/v1/stores/17/deals?page=0&size=20") {
      return jsonResponse({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      })
    }
    if (url === "/api/v1/favorites" && init?.method === "GET") {
      return jsonResponse(isFavorite ? [storeDto] : [])
    }
    if (url === "/api/v1/favorites/17" && init?.method === "PUT") {
      isFavorite = true
      return new Response(null, { status: 204 })
    }
    throw new Error(`Unexpected request: ${init?.method} ${url}`)
  })

  renderWithProviders(
    <MemoryRouter initialEntries={["/stores/17"]}>
      <Routes>
        <Route path="/stores/:storeId" element={<StoreDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "성수 테스트 빵집",
    }),
  ).toBeInTheDocument()
  expect(screen.getByText("서울특별시 성동구 성수동 1층")).toBeInTheDocument()

  await user.click(await screen.findByRole("button", { name: "찜하기" }))

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "찜한 가게" }),
    ).toBeInTheDocument()
  })
})

test("알림을 서버에서 읽음 처리하고 목록과 미읽음 수를 갱신한다", async () => {
  const user = userEvent.setup()
  let isRead = false

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input)
    if (url === "/api/v1/notifications?size=20") {
      return jsonResponse({
        notifications: [
          {
            id: 9,
            type: "DEAL_CREATED",
            title: "새 할인이 열렸어요",
            body: "성수 테스트 빵집의 할인을 확인해 보세요.",
            linkUrl: "/stores/17",
            read: isRead,
            readAt: isRead ? "2026-08-19T10:00:00" : null,
            createdAt: "2026-08-19T09:30:00",
          },
        ],
        nextCursor: null,
        hasNext: false,
      })
    }
    if (url === "/api/v1/notifications/unread-count") {
      return jsonResponse({ unreadCount: isRead ? 0 : 1 })
    }
    if (url === "/api/v1/notifications/9/read" && init?.method === "PATCH") {
      isRead = true
      return new Response(null, { status: 204 })
    }
    throw new Error(`Unexpected request: ${init?.method} ${url}`)
  })

  renderWithProviders(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>,
  )

  expect(await screen.findByText("안 읽은 알림 1개")).toBeInTheDocument()
  await user.click(
    screen.getByRole("button", { name: "새 할인이 열렸어요 읽음 처리" }),
  )

  expect(await screen.findByText("안 읽은 알림 0개")).toBeInTheDocument()
  expect(
    screen.queryByRole("button", { name: /읽음 처리$/ }),
  ).not.toBeInTheDocument()
})

test("인증되지 않은 즐겨찾기 요청에는 로그인 안내를 표시한다", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    jsonResponse({ code: "INVALID_TOKEN" }, 401),
  )

  renderWithProviders(
    <MemoryRouter>
      <FavoritesPage />
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole("heading", {
      level: 2,
      name: "찜한 가게를 보려면 로그인이 필요해요",
    }),
  ).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "로그인하기" })).toHaveAttribute(
    "href",
    "/login",
  )
})

test("실제 할인 품목을 선택해 멱등 키와 함께 예약한다", async () => {
  saveAccessToken(FUTURE_ACCESS_TOKEN)
  const user = userEvent.setup()
  const dealDetail = {
    dealId: 31,
    storeId: 17,
    storeName: "성수 테스트 빵집",
    salesEndsAt: "2026-08-20T20:00:00",
    status: "SELLING",
    description: "오늘의 소금빵",
    createdAt: "2026-08-20T10:00:00",
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
    storeName: "성수 테스트 빵집",
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

  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input, init) => {
      const url = String(input)
      if (url === "/api/v1/deals/31") return jsonResponse(dealDetail)
      if (url === "/api/v1/stores/17") return jsonResponse(storeDto)
      if (url === "/api/v1/reservations" && init?.method === "POST") {
        return jsonResponse(reservation, 201)
      }
      throw new Error(`Unexpected request: ${init?.method} ${url}`)
    })

  renderWithProviders(
    <MemoryRouter initialEntries={["/deals/31"]}>
      <Routes>
        <Route path="/deals/:dealId" element={<DealDetailPage />} />
        <Route
          path="/reservations/complete"
          element={<ReservationCompletePage />}
        />
      </Routes>
    </MemoryRouter>,
  )

  const quantity = await screen.findByRole("group", { name: "소금빵 수량" })
  await user.click(
    within(quantity).getByRole("button", { name: "소금빵 수량 늘리기" }),
  )
  await user.click(screen.getAllByRole("button", { name: "선택 확인하기" })[0])
  await user.click(
    within(
      await screen.findByRole("dialog", { name: "선택한 내용이 맞나요?" }),
    ).getByRole("button", { name: "예약하기" }),
  )

  expect(
    await screen.findByRole("heading", { name: "예약이 완료됐어요" }),
  ).toBeInTheDocument()
  expect(screen.getByText("예약번호 51")).toBeInTheDocument()

  const reservationRequest = fetchMock.mock.calls.find(
    ([url, init]) => url === "/api/v1/reservations" && init?.method === "POST",
  )
  expect(reservationRequest).toBeDefined()
  expect(
    new Headers(reservationRequest?.[1]?.headers).get("Idempotency-Key"),
  ).toBeTruthy()
  expect(JSON.parse(String(reservationRequest?.[1]?.body))).toEqual({
    dealId: 31,
    items: [{ dealItemId: 41, quantity: 1 }],
  })
})
