import { expect, test } from "@playwright/test"

import { LOCATION_PREFERENCE_STORAGE_KEY } from "../src/features/customer/location-preference"
import { FUTURE_ACCESS_TOKEN } from "../src/test/auth-token"
import { installMockApi } from "./mock-api"

test("방문자가 공개 랜딩에서 서비스 소개를 보고 회원가입으로 이동한다", async ({
  page,
}) => {
  const pageErrors: Error[] = []
  page.on("pageerror", (error) => pageErrors.push(error))
  await page.goto("/", { waitUntil: "domcontentloaded" })

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "마감 재고를 판매 기회로, 첫 방문을 단골로.",
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "발견부터 픽업까지, 오늘 안에",
    }),
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "로그인" })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)

  await page.getByRole("tab", { name: "02 예약" }).click()
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "원하는 상품을 미리 예약해요",
    }),
  ).toBeVisible()

  await page
    .getByRole("heading", {
      level: 2,
      name: "넓은 화면에서 운영 흐름을 더 선명하게",
    })
    .scrollIntoViewIfNeeded()
  expect(
    await page
      .locator("header")
      .evaluate((header) => Math.round(header.getBoundingClientRect().top)),
  ).toBe(0)

  await page.getByRole("link", { name: "지금 사용해보기" }).click()
  await expect(page).toHaveURL(/\/signup$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "남았당을 시작해 보세요" }),
  ).toBeVisible()
  await page.getByRole("textbox", { name: "전화번호" }).fill("01012345678")
  await expect(page.getByRole("textbox", { name: "전화번호" })).toHaveValue(
    "010-1234-5678",
  )
  expect(pageErrors).toEqual([])
})

test("비회원이 로그인 없이 고객 공개 화면을 둘러본다", async ({ page }) => {
  const api = await installMockApi(page, { authenticated: false })
  const publicScreens = [
    {
      path: "/app",
      heading: "지금 예약 가능한 할인",
    },
    {
      path: "/map",
      heading: "지도에서 가게 찾기",
    },
    {
      path: "/location?returnTo=%2Fapp",
      heading: "지도에서 위치 설정",
    },
    {
      path: "/stores/101",
      heading: "성수 빵연구소",
    },
    {
      path: "/deals/501",
      heading: "오늘의 소금빵 모음",
    },
  ] as const

  for (const screen of publicScreens) {
    await page.goto(screen.path, { waitUntil: "domcontentloaded" })
    await expect(
      page.getByRole("heading", { level: 1, name: screen.heading }),
    ).toBeVisible()
  }

  expect(api.requests.length).toBeGreaterThan(0)
  expect(api.requests.every(({ authorization }) => !authorization)).toBe(true)
})

test("비회원이 가게를 찜하려 하면 원래 화면으로 돌아오도록 로그인한다", async ({
  page,
}) => {
  const api = await installMockApi(page, { authenticated: false })
  await page.goto("/stores/101", { waitUntil: "domcontentloaded" })

  await page.getByRole("button", { name: "로그인하고 찜하기" }).click()

  await expect(page).toHaveURL(/\/login\?redirect=%2Fstores%2F101$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "다시 만나서 반가워요" }),
  ).toBeVisible()
  expect(
    api.requests.some(
      ({ method, pathname }) =>
        (method === "PUT" || method === "DELETE") &&
        pathname.startsWith("/api/v1/favorites/"),
    ),
  ).toBe(false)
})

test("비회원이 보호된 찜 목록에 접근하면 로그인으로 이동한다", async ({
  page,
}) => {
  const api = await installMockApi(page, { authenticated: false })
  await page.goto("/favorites", { waitUntil: "domcontentloaded" })

  await expect(page).toHaveURL(/\/login\?redirect=%2Ffavorites$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "다시 만나서 반가워요" }),
  ).toBeVisible()
  expect(
    api.requests.some(({ pathname }) =>
      pathname.startsWith("/api/v1/favorites"),
    ),
  ).toBe(false)
})

test("고객이 지도 중심으로 동네를 선택하고 홈에서 확인한다", async ({
  page,
}) => {
  const api = await installMockApi(page, { authenticated: false })
  await page.addInitScript(() => {
    Reflect.set(window, "__namatdangGeolocationCalls", 0)
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition() {
          const currentCalls = Number(
            Reflect.get(window, "__namatdangGeolocationCalls") ?? 0,
          )
          Reflect.set(window, "__namatdangGeolocationCalls", currentCalls + 1)
        },
      },
    })
  })

  await page.goto("/app", { waitUntil: "domcontentloaded" })
  const locationControl = page.getByRole("link", {
    name: "동네 위치 설정",
    exact: true,
  })
  const mapControl = page.getByRole("link", {
    name: "현재 조건으로 지도보기",
  })
  const searchControl = page.getByRole("search")
  const [locationBox, mapBox, searchBox] = await Promise.all([
    locationControl.boundingBox(),
    mapControl.boundingBox(),
    searchControl.boundingBox(),
  ])

  expect(locationBox).not.toBeNull()
  expect(mapBox).not.toBeNull()
  expect(searchBox).not.toBeNull()
  expect(locationBox?.height).toBeGreaterThanOrEqual(44)
  expect(mapBox?.height).toBeGreaterThanOrEqual(44)
  expect(searchBox?.height).toBeGreaterThanOrEqual(44)

  if ((page.viewportSize()?.width ?? 0) < 640) {
    expect(Math.abs((locationBox?.y ?? 0) - (mapBox?.y ?? 0))).toBeLessThan(2)
    expect(searchBox?.y ?? 0).toBeGreaterThanOrEqual(
      (locationBox?.y ?? 0) + (locationBox?.height ?? 0),
    )
  } else {
    expect(Math.abs((locationBox?.y ?? 0) - (mapBox?.y ?? 0))).toBeLessThan(2)
    expect(Math.abs((locationBox?.y ?? 0) - (searchBox?.y ?? 0))).toBeLessThan(
      2,
    )
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)

  await locationControl.click()

  await expect(page).toHaveURL(/\/location\?returnTo=%2Fapp$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "지도에서 위치 설정" }),
  ).toBeVisible()
  await expect(
    page.getByRole("region", { name: "선택할 위치를 정하는 지도" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /내 위치|현재 위치/ }),
  ).toHaveCount(0)

  await page
    .getByRole("region", { name: "선택할 위치를 정하는 지도" })
    .click({ position: { x: 160, y: 120 } })
  await expect(page.getByText("서울 중구 세종대로 110")).toBeVisible()

  await page.getByRole("button", { name: "이 위치로 설정" }).click()

  await expect(page).toHaveURL(/\/app$/)
  await expect(
    page.getByRole("link", { name: "태평로1가 위치 변경" }),
  ).toBeVisible()
  expect(
    await page.evaluate(() =>
      Number(Reflect.get(window, "__namatdangGeolocationCalls") ?? 0),
    ),
  ).toBe(0)
  expect(api.requests.every(({ authorization }) => !authorization)).toBe(true)
})

test("고객이 품목 수량을 고르고 예약을 완료한다", async ({ page }) => {
  const api = await installMockApi(page)
  await page.addInitScript(
    ({ key, preference }) => {
      window.localStorage.setItem(key, JSON.stringify(preference))
    },
    {
      key: LOCATION_PREFERENCE_STORAGE_KEY,
      preference: {
        v: 1,
        latitude: 37.5445,
        longitude: 127.056,
        label: "성수동",
        address: "서울특별시 성동구 성수동",
      },
    },
  )
  await page.goto("/app", { waitUntil: "domcontentloaded" })

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "지금 예약 가능한 할인",
    }),
  ).toBeVisible()
  await page.getByRole("link", { name: "현재 조건으로 지도보기" }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe("/map")
  await expect
    .poll(() => new URL(page.url()).searchParams.get("onlyDiscounting"))
    .toBe("true")
  await expect(
    page.getByRole("heading", { level: 1, name: "지도에서 가게 찾기" }),
  ).toBeVisible()
  const mapSearch = page.getByRole("searchbox", {
    name: "지도에서 가게 검색",
  })
  await expect(mapSearch).toBeVisible()
  await mapSearch.fill("소금빵")
  await page.getByRole("button", { name: "검색", exact: true }).click()
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe("소금빵")
  await expect(
    page.getByRole("region", { name: "등록된 가게 위치 지도" }),
  ).toBeVisible()
  await expect(page.locator('[data-mock-naver-map="ready"]')).toBeVisible()
  const activeStore = page.getByRole("img", {
    name: /성수 빵연구소 · 현재 할인 진행 중/,
  })
  await expect(activeStore).toBeVisible()
  await expect(
    page.getByRole("img", {
      name: /망원 케이크룸.*현재 할인 없음/,
    }),
  ).toHaveCount(0)
  await activeStore.click()
  const selectedStore = page.getByRole("article", {
    name: "성수 빵연구소",
  })
  await expect(selectedStore).toContainText("할인 중")
  await expect(selectedStore).toContainText("1개 판매 중")
  await expect(selectedStore.getByText("가게 기본 이미지")).toBeAttached()
  await expect(
    selectedStore.getByRole("link", { name: "가게 정보 보기" }),
  ).toHaveAttribute("href", "/stores/101")

  await page.getByRole("button", { name: "가게 목록으로 돌아가기" }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe("/app")
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe("소금빵")

  await page.getByRole("link", { name: "소금빵 할인 상세 보기" }).click()

  await expect(page).toHaveURL(/\/deals\/501$/)
  const quantity = page.getByRole("group", { name: "소금빵 수량" })
  await quantity.getByRole("button", { name: "소금빵 수량 늘리기" }).click()
  await expect(quantity).toContainText("1")

  await page.getByRole("button", { name: "선택 확인하기" }).click()
  const reviewDialog = page.getByRole("dialog", {
    name: "선택한 내용이 맞나요?",
  })
  await expect(reviewDialog).toContainText("소금빵 1개")
  await reviewDialog.getByRole("button", { name: "예약하기" }).click()

  await expect(page).toHaveURL(/\/reservations\/complete\?reservationId=91$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "예약이 완료됐어요" }),
  ).toBeVisible()
  await expect(page.getByText("소금빵 1개 · 총 1개")).toBeVisible()
  expect(
    api.requests.some(
      ({ method, pathname, idempotencyKey }) =>
        method === "POST" &&
        pathname === "/api/v1/reservations" &&
        Boolean(idempotencyKey),
    ),
  ).toBe(true)
  const publicReadRequests = api.requests.filter(
    ({ method, pathname }) =>
      method === "GET" &&
      (pathname.startsWith("/api/v1/stores") ||
        pathname.startsWith("/api/v1/deals")),
  )
  expect(publicReadRequests.length).toBeGreaterThan(0)
  expect(publicReadRequests.every(({ authorization }) => !authorization)).toBe(
    true,
  )
  expect(
    api.requests
      .filter((request) => !publicReadRequests.includes(request))
      .every(
        ({ authorization }) =>
          authorization === `Bearer ${FUTURE_ACCESS_TOKEN}`,
      ),
  ).toBe(true)
})

test("고객이 API 찜 목록을 정리하고 알림을 모두 읽는다", async ({ page }) => {
  const api = await installMockApi(page)
  await page.goto("/app", { waitUntil: "domcontentloaded" })

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
  await page.goto("/manage/onboarding", { waitUntil: "domcontentloaded" })

  await expect(page).toHaveURL(/\/manage\/onboarding$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "등록한 가게가 아직 없어요" }),
  ).toBeVisible()
  expect(api.currentUser?.roles).toEqual(["CONSUMER"])
  expect(
    api.requests.some(
      ({ method, pathname }) =>
        method === "GET" && pathname.startsWith("/api/v1/owner/stores"),
    ),
  ).toBe(false)

  await page.getByRole("link", { name: "가게 등록하기" }).click()

  await page.getByRole("textbox", { name: /가게 이름/ }).fill("성수 오늘빵")
  await page.getByRole("textbox", { name: /가게 연락처/ }).fill("0212345678")
  await expect(page.getByRole("textbox", { name: /가게 연락처/ })).toHaveValue(
    "02-1234-5678",
  )
  await page
    .getByRole("textbox", { name: /도로명 주소/ })
    .fill("서울 성동구 연무장길 18")
  await page.getByRole("button", { name: "주소로 위치 찾기" }).click()
  await expect(
    page.getByText(
      "주소의 위치를 찾았어요. 지도의 핀이 실제 픽업 장소와 맞는지 확인해 주세요.",
    ),
  ).toBeVisible()
  await expect(page.locator('[data-mock-naver-map="ready"]')).toBeVisible()
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
    latitude: 37.5445,
    longitude: 127.056,
  })
  expect(api.currentUser?.roles).toEqual(["CONSUMER", "OWNER"])
  expect(
    api.requests.some(
      ({ method, pathname }) =>
        method === "POST" && pathname === "/api/v1/owner/stores",
    ),
  ).toBe(true)
})

test("가게 관리자가 고객 화면과 관리 예약 화면을 오간다", async ({ page }) => {
  await installMockApi(page)
  await page.goto("/app", { waitUntil: "domcontentloaded" })

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

  await expect(page).toHaveURL(/\/app$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "지금 예약 가능한 할인" }),
  ).toBeVisible()
})
