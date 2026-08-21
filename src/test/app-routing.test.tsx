import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RouterProvider } from "react-router/dom"

import { router } from "../app/router"
import {
  ACCESS_TOKEN_STORAGE_KEY,
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from "../features/auth/auth-session"
import { customerQueryKeys } from "../features/customer/customer-api"
import { EXPIRED_ACCESS_TOKEN, FUTURE_ACCESS_TOKEN } from "./auth-token"
import {
  createMockApiFetch,
  createMockApiState,
  mockOwnerStore,
  type MockApiState,
} from "./mock-api"
import { renderWithProviders } from "./render"

const { geocodeAddressMock, reverseGeocodeCoordinateMock } = vi.hoisted(() => ({
  geocodeAddressMock: vi.fn(),
  reverseGeocodeCoordinateMock: vi.fn(),
}))

vi.mock("../features/map", () => ({
  geocodeAddress: geocodeAddressMock,
  reverseGeocodeCoordinate: reverseGeocodeCoordinateMock,
  isGeocodingError: () => false,
  isNaverMapLoadError: () => false,
  isReverseGeocodingError: () => false,
  StoreLocationMap: ({
    ariaLabel = "가게 위치 확인 지도",
    onPositionChange,
  }: {
    ariaLabel?: string
    onPositionChange?: (position: {
      latitude: number
      longitude: number
    }) => void
  }) => (
    <div role="region" aria-label={ariaLabel}>
      {onPositionChange ? (
        <button
          type="button"
          onClick={() =>
            onPositionChange({ latitude: 37.545, longitude: 127.057 })
          }
        >
          테스트 핀 이동
        </button>
      ) : null}
    </div>
  ),
  LocationPickerMap: ({
    ariaLabel = "선택할 위치를 정하는 지도",
    onCenterSettled,
  }: {
    ariaLabel?: string
    onCenterSettled: (position: { latitude: number; longitude: number }) => void
  }) => (
    <div role="region" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={() =>
          onCenterSettled({ latitude: 37.5665, longitude: 126.978 })
        }
      >
        지도 중심 선택
      </button>
    </div>
  ),
  StoreMap: ({ ariaLabel = "가게 지도" }: { ariaLabel?: string }) => (
    <div role="region" aria-label={ariaLabel} />
  ),
}))

const coreScreens = [
  ["landing", "/", "오늘 남은 빵, 가까이서 예약해요."],
  ["login", "/login", "다시 만나서 반가워요"],
  ["signup", "/signup", "남았당을 시작해 보세요"],
  ["home", "/app", "지금 예약 가능한 할인"],
  ["location selection", "/location?returnTo=/app", "지도에서 위치 설정"],
  ["store map", "/map", "지도에서 가게 찾기"],
  ["favorites", "/favorites", "찜한 가게"],
  ["notifications", "/notifications", "알림 센터"],
  ["store detail", "/stores/101", "성수 빵연구소"],
  ["deal detail", "/deals/501", "오늘의 소금빵 모음"],
  [
    "reservation complete",
    "/reservations/complete?reservationId=91",
    "예약이 완료됐어요",
  ],
  ["reservation list", "/reservations", "내 예약"],
  ["reservation detail", "/reservations/91", "예약 상세"],
  ["my", "/me", "마이"],
  ["management onboarding", "/manage/onboarding", "등록한 가게가 아직 없어요"],
  ["store registration", "/manage/register", "가게 등록"],
  ["management home", "/manage", "오늘 운영 현황"],
  ["management deals", "/manage/deals", "할인 관리"],
  ["deal form", "/manage/deals/new", "할인 등록"],
  ["management deal detail", "/manage/deals/41", "할인 상세"],
  ["management reservations", "/manage/reservations", "예약 관리"],
  ["store settings", "/manage/store", "가게 정보"],
] as const

let apiState: MockApiState

beforeEach(() => {
  clearAccessToken()
  window.localStorage.clear()
  saveAccessToken(FUTURE_ACCESS_TOKEN)
  geocodeAddressMock.mockReset()
  geocodeAddressMock.mockResolvedValue({
    roadAddress: "서울 성동구 연무장길 18",
    jibunAddress: "서울 성동구 성수동2가 1-1",
    englishAddress: "18 Yeonmujang-gil, Seongdong-gu, Seoul",
    latitude: 37.54291,
    longitude: 127.05481,
  })
  reverseGeocodeCoordinateMock.mockImplementation(
    async (coordinate: { latitude: number; longitude: number }) => ({
      coordinate,
      address: "서울 중구 세종대로 110",
      label: "태평로1가",
    }),
  )
  apiState = createMockApiState()
  vi.stubGlobal("fetch", createMockApiFetch(apiState))
})

afterEach(() => {
  clearAccessToken()
  vi.unstubAllGlobals()
})

async function renderApp(path: string) {
  await router.navigate("/login")
  await router.navigate(path)
  return renderWithProviders(<RouterProvider router={router} />)
}

test("공개 랜딩을 포함한 22개 핵심 화면을 대표 경로에서 렌더링한다", async () => {
  apiState.ownerStores = []
  if (apiState.currentUser) apiState.currentUser.roles = ["CONSUMER"]
  const { queryClient } = await renderApp(coreScreens[0][1])

  for (const [screenName, path, heading] of coreScreens) {
    if (path === "/manage") {
      apiState.ownerStores = [structuredClone(mockOwnerStore)]
      if (apiState.currentUser) {
        apiState.currentUser.roles = ["CONSUMER", "OWNER"]
        queryClient.setQueryData(["auth", "me"], apiState.currentUser)
      }
      queryClient.setQueryData(["owner", "stores"], apiState.ownerStores)
    }

    await act(async () => {
      await router.navigate(path)
    })

    expect(
      await screen.findByRole("heading", { level: 1, name: heading }),
      `${screenName} screen at ${path}`,
    ).toBeInTheDocument()
    expect(
      `${router.state.location.pathname}${router.state.location.search}`,
    ).toBe(path)
  }

  const apiRequests = apiState.requests.filter(({ pathname }) =>
    pathname.startsWith("/api/v1/"),
  )
  const publicReadRequests = apiRequests.filter(
    ({ method, pathname }) =>
      method === "GET" &&
      (pathname.startsWith("/api/v1/stores") ||
        pathname.startsWith("/api/v1/deals")),
  )
  expect(publicReadRequests.length).toBeGreaterThan(0)
  expect(
    publicReadRequests.every(({ authorization }) => authorization === null),
  ).toBe(true)
  expect(
    apiRequests
      .filter((request) => !publicReadRequests.includes(request))
      .every(
        ({ authorization }) =>
          authorization === `Bearer ${FUTURE_ACCESS_TOKEN}`,
      ),
  ).toBe(true)
})

test("토큰 없이 공개 랜딩을 보고 서비스와 로그인 경로를 선택할 수 있다", async () => {
  clearAccessToken()
  window.localStorage.clear()
  const user = userEvent.setup()

  await renderApp("/")

  const heroHeading = await screen.findByRole("heading", {
    level: 1,
    name: "오늘 남은 빵, 가까이서 예약해요.",
  })
  const hero = heroHeading.closest("section")

  expect(hero).not.toBeNull()
  expect(router.state.location.pathname).toBe("/")
  expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
    "href",
    "/login",
  )
  expect(screen.queryByRole("tab")).not.toBeInTheDocument()
  expect(
    screen.getByRole("heading", {
      level: 2,
      name: "할인 찾기부터 픽업까지",
    }),
  ).toBeInTheDocument()
  expect(
    within(hero as HTMLElement).getByRole("link", {
      name: "지도에서 가까운 가게 찾기",
    }),
  ).toHaveAttribute("href", "/map")
  expect(document.querySelector('a[href="/signup"]')).not.toBeInTheDocument()

  await user.click(
    within(hero as HTMLElement).getByRole("link", {
      name: "오늘 할인 상품 보기",
    }),
  )
  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "지금 예약 가능한 할인",
    }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe("/app")
})

test("다른 탭에서 로그인하면 로그인 화면이 기억한 경로로 이동한다", async () => {
  clearAccessToken()
  window.localStorage.clear()
  await renderApp("/login?redirect=%2Ffavorites")

  act(() => {
    saveAccessToken(FUTURE_ACCESS_TOKEN)
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCESS_TOKEN_STORAGE_KEY,
        oldValue: null,
        newValue: FUTURE_ACCESS_TOKEN,
        storageArea: window.localStorage,
      }),
    )
  })

  expect(
    await screen.findByRole("heading", { level: 1, name: "찜한 가게" }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe("/favorites")
})

test.each([
  ["토큰 없음", null],
  ["만료 토큰", EXPIRED_ACCESS_TOKEN],
  ["비정상 토큰", "not-a-jwt"],
] as const)(
  "%s은 원래 경로를 기억한 로그인 화면으로 이동한다",
  async (_caseName, accessToken) => {
    clearAccessToken()
    window.localStorage.clear()
    if (accessToken) saveAccessToken(accessToken)

    await renderApp("/favorites")

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "다시 만나서 반가워요",
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/login")
    expect(router.state.location.search).toBe("?redirect=%2Ffavorites")
    expect(getAccessToken()).toBeNull()
  },
)

test.each([
  ["홈", "/app", "지금 예약 가능한 할인"],
  ["지도", "/map", "지도에서 가게 찾기"],
  ["위치 설정", "/location?returnTo=%2Fapp", "지도에서 위치 설정"],
  ["가게 상세", "/stores/101", "성수 빵연구소"],
  ["할인 상세", "/deals/501", "오늘의 소금빵 모음"],
] as const)(
  "비회원도 %s 화면을 로그인 없이 볼 수 있다",
  async (_screenName, path, heading) => {
    clearAccessToken()
    window.localStorage.clear()

    await renderApp(path)

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: heading,
      }),
    ).toBeInTheDocument()
    expect(
      `${router.state.location.pathname}${router.state.location.search}`,
    ).toBe(path)
    expect(getAccessToken()).toBeNull()
    expect(
      apiState.requests.every(({ authorization }) => authorization === null),
    ).toBe(true)
  },
)

test.each([
  ["찜", "/favorites"],
  ["알림", "/notifications"],
  ["예약", "/reservations"],
  ["마이", "/me"],
  ["가게 관리", "/manage"],
] as const)(
  "비회원이 %s 화면에 접근하면 로그인 후 돌아오도록 안내한다",
  async (_name, path) => {
    clearAccessToken()
    window.localStorage.clear()

    await renderApp(path)

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "다시 만나서 반가워요",
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/login")
    expect(router.state.location.search).toBe(
      `?redirect=${encodeURIComponent(path)}`,
    )
  },
)

test("비회원이 가게를 찜하려 하면 로그인 후 같은 가게로 돌아온다", async () => {
  clearAccessToken()
  window.localStorage.clear()
  const user = userEvent.setup()

  await renderApp("/stores/101")
  await user.click(
    await screen.findByRole("button", { name: "로그인하고 찜하기" }),
  )

  expect(router.state.location.pathname).toBe("/login")
  expect(router.state.location.search).toBe("?redirect=%2Fstores%2F101")
  expect(
    apiState.requests.some(({ pathname }) =>
      pathname.startsWith("/api/v1/favorites"),
    ),
  ).toBe(false)
})

test("비회원이 할인을 예약하려 하면 로그인 후 같은 할인으로 돌아온다", async () => {
  clearAccessToken()
  window.localStorage.clear()
  const user = userEvent.setup()

  await renderApp("/deals/501")
  const reservationButtons = await screen.findAllByRole("button", {
    name: "로그인하고 예약하기",
  })
  await user.click(reservationButtons[0])

  expect(router.state.location.pathname).toBe("/login")
  expect(router.state.location.search).toBe("?redirect=%2Fdeals%2F501")
  expect(
    apiState.requests.some(
      ({ method, pathname }) =>
        method === "POST" && pathname === "/api/v1/reservations",
    ),
  ).toBe(false)
})

test("만료 토큰이 있어도 공개 홈을 보고 토큰은 정리한다", async () => {
  clearAccessToken()
  window.localStorage.clear()
  saveAccessToken(EXPIRED_ACCESS_TOKEN)

  await renderApp("/app")

  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "지금 예약 가능한 할인",
    }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe("/app")
  expect(getAccessToken()).toBeNull()
})

test("공개 위치 설정 중 다른 탭에서 로그아웃해도 화면을 유지한다", async () => {
  await renderApp("/location?returnTo=%2Fapp")
  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "지도에서 위치 설정",
    }),
  ).toBeInTheDocument()

  act(() => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCESS_TOKEN_STORAGE_KEY,
        oldValue: FUTURE_ACCESS_TOKEN,
        newValue: null,
        storageArea: window.localStorage,
      }),
    )
  })

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "지도에서 위치 설정",
    }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe("/location")
  expect(router.state.location.search).toBe("?returnTo=%2Fapp")
  expect(getAccessToken()).toBeNull()
})

test("홈에서 지도 중심으로 동네를 선택하고 선택한 라벨을 표시한다", async () => {
  const user = userEvent.setup()
  const getCurrentPosition = vi.fn()
  const originalGeolocationDescriptor = Object.getOwnPropertyDescriptor(
    window.navigator,
    "geolocation",
  )
  Object.defineProperty(window.navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition },
  })

  try {
    await renderApp("/app")
    await user.click(
      await screen.findByRole("link", { name: "동네 위치 설정" }),
    )

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "지도에서 위치 설정",
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/location")
    expect(router.state.location.search).toBe("?returnTo=%2Fapp")
    expect(
      screen.queryByRole("button", { name: /내 위치|현재 위치/ }),
    ).not.toBeInTheDocument()
    expect(getCurrentPosition).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "지도 중심 선택" }))
    expect(
      await screen.findByText("서울 중구 세종대로 110"),
    ).toBeInTheDocument()
    expect(reverseGeocodeCoordinateMock).toHaveBeenCalledWith({
      latitude: 37.5665,
      longitude: 126.978,
    })

    await user.click(screen.getByRole("button", { name: "이 위치로 설정" }))

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "지금 예약 가능한 할인",
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/app")
    expect(
      screen.getByRole("link", {
        name: "태평로1가 위치 변경",
      }),
    ).toBeInTheDocument()
    expect(getCurrentPosition).not.toHaveBeenCalled()
  } finally {
    if (originalGeolocationDescriptor) {
      Object.defineProperty(
        window.navigator,
        "geolocation",
        originalGeolocationDescriptor,
      )
    } else {
      Reflect.deleteProperty(window.navigator, "geolocation")
    }
  }
})

test("다른 탭에서 로그아웃하면 캐시를 비우고 현재 경로를 기억한 로그인 화면으로 이동한다", async () => {
  const { queryClient } = await renderApp("/favorites")
  expect(await screen.findByText("2개의 가게")).toBeInTheDocument()
  expect(queryClient.getQueryData(customerQueryKeys.favorites)).toBeDefined()

  act(() => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ACCESS_TOKEN_STORAGE_KEY,
        oldValue: FUTURE_ACCESS_TOKEN,
        newValue: null,
        storageArea: window.localStorage,
      }),
    )
  })

  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "다시 만나서 반가워요",
    }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe("/login")
  expect(router.state.location.search).toBe("?redirect=%2Ffavorites")
  expect(queryClient.getQueryData(customerQueryKeys.favorites)).toBeUndefined()
  expect(getAccessToken()).toBeNull()
})

test("고객이 API 찜 목록에서 두 가게를 해제하면 서버 상태와 빈 화면이 같이 바뀐다", async () => {
  const user = userEvent.setup()
  await renderApp("/app")

  const customerNavigation = screen.getByRole("navigation", {
    name: "고객 주요 메뉴",
  })
  await user.click(
    within(customerNavigation).getByRole("link", { name: /^찜$/ }),
  )

  expect(
    await screen.findByRole("heading", { level: 1, name: "찜한 가게" }),
  ).toBeInTheDocument()
  expect(await screen.findByText("2개의 가게")).toBeInTheDocument()

  await user.click(
    screen.getByRole("button", { name: "성수 빵연구소 찜 해제" }),
  )
  expect(await screen.findByText("1개의 가게")).toBeInTheDocument()

  await user.click(
    screen.getByRole("button", { name: "망원 케이크룸 찜 해제" }),
  )

  expect(
    await screen.findByRole("heading", {
      level: 2,
      name: "아직 찜한 가게가 없어요",
    }),
  ).toBeInTheDocument()
  expect(apiState.favorites).toHaveLength(0)
  expect(
    apiState.requests.filter(
      ({ method, pathname }) =>
        method === "DELETE" && pathname.startsWith("/api/v1/favorites/"),
    ),
  ).toHaveLength(2)
})

test("헤더에서 API 알림 센터를 열고 안 읽은 알림을 모두 읽음 처리한다", async () => {
  const user = userEvent.setup()
  await renderApp("/app")

  await user.click(await screen.findByRole("link", { name: /^알림 센터/ }))

  expect(
    await screen.findByRole("heading", { level: 1, name: "알림 센터" }),
  ).toBeInTheDocument()
  const markAllAsRead = await screen.findByRole("button", {
    name: "현재 목록 읽음 처리",
  })
  await user.click(markAllAsRead)

  expect(
    await screen.findByRole("button", { name: "현재 목록 읽음" }),
  ).toBeDisabled()
  expect(apiState.notifications.every(({ read }) => read)).toBe(true)
  expect(
    apiState.requests.filter(
      ({ method, pathname }) =>
        method === "PATCH" &&
        pathname.startsWith("/api/v1/notifications/") &&
        pathname.endsWith("/read"),
    ),
  ).toHaveLength(2)
})

test("일반 회원이 가게를 등록하면 생성 API 응답으로 관리 화면에 진입한다", async () => {
  apiState.ownerStores = []
  if (apiState.currentUser) apiState.currentUser.roles = ["CONSUMER"]
  const user = userEvent.setup()
  await renderApp("/manage/onboarding")

  const registrationLink = await screen.findByRole("link", {
    name: "가게 등록하기",
  })
  expect(
    apiState.requests.some(
      ({ method, pathname }) =>
        method === "GET" && pathname === "/api/v1/owner/stores",
    ),
  ).toBe(false)
  await user.click(registrationLink)
  expect(
    await screen.findByRole("heading", { level: 1, name: "가게 등록" }),
  ).toBeInTheDocument()
  await user.type(
    screen.getByRole("textbox", { name: /가게 이름/ }),
    "성수 오늘빵",
  )
  await user.type(
    screen.getByRole("textbox", { name: /가게 연락처/ }),
    "0212345678",
  )
  expect(screen.getByRole("textbox", { name: /가게 연락처/ })).toHaveValue(
    "02-1234-5678",
  )
  await user.type(
    screen.getByRole("textbox", { name: /도로명 주소/ }),
    "서울 성동구 연무장길 18",
  )
  expect(geocodeAddressMock).not.toHaveBeenCalled()
  await user.click(screen.getByRole("button", { name: "주소로 위치 찾기" }))
  expect(
    await screen.findByText(
      "주소의 위치를 찾았어요. 지도의 핀이 실제 픽업 장소와 맞는지 확인해 주세요.",
    ),
  ).toBeInTheDocument()
  await user.type(screen.getByRole("textbox", { name: "상세 주소" }), "1층")
  await user.type(
    screen.getByRole("textbox", { name: "가게 소개" }),
    "오늘 구운 빵을 준비해요.",
  )
  await user.click(screen.getByRole("button", { name: "가게 등록하기" }))

  expect(
    await screen.findByRole("heading", { level: 1, name: "오늘 운영 현황" }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe("/manage")
  expect(apiState.ownerStores[0]).toMatchObject({
    name: "성수 오늘빵",
    phoneNumber: "02-1234-5678",
    address: "서울 성동구 연무장길 18",
    latitude: 37.54291,
    longitude: 127.05481,
  })
  expect(
    apiState.requests.some(
      ({ method, pathname }) =>
        method === "POST" && pathname === "/api/v1/owner/stores",
    ),
  ).toBe(true)
  expect(apiState.currentUser?.roles).toEqual(["CONSUMER", "OWNER"])
})

test("할인 등록 폼과 공개된 할인의 읽기 전용 상세를 렌더링한다", async () => {
  await renderApp("/manage/deals/new")

  expect(
    await screen.findByRole("heading", { level: 1, name: "할인 등록" }),
  ).toBeInTheDocument()

  await act(async () => {
    await router.navigate("/manage/deals/41")
  })

  expect(
    await screen.findByRole("heading", { level: 1, name: "할인 상세" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("heading", { level: 2, name: "오늘의 빵 할인" }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole("button", { name: /수정|저장/ }),
  ).not.toBeInTheDocument()
  expect(
    apiState.requests.some(
      ({ method, pathname }) =>
        method === "GET" && pathname === "/api/v1/owner/deals/41",
    ),
  ).toBe(true)
})

test("가게 설정은 owner-store의 phoneNumber를 연락처 입력값으로 보여 준다", async () => {
  await renderApp("/manage/store")

  expect(
    await screen.findByRole("heading", { level: 1, name: "가게 정보" }),
  ).toBeInTheDocument()
  expect(screen.getByRole("textbox", { name: /가게 연락처/ })).toHaveValue(
    mockOwnerStore.phoneNumber,
  )
  expect(
    apiState.requests.some(
      ({ method, pathname }) =>
        method === "GET" && pathname === "/api/v1/owner/stores",
    ),
  ).toBe(true)
})

test("좌표가 없는 기존 가게는 주소를 바꾸지 않으면 다른 정보를 저장할 수 있다", async () => {
  const user = userEvent.setup()
  await renderApp("/manage/store")

  await screen.findByRole("heading", { level: 1, name: "가게 정보" })
  await user.type(
    screen.getByRole("textbox", { name: "가게 소개" }),
    " 픽업 안내를 추가했어요.",
  )
  await user.click(screen.getByRole("button", { name: "변경 내용 저장" }))

  expect(await screen.findByText("가게 정보를 저장했어요.")).toBeInTheDocument()
  expect(
    apiState.requests.filter(
      ({ method, pathname }) =>
        method === "PATCH" && pathname === "/api/v1/owner/stores/301",
    ),
  ).toHaveLength(1)
  expect(apiState.ownerStores[0]).toMatchObject({
    latitude: null,
    longitude: null,
  })
})

test("기존 가게의 주소를 바꾸면 새 위치를 확인해야 저장한다", async () => {
  const user = userEvent.setup()
  await renderApp("/manage/store")

  await screen.findByRole("heading", { level: 1, name: "가게 정보" })
  const addressField = screen.getByRole("textbox", { name: /도로명 주소/ })
  await user.clear(addressField)
  await user.type(addressField, "서울 성동구 연무장길 18")
  await user.click(screen.getByRole("button", { name: "변경 내용 저장" }))

  expect(
    await screen.findByText("변경한 주소의 위치를 찾은 뒤 저장해 주세요."),
  ).toBeInTheDocument()
  expect(
    apiState.requests.filter(({ method }) => method === "PATCH"),
  ).toHaveLength(0)

  await user.click(screen.getByRole("button", { name: "주소로 위치 찾기" }))
  await screen.findByRole("region", { name: "가게 픽업 위치 확인 지도" })
  await user.click(screen.getByRole("button", { name: "변경 내용 저장" }))

  expect(await screen.findByText("가게 정보를 저장했어요.")).toBeInTheDocument()
  expect(apiState.ownerStores[0]).toMatchObject({
    address: "서울 성동구 연무장길 18",
    latitude: 37.54291,
    longitude: 127.05481,
  })
})

test("주소를 바꾸었다가 되돌려도 기존 좌표를 null로 저장하지 않는다", async () => {
  apiState.ownerStores = [
    {
      ...structuredClone(mockOwnerStore),
      latitude: 37.5445,
      longitude: 127.056,
    },
  ]
  const user = userEvent.setup()
  await renderApp("/manage/store")

  await screen.findByRole("heading", { level: 1, name: "가게 정보" })
  const addressField = screen.getByRole("textbox", { name: /도로명 주소/ })
  await user.type(addressField, " ")
  await user.keyboard("{Backspace}")
  expect(addressField).toHaveValue(mockOwnerStore.address)
  await user.click(screen.getByRole("button", { name: "변경 내용 저장" }))

  expect(
    await screen.findByText("기존 픽업 위치를 다시 확인한 뒤 저장해 주세요."),
  ).toBeInTheDocument()
  expect(
    apiState.requests.filter(({ method }) => method === "PATCH"),
  ).toHaveLength(0)
  expect(apiState.ownerStores[0]).toMatchObject({
    latitude: 37.5445,
    longitude: 127.056,
  })
})

test("저장 완료 후 지도 핀만 조정해도 완료 안내를 숨긴다", async () => {
  apiState.ownerStores = [
    {
      ...structuredClone(mockOwnerStore),
      latitude: 37.5445,
      longitude: 127.056,
    },
  ]
  const user = userEvent.setup()
  await renderApp("/manage/store")

  await screen.findByRole("heading", { level: 1, name: "가게 정보" })
  await user.type(
    screen.getByRole("textbox", { name: "가게 소개" }),
    " 입구 안내를 추가했어요.",
  )
  await user.click(screen.getByRole("button", { name: "변경 내용 저장" }))
  expect(await screen.findByText("가게 정보를 저장했어요.")).toBeInTheDocument()

  await user.click(screen.getByRole("button", { name: "테스트 핀 이동" }))

  expect(screen.queryByText("가게 정보를 저장했어요.")).not.toBeInTheDocument()
  expect(screen.getByRole("button", { name: "변경 내용 저장" })).toBeEnabled()
})

test("홈에서 품목 수량을 고르고 확인한 뒤 예약을 완료한다", async () => {
  const user = userEvent.setup()
  await renderApp("/app")

  await user.click(
    await screen.findByRole("link", {
      name: "소금빵 할인 상세 보기",
    }),
  )

  await waitFor(() => expect(router.state.location.pathname).toBe("/deals/501"))

  const saltBreadQuantity = await screen.findByRole("group", {
    name: "소금빵 수량",
  })
  await user.click(
    within(saltBreadQuantity).getByRole("button", {
      name: "소금빵 수량 늘리기",
    }),
  )
  expect(within(saltBreadQuantity).getByText("1")).toBeInTheDocument()

  await user.click(screen.getAllByRole("button", { name: "선택 확인하기" })[0])

  const reviewDialog = await screen.findByRole("dialog", {
    name: "선택한 내용이 맞나요?",
  })
  expect(within(reviewDialog).getByText("소금빵 1개")).toBeInTheDocument()
  await user.click(
    within(reviewDialog).getByRole("button", { name: "예약하기" }),
  )

  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "예약이 완료됐어요",
    }),
  ).toBeInTheDocument()
  expect(screen.getByText("소금빵 1개 · 총 1개")).toBeInTheDocument()
  await waitFor(() =>
    expect(router.state.location.pathname).toBe("/reservations/complete"),
  )
  expect(router.state.location.search).toBe("?reservationId=91")
  expect(
    apiState.requests.some(
      ({ method, pathname, idempotencyKey }) =>
        method === "POST" &&
        pathname === "/api/v1/reservations" &&
        Boolean(idempotencyKey),
    ),
  ).toBe(true)
})
