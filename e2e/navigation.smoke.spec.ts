import { expect, test } from "@playwright/test"

test("고객이 품목 수량을 고르고 예약을 완료한다", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })

  await expect(
    page.getByRole("heading", { level: 1, name: "근처의 마감 할인" }),
  ).toBeVisible()
  await page
    .getByRole("link", { name: "오늘의 소금빵 모음 할인 상세 보기" })
    .click()

  await expect(page).toHaveURL(/\/deals\/salt-bread-today$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "오늘의 소금빵 모음" }),
  ).toBeVisible()

  const quantity = page.getByRole("group", { name: "소금빵 수량" })
  await quantity.getByRole("button", { name: "소금빵 수량 늘리기" }).click()
  await expect(quantity).toContainText("1")

  await page.getByRole("button", { name: "선택 확인하기" }).click()
  const reviewDialog = page.getByRole("dialog", {
    name: "선택한 내용이 맞나요?",
  })
  await expect(reviewDialog).toBeVisible()
  await expect(reviewDialog).toContainText("소금빵 1개")
  await expect(reviewDialog).toContainText("2,100원")
  await reviewDialog.getByRole("button", { name: "예약하기" }).click()

  await expect(page).toHaveURL(/\/reservations\/complete$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "예약이 완료됐어요" }),
  ).toBeVisible()
  await expect(page.getByText("소금빵 1개 · 총 1개")).toBeVisible()
  await expect(page.getByText("2,100원")).toBeVisible()
})

test("고객이 찜 목록을 정리하고 알림을 모두 읽는다", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })

  await page.getByRole("link", { name: "찜", exact: true }).click()

  await expect(page).toHaveURL(/\/favorites$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "찜한 가게" }),
  ).toBeVisible()
  await expect(page.getByText("2개의 가게")).toBeVisible()

  await page.getByRole("button", { name: "성수 빵연구소 찜 해제" }).click()
  await page.getByRole("button", { name: "망원 케이크룸 찜 해제" }).click()

  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "아직 찜한 가게가 없어요",
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "오늘의 할인 둘러보기" }),
  ).toBeVisible()

  await page.getByRole("link", { name: "알림 센터" }).click()

  await expect(page).toHaveURL(/\/notifications$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "알림 센터" }),
  ).toBeVisible()

  const markAllAsRead = page.getByRole("button", { name: "전체 읽음" })
  await expect(markAllAsRead).toBeEnabled()
  await markAllAsRead.click()
  await expect(page.getByRole("button", { name: "모두 읽음" })).toBeDisabled()
})

test("고객 화면에서 가게 관리에 진입해 예약을 확인하고 돌아온다", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })

  await page.getByRole("link", { name: /^(가게 관리|관리)$/ }).click()

  await expect(page).toHaveURL(/\/manage$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "오늘 운영 현황" }),
  ).toBeVisible()

  const managementNavigation = page.getByRole("navigation", {
    name: "가게 관리 메뉴",
  })
  await managementNavigation.getByRole("link", { name: "예약 관리" }).click()

  await expect(page).toHaveURL(/\/manage\/reservations$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "예약 관리" }),
  ).toBeVisible()
  await expect(page.getByRole("region", { name: "예약 목록" })).toBeVisible()
  await expect(
    page.getByRole("heading", { level: 2, name: "예약 NMD-0818-001" }),
  ).toBeVisible()

  await page
    .getByRole("link", { name: /^고객 화면(으로|으로 돌아가기)$/ })
    .click()

  await expect(page).toHaveURL(/\/$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "근처의 마감 할인" }),
  ).toBeVisible()
})
