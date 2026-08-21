import { screen, within } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"

import {
  clearAccessToken,
  saveAccessToken,
} from "../../features/auth/auth-session"
import { FUTURE_ACCESS_TOKEN } from "../../test/auth-token"
import { renderWithProviders } from "../../test/render"
import { LandingPage } from "./landing-page"

function renderLanding() {
  const router = createMemoryRouter([{ path: "/", element: <LandingPage /> }], {
    initialEntries: ["/"],
  })

  return renderWithProviders(<RouterProvider router={router} />)
}

function getSectionByHeading(name: string) {
  const heading = screen.getByRole("heading", { level: 2, name })
  const section = heading.closest("section")

  expect(section).not.toBeNull()
  return section as HTMLElement
}

afterEach(() => {
  clearAccessToken()
  vi.unstubAllGlobals()
})

test("고객이 서버 응답 없이 완성된 할인 탐색 화면을 확인한다", () => {
  const fetchMock = vi.fn()
  vi.stubGlobal("fetch", fetchMock)

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
  expect(
    within(hero as HTMLElement).getByRole("img", {
      name: "빵과 디저트가 진열된 동네 베이커리",
    }),
  ).toHaveAttribute("src")
  expect(
    within(hero as HTMLElement).queryByText("로그인 전에도 할인 둘러보기"),
  ).not.toBeInTheDocument()
  expect(
    within(hero as HTMLElement).queryByText("가까운 가게에서 간편 픽업"),
  ).not.toBeInTheDocument()

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

  const dealsSection = getSectionByHeading("오늘의 할인을 한눈에 골라요")
  const dealPhotoNames = [
    "소금빵 3개 세트 사진",
    "크루아상 2개와 뺑 오 쇼콜라 사진",
    "디저트 모음 박스 사진",
  ] as const
  const dealPhotos = dealPhotoNames.map((name) =>
    within(dealsSection).getByRole("img", { name }),
  )
  expect(within(dealsSection).getAllByRole("img")).toHaveLength(3)
  expect(
    dealPhotos.every((image) => image.getAttribute("src")?.length),
  ).toBeTruthy()
  expect(
    within(dealsSection).getAllByText(/원$/).length,
  ).toBeGreaterThanOrEqual(3)
  expect(
    within(dealsSection).getAllByText(/개 남(?:음|았어요)/).length,
  ).toBeGreaterThanOrEqual(3)

  expect(fetchMock).not.toHaveBeenCalled()
})

test("지도·예약·가게 관리 화면과 실제 기능 경로를 정적으로 안내한다", () => {
  renderLanding()

  const mapSection = getSectionByHeading("가까운 할인 가게를 지도에서 찾아요")
  expect(
    within(mapSection).getByRole("img", {
      name: "대구 동성로 주변 가게 지도",
    }),
  ).toHaveAttribute("src")
  expect(
    within(mapSection).getByRole("link", {
      name: "지도로 할인 가게 찾기",
    }),
  ).toHaveAttribute("href", "/map")
  const activePin = within(mapSection).getByRole("img", {
    name: "동성로 베이크샵, 할인 중, 선택됨",
  })
  const inactivePin = within(mapSection).getByRole("img", {
    name: "수성못 브레드, 현재 공개된 할인 없음",
  })
  expect(activePin).toHaveAttribute("data-deal-status", "active")
  expect(activePin).toHaveAttribute("data-selected", "true")
  expect(activePin.querySelector("img")).toHaveAttribute(
    "src",
    "/brand/namatdang-icon.png",
  )
  expect(inactivePin).toHaveAttribute("data-deal-status", "none")
  expect(inactivePin.querySelector("img")).toHaveClass("grayscale")
  expect(
    within(mapSection).getByText("대구 중구 동성로2길 28"),
  ).toBeInTheDocument()
  expect(document.body).not.toHaveTextContent(/성수|서울|연무장/)

  const reservationSection = getSectionByHeading(
    "품목과 수량, 금액을 한 번 더 확인해요",
  )
  expect(
    within(reservationSection).getByRole("img", {
      name: "예약한 소금빵 3개 세트",
    }),
  ).toHaveAttribute("src")
  expect(
    within(reservationSection).getAllByText(/예약 마감/).length,
  ).toBeGreaterThan(0)
  expect(within(reservationSection).getByText("오늘 19:30")).toBeInTheDocument()

  const ownerSection = getSectionByHeading("오늘 남은 상품을 직접 공개하세요")
  expect(
    within(ownerSection).getByRole("link", {
      name: "가게 등록하기",
    }),
  ).toHaveAttribute("href", "/login?redirect=%2Fmanage%2Fonboarding")

  const finalSection = getSectionByHeading(
    "오늘 가까운 가게의 할인을 확인해 보세요",
  )
  expect(
    within(finalSection).getByRole("link", {
      name: "할인 상품 보기",
    }),
  ).toHaveAttribute("href", "/app")

  expect(screen.queryByRole("tab")).not.toBeInTheDocument()
  expect(
    screen.queryByRole("heading", { name: "자주 묻는 질문" }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole("heading", { name: /고객 리뷰|이용 후기|사용자 후기/ }),
  ).not.toBeInTheDocument()
  expect(document.body).not.toHaveTextContent(
    /예시|미리보기|누적 예약|제휴 가게|이용자 만족도|고객 만족도|API|TODO|추후 구현|테스트용|준비 중/,
  )
})

test("로그인한 회원은 사장님 안내에서 바로 가게 등록 온보딩으로 간다", () => {
  saveAccessToken(FUTURE_ACCESS_TOKEN)
  renderLanding()

  const ownerSection = getSectionByHeading("오늘 남은 상품을 직접 공개하세요")

  expect(
    within(ownerSection).getByRole("link", {
      name: "가게 등록하기",
    }),
  ).toHaveAttribute("href", "/manage/onboarding")
})
