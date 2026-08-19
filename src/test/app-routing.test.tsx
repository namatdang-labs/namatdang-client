import { act, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RouterProvider } from "react-router/dom"

import { router } from "../app/router"
import { renderWithProviders } from "./render"

const coreScreens = [
  ["login", "/login", "다시 만나서 반가워요"],
  ["signup", "/signup", "남았당을 시작해 보세요"],
  ["home", "/", "근처의 마감 할인"],
  ["store detail", "/stores/seongsu-bread-lab", "성수 빵연구소"],
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

test("16개 핵심 화면이 대표 경로에서 제목을 렌더링한다", async () => {
  await router.navigate(coreScreens[0][1])
  renderWithProviders(<RouterProvider router={router} />)

  for (const [screenName, path, heading] of coreScreens) {
    await act(async () => {
      await router.navigate(path)
    })

    expect(
      await screen.findByRole("heading", { level: 1, name: heading }),
      `${screenName} screen at ${path}`,
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(path)
  }
})

test("할인 생성과 수정 경로는 같은 폼을 서로 다른 모드로 렌더링한다", async () => {
  await router.navigate("/manage/deals/new")
  renderWithProviders(<RouterProvider router={router} />)

  expect(
    screen.getByRole("heading", { level: 1, name: "할인 등록" }),
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

test("홈에서 품목 수량을 고르고 확인한 뒤 예약을 완료한다", async () => {
  const user = userEvent.setup()
  await router.navigate("/")
  renderWithProviders(<RouterProvider router={router} />)

  await user.click(
    screen.getByRole("link", {
      name: "오늘의 소금빵 모음 할인 상세 보기",
    }),
  )

  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "오늘의 소금빵 모음",
    }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe("/deals/salt-bread-today")

  const saltBreadQuantity = screen.getByRole("group", {
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
  expect(within(reviewDialog).getAllByText("2,100원")).toHaveLength(2)

  await user.click(
    within(reviewDialog).getByRole("button", { name: "예약하기" }),
  )

  expect(
    await screen.findByRole(
      "heading",
      { level: 1, name: "예약이 완료됐어요" },
      { timeout: 2_000 },
    ),
  ).toBeInTheDocument()
  expect(screen.getByText("소금빵 1개 · 총 1개")).toBeInTheDocument()
  expect(screen.getByText("2,100원")).toBeInTheDocument()
  expect(router.state.location.pathname).toBe("/reservations/complete")
})
