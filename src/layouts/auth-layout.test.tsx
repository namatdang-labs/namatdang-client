import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"

import { renderWithProviders } from "../test/render"
import { AuthLayout } from "./auth-layout"

function renderAuthLayout() {
  const router = createMemoryRouter(
    [
      { path: "/", element: <h1>남았당 소개</h1> },
      {
        element: <AuthLayout />,
        children: [{ path: "/login", element: <h1>로그인</h1> }],
      },
      { path: "/app", element: <h1>오늘의 할인</h1> },
    ],
    { initialEntries: ["/login"] },
  )

  return {
    ...renderWithProviders(<RouterProvider router={router} />),
    router,
  }
}

test("인증 화면에서 브랜드 여정과 비회원 둘러보기 행동을 함께 안내한다", () => {
  renderAuthLayout()

  const header = screen.getByRole("banner")
  expect(
    within(header).getByRole("link", { name: "남았당 홈" }),
  ).toHaveAttribute("href", "/")

  const main = screen.getByRole("main")
  expect(
    within(main).getByRole("heading", { level: 1, name: "로그인" }),
  ).toBeInTheDocument()

  const brandPanel = screen.getByRole("complementary")
  expect(brandPanel).toHaveAccessibleName(
    "남은 상품을 발견하고, 가볍게 예약해요",
  )

  const journey = within(brandPanel).getByRole("list", {
    name: "남았당 이용 방법",
  })
  expect(within(journey).getAllByRole("listitem")).toHaveLength(3)
  expect(journey).toHaveTextContent("할인 발견")
  expect(journey).toHaveTextContent("상품 예약")
  expect(journey).toHaveTextContent("매장 픽업")

  const browseLink = within(main).getByRole("link", {
    name: "로그인 없이 할인 둘러보기",
  })
  expect(browseLink).toHaveAttribute("href", "/app")
  expect(browseLink).toHaveClass("min-h-11")
})

test("비회원 둘러보기를 누르면 고객 홈으로 이동한다", async () => {
  const user = userEvent.setup()
  const { router } = renderAuthLayout()

  await user.click(
    screen.getByRole("link", { name: "로그인 없이 할인 둘러보기" }),
  )

  expect(
    await screen.findByRole("heading", { level: 1, name: "오늘의 할인" }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe("/app")
})
