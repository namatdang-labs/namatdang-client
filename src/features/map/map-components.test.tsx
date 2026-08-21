import { act, render, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { __resetNaverMapsLoaderForTests } from "./naver-map-loader"
import { StoreLocationMap } from "./store-location-map"
import { StoreMap } from "./store-map"

type FakeListener = {
  target: object
  eventName: string
  callback: () => void
}

const markerInstances: FakeMarker[] = []
const mapInstances: FakeMap[] = []
const listeners: FakeListener[] = []

class FakeLatLng {
  private readonly latitude: number
  private readonly longitude: number

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

class FakeLatLngBounds {
  readonly positions: FakeLatLng[]

  constructor(southWest: FakeLatLng, northEast: FakeLatLng) {
    this.positions = [southWest, northEast]
  }

  extend(position: FakeLatLng) {
    this.positions.push(position)
    return this
  }
}

class FakeSize {
  readonly width: number
  readonly height: number

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }
}

class FakePoint {
  readonly x: number
  readonly y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

class FakeMap {
  readonly container: HTMLElement
  readonly options: Record<string, unknown>
  fitBoundsCalls = 0
  readonly panToCalls: FakeLatLng[] = []

  constructor(container: HTMLElement, options: Record<string, unknown>) {
    this.container = container
    this.options = options
    mapInstances.push(this)
  }

  autoResize() {}
  destroy() {}
  panTo(position: FakeLatLng) {
    this.panToCalls.push(position)
  }
  setCenter() {}
  setZoom() {}

  fitBounds() {
    this.fitBoundsCalls += 1
  }
}

class FakeMarker {
  cursor = ""
  draggable = false
  icon: naver.maps.ImageIcon | naver.maps.HtmlIcon | undefined
  map: FakeMap | null
  position: FakeLatLng
  title = ""
  zIndex = 0

  constructor(options: {
    cursor?: string
    draggable?: boolean
    icon?: naver.maps.ImageIcon | naver.maps.HtmlIcon
    map?: FakeMap
    position: FakeLatLng
    title?: string
  }) {
    this.cursor = options.cursor ?? ""
    this.draggable = options.draggable ?? false
    this.icon = options.icon
    this.map = options.map ?? null
    this.position = options.position
    this.title = options.title ?? ""
    markerInstances.push(this)
  }

  getPosition() {
    return this.position
  }

  setCursor(cursor: string) {
    this.cursor = cursor
  }

  setDraggable(draggable: boolean) {
    this.draggable = draggable
  }

  setIcon(icon: naver.maps.ImageIcon | naver.maps.HtmlIcon) {
    this.icon = icon
  }

  setMap(map: FakeMap | null) {
    this.map = map
  }

  setPosition(position: FakeLatLng) {
    this.position = position
  }

  setTitle(title: string) {
    this.title = title
  }

  setZIndex(zIndex: number) {
    this.zIndex = zIndex
  }
}

function installNaverMapsMock() {
  const maps = {
    Event: {
      addListener(target: object, eventName: string, callback: () => void) {
        const listener = { target, eventName, callback }
        listeners.push(listener)
        return listener
      },
      removeListener(listener: FakeListener | FakeListener[]) {
        const removed = Array.isArray(listener) ? listener : [listener]
        removed.forEach((item) => {
          const index = listeners.indexOf(item)
          if (index >= 0) listeners.splice(index, 1)
        })
      },
    },
    LatLng: FakeLatLng,
    LatLngBounds: FakeLatLngBounds,
    Map: FakeMap,
    Marker: FakeMarker,
    Point: FakePoint,
    Position: { TOP_RIGHT: 3 },
    Service: {
      Status: { OK: 200, ERROR: 500 },
      geocode: vi.fn(),
    },
    Size: FakeSize,
  } as unknown as typeof naver.maps

  Object.defineProperty(window, "naver", {
    configurable: true,
    value: { maps },
    writable: true,
  })
}

beforeEach(() => {
  __resetNaverMapsLoaderForTests()
  markerInstances.length = 0
  mapInstances.length = 0
  listeners.length = 0
  installNaverMapsMock()
})

afterEach(() => {
  __resetNaverMapsLoaderForTests()
})

test("SDK가 나중에 준비되어도 위치 핀을 드래그할 수 있다", async () => {
  const onPositionChange = vi.fn()
  const position = { latitude: 37.5445, longitude: 127.056 }
  const { rerender } = render(
    <StoreLocationMap
      position={position}
      draggable
      onPositionChange={onPositionChange}
    />,
  )

  await waitFor(() => expect(markerInstances).toHaveLength(1))
  expect(mapInstances[0].options).toMatchObject({
    keyboardShortcuts: true,
    zoomControl: false,
  })
  const marker = markerInstances[0]
  expect(marker.draggable).toBe(true)
  expect(marker.cursor).toBe("grab")

  marker.setPosition(new FakeLatLng(37.545, 127.057))
  const dragEndListener = listeners.find(
    (listener) =>
      listener.target === marker && listener.eventName === "dragend",
  )
  expect(dragEndListener).toBeDefined()

  act(() => dragEndListener?.callback())

  expect(onPositionChange).toHaveBeenCalledWith({
    latitude: 37.545,
    longitude: 127.057,
  })

  rerender(
    <StoreLocationMap
      position={position}
      draggable
      initialZoom={18}
      onPositionChange={onPositionChange}
    />,
  )
  await waitFor(() => expect(markerInstances).toHaveLength(2))
  expect(markerInstances[1].draggable).toBe(true)
  expect(markerInstances[1].cursor).toBe("grab")
})

test("선택한 가게는 큰 남았당 핀으로 표시하고 전체 범위를 맞춘다", async () => {
  const onSelect = vi.fn()
  const stores = [
    {
      id: "1",
      name: "성수 빵집",
      latitude: 37.5445,
      longitude: 127.056,
      dealStatus: "active" as const,
    },
    {
      id: "2",
      name: "연남 타르트집",
      latitude: 37.563,
      longitude: 126.923,
      dealStatus: "none" as const,
    },
  ]

  const { getByRole, rerender } = render(
    <StoreMap
      stores={stores}
      selectedStoreId="2"
      onSelect={onSelect}
      fitBounds
    />,
  )

  expect(getByRole("region", { name: "가게 위치 지도" })).toHaveClass(
    "h-full",
    "w-full",
  )

  await waitFor(() => expect(markerInstances).toHaveLength(2))
  expect(mapInstances[0].options).toMatchObject({
    keyboardShortcuts: true,
    zoomControl: false,
  })
  expect(mapInstances[0].fitBoundsCalls).toBe(1)
  expect(mapInstances[0].panToCalls).toHaveLength(0)

  const defaultIcon = markerInstances[0].icon as naver.maps.HtmlIcon
  expect(defaultIcon.size).toMatchObject({ width: 48, height: 48 })
  expect(defaultIcon?.anchor).toMatchObject({ x: 22, y: 41 })
  const defaultContent = defaultIcon.content as HTMLElement
  expect(defaultContent.dataset.dealStatus).toBe("active")
  expect(defaultContent.dataset.selected).toBe("false")
  expect(defaultContent).toHaveAccessibleName("성수 빵집 · 현재 할인 진행 중")
  expect(defaultContent).toHaveTextContent("")
  expect(defaultContent.style.background).toBe("")
  expect(defaultContent.style.border).toBe("")
  expect(
    (defaultContent.querySelector("img") as HTMLImageElement).style.filter,
  ).toBe("none")
  expect(markerInstances[0].title).toBe("성수 빵집 · 현재 할인 진행 중")

  const selectedIcon = markerInstances[1].icon as naver.maps.HtmlIcon
  expect(selectedIcon.size).toMatchObject({ width: 56, height: 56 })
  expect(selectedIcon?.anchor).toMatchObject({ x: 25, y: 48 })
  const selectedContent = selectedIcon.content as HTMLElement
  expect(selectedContent.dataset.dealStatus).toBe("none")
  expect(selectedContent.dataset.selected).toBe("true")
  expect(selectedContent).toHaveAccessibleName(
    "연남 타르트집 · 현재 할인 없음 · 선택됨",
  )
  expect(selectedContent).toHaveTextContent("")
  expect(
    (selectedContent.querySelector("img") as HTMLImageElement).style.filter,
  ).toBe("grayscale(1) opacity(0.68)")
  expect(markerInstances[1].title).toBe(
    "연남 타르트집 · 현재 할인 없음 · 선택됨",
  )
  expect(markerInstances[1].zIndex).toBe(100)

  const firstMarkerClick = listeners.find(
    (listener) =>
      listener.target === markerInstances[0] && listener.eventName === "click",
  )
  act(() => firstMarkerClick?.callback())
  expect(onSelect).toHaveBeenCalledWith(stores[0])

  rerender(
    <StoreMap
      stores={stores}
      selectedStoreId="1"
      onSelect={onSelect}
      fitBounds
    />,
  )
  await waitFor(() => expect(mapInstances[0].panToCalls).toHaveLength(1))
  const newlySelectedIcon = markerInstances[0].icon as naver.maps.HtmlIcon
  expect((newlySelectedIcon.content as HTMLElement).dataset.selected).toBe(
    "true",
  )
  expect(markerInstances[0].title).toBe(
    "성수 빵집 · 현재 할인 진행 중 · 선택됨",
  )
  expect(mapInstances[0].panToCalls[0].lat()).toBe(stores[0].latitude)
  expect(mapInstances[0].panToCalls[0].lng()).toBe(stores[0].longitude)
})

test("지도 준비 시 선택이 없다가 첫 가게를 선택하면 그 위치로 이동한다", async () => {
  const stores = [
    {
      id: "1",
      name: "성수 빵집",
      latitude: 37.5445,
      longitude: 127.056,
      dealStatus: "unknown" as const,
    },
  ]
  const { rerender } = render(
    <StoreMap stores={stores} selectedStoreId={null} />,
  )

  await waitFor(() => expect(markerInstances).toHaveLength(1))
  const icon = markerInstances[0].icon as naver.maps.HtmlIcon
  expect((icon.content as HTMLElement).dataset.dealStatus).toBe("unknown")
  expect(icon.content as HTMLElement).toHaveTextContent("")
  expect(
    ((icon.content as HTMLElement).querySelector("img") as HTMLImageElement)
      .style.filter,
  ).toBe("grayscale(1) opacity(0.68)")
  expect(markerInstances[0].title).toBe("성수 빵집 · 할인 정보 확인 중")
  expect(mapInstances[0].panToCalls).toHaveLength(0)

  rerender(<StoreMap stores={stores} selectedStoreId="1" />)

  await waitFor(() => expect(mapInstances[0].panToCalls).toHaveLength(1))
  expect(mapInstances[0].panToCalls[0].lat()).toBe(stores[0].latitude)
  expect(mapInstances[0].panToCalls[0].lng()).toBe(stores[0].longitude)
})

test("가게 검색 결과가 바뀌어도 현재 지도 인스턴스를 유지한다", async () => {
  const { rerender } = render(<StoreMap stores={[]} fitBounds={false} />)

  await waitFor(() => expect(mapInstances).toHaveLength(1))
  const currentMap = mapInstances[0]

  rerender(
    <StoreMap
      stores={[
        {
          id: "daegu-store",
          name: "대구 빵집",
          latitude: 35.8714,
          longitude: 128.6014,
          dealStatus: "active",
        },
      ]}
      fitBounds={false}
    />,
  )

  await waitFor(() => expect(markerInstances).toHaveLength(1))
  expect(mapInstances).toHaveLength(1)
  expect(markerInstances[0].map).toBe(currentMap)
  expect(currentMap.fitBoundsCalls).toBe(0)
})
