import { act, screen } from "@testing-library/react"
import { createMemoryRouter } from "react-router"
import { RouterProvider } from "react-router/dom"

import {
  clearAccessToken,
  saveAccessToken,
} from "../features/auth/auth-session"
import { renderWithProviders } from "../test/render"
import { RootLayout } from "./root-layout"

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
})

test("보호 화면을 열어 둔 채 세션이 만료되면 현재 경로를 기억한 로그인 화면로 이동한다", () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-08-21T00:00:00.000Z"))
  saveAccessToken(createAccessToken(Math.floor(Date.now() / 1000) + 7))

  const router = createMemoryRouter(
    [
      {
        Component: RootLayout,
        children: [
          { path: "favorites", element: <h1>찜한 가게</h1> },
          { path: "login", element: <h1>로그인</h1> },
        ],
      },
    ],
    { initialEntries: ["/favorites"] },
  )

  renderWithProviders(<RouterProvider router={router} />)
  expect(screen.getByRole("heading", { name: "찜한 가게" })).toBeVisible()

  act(() => {
    vi.advanceTimersByTime(2_000)
  })

  expect(router.state.location.pathname).toBe("/login")
  expect(router.state.location.search).toBe("?redirect=%2Ffavorites")
  expect(screen.getByRole("heading", { name: "로그인" })).toBeVisible()
})

test("공개 화면에서 세션이 만료되면 화면은 유지한다", () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-08-21T00:00:00.000Z"))
  saveAccessToken(createAccessToken(Math.floor(Date.now() / 1000) + 7))

  const router = createMemoryRouter(
    [
      {
        Component: RootLayout,
        children: [
          { path: "app", element: <h1>오늘의 할인</h1> },
          { path: "login", element: <h1>로그인</h1> },
        ],
      },
    ],
    { initialEntries: ["/app"] },
  )

  renderWithProviders(<RouterProvider router={router} />)

  act(() => {
    vi.advanceTimersByTime(2_000)
  })

  expect(router.state.location.pathname).toBe("/app")
  expect(screen.getByRole("heading", { name: "오늘의 할인" })).toBeVisible()
})
