import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter } from "react-router"
import { RouterProvider } from "react-router/dom"
import { CustomerLayout } from "../layouts/customer-layout"
import { RootLayout } from "../layouts/root-layout"
import { DealDetailPage } from "../pages/customer/deal-detail-page"
import { HomePage } from "../pages/customer/home-page"
import { renderWithProviders } from "./render"

test("고객 홈에서 할인 상세로 이동하면 라우트 파라미터를 표시한다", async () => {
  const user = userEvent.setup()
  const router = createMemoryRouter(
    [
      {
        Component: RootLayout,
        children: [
          {
            Component: CustomerLayout,
            children: [
              { index: true, Component: HomePage },
              { path: "deals/:dealId", Component: DealDetailPage },
            ],
          },
        ],
      },
    ],
    { initialEntries: ["/"] },
  )

  renderWithProviders(<RouterProvider router={router} />)

  expect(
    screen.getByRole("heading", { level: 1, name: "오늘 가까운 할인" }),
  ).toBeInTheDocument()

  await user.click(screen.getByRole("link", { name: "할인 상세 골격 보기" }))

  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "할인과 픽업 정보",
    }),
  ).toBeInTheDocument()
  expect(screen.getByText("sample-deal")).toBeInTheDocument()
  expect(router.state.location.pathname).toBe("/deals/sample-deal")
})
