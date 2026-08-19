import { expect, test } from "@playwright/test"

import { FUTURE_ACCESS_TOKEN } from "../src/test/auth-token"
import { installMockApi } from "./mock-api"

test("고객이 품목 수량을 고르고 예약을 완료한다", async ({ page }) => {
  const api = await installMockApi(page)
  await page.goto("/", { waitUntil: "domcontentloaded" })

  await expect(
    page.getByRole("heading", { level: 1, name: "근처의 마감 할인" }),
  ).toBeVisible()
  await page
    .getByRole("link", { name: "오늘의 소금빵 모음 할인 상세 보기" })
    .click()

  await expect(page).toHaveURL(/\/deals\/salt-bread-today$/)
  const quantity = page.getByRole("group", { name: "소금빵 수량" })
  await quantity.getByRole("button", { name: "소금빵 수량 늘리기" }).click()
  await expect(quantity).toContainText("1")

  await page.getByRole("button", { name: "선택 확인하기" }).click()
  const reviewDialog = page.getByRole("dialog", {
    name: "선택한 내용이 맞나요?",
  })
  await expect(reviewDialog).toContainText("소금빵 1개")
  await reviewDialog.getByRole("button", { name: "예약하기" }).click()

  await expect(page).toHaveURL(/\/reservations\/complete$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "예약이 완료됐어요" }),
  ).toBeVisible()
  await expect(page.getByText("소금빵 1개 · 총 1개")).toBeVisible()
  expect(
    api.requests.every(
      ({ authorization }) => authorization === `Bearer ${FUTURE_ACCESS_TOKEN}`,
    ),
  ).toBe(true)
})

test("고객이 API 찜 목록을 정리하고 알림을 모두 읽는다", async ({ page }) => {
  const api = await installMockApi(page)
  await page.goto("/", { waitUntil: "domcontentloaded" })

  await page.getByRole("link", { name: "찜", exact: true }).click()
  await expect(page).toHaveURL(/\/favorites$/)
  await expect(page.getByText("2개의 가게")).toBeVisible()

  await page.getByRole("button", { name: "성수 빵연구소 찜 해제" }).click()
  await expect(page.getByText("1개의 가게")).toBeVisible()
  await page.getByRole("button", { name: "망원 케이크룸 찜 해제" }).click()
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "아직 찜한 가게가 없어요",
    }),
  ).toBeVisible()
  expect(api.favorites).toHaveLength(0)

  await page.getByRole("link", { name: /^알림 센터/ }).click()
  await expect(page).toHaveURL(/\/notifications$/)
  const markAllAsRead = page.getByRole("button", {
    name: "현재 목록 읽음 처리",
  })
  await expect(markAllAsRead).toBeEnabled()
  await markAllAsRead.click()
  await expect(
    page.getByRole("button", { name: "현재 목록 읽음" }),
  ).toBeDisabled()
  expect(api.notifications.every(({ read }) => read)).toBe(true)
})

test("일반 회원이 가게를 등록하고 관리 화면으로 진입한다", async ({ page }) => {
  const api = await installMockApi(page, { hasOwnerStore: false })
  await page.goto("/", { waitUntil: "domcontentloaded" })

  await page.getByRole("link", { name: "가게 관리" }).click()
  await expect(page).toHaveURL(/\/manage\/onboarding$/)
  await page.getByRole("link", { name: "가게 등록하기" }).click()

  await page.getByRole("textbox", { name: /가게 이름/ }).fill("성수 오늘빵")
  await page.getByRole("textbox", { name: /가게 연락처/ }).fill("02-1234-5678")
  await page
    .getByRole("textbox", { name: /도로명 주소/ })
    .fill("서울 성동구 연무장길 18")
  await page.getByRole("textbox", { name: "상세 주소" }).fill("1층")
  await page
    .getByRole("textbox", { name: "가게 소개" })
    .fill("오늘 구운 빵을 준비해요.")
  await page.getByRole("button", { name: "가게 등록하기" }).click()

  await expect(page).toHaveURL(/\/manage$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "오늘 운영 현황" }),
  ).toBeVisible()
  await page
    .getByRole("navigation", { name: "가게 관리 메뉴" })
    .getByRole("link", { name: "가게 정보" })
    .click()
  await expect(page).toHaveURL(/\/manage\/store$/)
  await expect(page.getByRole("textbox", { name: /가게 연락처/ })).toHaveValue(
    "02-1234-5678",
  )
  expect(api.ownerStores[0]).toMatchObject({
    name: "성수 오늘빵",
    phoneNumber: "02-1234-5678",
  })
  expect(
    api.requests.some(
      ({ method, pathname }) =>
        method === "POST" && pathname === "/api/v1/owner/stores",
    ),
  ).toBe(true)
})

test("가게 관리자가 고객 화면과 관리 예약 화면을 오간다", async ({ page }) => {
  await installMockApi(page)
  await page.goto("/", { waitUntil: "domcontentloaded" })

  await page.getByRole("link", { name: "가게 관리" }).click()
  await expect(page).toHaveURL(/\/manage$/)
  const managementNavigation = page.getByRole("navigation", {
    name: "가게 관리 메뉴",
  })
  await managementNavigation.getByRole("link", { name: "예약 관리" }).click()

  await expect(page).toHaveURL(/\/manage\/reservations$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "예약 관리" }),
  ).toBeVisible()
  await page
    .getByRole("link", { name: /^고객 화면(으로|으로 돌아가기)$/ })
    .click()

  await expect(page).toHaveURL(/\/$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "근처의 마감 할인" }),
  ).toBeVisible()
})
