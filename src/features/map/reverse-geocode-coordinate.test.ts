import { beforeEach, expect, test, vi } from "vitest"
import { loadNaverMaps } from "./naver-map-loader"
import { reverseGeocodeCoordinate } from "./reverse-geocode-coordinate"

vi.mock("./naver-map-loader", () => ({
  loadNaverMaps: vi.fn(),
}))

type ReverseGeocodeCallback = Parameters<
  typeof naver.maps.Service.reverseGeocode
>[1]

class FakeLatLng {
  readonly latitude: number
  readonly longitude: number

  constructor(latitude: number, longitude: number) {
    this.latitude = latitude
    this.longitude = longitude
  }

  lat() {
    return this.latitude
  }

  lng() {
    return this.longitude
  }
}

function createResult(
  name: string,
  area3: string,
): naver.maps.Service.ResultItem {
  const area = (value: string) => ({
    name: value,
    coords: { center: { crs: "", x: "", y: "" } },
  })

  return {
    name,
    code: { id: "", type: "A", mappingId: "" },
    region: {
      area0: area("kr"),
      area1: area("서울특별시"),
      area2: area("성동구"),
      area3: area(area3),
      area4: area(""),
    },
    land: {} as naver.maps.Service.Land,
  }
}

function createResponse(
  results: naver.maps.Service.ResultItem[] = [
    createResult("admcode", "성수2가3동"),
  ],
  address: Partial<naver.maps.Service.ReverseGeocodeAddress> = {},
): naver.maps.Service.ReverseGeocodeResponse {
  return {
    result: { userquery: "", total: 0, items: [] },
    v2: {
      status: {
        code: "0" as naver.maps.Service.ReverseGeocodeStatusCode,
        name: "ok" as naver.maps.Service.ReverseGeocodeStatusName,
        message: "",
      },
      results,
      address: {
        roadAddress: "서울특별시 성동구 연무장길 18",
        jibunAddress: "서울특별시 성동구 성수동2가 314-5",
        ...address,
      },
    },
  }
}

function mockReverseGeocode(
  implementation: (callback: NonNullable<ReverseGeocodeCallback>) => void,
) {
  const reverseGeocode = vi.fn(
    (
      _options: naver.maps.Service.ReverseServiceOptions,
      callback: NonNullable<ReverseGeocodeCallback>,
    ) => implementation(callback),
  )
  const maps = {
    LatLng: FakeLatLng,
    Service: {
      Status: { OK: 200, ERROR: 500 },
      reverseGeocode,
    },
  } as unknown as typeof naver.maps
  vi.mocked(loadNaverMaps).mockResolvedValue(maps)
  return reverseGeocode
}

beforeEach(() => {
  vi.mocked(loadNaverMaps).mockReset()
})

test("행정동과 도로명 주소를 우선해 선택 위치를 반환한다", async () => {
  const response = createResponse([
    createResult("legalcode", "성수동2가"),
    createResult("admcode", "성수2가3동"),
    createResult("roadaddr", "성수동2가"),
  ])
  const reverseGeocode = mockReverseGeocode((callback) =>
    callback(200, response),
  )
  const coordinate = { latitude: 37.5445, longitude: 127.056 }

  await expect(reverseGeocodeCoordinate(coordinate)).resolves.toEqual({
    coordinate,
    address: "서울특별시 성동구 연무장길 18",
    label: "성수2가3동",
  })
  expect(reverseGeocode).toHaveBeenCalledWith(
    {
      coords: expect.objectContaining({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      }),
      orders: "admcode,legalcode,roadaddr,addr",
    },
    expect.any(Function),
  )
})

test("행정동과 도로명 주소가 없으면 법정동과 지번 주소를 사용한다", async () => {
  const response = createResponse([createResult("legalcode", "성수동2가")], {
    roadAddress: "",
  })
  mockReverseGeocode((callback) => callback(200, response))

  await expect(
    reverseGeocodeCoordinate({ latitude: 37.5445, longitude: 127.056 }),
  ).resolves.toMatchObject({
    address: "서울특별시 성동구 성수동2가 314-5",
    label: "성수동2가",
  })
})

test("유효하지 않은 좌표는 SDK를 호출하지 않고 구분한다", async () => {
  await expect(
    reverseGeocodeCoordinate({ latitude: 91, longitude: 127 }),
  ).rejects.toMatchObject({
    name: "ReverseGeocodingError",
    code: "invalid-coordinate",
  })
  expect(loadNaverMaps).not.toHaveBeenCalled()
})

test("주소 결과 없음과 네이버 요청 실패를 구분한다", async () => {
  mockReverseGeocode((callback) => callback(200, createResponse([])))
  await expect(
    reverseGeocodeCoordinate({ latitude: 37.5445, longitude: 127.056 }),
  ).rejects.toMatchObject({ code: "no-results" })

  mockReverseGeocode((callback) => callback(500, createResponse()))
  await expect(
    reverseGeocodeCoordinate({ latitude: 37.5445, longitude: 127.056 }),
  ).rejects.toMatchObject({ code: "request-failed" })
})
