import { expect, test } from "@playwright/test"

test("고객 홈과 가게 관리 홈을 오간다", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { level: 1, name: "오늘 가까운 할인" }),
  ).toBeVisible()

  const customerNavigation = page.getByRole("navigation", {
    name: "고객 주요 메뉴",
  })
  await customerNavigation
    .getByRole("link", { name: /^(가게 관리|관리)$/ })
    .click()

  await expect(page).toHaveURL(/\/manage$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "오늘 운영 현황" }),
  ).toBeVisible()

  await page.getByRole("link", { name: /^고객 화면(으로)?$/ }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "오늘 가까운 할인" }),
  ).toBeVisible()
})
