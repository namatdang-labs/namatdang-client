import type { ReactNode } from "react"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"

import { renderWithProviders } from "../test/render"
import { ManagementLayout } from "./management-layout"
import { ManagementSetupLayout } from "./management-setup-layout"

vi.mock("../features/management/store-context", () => ({
  ManagementStoreProvider: ({ children }: { children: ReactNode }) => children,
  useManagementStore: () => ({
    store: { id: "101", name: "남았당 베이커리" },
    stores: [{ id: "101", name: "남았당 베이커리" }],
    setStoreId: vi.fn(),
  }),
}))

test("가게 관리의 데스크톱과 모바일 로고가 고객 홈으로 이동한다", async () => {
  const user = userEvent.setup()
  const router = createMemoryRouter(
    [
      { path: "/app", element: <h1>남았당 고객 홈</h1> },
      {
        path: "/manage",
        element: <ManagementLayout />,
        children: [{ index: true, element: <h1>가게 관리</h1> }],
      },
    ],
    { initialEntries: ["/manage"] },
  )

  renderWithProviders(<RouterProvider router={router} />)

  const homeLinks = screen.getAllByRole("link", { name: "남았당 홈" })
  expect(homeLinks).toHaveLength(2)
  expect(homeLinks.every((link) => link.getAttribute("href") === "/app")).toBe(
    true,
  )

  await user.click(homeLinks[0])

  expect(
    await screen.findByRole("heading", { name: "남았당 고객 홈" }),
  ).toBeInTheDocument()
})

test("현재 관리 중인 가게와 활성 메뉴를 데스크톱과 모바일에서 구분한다", () => {
  const router = createMemoryRouter(
    [
      {
        path: "/manage",
        element: <ManagementLayout />,
        children: [{ index: true, element: <h1>가게 관리</h1> }],
      },
    ],
    { initialEntries: ["/manage"] },
  )

  renderWithProviders(<RouterProvider router={router} />)

  const storeSelects = screen.getAllByRole("combobox", {
    name: "현재 관리 중",
  })
  expect(storeSelects).toHaveLength(2)
  expect(
    storeSelects.every(
      (select) =>
        select.classList.contains("min-h-11") &&
        select.textContent?.includes("남았당 베이커리"),
    ),
  ).toBe(true)

  const activeNavigationLinks = screen.getAllByRole("link", {
    name: "운영 현황",
  })
  expect(activeNavigationLinks).toHaveLength(2)
  expect(
    activeNavigationLinks.every(
      (link) =>
        link.getAttribute("aria-current") === "page" &&
        link
          .querySelector("[data-active-indicator]")
          ?.classList.contains("bg-primary"),
    ),
  ).toBe(true)
})

test("가게 등록 화면의 로고가 고객 홈으로 이동한다", async () => {
  const user = userEvent.setup()
  const router = createMemoryRouter(
    [
      { path: "/app", element: <h1>남았당 고객 홈</h1> },
      {
        path: "/manage/onboarding",
        element: <ManagementSetupLayout />,
        children: [{ index: true, element: <h1>가게 등록 안내</h1> }],
      },
    ],
    { initialEntries: ["/manage/onboarding"] },
  )

  renderWithProviders(<RouterProvider router={router} />)

  const homeLink = screen.getByRole("link", { name: "남았당 홈" })
  expect(homeLink).toHaveAttribute("href", "/app")

  await user.click(homeLink)

  expect(
    await screen.findByRole("heading", { name: "남았당 고객 홈" }),
  ).toBeInTheDocument()
})
