import { screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"

import { clearAccessToken } from "../../features/auth/auth-session"
import { renderWithProviders } from "../../test/render"
import { LandingPage } from "./landing-page"

afterEach(() => {
  clearAccessToken()
})

test("랜딩 화면은 서비스 기능을 안내하고 개발 상태 문구를 노출하지 않는다", () => {
  const router = createMemoryRouter([{ path: "/", element: <LandingPage /> }], {
    initialEntries: ["/"],
  })

  renderWithProviders(<RouterProvider router={router} />)

  expect(screen.getByText("남았당 주요 기능")).toBeInTheDocument()
  expect(
    screen.getByRole("navigation", { name: "남았당 주요 메뉴" }),
  ).toBeInTheDocument()
  expect(
    screen.queryByText(/화면 예시|미리보기|API 연동|API 개발/),
  ).not.toBeInTheDocument()
})
