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

const coreScreens = [
  ["login", "/login", "다시 만나서 반가워요"],
  ["signup", "/signup", "남았당을 시작해 보세요"],
  ["home", "/", "근처의 마감 할인"],
  ["favorites", "/favorites", "찜한 가게"],
  ["notifications", "/notifications", "알림 센터"],
  ["store detail", "/stores/101", "성수 빵연구소"],
  ["deal detail", "/deals/salt-bread-today", "오늘의 소금빵 모음"],
  ["reservation complete", "/reservations/complete", "예약이 완료됐어요"],
  ["reservation list", "/reservations", "내 예약"],
  ["reservation detail", "/reservations/reservation-1", "예약 상세"],
  ["my", "/me", "마이"],
  ["management onboarding", "/manage/onboarding", "등록한 가게가 아직 없어요"],
  ["store registration", "/manage/register", "가게 등록"],
  ["management home", "/manage", "오늘 운영 현황"],
  ["management deals", "/manage/deals", "할인 관리"],
  ["deal form", "/manage/deals/new", "할인 등록"],
  ["management reservations", "/manage/reservations", "예약 관리"],
  ["store settings", "/manage/store", "가게 정보"],
] as const

let apiState: MockApiState

beforeEach(() => {
  clearAccessToken()
  window.localStorage.clear()
  saveAccessToken(FUTURE_ACCESS_TOKEN)
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

test("JWT 세션과 mock API로 18개 핵심 화면을 대표 경로에서 렌더링한다", async () => {
  apiState.ownerStores = []
  const { queryClient } = await renderApp(coreScreens[0][1])

  for (const [screenName, path, heading] of coreScreens) {
    if (path === "/manage") {
      apiState.ownerStores = [structuredClone(mockOwnerStore)]
      queryClient.setQueryData(["owner", "stores"], apiState.ownerStores)
    }

    await act(async () => {
      await router.navigate(path)
    })

    expect(
      await screen.findByRole("heading", { level: 1, name: heading }),
      `${screenName} screen at ${path}`,
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(path)
  }

  expect(
    apiState.requests
      .filter(({ pathname }) => pathname.startsWith("/api/v1/"))
      .every(
        ({ authorization }) =>
          authorization === `Bearer ${FUTURE_ACCESS_TOKEN}`,
      ),
  ).toBe(true)
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
  await renderApp("/")

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
  await renderApp("/")

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
  const user = userEvent.setup()
  await renderApp("/manage/onboarding")

  await user.click(await screen.findByRole("link", { name: "가게 등록하기" }))
  expect(
    await screen.findByRole("heading", { level: 1, name: "가게 등록" }),
  ).toBeInTheDocument()
  await user.type(
    screen.getByRole("textbox", { name: /가게 이름/ }),
    "성수 오늘빵",
  )
  await user.type(
    screen.getByRole("textbox", { name: /가게 연락처/ }),
    "02-1234-5678",
  )
  await user.type(
    screen.getByRole("textbox", { name: /도로명 주소/ }),
    "서울 성동구 연무장길 18",
  )
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
  })
  expect(
    apiState.requests.some(
      ({ method, pathname }) =>
        method === "POST" && pathname === "/api/v1/owner/stores",
    ),
  ).toBe(true)
})

test("할인 생성과 수정 경로는 API 가게 컨텍스트 안에서 각 폼 모드를 렌더링한다", async () => {
  await renderApp("/manage/deals/new")

  expect(
    await screen.findByRole("heading", { level: 1, name: "할인 등록" }),
  ).toBeInTheDocument()

  await act(async () => {
    await router.navigate("/manage/deals/deal-001/edit")
  })

  expect(
    await screen.findByRole("heading", { level: 1, name: "할인 수정" }),
  ).toBeInTheDocument()
  expect(screen.getByRole("textbox", { name: /할인 이름/ })).toHaveValue(
    "버터 크루아상 세트",
  )
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

test("홈에서 품목 수량을 고르고 확인한 뒤 예약을 완료한다", async () => {
  const user = userEvent.setup()
  await renderApp("/")

  await user.click(
    screen.getByRole("link", {
      name: "오늘의 소금빵 모음 할인 상세 보기",
    }),
  )

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
})
