import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { MemoryRouter } from "react-router"

import {
  LOCATION_PREFERENCE_STORAGE_KEY,
  getLocationSearchBounds,
} from "../../features/customer/location-preference"
import { renderWithProviders } from "../../test/render"
import { HomePage } from "./home-page"

const selectedLocation = {
  v: 1 as const,
  latitude: 37.5445,
  longitude: 127.056,
  label: "성수동1가1동",
  address: "서울특별시 성동구 성수이로 1",
}

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  })
}

function mapStore(index: number) {
  return {
    id: index,
    name: `근처 빵집 ${index}`,
    address: `서울특별시 성동구 성수이로 ${index}`,
    latitude: selectedLocation.latitude + index * 0.0015,
    longitude: selectedLocation.longitude,
    hasActiveDeal: index % 2 === 0,
    activeDealCount: index % 2 === 0 ? 1 : 0,
  }
}

function emptyDealPage() {
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

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

test("선택 위치 5km 안의 가게만 가까운 순으로 20개씩 보여준다", async () => {
  const user = userEvent.setup()
  window.localStorage.setItem(
    LOCATION_PREFERENCE_STORAGE_KEY,
    JSON.stringify(selectedLocation),
  )
  const nearbyStores = Array.from({ length: 23 }, (_, index) =>
    mapStore(index + 1),
  )
  const boundingBoxCornerStore = {
    ...mapStore(999),
    name: "사각 범위만 안의 가게",
    latitude: selectedLocation.latitude + 0.04,
    longitude: selectedLocation.longitude + 0.05,
  }
  let mapRequestUrl: URL | null = null
  let dealRequestUrl: URL | null = null

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes("/deals?")) {
      dealRequestUrl = new URL(url, "https://namatdang.test")
      return jsonResponse(emptyDealPage())
    }
    if (url.includes("/stores/map?")) {
      mapRequestUrl = new URL(url, "https://namatdang.test")
      return jsonResponse([
        boundingBoxCornerStore,
        ...nearbyStores.toReversed(),
      ])
    }
    if (url.endsWith("/stores?page=0&size=20&keyword=%EB%B9%B5")) {
      return jsonResponse({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      })
    }
    throw new Error(`Unexpected request: ${url}`)
  })

  renderWithProviders(
    <MemoryRouter initialEntries={["/app?q=%EB%B9%B5"]}>
      <HomePage />
    </MemoryRouter>,
  )

  expect(await screen.findByText("근처 빵집 1")).toBeInTheDocument()
  expect(screen.getByText("근처 빵집 20")).toBeInTheDocument()
  expect(screen.queryByText("근처 빵집 21")).not.toBeInTheDocument()
  expect(screen.queryByText("사각 범위만 안의 가게")).not.toBeInTheDocument()
  expect(screen.getByText("23곳 중 20곳")).toBeInTheDocument()

  const firstStore = screen.getByText("근처 빵집 1").closest("a")
  const secondStore = screen.getByText("근처 빵집 2").closest("a")
  expect(firstStore).not.toBeNull()
  expect(secondStore).not.toBeNull()
  const firstStoreCard = within(firstStore as HTMLElement)
  const secondStoreCard = within(secondStore as HTMLElement)
  const firstStoreTitle = firstStoreCard.getByRole("heading", {
    name: "근처 빵집 1",
  })
  const noActiveDealBadge = firstStoreCard.getByText("현재 할인 없음")
  expect(firstStoreTitle.parentElement).toBe(noActiveDealBadge.parentElement)
  expect(firstStoreCard.getByText("가게 기본 이미지")).toBeInTheDocument()
  expect(
    firstStoreCard.getByText(/^\d+(?:\.\d+)?(?:m|km)$/),
  ).toBeInTheDocument()
  expect(secondStoreCard.getByText("할인 중")).toBeInTheDocument()
  expect(secondStoreCard.getByText("1개 판매 중")).toBeInTheDocument()
  expect(
    firstStore!.compareDocumentPosition(secondStore!) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(
    screen.getByRole("heading", {
      name: "성수동1가1동 근처 가게 둘러보기",
    }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("link", {
      name: "성수동1가1동 위치 변경",
    }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("link", { name: "현재 조건으로 지도보기" }),
  ).toHaveAttribute("href", "/map?onlyDiscounting=true&q=%EB%B9%B5")

  const expectedBounds = getLocationSearchBounds(selectedLocation)
  expect(mapRequestUrl).not.toBeNull()
  expect(mapRequestUrl!.searchParams.get("keyword")).toBe("빵")
  expect(Number(mapRequestUrl!.searchParams.get("minLat"))).toBeCloseTo(
    expectedBounds.minLat,
    8,
  )
  expect(Number(mapRequestUrl!.searchParams.get("maxLat"))).toBeCloseTo(
    expectedBounds.maxLat,
    8,
  )
  expect(Number(mapRequestUrl!.searchParams.get("minLng"))).toBeCloseTo(
    expectedBounds.minLng,
    8,
  )
  expect(Number(mapRequestUrl!.searchParams.get("maxLng"))).toBeCloseTo(
    expectedBounds.maxLng,
    8,
  )
  expect(dealRequestUrl).not.toBeNull()
  expect(dealRequestUrl!.searchParams.get("keyword")).toBe("빵")
  expect(dealRequestUrl!.searchParams.get("centerLat")).toBe("37.5445")
  expect(dealRequestUrl!.searchParams.get("centerLng")).toBe("127.056")
  expect(dealRequestUrl!.searchParams.get("radiusMeters")).toBe("5000")

  await user.click(screen.getByRole("button", { name: "가게 더 보기" }))
  expect(await screen.findByText("근처 빵집 23")).toBeInTheDocument()
  expect(screen.getByText("23곳 중 23곳")).toBeInTheDocument()
})
