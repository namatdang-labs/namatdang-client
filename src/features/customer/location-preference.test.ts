import { afterEach, expect, test } from "vitest"

import {
  LOCATION_PREFERENCE_STORAGE_KEY,
  LOCATION_SEARCH_RADIUS_KILOMETERS,
  clearLocationPreference,
  getDistanceKilometers,
  getLocationSearchBounds,
  readLocationPreference,
  saveLocationPreference,
} from "./location-preference"

const preference = {
  v: 1 as const,
  latitude: 37.5665,
  longitude: 126.978,
  label: "소공동",
  address: "서울특별시 중구 세종대로 110",
}

afterEach(() => {
  window.localStorage.clear()
})

test("선택한 위치를 버전이 있는 JSON으로 저장하고 읽는다", () => {
  expect(
    saveLocationPreference({
      ...preference,
      label: "  소공동  ",
      address: "서울특별시   중구 세종대로 110",
    }),
  ).toBe(true)

  expect(readLocationPreference()).toEqual(preference)
  expect(
    JSON.parse(
      window.localStorage.getItem(LOCATION_PREFERENCE_STORAGE_KEY) ?? "{}",
    ),
  ).toEqual(preference)
})

test("잘못된 JSON과 알 수 없는 버전은 사용하지 않는다", () => {
  window.localStorage.setItem(LOCATION_PREFERENCE_STORAGE_KEY, "{")
  expect(readLocationPreference()).toBeNull()

  window.localStorage.setItem(
    LOCATION_PREFERENCE_STORAGE_KEY,
    JSON.stringify({ ...preference, v: 2 }),
  )
  expect(readLocationPreference()).toBeNull()
})

test("좌표가 범위를 벗어나거나 주소가 빈 선택은 저장하지 않는다", () => {
  expect(saveLocationPreference({ ...preference, latitude: 91 })).toBe(false)
  expect(saveLocationPreference({ ...preference, address: "  " })).toBe(false)
  expect(readLocationPreference()).toBeNull()
})

test("전체 지역으로 바꾸면 신규·기존 동네 선택을 모두 지운다", () => {
  window.localStorage.setItem(
    LOCATION_PREFERENCE_STORAGE_KEY,
    JSON.stringify(preference),
  )
  window.localStorage.setItem("namatdang.customer.neighborhood", "성수동")

  clearLocationPreference()

  expect(
    window.localStorage.getItem(LOCATION_PREFERENCE_STORAGE_KEY),
  ).toBeNull()
  expect(
    window.localStorage.getItem("namatdang.customer.neighborhood"),
  ).toBeNull()
})

test("선택 좌표를 중심으로 5km 지도 검색 범위를 계산한다", () => {
  const bounds = getLocationSearchBounds(preference)

  expect(bounds.minLat).toBeLessThan(preference.latitude)
  expect(bounds.maxLat).toBeGreaterThan(preference.latitude)
  expect(bounds.minLng).toBeLessThan(preference.longitude)
  expect(bounds.maxLng).toBeGreaterThan(preference.longitude)
  expect(bounds.maxLat - preference.latitude).toBeCloseTo(0.04497, 4)
})

test("하버사인 거리로 5km 원형 범위를 구분할 수 있다", () => {
  const withinRadius = getDistanceKilometers(preference, {
    latitude: preference.latitude + 0.02,
    longitude: preference.longitude,
  })
  const outsideRadius = getDistanceKilometers(preference, {
    latitude: preference.latitude + 0.06,
    longitude: preference.longitude,
  })

  expect(withinRadius).toBeLessThan(LOCATION_SEARCH_RADIUS_KILOMETERS)
  expect(outsideRadius).toBeGreaterThan(LOCATION_SEARCH_RADIUS_KILOMETERS)
  expect(
    getDistanceKilometers(
      { latitude: 0, longitude: 0 },
      {
        latitude: 0,
        longitude: 1,
      },
    ),
  ).toBeCloseTo(111.2, 1)
})
