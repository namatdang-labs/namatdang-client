import { act, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"

import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTHENTICATION_REQUIRED_EVENT,
  clearAccessToken,
  saveAccessToken,
} from "../features/auth/auth-session"
import { FUTURE_ACCESS_TOKEN } from "../test/auth-token"
import { renderWithProviders } from "../test/render"
import { CustomerLayout } from "./customer-layout"

function createAccessToken(expirationSeconds: number) {
  const payload = globalThis
    .btoa(JSON.stringify({ exp: expirationSeconds }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  return `header.${payload}.signature`
}

afterEach(() => {
  clearAccessToken()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

test("비회원 고객 셸은 알림 API를 요청하지 않고 공개 탐색과 로그인 행동을 보여준다", () => {
  const fetchMock = vi.spyOn(globalThis, "fetch")

  renderWithProviders(
    <MemoryRouter initialEntries={["/app"]}>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/app" element={<h1>오늘의 할인</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

  expect(screen.getByRole("heading", { name: "오늘의 할인" })).toBeVisible()
  expect(screen.getAllByRole("link", { name: "로그인" })).not.toHaveLength(0)
  expect(screen.getAllByRole("link", { name: "지도" })).not.toHaveLength(0)
  expect(screen.queryByRole("link", { name: "알림 센터" })).toBeNull()
  expect(screen.queryByRole("link", { name: "가게 관리" })).toBeNull()
  expect(fetchMock).not.toHaveBeenCalled()
})

test("공개 화면에서 인증 만료 이벤트를 받으면 게스트 메뉴로 전환한다", async () => {
  saveAccessToken(FUTURE_ACCESS_TOKEN)
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ unreadCount: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )

  renderWithProviders(
    <MemoryRouter initialEntries={["/app"]}>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/app" element={<h1>오늘의 할인</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole("link", { name: "알림 센터" }),
  ).toBeInTheDocument()

  act(() => {
    clearAccessToken()
    window.dispatchEvent(new Event(AUTHENTICATION_REQUIRED_EVENT))
  })

  expect(screen.queryByRole("link", { name: "알림 센터" })).toBeNull()
  expect(screen.getAllByRole("link", { name: "로그인" })).not.toHaveLength(0)
})

test("공개 화면에서 다른 탭의 로그인을 감지하면 회원 메뉴로 전환한다", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ unreadCount: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )

  renderWithProviders(
    <MemoryRouter initialEntries={["/app"]}>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/app" element={<h1>오늘의 할인</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

  act(() => {
    saveAccessToken(FUTURE_ACCESS_TOKEN)
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCESS_TOKEN_STORAGE_KEY,
        oldValue: null,
        newValue: FUTURE_ACCESS_TOKEN,
        storageArea: window.localStorage,
      }),
    )
  })

  expect(
    await screen.findByRole("link", { name: "알림 센터" }),
  ).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "가게 관리" })).toBeInTheDocument()
})

test("페이지를 열어 둔 채 세션이 만료되면 게스트 메뉴로 전환하고 안 읽은 알림 조회를 중단한다", () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-08-21T00:00:00.000Z"))

  const accessToken = createAccessToken(Math.floor(Date.now() / 1000) + 7)
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ unreadCount: 2 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )
  saveAccessToken(accessToken)

  renderWithProviders(
    <MemoryRouter initialEntries={["/app"]}>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/app" element={<h1>오늘의 할인</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

  expect(screen.getByRole("link", { name: "알림 센터" })).toBeVisible()
  expect(fetchMock).toHaveBeenCalledOnce()

  act(() => {
    vi.advanceTimersByTime(2_000)
  })

  expect(screen.queryByRole("link", { name: /^알림 센터/ })).toBeNull()
  expect(screen.getAllByRole("link", { name: "로그인" })).not.toHaveLength(0)

  act(() => {
    window.dispatchEvent(new Event("focus"))
    document.dispatchEvent(new Event("visibilitychange"))
    vi.advanceTimersByTime(60_000)
  })

  expect(fetchMock).toHaveBeenCalledOnce()
})
