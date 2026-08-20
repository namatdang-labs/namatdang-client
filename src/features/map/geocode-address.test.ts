import { beforeEach, expect, test, vi } from "vitest"
import { loadNaverMaps } from "./naver-map-loader"
import { geocodeAddress } from "./geocode-address"

vi.mock("./naver-map-loader", () => ({
  loadNaverMaps: vi.fn(),
}))

type GeocodeCallback = Parameters<typeof naver.maps.Service.geocode>[1]

function mockGeocode(
  implementation: (callback: NonNullable<GeocodeCallback>) => void,
) {
  const maps = {
    Service: {
      Status: { OK: 200, ERROR: 500 },
      geocode: vi.fn(
        (
          _options: naver.maps.Service.GeocodeServiceOptions,
          callback: NonNullable<GeocodeCallback>,
        ) => implementation(callback),
      ),
    },
  } as unknown as typeof naver.maps
  vi.mocked(loadNaverMaps).mockResolvedValue(maps)
  return maps.Service.geocode
}

function createResponse(
  address: Partial<naver.maps.Service.AddressItemV2> = {},
): naver.maps.Service.GeocodeResponse {
  return {
    result: {
      userquery: "",
      total: 1,
      items: [],
    },
    v2: {
      status: "OK" as naver.maps.Service.GeocodeStatus,
      meta: { totalCount: 1, page: 1, count: 1 },
      addresses: [
        {
          roadAddress: "경기도 성남시 분당구 불정로 6",
          jibunAddress: "경기도 성남시 분당구 정자동 178-1",
          englishAddress: "6, Buljeong-ro, Bundang-gu, Seongnam-si",
          addressElements: [],
          x: "127.10522081658463",
          y: "37.35951219616309",
          distance: "0",
          ...address,
        },
      ],
      errorMessage: "",
    },
  }
}

beforeEach(() => {
  vi.mocked(loadNaverMaps).mockReset()
})

test("네이버 x를 경도, y를 위도로 변환한다", async () => {
  mockGeocode((callback) => callback(200, createResponse()))

  await expect(geocodeAddress("  불정로 6  ")).resolves.toEqual({
    roadAddress: "경기도 성남시 분당구 불정로 6",
    jibunAddress: "경기도 성남시 분당구 정자동 178-1",
    englishAddress: "6, Buljeong-ro, Bundang-gu, Seongnam-si",
    latitude: 37.35951219616309,
    longitude: 127.10522081658463,
  })
})

test("빈 주소는 SDK를 호출하지 않는다", async () => {
  await expect(geocodeAddress("   ")).rejects.toMatchObject({
    code: "empty-query",
  })
  expect(loadNaverMaps).not.toHaveBeenCalled()
})

test("검색 결과가 없으면 no-results로 구분한다", async () => {
  const response = createResponse()
  response.v2.addresses = []
  mockGeocode((callback) => callback(200, response))

  await expect(geocodeAddress("없는 주소")).rejects.toMatchObject({
    code: "no-results",
  })
})

test("응답 좌표가 범위를 벗어나면 저장하지 않는다", async () => {
  mockGeocode((callback) => callback(200, createResponse({ y: "91" })))

  await expect(geocodeAddress("불정로 6")).rejects.toMatchObject({
    code: "invalid-coordinate",
  })
})

test("네이버 요청 실패를 검색 결과 없음과 구분한다", async () => {
  mockGeocode((callback) => callback(500, createResponse()))

  await expect(geocodeAddress("불정로 6")).rejects.toMatchObject({
    code: "request-failed",
  })
})
