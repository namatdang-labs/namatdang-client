import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"

import { clearAccessToken } from "../../features/auth/auth-session"
import { renderWithProviders } from "../../test/render"
import { DealDetailPage } from "./deal-detail-page"
import { StoreDetailPage } from "./store-detail-page"

vi.mock("../../features/map", () => ({
  StoreLocationMap: ({ ariaLabel }: { ariaLabel?: string }) => (
    <div role="img" aria-label={ariaLabel} />
  ),
}))

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

const store = {
  id: 17,
  name: "성수 테스트 빵집",
  address: "서울특별시 성동구 성수동",
  addressDetail: "1층",
  phoneNumber: "02-1234-5678",
  description: "오늘 만든 빵을 소개해요.",
  latitude: 37.5445,
  longitude: 127.056,
}

const emptyDeals = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
}

const deal = {
  dealId: 31,
  storeId: 17,
  storeName: "성수 테스트 빵집",
  salesEndsAt: "2026-08-21T20:00:00",
  status: "SELLING",
  description: "오늘의 소금빵",
  createdAt: "2026-08-21T10:00:00",
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

function LoginDestination() {
  const location = useLocation()
  return <h1>로그인 이동 {location.search}</h1>
}

afterEach(() => {
  clearAccessToken()
  vi.restoreAllMocks()
})

test("비회원은 가게 정보를 보되 찜 API 없이 현재 가게로 돌아오는 로그인을 안내받는다", async () => {
  const user = userEvent.setup()
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input) => {
      const url = String(input)
      if (url === "/api/v1/stores/17") return jsonResponse(store)
      if (url === "/api/v1/stores/17/deals?page=0&size=20") {
        return jsonResponse(emptyDeals)
      }
      throw new Error(`Unexpected request: ${url}`)
    })

  renderWithProviders(
    <MemoryRouter initialEntries={["/stores/17"]}>
      <Routes>
        <Route path="/stores/:storeId" element={<StoreDetailPage />} />
        <Route path="/login" element={<LoginDestination />} />
      </Routes>
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole("heading", { name: "성수 테스트 빵집" }),
  ).toBeInTheDocument()
  expect(
    fetchMock.mock.calls.some(([input]) => String(input).includes("favorites")),
  ).toBe(false)

  await user.click(screen.getByRole("button", { name: "로그인하고 찜하기" }))

  expect(
    await screen.findByRole("heading", {
      name: "로그인 이동 ?redirect=%2Fstores%2F17",
    }),
  ).toBeInTheDocument()
  expect(
    fetchMock.mock.calls.some(([input]) => String(input).includes("favorites")),
  ).toBe(false)
})

test("비회원은 할인 품목을 보되 예약 API 없이 현재 할인으로 돌아오는 로그인을 안내받는다", async () => {
  const user = userEvent.setup()
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input) => {
      const url = String(input)
      if (url === "/api/v1/deals/31") return jsonResponse(deal)
      if (url === "/api/v1/stores/17") return jsonResponse(store)
      throw new Error(`Unexpected request: ${url}`)
    })

  renderWithProviders(
    <MemoryRouter initialEntries={["/deals/31"]}>
      <Routes>
        <Route path="/deals/:dealId" element={<DealDetailPage />} />
        <Route path="/login" element={<LoginDestination />} />
      </Routes>
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole("heading", { name: "오늘의 소금빵" }),
  ).toBeInTheDocument()

  await user.click(
    (
      await screen.findAllByRole("button", {
        name: "로그인하고 예약하기",
      })
    )[0],
  )

  expect(
    await screen.findByRole("heading", {
      name: "로그인 이동 ?redirect=%2Fdeals%2F31",
    }),
  ).toBeInTheDocument()
  expect(
    fetchMock.mock.calls.some(
      ([input, init]) =>
        String(input) === "/api/v1/reservations" && init?.method === "POST",
    ),
  ).toBe(false)
})
