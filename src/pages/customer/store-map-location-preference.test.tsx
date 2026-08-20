import { act, fireEvent, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { MemoryRouter } from "react-router"

import { LOCATION_PREFERENCE_STORAGE_KEY } from "../../features/customer/location-preference"
import { renderWithProviders } from "../../test/render"
import { StoreMapPage } from "./store-map-page"

interface MockStoreMapProps {
  ariaLabel?: string
  fitBounds?: boolean
  onBoundsChange?: (bounds: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  }) => void
  initialCenter?: {
    latitude: number
    longitude: number
  }
}

const { storeMapRenderMock } = vi.hoisted(() => ({
  storeMapRenderMock: vi.fn(),
}))

vi.mock("../../features/map", () => ({
  StoreMap: (props: MockStoreMapProps) => {
    storeMapRenderMock(props)
    return <section role="region" aria-label={props.ariaLabel} />
  },
}))

const mapStore = {
  id: 17,
  name: "성수 테스트 빵집",
  address: "서울특별시 성동구 성수동",
  addressDetail: null,
  phoneNumber: null,
  latitude: 37.5445,
  longitude: 127.056,
  hasActiveDeal: false,
  activeDealCount: 0,
}

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  })
}

function mockMapRequest(requests: URL[]) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    requests.push(new URL(String(input), window.location.origin))
    return jsonResponse([mapStore])
  })
}

beforeEach(() => {
  window.localStorage.clear()
  storeMapRenderMock.mockReset()
})

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

test("저장 위치를 지도 중심과 5km 검색 범위에 적용하고 URL 검색어는 별도로 유지한다", async () => {
  window.localStorage.setItem(
    LOCATION_PREFERENCE_STORAGE_KEY,
    JSON.stringify({
      v: 1,
      latitude: 37.5445,
      longitude: 127.056,
      label: "성수2가3동",
      address: "서울특별시 성동구 연무장길 18",
    }),
  )
  const requests: URL[] = []
  mockMapRequest(requests)

  renderWithProviders(
    <MemoryRouter
      initialEntries={[
        "/map?onlyDiscounting=true&q=%EC%86%8C%EA%B8%88%EB%B9%B5",
      ]}
    >
      <StoreMapPage />
    </MemoryRouter>,
  )

  await screen.findByRole("region", { name: "등록된 가게 위치 지도" })
  await waitFor(() => expect(requests).toHaveLength(1))

  const request = requests[0]
  expect(request.pathname).toMatch(/\/stores\/map$/)
  expect(request.searchParams.get("keyword")).toBe("소금빵")
  expect(Number(request.searchParams.get("minLat"))).toBeCloseTo(
    37.4995339818,
    8,
  )
  expect(Number(request.searchParams.get("maxLat"))).toBeCloseTo(
    37.5894660182,
    8,
  )
  expect(Number(request.searchParams.get("minLng"))).toBeCloseTo(
    126.9992877591,
    8,
  )
  expect(Number(request.searchParams.get("maxLng"))).toBeCloseTo(
    127.1127122409,
    8,
  )
  expect(request.searchParams.get("limit")).toBe("50")
  expect(request.searchParams.get("onlyDiscounting")).toBe("true")

  const mapProps = storeMapRenderMock.mock.lastCall?.[0] as MockStoreMapProps
  expect(mapProps.initialCenter).toEqual({
    latitude: 37.5445,
    longitude: 127.056,
  })
  expect(mapProps.fitBounds).toBe(false)
  expect(
    screen.getByRole("button", { name: "가게 목록으로 돌아가기" }),
  ).toBeInTheDocument()
  const discountFilter = screen.getByRole("button", {
    name: "할인 중인 매장만 보기",
  })
  expect(discountFilter).toHaveAttribute("aria-pressed", "true")

  fireEvent.click(discountFilter)
  await waitFor(() => expect(requests).toHaveLength(2))
  expect(requests[1].searchParams.has("onlyDiscounting")).toBe(false)
  expect(discountFilter).toHaveAttribute("aria-pressed", "false")
})

test("저장 위치가 없으면 전국을 선조회하지 않고 지도에 보이는 영역만 조회한다", async () => {
  const requests: URL[] = []
  mockMapRequest(requests)

  renderWithProviders(
    <MemoryRouter initialEntries={["/map"]}>
      <StoreMapPage />
    </MemoryRouter>,
  )

  await screen.findByRole("region", { name: "등록된 가게 위치 지도" })
  expect(requests).toHaveLength(0)

  const initialMapProps = storeMapRenderMock.mock.lastCall?.[0] as
    MockStoreMapProps | undefined
  expect(initialMapProps?.initialCenter).toBeUndefined()
  expect(initialMapProps?.fitBounds).toBe(true)

  act(() => {
    initialMapProps?.onBoundsChange?.({
      minLat: 37.52,
      maxLat: 37.57,
      minLng: 127.02,
      maxLng: 127.08,
    })
  })
  await waitFor(() => expect(requests).toHaveLength(1))

  const request = requests[0]
  expect(request.searchParams.get("minLat")).toBe("37.52")
  expect(request.searchParams.get("maxLat")).toBe("37.57")
  expect(request.searchParams.get("minLng")).toBe("127.02")
  expect(request.searchParams.get("maxLng")).toBe("127.08")
  expect(request.searchParams.get("limit")).toBe("50")
  expect(request.searchParams.has("keyword")).toBe(false)

  const mapProps = storeMapRenderMock.mock.lastCall?.[0] as MockStoreMapProps
  expect(mapProps.initialCenter).toBeUndefined()
  expect(mapProps.fitBounds).toBe(false)
  expect(
    screen.getByRole("button", { name: "가게 목록으로 돌아가기" }),
  ).toBeInTheDocument()
})

test("넓은 지도 영역도 현재 위치 기준으로 다시 검색한다", async () => {
  const requests: URL[] = []
  mockMapRequest(requests)

  renderWithProviders(
    <MemoryRouter initialEntries={["/map"]}>
      <StoreMapPage />
    </MemoryRouter>,
  )

  const initialMapProps = storeMapRenderMock.mock.lastCall?.[0] as
    MockStoreMapProps | undefined
  act(() => {
    initialMapProps?.onBoundsChange?.({
      minLat: 37.52,
      maxLat: 37.57,
      minLng: 127.02,
      maxLng: 127.08,
    })
  })
  await waitFor(() => expect(requests).toHaveLength(1))

  const currentMapProps = storeMapRenderMock.mock.lastCall?.[0] as
    MockStoreMapProps | undefined
  act(() => {
    currentMapProps?.onBoundsChange?.({
      minLat: 33,
      maxLat: 38.8,
      minLng: 124,
      maxLng: 131,
    })
  })

  const searchCurrentArea = await screen.findByRole("button", {
    name: "이 위치에서 검색",
  })
  fireEvent.click(searchCurrentArea)

  await waitFor(() => expect(requests).toHaveLength(2))
  const wideAreaRequest = requests[1]
  expect(wideAreaRequest.searchParams.get("minLat")).toBe("33")
  expect(wideAreaRequest.searchParams.get("maxLat")).toBe("38.8")
  expect(wideAreaRequest.searchParams.get("minLng")).toBe("124")
  expect(wideAreaRequest.searchParams.get("maxLng")).toBe("131")
  expect(wideAreaRequest.searchParams.get("limit")).toBe("50")
})
