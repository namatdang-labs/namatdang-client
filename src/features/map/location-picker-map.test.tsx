import { act, render, waitFor } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import { LocationPickerMap } from "./location-picker-map"
import { useNaverMaps } from "./use-naver-maps"

vi.mock("./use-naver-maps", () => ({
  useNaverMaps: vi.fn(),
}))

type FakeListener = {
  target: object
  eventName: string
  callback: () => void
}

const listeners: FakeListener[] = []
const mapInstances: FakeMap[] = []

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

class FakeMap {
  center: FakeLatLng
  destroyed = false
  readonly options: Record<string, unknown>
  readonly setCenterCalls: FakeLatLng[] = []

  constructor(_container: HTMLElement, options: Record<string, unknown>) {
    this.center = options.center as FakeLatLng
    this.options = options
    mapInstances.push(this)
  }

  autoResize() {}

  destroy() {
    this.destroyed = true
  }

  getCenter() {
    return this.center
  }

  setCenter(center: FakeLatLng) {
    this.center = center
    this.setCenterCalls.push(center)
  }
}

function createMapsMock() {
  return {
    Event: {
      addListener(target: object, eventName: string, callback: () => void) {
        const listener = { target, eventName, callback }
        listeners.push(listener)
        return listener
      },
      removeListener(listener: FakeListener) {
        const index = listeners.indexOf(listener)
        if (index >= 0) listeners.splice(index, 1)
      },
    },
    LatLng: FakeLatLng,
    Map: FakeMap,
    Position: { TOP_RIGHT: 3 },
  } as unknown as typeof naver.maps
}

beforeEach(() => {
  listeners.length = 0
  mapInstances.length = 0
  vi.mocked(useNaverMaps).mockReturnValue({
    status: "ready",
    maps: createMapsMock(),
    error: null,
  })
})

test("중앙 브랜드 핀을 고정하고 실제 이동이 끝났을 때만 좌표를 알린다", async () => {
  const onCenterSettled = vi.fn()
  const { container, getByRole, unmount } = render(
    <LocationPickerMap
      initialPosition={{ latitude: 37.5445, longitude: 127.056 }}
      onCenterSettled={onCenterSettled}
      className="h-96"
    />,
  )

  const region = getByRole("region", { name: "선택할 위치를 정하는 지도" })
  expect(region).toHaveAttribute("tabindex", "0")
  expect(region).toHaveAccessibleDescription(
    "지도를 드래그하거나 지도에 초점을 맞춘 뒤 화살표 키로 움직여 위치를 선택하세요.",
  )
  expect(mapInstances[0].options).toMatchObject({
    keyboardShortcuts: true,
    zoom: 16,
    zoomControl: false,
  })
  const pin = container.querySelector('img[src="/brand/namatdang-icon.png"]')
  expect(pin).toBeInTheDocument()
  expect(pin?.parentElement).toHaveClass("absolute", "left-1/2", "top-1/2")

  const idleListener = listeners.find(
    ({ target, eventName }) =>
      target === mapInstances[0] && eventName === "idle",
  )
  expect(idleListener).toBeDefined()

  act(() => idleListener?.callback())
  expect(onCenterSettled).not.toHaveBeenCalled()

  mapInstances[0].center = new FakeLatLng(37.545, 127.057)
  act(() => idleListener?.callback())
  expect(onCenterSettled).toHaveBeenCalledTimes(1)
  expect(onCenterSettled).toHaveBeenCalledWith({
    latitude: 37.545,
    longitude: 127.057,
  })

  act(() => idleListener?.callback())
  expect(onCenterSettled).toHaveBeenCalledTimes(1)

  unmount()
  expect(mapInstances[0].destroyed).toBe(true)
  expect(listeners).toHaveLength(0)
})

test("검색 등으로 기준 좌표가 바뀌면 지도를 옮기되 idle 콜백은 만들지 않는다", async () => {
  const onCenterSettled = vi.fn()
  const { rerender } = render(
    <LocationPickerMap
      initialPosition={{ latitude: 37.5445, longitude: 127.056 }}
      onCenterSettled={onCenterSettled}
    />,
  )

  await waitFor(() => expect(mapInstances).toHaveLength(1))
  rerender(
    <LocationPickerMap
      initialPosition={{ latitude: 37.5665, longitude: 126.978 }}
      onCenterSettled={onCenterSettled}
    />,
  )

  expect(mapInstances).toHaveLength(1)
  expect(mapInstances[0].setCenterCalls).toHaveLength(1)
  expect(mapInstances[0].setCenterCalls[0]).toMatchObject({
    latitude: 37.5665,
    longitude: 126.978,
  })

  const idleListener = listeners.find(
    ({ target, eventName }) =>
      target === mapInstances[0] && eventName === "idle",
  )
  act(() => idleListener?.callback())
  expect(onCenterSettled).not.toHaveBeenCalled()
})

test("SDK 오류와 유효하지 않은 좌표를 지도 영역에서 안내한다", () => {
  vi.mocked(useNaverMaps).mockReturnValue({
    status: "error",
    maps: null,
    error: {
      name: "NaverMapLoadError",
      code: "load-failed",
      message: "지도를 불러오지 못했어요.",
    },
  })
  const { getByRole, rerender } = render(
    <LocationPickerMap
      initialPosition={{ latitude: 37.5445, longitude: 127.056 }}
      onCenterSettled={vi.fn()}
    />,
  )
  expect(getByRole("alert")).toHaveTextContent("지도를 불러오지 못했어요.")

  vi.mocked(useNaverMaps).mockReturnValue({
    status: "ready",
    maps: createMapsMock(),
    error: null,
  })
  rerender(
    <LocationPickerMap
      initialPosition={{ latitude: 100, longitude: 127.056 }}
      onCenterSettled={vi.fn()}
    />,
  )
  expect(getByRole("alert")).toHaveTextContent(
    "선택 위치 좌표를 확인해 주세요.",
  )
})
