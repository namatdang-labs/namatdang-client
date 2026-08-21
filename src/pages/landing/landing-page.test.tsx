import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"

import {
  clearAccessToken,
  saveAccessToken,
} from "../../features/auth/auth-session"
import { FUTURE_ACCESS_TOKEN } from "../../test/auth-token"
import { renderWithProviders } from "../../test/render"
import { LandingPage } from "./landing-page"

const emptyDealPage = {
  content: [],
  page: 0,
  size: 4,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function renderLanding() {
  const router = createMemoryRouter([{ path: "/", element: <LandingPage /> }], {
    initialEntries: ["/"],
  })

  return renderWithProviders(<RouterProvider router={router} />)
}

afterEach(() => {
  clearAccessToken()
  vi.unstubAllGlobals()
})

test("고객이 서비스 가치를 이해하고 회원가입 없이 할인과 지도를 탐색할 수 있다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(emptyDealPage)))

  renderLanding()

  const heroHeading = screen.getByRole("heading", {
    level: 1,
    name: "오늘 남은 빵, 가까이서 예약해요.",
  })
  const hero = heroHeading.closest("section")

  expect(hero).not.toBeNull()
  expect(
    within(hero as HTMLElement).getByText(/가격.*남은 수량.*예약 마감 시간/),
  ).toBeInTheDocument()
  expect(
    within(hero as HTMLElement).getByRole("link", {
      name: "오늘 할인 상품 보기",
    }),
  ).toHaveAttribute("href", "/app")
  expect(
    within(hero as HTMLElement).getByRole("link", {
      name: "지도에서 가까운 가게 찾기",
    }),
  ).toHaveAttribute("href", "/map")

  const primaryNavigation = screen.getByRole("navigation", {
    name: "남았당 주요 메뉴",
  })
  expect(
    within(primaryNavigation).getByRole("link", { name: "로그인" }),
  ).toHaveAttribute("href", "/login")
  expect(
    within(primaryNavigation).getByRole("link", { name: "할인 둘러보기" }),
  ).toHaveAttribute("href", "/app")
  expect(document.querySelector('a[href="/signup"]')).not.toBeInTheDocument()
  expect(
    screen.queryByRole("link", { name: /회원가입|지금 시작하기/ }),
  ).not.toBeInTheDocument()

  expect(
    screen.getByRole("heading", { level: 2, name: "할인 찾기부터 픽업까지" }),
  ).toBeInTheDocument()
  const ownerHeading = screen.getByRole("heading", {
    level: 2,
    name: "오늘 남은 상품을 직접 공개하세요",
  })
  const ownerSection = ownerHeading.closest("section")

  expect(ownerSection).not.toBeNull()
  expect(
    within(ownerSection as HTMLElement).getByRole("link", {
      name: "가게 등록하기",
    }),
  ).toHaveAttribute("href", "/login?redirect=%2Fmanage%2Fonboarding")
  expect(
    (hero as HTMLElement).compareDocumentPosition(ownerSection as HTMLElement) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()

  const finalHeading = screen.getByRole("heading", {
    level: 2,
    name: "오늘 가까운 가게의 할인을 확인해 보세요",
  })
  const finalSection = finalHeading.closest("section")

  expect(finalSection).not.toBeNull()
  expect(
    within(finalSection as HTMLElement).getByRole("link", {
      name: "할인 상품 보기",
    }),
  ).toHaveAttribute("href", "/app")
  expect(
    (ownerSection as HTMLElement).compareDocumentPosition(
      finalSection as HTMLElement,
    ) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()

  expect(
    screen.queryByText(/화면 예시|미리보기|API 연동|API 개발/),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole("heading", { name: /고객 리뷰|이용 후기|사용자 후기/ }),
  ).not.toBeInTheDocument()
  expect(document.body).not.toHaveTextContent(
    /누적 예약|제휴 가게|이용자 만족도|고객 만족도/,
  )
})

test("공개 API의 실제 판매 중 할인을 최대 네 개 보여준다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    jsonResponse({
      ...emptyDealPage,
      content: [
        {
          dealId: 501,
          storeId: 71,
          storeName: "오늘빵집",
          salesEndsAt: "2099-08-21T19:00:00+09:00",
          status: "SELLING",
          description: "저녁 할인",
          itemCount: 2,
          lowestSalePrice: 2700,
          headlineItemName: "소금빵",
          totalRemainingQuantity: 4,
          maxDiscountRate: 30,
          createdAt: "2099-08-21T15:00:00+09:00",
        },
      ],
      totalElements: 1,
      totalPages: 1,
    }),
  )
  vi.stubGlobal("fetch", fetchMock)

  renderLanding()

  expect(
    await screen.findByRole("link", { name: "소금빵 할인 상세 보기" }),
  ).toHaveAttribute("href", "/deals/501")
  expect(
    screen.getByRole("heading", { name: "지금 예약 가능한 할인" }),
  ).toBeInTheDocument()

  const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [
    string,
    RequestInit,
  ]
  const url = new URL(requestUrl, "http://localhost")
  expect(`${url.pathname}${url.search}`).toBe("/api/v1/deals?page=0&size=4")
  expect(requestInit.method).toBe("GET")
  expect(new Headers(requestInit.headers).has("Authorization")).toBe(false)
})

test("할인을 불러오는 동안 실제 카드 크기의 로딩 상태를 보여준다", () => {
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})))

  renderLanding()

  expect(screen.getByLabelText("오늘의 할인을 불러오는 중")).toHaveAttribute(
    "aria-busy",
    "true",
  )
})

test("공개된 할인이 없으면 빈 이유와 다음 행동을 안내한다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(emptyDealPage)))

  renderLanding()

  expect(
    await screen.findByRole("heading", {
      level: 3,
      name: "지금 공개된 할인 상품이 없어요",
    }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("heading", {
      level: 2,
      name: "지금 예약 가능한 할인",
    }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("link", { name: "전체 할인 둘러보기" }),
  ).toHaveAttribute("href", "/app")
})

test("할인 API가 실패하면 재시도할 수 있고 나머지 랜딩은 유지한다", async () => {
  const user = userEvent.setup()
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(jsonResponse({ message: "unavailable" }, 503))
    .mockResolvedValueOnce(jsonResponse(emptyDealPage))
  vi.stubGlobal("fetch", fetchMock)

  renderLanding()

  expect(
    await screen.findByRole("heading", {
      level: 3,
      name: "할인 상품을 불러오지 못했어요",
    }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "다시 불러오기" }))

  expect(
    await screen.findByRole("heading", {
      level: 3,
      name: "지금 공개된 할인 상품이 없어요",
    }),
  ).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(
    screen.getByRole("heading", { name: "자주 묻는 질문" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("heading", {
      name: "오늘 가까운 가게의 할인을 확인해 보세요",
    }),
  ).toBeInTheDocument()
})

test("로그인한 회원은 사장님 안내에서 바로 가게 등록 온보딩으로 간다", async () => {
  saveAccessToken(FUTURE_ACCESS_TOKEN)
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(emptyDealPage)))

  renderLanding()

  const ownerHeading = screen.getByRole("heading", {
    level: 2,
    name: "오늘 남은 상품을 직접 공개하세요",
  })
  const ownerSection = ownerHeading.closest("section")

  expect(ownerSection).not.toBeNull()
  expect(
    within(ownerSection as HTMLElement).getByRole("link", {
      name: "가게 등록하기",
    }),
  ).toHaveAttribute("href", "/manage/onboarding")
})
