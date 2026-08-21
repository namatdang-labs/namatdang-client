import type { ReactNode } from "react"
import { screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"

import {
  clearAccessToken,
  saveAccessToken,
} from "../../features/auth/auth-session"
import { ManagementStoreProvider } from "../../features/management/store-context"
import { FUTURE_ACCESS_TOKEN } from "../../test/auth-token"
import { renderWithProviders } from "../../test/render"
import { ManagementOnboardingPage } from "./management-onboarding-page"

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

function consumerResponse() {
  return {
    id: 1,
    email: "consumer@example.com",
    name: "일반 회원",
    phoneNumber: "010-1234-5678",
    roles: ["CONSUMER"],
    createdAt: "2026-08-21T10:00:00",
    updatedAt: "2026-08-21T10:00:00",
  }
}

beforeEach(() => {
  saveAccessToken(FUTURE_ACCESS_TOKEN)
})

afterEach(() => {
  clearAccessToken()
  vi.restoreAllMocks()
})

test("일반 회원 온보딩은 사장님 가게 API를 호출하지 않고 등록 행동을 보여준다", async () => {
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(jsonResponse(consumerResponse()))

  renderWithProviders(
    <MemoryRouter>
      <ManagementOnboardingPage />
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "등록한 가게가 아직 없어요",
    }),
  ).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "가게 등록하기" })).toHaveAttribute(
    "href",
    "/manage/register",
  )
  expect(
    fetchMock.mock.calls.some(([input]) =>
      String(input).includes("/api/v1/owner/stores"),
    ),
  ).toBe(false)
})

function ProtectedManagement({ children }: { children: ReactNode }) {
  return <ManagementStoreProvider>{children}</ManagementStoreProvider>
}

test("일반 회원이 관리 홈으로 바로 들어오면 온보딩으로 이동한다", async () => {
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(jsonResponse(consumerResponse()))

  renderWithProviders(
    <MemoryRouter initialEntries={["/manage"]}>
      <Routes>
        <Route
          path="/manage"
          element={
            <ProtectedManagement>
              <h1>가게 관리 홈</h1>
            </ProtectedManagement>
          }
        />
        <Route
          path="/manage/onboarding"
          element={<h1>가게 관리 시작하기</h1>}
        />
      </Routes>
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole("heading", { name: "가게 관리 시작하기" }),
  ).toBeInTheDocument()
  expect(screen.queryByRole("heading", { name: "가게 관리 홈" })).toBeNull()
  expect(
    fetchMock.mock.calls.some(([input]) =>
      String(input).includes("/api/v1/owner/stores"),
    ),
  ).toBe(false)
})
