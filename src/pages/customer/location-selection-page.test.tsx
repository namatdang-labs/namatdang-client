import { act, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router"

import { LOCATION_PREFERENCE_STORAGE_KEY } from "../../features/customer/location-preference"
import { renderWithProviders } from "../../test/render"
import { LocationSelectionPage } from "./location-selection-page"

const mapMocks = vi.hoisted(() => ({
  geocodeAddress: vi.fn(),
  reverseGeocodeCoordinate: vi.fn(),
}))

vi.mock("../../features/map", () => ({
  geocodeAddress: mapMocks.geocodeAddress,
  reverseGeocodeCoordinate: mapMocks.reverseGeocodeCoordinate,
  LocationPickerMap: ({
    initialPosition,
    onCenterSettled,
    ariaLabel,
  }: {
    initialPosition: { latitude: number; longitude: number }
    onCenterSettled: (coordinate: {
      latitude: number
      longitude: number
    }) => void
    ariaLabel?: string
  }) => (
    <section aria-label={ariaLabel}>
      <output aria-label="지도 중심">
        {initialPosition.latitude},{initialPosition.longitude}
      </output>
      <button
        type="button"
        onClick={() =>
          onCenterSettled({ latitude: 37.5445, longitude: 127.056 })
        }
      >
        지도를 성수동으로 이동
      </button>
    </section>
  ),
}))

const seoulCityHallLocation = {
  coordinate: { latitude: 37.5665, longitude: 126.978 },
  label: "소공동",
  address: "서울특별시 중구 세종대로 110",
}

const seongsuLocation = {
  coordinate: { latitude: 37.5445, longitude: 127.056 },
  label: "성수동2가",
  address: "서울특별시 성동구 성수이로 1",
}

afterEach(() => {
  window.localStorage.clear()
  mapMocks.geocodeAddress.mockReset()
  mapMocks.reverseGeocodeCoordinate.mockReset()
})

function renderPage(entry = "/location?returnTo=%2Fapp") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/location" element={<LocationSelectionPage />} />
        <Route path="/app" element={<p>홈 화면</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

test("현재 위치 권한 없이 지도 중심의 주소를 저장한다", async () => {
  const user = userEvent.setup()
  mapMocks.reverseGeocodeCoordinate.mockResolvedValue(seoulCityHallLocation)

  renderPage()

  expect(
    screen.getByRole("heading", { name: "지도에서 위치 설정" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("region", { name: "선택할 위치를 정하는 지도" }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole("button", { name: /내 위치/ }),
  ).not.toBeInTheDocument()
  expect(await screen.findByText("소공동")).toBeInTheDocument()

  await user.click(screen.getByRole("button", { name: "이 위치로 설정" }))

  expect(await screen.findByText("홈 화면")).toBeInTheDocument()
  expect(
    JSON.parse(
      window.localStorage.getItem(LOCATION_PREFERENCE_STORAGE_KEY) ?? "{}",
    ),
  ).toEqual({
    v: 1,
    latitude: 37.5665,
    longitude: 126.978,
    label: "소공동",
    address: "서울특별시 중구 세종대로 110",
  })
})

test("주소를 검색하면 지도를 옮기고 역지오코딩한 주소를 보여준다", async () => {
  const user = userEvent.setup()
  mapMocks.reverseGeocodeCoordinate
    .mockResolvedValueOnce(seoulCityHallLocation)
    .mockResolvedValueOnce(seongsuLocation)
  mapMocks.geocodeAddress.mockResolvedValue({
    latitude: 37.5445,
    longitude: 127.056,
    roadAddress: seongsuLocation.address,
    jibunAddress: "",
    englishAddress: "",
  })

  renderPage()
  await screen.findByText("소공동")

  await user.type(
    screen.getByRole("searchbox", { name: "주소 또는 동네 검색" }),
    "성수동",
  )
  await user.click(screen.getByRole("button", { name: "검색" }))

  expect(mapMocks.geocodeAddress).toHaveBeenCalledWith("성수동")
  expect(mapMocks.reverseGeocodeCoordinate).toHaveBeenLastCalledWith({
    latitude: 37.5445,
    longitude: 127.056,
  })
  expect(await screen.findByText("성수동2가")).toBeInTheDocument()
  expect(screen.getByLabelText("지도 중심")).toHaveTextContent(
    "37.5445,127.056",
  )
})

test("주소 검색이 느린 동안 지도를 움직이면 이전 검색 결과로 되돌리지 않는다", async () => {
  const user = userEvent.setup()
  let finishSearch: ((value: unknown) => void) | undefined
  mapMocks.geocodeAddress.mockReturnValue(
    new Promise((resolve) => {
      finishSearch = resolve
    }),
  )
  mapMocks.reverseGeocodeCoordinate
    .mockResolvedValueOnce(seoulCityHallLocation)
    .mockResolvedValueOnce(seongsuLocation)

  renderPage()
  await screen.findByText("소공동")

  await user.type(
    screen.getByRole("searchbox", { name: "주소 또는 동네 검색" }),
    "잠실동",
  )
  await user.click(screen.getByRole("button", { name: "검색" }))
  await user.click(
    screen.getByRole("button", { name: "지도를 성수동으로 이동" }),
  )
  expect(await screen.findByText("성수동2가")).toBeInTheDocument()

  await act(async () => {
    finishSearch?.({
      latitude: 37.5133,
      longitude: 127.1001,
      roadAddress: "서울특별시 송파구 올림픽로 300",
      jibunAddress: "",
      englishAddress: "",
    })
    await Promise.resolve()
  })

  expect(mapMocks.reverseGeocodeCoordinate).toHaveBeenCalledTimes(2)
  expect(mapMocks.reverseGeocodeCoordinate).not.toHaveBeenCalledWith({
    latitude: 37.5133,
    longitude: 127.1001,
  })
  expect(screen.getByLabelText("지도 중심")).toHaveTextContent(
    "37.5445,127.056",
  )
  expect(screen.getByText("성수동2가")).toBeInTheDocument()
})

test("역지오코딩을 못하면 좌표만 저장하지 않는다", async () => {
  mapMocks.reverseGeocodeCoordinate.mockRejectedValue(
    new Error("역지오코딩 실패"),
  )

  renderPage()

  expect(
    await screen.findByText("선택한 위치의 주소를 확인하지 못했어요"),
  ).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "이 위치로 설정" })).toBeDisabled()
  expect(
    window.localStorage.getItem(LOCATION_PREFERENCE_STORAGE_KEY),
  ).toBeNull()
})

test("외부 returnTo는 무시하고 기본 홈으로 돌아간다", async () => {
  const user = userEvent.setup()
  window.localStorage.setItem(
    LOCATION_PREFERENCE_STORAGE_KEY,
    JSON.stringify({
      v: 1,
      latitude: 37.5445,
      longitude: 127.056,
      label: "성수동2가",
      address: "서울특별시 성동구 성수이로 1",
    }),
  )

  renderPage("/location?returnTo=https%3A%2F%2Fevil.example")
  await user.click(screen.getByRole("button", { name: "이 위치로 설정" }))

  expect(await screen.findByText("홈 화면")).toBeInTheDocument()
})

test("저장한 위치를 해제하고 전체 지역 홈으로 돌아간다", async () => {
  const user = userEvent.setup()
  window.localStorage.setItem(
    LOCATION_PREFERENCE_STORAGE_KEY,
    JSON.stringify({
      v: 1,
      latitude: 37.5445,
      longitude: 127.056,
      label: "성수동2가",
      address: "서울특별시 성동구 성수이로 1",
    }),
  )

  renderPage()
  await user.click(screen.getByRole("button", { name: "전체 지역으로 보기" }))

  expect(await screen.findByText("홈 화면")).toBeInTheDocument()
  expect(
    window.localStorage.getItem(LOCATION_PREFERENCE_STORAGE_KEY),
  ).toBeNull()
})
