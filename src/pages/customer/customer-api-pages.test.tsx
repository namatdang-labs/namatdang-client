import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router"

import { clearAccessToken } from "../../features/auth/auth-session"
import { renderWithProviders } from "../../test/render"
import { FavoritesPage } from "./favorites-page"
import { NotificationsPage } from "./notifications-page"
import { StoreDetailPage } from "./store-detail-page"

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
  const user = userEvent.setup()
  let isFavorite = false

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input)
    if (url === "/api/v1/stores/17") return jsonResponse(storeDto)
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
    if (url === "/api/v1/notifications?size=100") {
      return jsonResponse({
        notifications: [
          {
            id: 9,
            type: "DEAL_PUBLISHED",
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
