import { useEffect, useRef } from "react"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"

import { clearAccessToken } from "../../features/auth/auth-session"
import { LOCATION_PREFERENCE_STORAGE_KEY } from "../../features/customer/location-preference"
import { renderWithProviders } from "../../test/render"
import { HomePage } from "./home-page"
import { StoreDetailPage } from "./store-detail-page"
import { StoreMapPage } from "./store-map-page"

type MockMapStore = {
  id: string
  name: string
  latitude: number
  longitude: number
}

vi.mock("../../features/map", () => ({
  StoreMap: ({
    stores,
    onSelect,
    onBoundsChange,
    ariaLabel,
    className,
  }: {
    stores: MockMapStore[]
    onSelect?: (store: MockMapStore) => void
    onBoundsChange?: (bounds: {
      minLat: number
      maxLat: number
      minLng: number
      maxLng: number
    }) => void
    ariaLabel?: string
    className?: string
  }) => {
    const emittedInitialBounds = useRef(false)

    useEffect(() => {
      if (emittedInitialBounds.current) return
      emittedInitialBounds.current = true
      onBoundsChange?.({
        minLat: 37.52,
        maxLat: 37.58,
        minLng: 126.97,
        maxLng: 127.05,
      })
    }, [onBoundsChange])

    return (
      <section aria-label={ariaLabel} className={className}>
        {stores.map((store) => (
          <button
            key={store.id}
            type="button"
            onClick={() => onSelect?.(store)}
          >
            {store.name} 마커
          </button>
        ))}
      </section>
    )
  },
  StoreLocationMap: ({ ariaLabel }: { ariaLabel?: string }) => (
    <div role="img" aria-label={ariaLabel} />
  ),
}))

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status,
  })
}

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="현재 검색 파라미터">{location.search}</output>
}

const stores = [
  {
    id: 17,
    name: "성수 테스트 빵집",
    address: "서울특별시 성동구 성수동",
    addressDetail: "1층",
    phoneNumber: "02-1234-5678",
    description: "오늘 만든 빵을 소개해요.",
    latitude: 37.5445,
    longitude: 127.056,
  },
  {
    id: 18,
    name: "연남 타르트집",
    address: "서울특별시 마포구 연남동",
    addressDetail: null,
    phoneNumber: null,
    description: null,
    latitude: 37.563,
    longitude: 126.923,
  },
  {
    id: 19,
    name: "위치 준비 중인 가게",
    address: "서울특별시 중구",
    addressDetail: null,
    phoneNumber: null,
    description: null,
    latitude: null,
    longitude: null,
  },
]

const activeDeal = {
  dealId: 71,
  storeId: 17,
  storeName: "성수 테스트 빵집",
  salesEndsAt: "2026-08-20T20:00:00",
  status: "SELLING",
  description: "오늘의 빵 할인",
  itemCount: 2,
  lowestSalePrice: 3500,
  headlineItemName: "소금빵",
  totalRemainingQuantity: 7,
  maxDiscountRate: 40,
  distanceMeters: 420,
  createdAt: "2026-08-20T10:00:00",
}

function dealPage(content: (typeof activeDeal)[] = []) {
  return {
    content,
    page: 0,
    size: 100,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
    first: true,
    last: true,
  }
}

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
)

afterEach(() => {
  clearAccessToken()
  window.localStorage.removeItem("namatdang.customer.neighborhood")
  window.localStorage.removeItem(LOCATION_PREFERENCE_STORAGE_KEY)
  vi.restoreAllMocks()
  if (originalClipboardDescriptor) {
    Object.defineProperty(navigator, "clipboard", originalClipboardDescriptor)
  } else {
    Reflect.deleteProperty(navigator, "clipboard")
  }
})

test("지도에서 선택한 위치를 5km 가게 검색에 적용하고 URL 검색어를 유지한다", async () => {
  window.localStorage.setItem(
    LOCATION_PREFERENCE_STORAGE_KEY,
    JSON.stringify({
      v: 1,
      latitude: 37.5445,
      longitude: 127.056,
      label: "성수동",
      address: "서울특별시 성동구 성수동",
    }),
  )

  const requestedUrls: URL[] = []
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(String(input), window.location.origin)
    requestedUrls.push(url)
    if (url.pathname.endsWith("/deals")) {
      return jsonResponse(dealPage([activeDeal]))
    }
    if (url.pathname.endsWith("/stores/map")) {
      return jsonResponse(
        stores.slice(0, 2).map((store) => ({
          ...store,
          hasActiveDeal: store.id === 17,
          activeDealCount: store.id === 17 ? 1 : 0,
        })),
      )
    }
    if (url.pathname.endsWith("/stores")) {
      return jsonResponse({
        content: stores,
        page: 0,
        size: 20,
        totalElements: stores.length,
        totalPages: 1,
        first: true,
        last: true,
      })
    }
    throw new Error(`Unexpected request: ${url}`)
  })

  renderWithProviders(
    <MemoryRouter initialEntries={["/app?q=%EB%B9%B5"]}>
      <LocationProbe />
      <HomePage />
    </MemoryRouter>,
  )

  expect(
    screen.getByRole("link", { name: "성수동 위치 변경" }),
  ).toHaveAttribute("href", "/location?returnTo=%2Fapp%3Fq%3D%25EB%25B9%25B5")
  expect(
    screen.getByRole("heading", { name: "성수동 근처 가게 둘러보기" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("heading", {
      name: "지금 예약 가능한 할인",
    }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("link", { name: "현재 조건으로 지도보기" }),
  ).toHaveAttribute("href", "/map?onlyDiscounting=true&q=%EB%B9%B5")

  expect(await screen.findAllByText("성수 테스트 빵집")).not.toHaveLength(0)
  const nearbyRequest = requestedUrls.find((url) =>
    url.pathname.endsWith("/stores/map"),
  )
  expect(nearbyRequest).toBeDefined()
  expect(nearbyRequest?.searchParams.get("keyword")).toBe("빵")
  expect(Number(nearbyRequest?.searchParams.get("minLat"))).toBeCloseTo(
    37.4995339818,
    8,
  )
  expect(Number(nearbyRequest?.searchParams.get("maxLat"))).toBeCloseTo(
    37.5894660182,
    8,
  )
  expect(Number(nearbyRequest?.searchParams.get("minLng"))).toBeCloseTo(
    126.9992877591,
    8,
  )
  expect(Number(nearbyRequest?.searchParams.get("maxLng"))).toBeCloseTo(
    127.1127122409,
    8,
  )
  const dealRequest = requestedUrls.find((url) =>
    url.pathname.endsWith("/deals"),
  )
  expect(dealRequest?.searchParams.get("keyword")).toBe("빵")
  expect(dealRequest?.searchParams.get("centerLat")).toBe("37.5445")
  expect(dealRequest?.searchParams.get("centerLng")).toBe("127.056")
  expect(dealRequest?.searchParams.get("radiusMeters")).toBe("5000")
})

test("홈 상단 검색을 URL과 동기화하고 별도 지도 페이지로 이동한다", async () => {
  const user = userEvent.setup()
  const requestedDealKeywords: Array<string | null> = []

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(String(input), window.location.origin)
    if (url.pathname.endsWith("/deals")) {
      requestedDealKeywords.push(url.searchParams.get("keyword"))
      return jsonResponse(dealPage([activeDeal]))
    }
    if (url.pathname.endsWith("/stores")) {
      return jsonResponse({
        content: stores,
        page: 0,
        size: 20,
        totalElements: stores.length,
        totalPages: 1,
        first: true,
        last: true,
      })
    }
    throw new Error(`Unexpected request: ${url.toString()}`)
  })

  renderWithProviders(
    <MemoryRouter initialEntries={["/app?q=%EC%84%B1%EC%88%98"]}>
      <LocationProbe />
      <HomePage />
    </MemoryRouter>,
  )

  const search = screen.getByRole("searchbox", {
    name: "가게와 할인 품목 검색",
  })
  expect(search).toHaveValue("성수")
  expect(requestedDealKeywords).toContain("성수")
  expect(await screen.findAllByText("성수 테스트 빵집")).not.toHaveLength(0)
  const mapView = screen.getByRole("link", {
    name: "현재 조건으로 지도보기",
  })
  expect(mapView).toHaveAttribute(
    "href",
    "/map?onlyDiscounting=true&q=%EC%84%B1%EC%88%98",
  )
  const dealPreviewHeading = screen.getByRole("heading", {
    name: "지금 예약 가능한 할인",
  })
  const storesHeading = screen.getByRole("heading", {
    name: "가게 둘러보기",
  })
  expect(
    dealPreviewHeading.compareDocumentPosition(storesHeading) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(
    screen.queryByRole("region", { name: "등록된 가게 위치 지도" }),
  ).not.toBeInTheDocument()

  await user.clear(search)
  expect(screen.getByLabelText("현재 검색 파라미터")).toHaveTextContent(
    "?q=%EC%84%B1%EC%88%98",
  )
  await user.click(screen.getByRole("button", { name: "검색" }))
  expect(screen.getByLabelText("현재 검색 파라미터")).toHaveTextContent("")
  expect(mapView).toHaveAttribute("href", "/map?onlyDiscounting=true")
})

test("홈 할인을 조건을 유지해 더 불러오고 중복 없이 표시한다", async () => {
  const user = userEvent.setup()
  window.localStorage.setItem(
    LOCATION_PREFERENCE_STORAGE_KEY,
    JSON.stringify({
      v: 1,
      latitude: 37.5445,
      longitude: 127.056,
      label: "성수동",
      address: "서울특별시 성동구 성수동",
    }),
  )
  const pagedDeals = Array.from({ length: 21 }, (_, index) => ({
    ...activeDeal,
    dealId: index + 1,
    headlineItemName: `할인 품목 ${index + 1}`,
  }))
  const requestedDealUrls: URL[] = []

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(String(input), window.location.origin)

    if (url.pathname.endsWith("/deals")) {
      requestedDealUrls.push(url)
      const page = Number(url.searchParams.get("page"))
      const content =
        page === 0 ? pagedDeals.slice(0, 20) : [pagedDeals[19], pagedDeals[20]]

      return jsonResponse({
        content,
        page,
        size: 20,
        totalElements: pagedDeals.length,
        totalPages: 2,
        first: page === 0,
        last: page === 1,
      })
    }
    if (url.pathname.endsWith("/stores/map")) return jsonResponse([])
    throw new Error(`Unexpected request: ${url.toString()}`)
  })

  renderWithProviders(
    <MemoryRouter initialEntries={["/app?q=%EC%86%8C%EA%B8%88%EB%B9%B5"]}>
      <HomePage />
    </MemoryRouter>,
  )

  expect(await screen.findByText("할인 품목 20")).toBeInTheDocument()
  expect(screen.queryByText("할인 품목 21")).not.toBeInTheDocument()
  expect(screen.getByText("21개 중 20개 표시")).toBeInTheDocument()

  await user.click(screen.getByRole("button", { name: "할인 더 보기" }))

  expect(await screen.findByText("할인 품목 21")).toBeInTheDocument()
  expect(screen.getAllByText("할인 품목 20")).toHaveLength(1)
  expect(screen.getByText("21개 중 21개 표시")).toBeInTheDocument()
  expect(screen.getByRole("status")).toHaveTextContent(
    "모든 할인을 확인했어요.",
  )

  const nextPageRequest = requestedDealUrls.find(
    (url) => url.searchParams.get("page") === "1",
  )
  expect(nextPageRequest?.searchParams.get("size")).toBe("20")
  expect(nextPageRequest?.searchParams.get("keyword")).toBe("소금빵")
  expect(nextPageRequest?.searchParams.get("centerLat")).toBe("37.5445")
  expect(nextPageRequest?.searchParams.get("centerLng")).toBe("127.056")
  expect(nextPageRequest?.searchParams.get("radiusMeters")).toBe("5000")
})

test("홈 가게 목록을 20곳씩 이어서 불러온다", async () => {
  const user = userEvent.setup()
  const pagedStores = Array.from({ length: 21 }, (_, index) => ({
    ...stores[0],
    id: index + 1,
    name: `가게 ${index + 1}`,
  }))

  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith("/deals?page=0&size=20")) {
        return jsonResponse(dealPage())
      }
      if (url.endsWith("/stores?page=0&size=20")) {
        return jsonResponse({
          content: pagedStores.slice(0, 20),
          page: 0,
          size: 20,
          totalElements: pagedStores.length,
          totalPages: 2,
          first: true,
          last: false,
        })
      }
      if (url.endsWith("/stores?page=1&size=20")) {
        return jsonResponse({
          content: pagedStores.slice(20),
          page: 1,
          size: 20,
          totalElements: pagedStores.length,
          totalPages: 2,
          first: false,
          last: true,
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

  renderWithProviders(
    <MemoryRouter initialEntries={["/app"]}>
      <HomePage />
    </MemoryRouter>,
  )

  expect(await screen.findByText("가게 20")).toBeInTheDocument()
  expect(screen.queryByText("가게 21")).not.toBeInTheDocument()
  expect(screen.getByText("21곳 중 20곳")).toBeInTheDocument()

  await user.click(screen.getByRole("button", { name: "가게 더 보기" }))

  expect(await screen.findByText("가게 21")).toBeInTheDocument()
  expect(screen.getByText("21곳 중 21곳")).toBeInTheDocument()
  expect(screen.getByRole("status")).toHaveTextContent(
    "모든 가게를 확인했어요.",
  )
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/stores?page=1&size=20"),
    expect.objectContaining({ method: "GET" }),
  )
})

test("별도 지도 페이지에 유효한 위치만 표시하고 가게를 선택한다", async () => {
  const user = userEvent.setup()

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes("/deals")) {
      return jsonResponse(dealPage([activeDeal]))
    }
    if (url.includes("/stores/map") || url.includes("/stores")) {
      return jsonResponse(
        stores.map((s) => ({
          ...s,
          hasActiveDeal: s.id === 17,
          activeDealCount: s.id === 17 ? 1 : 0,
        })),
      )
    }
    throw new Error(`Unexpected request: ${url}`)
  })

  renderWithProviders(
    <MemoryRouter
      initialEntries={["/map?onlyDiscounting=true&q=%EC%84%B1%EC%88%98"]}
    >
      <StoreMapPage />
    </MemoryRouter>,
  )

  expect(
    screen.getByRole("heading", { level: 1, name: "지도에서 가게 찾기" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("searchbox", { name: "지도에서 가게 검색" }),
  ).toHaveValue("성수")
  expect(
    screen.getByRole("button", { name: "가게 목록으로 돌아가기" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: "할인 중인 매장만 보기" }),
  ).toHaveAttribute("aria-pressed", "true")

  const map = await screen.findByRole("region", {
    name: "등록된 가게 위치 지도",
  })
  const mapViewport = map.closest('[data-map-viewport="primary"]')
  const mapPage = map.closest('[data-map-page-layout="fullscreen"]')
  expect(mapViewport).toHaveClass("min-h-0", "flex-1", "overflow-hidden")
  expect(mapPage).toHaveClass("fixed", "inset-0", "min-h-svh", "flex-col")
  expect(
    await within(map).findByText("성수 테스트 빵집 마커"),
  ).toBeInTheDocument()
  expect(within(map).getByText("연남 타르트집 마커")).toBeInTheDocument()
  expect(
    within(map).queryByText("위치 준비 중인 가게 마커"),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole("complementary", { name: "지도 가게 목록" }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole("article", { name: "성수 테스트 빵집" }),
  ).not.toBeInTheDocument()

  await user.click(
    within(map).getByRole("button", { name: "성수 테스트 빵집 마커" }),
  )
  const selectedStoreCard = screen.getByRole("article", {
    name: "성수 테스트 빵집",
  })
  expect(selectedStoreCard).toHaveAttribute("data-map-selected-store-card")
  expect(selectedStoreCard).toHaveClass("absolute", "max-w-md", "rounded-2xl")
  expect(selectedStoreCard.closest("footer")).toBeNull()
  expect(
    within(selectedStoreCard).getByText("가게 기본 이미지"),
  ).toBeInTheDocument()
  expect(
    within(selectedStoreCard).getByText("성수 테스트 빵집"),
  ).toBeInTheDocument()
  expect(
    within(selectedStoreCard).getByText("서울특별시 성동구 성수동"),
  ).toBeInTheDocument()
  expect(within(selectedStoreCard).getByText("할인 중")).toBeInTheDocument()
  expect(within(selectedStoreCard).getByText("1개 판매 중")).toBeInTheDocument()
  expect(
    within(selectedStoreCard).getByRole("link", { name: "가게 정보 보기" }),
  ).toHaveAttribute("href", "/stores/17")

  await user.click(
    within(map).getByRole("button", { name: "연남 타르트집 마커" }),
  )
  const updatedStoreCard = screen.getByRole("article", {
    name: "연남 타르트집",
  })
  expect(
    within(updatedStoreCard).getByText("연남 타르트집"),
  ).toBeInTheDocument()
  expect(
    within(updatedStoreCard).getByText("현재 할인 없음"),
  ).toBeInTheDocument()
  await user.click(
    within(updatedStoreCard).getByRole("button", {
      name: "연남 타르트집 간단 정보 닫기",
    }),
  )
  expect(
    screen.queryByRole("article", { name: "연남 타르트집" }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole("complementary", { name: "지도 가게 목록" }),
  ).not.toBeInTheDocument()
})

test("지도 위치가 없는 가게는 지도 안내 후 목록 보기로 확인한다", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes("/deals")) {
      return jsonResponse(dealPage())
    }
    if (url.includes("/stores/map") || url.includes("/stores")) {
      return jsonResponse([
        {
          ...stores[2],
          hasActiveDeal: false,
          activeDealCount: 0,
        },
      ])
    }
    throw new Error(`Unexpected request: ${url}`)
  })

  renderWithProviders(
    <MemoryRouter initialEntries={["/map"]}>
      <StoreMapPage />
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole("heading", {
      name: "지도에 표시할 가게 위치가 아직 없어요",
    }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("region", { name: "등록된 가게 위치 지도" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: "가게 목록으로 돌아가기" }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole("link", { name: /\uC704치 준비 중인 가게/ }),
  ).not.toBeInTheDocument()
})

test("가게 API가 실패해도 서울 중심 지도와 재시도 안내를 유지한다", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes("/stores/map")) {
      return jsonResponse({ message: "Map API unavailable" }, 500)
    }
    throw new Error(`Unexpected request: ${url}`)
  })

  renderWithProviders(
    <MemoryRouter initialEntries={["/map"]}>
      <StoreMapPage />
    </MemoryRouter>,
  )

  const map = screen.getByRole("region", {
    name: "등록된 가게 위치 지도",
  })
  expect(map).toHaveClass("h-full", "w-full")

  const errorPanel = await screen.findByRole("alert")
  expect(
    within(errorPanel).getByRole("heading", {
      name: "가게 목록을 불러오지 못했어요",
    }),
  ).toBeInTheDocument()
  expect(
    within(errorPanel).getByRole("button", { name: "재시도" }),
  ).toBeInTheDocument()
})

test("가게 상세에 지도 미리보기와 주소 행동을 제공한다", async () => {
  const user = userEvent.setup()
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  })

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input)
    if (url.endsWith("/stores/17")) return jsonResponse(stores[0])
    if (url.endsWith("/stores/17/deals?page=0&size=20")) {
      return jsonResponse(dealPage([activeDeal]))
    }
    if (url.endsWith("/favorites") && init?.method === "GET") {
      return jsonResponse([])
    }
    throw new Error(`Unexpected request: ${init?.method} ${url}`)
  })

  renderWithProviders(
    <MemoryRouter initialEntries={["/stores/17"]}>
      <Routes>
        <Route path="/stores/:storeId" element={<StoreDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole("img", { name: "성수 테스트 빵집 위치 지도" }),
  ).toBeInTheDocument()
  expect(screen.queryByText(/^위도 /)).not.toBeInTheDocument()

  const naverMapLink = screen.getByRole("link", {
    name: "성수 테스트 빵집 네이버 지도에서 보기 (새 창)",
  })
  expect(naverMapLink).toHaveAttribute("target", "_blank")
  expect(naverMapLink.getAttribute("href")).toMatch(
    /^https:\/\/map\.naver\.com\/p\/search\//,
  )

  await user.click(screen.getByRole("button", { name: "주소 복사" }))
  expect(writeText).toHaveBeenCalledWith("서울특별시 성동구 성수동 1층")
  expect(await screen.findByText("주소를 복사했어요.")).toBeInTheDocument()
})

test("좌표가 없는 가게 상세에서 주소와 안내를 유지한다", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input)
    if (url.endsWith("/stores/19")) return jsonResponse(stores[2])
    if (url.endsWith("/stores/19/deals?page=0&size=20")) {
      return jsonResponse(dealPage())
    }
    if (url.endsWith("/favorites") && init?.method === "GET") {
      return jsonResponse([])
    }
    throw new Error(`Unexpected request: ${init?.method} ${url}`)
  })

  renderWithProviders(
    <MemoryRouter initialEntries={["/stores/19"]}>
      <Routes>
        <Route path="/stores/:storeId" element={<StoreDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )

  expect(
    await screen.findByText(
      "지도에서 위치를 확인할 수 없어요. 주소로 가게를 확인해 주세요.",
    ),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole("img", { name: "위치 준비 중인 가게 위치 지도" }),
  ).not.toBeInTheDocument()
  expect(screen.getAllByText("서울특별시 중구")).toHaveLength(2)
})
