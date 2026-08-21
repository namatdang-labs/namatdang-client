import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { MemoryRouter, useLocation } from "react-router"

import { LOCATION_PREFERENCE_STORAGE_KEY } from "../../features/customer/location-preference"
import { renderWithProviders } from "../../test/render"
import { HomePage } from "./home-page"

const selectedLocation = {
  v: 1 as const,
  latitude: 37.5445,
  longitude: 127.056,
  label: "성수2가3동",
  address: "서울특별시 성동구 성수이로 1",
}

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  })
}

function emptyPage() {
  return {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  }
}

function CurrentSearchProbe() {
  const location = useLocation()
  return <output aria-label="현재 검색 파라미터">{location.search}</output>
}

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

test("모바일 홈은 위치와 지도를 한 줄에 두고 검색창을 바로 아래에 유지한다", async () => {
  window.localStorage.setItem(
    LOCATION_PREFERENCE_STORAGE_KEY,
    JSON.stringify(selectedLocation),
  )

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(String(input), "https://namatdang.test")
    if (url.pathname.endsWith("/deals")) return jsonResponse(emptyPage())
    if (url.pathname.endsWith("/stores/map")) return jsonResponse([])
    throw new Error(`Unexpected request: ${url.toString()}`)
  })

  renderWithProviders(
    <MemoryRouter initialEntries={["/app?q=%EC%86%8C%EA%B8%88%EB%B9%B5"]}>
      <HomePage />
    </MemoryRouter>,
  )

  const locationLink = screen.getByRole("link", {
    name: "성수2가3동 위치 변경",
  })
  expect(locationLink).toHaveTextContent("성수2가3동 · 변경")
  expect(locationLink).not.toHaveClass("flex-1")
  expect(locationLink).toHaveAttribute(
    "href",
    "/location?returnTo=%2Fapp%3Fq%3D%25EC%2586%258C%25EA%25B8%2588%25EB%25B9%25B5",
  )

  expect(
    screen.getByRole("link", { name: "현재 조건으로 지도보기" }),
  ).toHaveAttribute(
    "href",
    "/map?onlyDiscounting=true&q=%EC%86%8C%EA%B8%88%EB%B9%B5",
  )

  const searchForm = screen.getByRole("search")
  expect(searchForm).toHaveClass("order-last", "min-h-12", "w-full")
  expect(
    screen.getByRole("searchbox", { name: "가게와 할인 품목 검색" }),
  ).toHaveValue("소금빵")
  expect(
    screen.queryByRole("button", { name: "검색창 열기" }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole("heading", { name: "지금 예약 가능한 할인" }),
  ).toBeInTheDocument()

  expect(
    await screen.findByText("검색 조건에 맞는 할인이 없어요"),
  ).toBeInTheDocument()
})

test("홈 검색은 입력한 조건을 URL과 지도 링크에 함께 반영한다", async () => {
  const user = userEvent.setup()

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(String(input), "https://namatdang.test")
    if (url.pathname.endsWith("/deals")) return jsonResponse(emptyPage())
    if (url.pathname.endsWith("/stores")) return jsonResponse(emptyPage())
    throw new Error(`Unexpected request: ${url.toString()}`)
  })

  renderWithProviders(
    <MemoryRouter initialEntries={["/app"]}>
      <CurrentSearchProbe />
      <HomePage />
    </MemoryRouter>,
  )

  const search = screen.getByRole("searchbox", {
    name: "가게와 할인 품목 검색",
  })
  await user.type(search, "크루아상")
  await user.click(screen.getByRole("button", { name: "검색" }))

  expect(screen.getByLabelText("현재 검색 파라미터")).toHaveTextContent(
    "?q=%ED%81%AC%EB%A3%A8%EC%95%84%EC%83%81",
  )
  expect(
    screen.getByRole("link", { name: "현재 조건으로 지도보기" }),
  ).toHaveAttribute(
    "href",
    "/map?onlyDiscounting=true&q=%ED%81%AC%EB%A3%A8%EC%95%84%EC%83%81",
  )
})
