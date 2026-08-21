import type { Page } from "@playwright/test"

export async function installMockNaverMaps(page: Page) {
  await page.addInitScript(() => {
    type Listener = {
      target: object
      eventName: string
      callback: () => void
    }

    const listeners: Listener[] = []

    function dispatchEvent(target: object, eventName: string) {
      for (const listener of listeners) {
        if (listener.target === target && listener.eventName === eventName) {
          listener.callback()
        }
      }
    }

    class MockLatLng {
      constructor(
        private readonly latitude: number,
        private readonly longitude: number,
      ) {}

      lat() {
        return this.latitude
      }

      lng() {
        return this.longitude
      }
    }

    class MockLatLngBounds {
      constructor(
        public southWest: MockLatLng,
        public northEast: MockLatLng,
      ) {}

      extend(position: MockLatLng) {
        this.northEast = position
        return this
      }

      getSW() {
        return this.southWest
      }

      getNE() {
        return this.northEast
      }
    }

    class MockSize {
      constructor(
        public width: number,
        public height: number,
      ) {}
    }

    class MockPoint {
      constructor(
        public x: number,
        public y: number,
      ) {}
    }

    class MockNaverMap {
      readonly container: HTMLElement
      private center: MockLatLng
      private zoom: number

      constructor(
        container: HTMLElement,
        options: { center: MockLatLng; zoom: number },
      ) {
        this.container = container
        this.center = options.center
        this.zoom = options.zoom
        container.dataset.mockNaverMap = "ready"
        container.addEventListener("click", () => {
          this.center = new MockLatLng(37.5665, 126.978)
          dispatchEvent(this, "idle")
        })
      }

      autoResize() {}

      destroy() {}

      fitBounds(bounds: MockLatLngBounds) {
        this.center = bounds.northEast
      }

      getCenter() {
        return this.center
      }

      getBounds() {
        return new MockLatLngBounds(
          new MockLatLng(this.center.lat() - 0.03, this.center.lng() - 0.03),
          new MockLatLng(this.center.lat() + 0.03, this.center.lng() + 0.03),
        )
      }

      panTo(position: MockLatLng) {
        this.center = position
      }

      setCenter(position: MockLatLng) {
        this.center = position
      }

      setZoom(zoom: number) {
        this.zoom = zoom
      }
    }

    class MockMarker {
      private icon: { content?: HTMLElement } | undefined
      private iconElement: HTMLElement | null = null
      private map: MockNaverMap | null
      private position: MockLatLng
      private title: string

      constructor(options: {
        icon?: { content?: HTMLElement }
        map?: MockNaverMap
        position: MockLatLng
        title?: string
      }) {
        this.icon = options.icon
        this.map = options.map ?? null
        this.position = options.position
        this.title = options.title ?? ""
        this.mountIcon()
      }

      private mountIcon() {
        const content = this.icon?.content
        if (!this.map || !(content instanceof HTMLElement)) return

        content.style.position = "absolute"
        content.style.top = "260px"
        content.style.left = `${24 + (Number(this.position.lng().toFixed(3).replace(".", "")) % 8) * 56}px`
        content.style.zIndex = "1"
        content.addEventListener("click", () => dispatchEvent(this, "click"))
        this.map.container.append(content)
        this.iconElement = content
      }

      getPosition() {
        return this.position
      }

      setCursor() {}

      setDraggable() {}

      setIcon(icon: { content?: HTMLElement }) {
        this.iconElement?.remove()
        this.iconElement = null
        this.icon = icon
        this.mountIcon()
      }

      setMap(map: MockNaverMap | null) {
        this.iconElement?.remove()
        this.iconElement = null
        this.map = map
        this.mountIcon()
      }

      setPosition(position: MockLatLng) {
        this.position = position
      }

      setTitle(title: string) {
        this.title = title
      }

      setZIndex() {}
    }

    const event = {
      addListener(target: object, eventName: string, callback: () => void) {
        const listener = { target, eventName, callback } satisfies Listener
        listeners.push(listener)
        return listener
      },
      removeListener(listener: Listener | Listener[]) {
        const targets = Array.isArray(listener) ? listener : [listener]
        for (const target of targets) {
          const index = listeners.indexOf(target)
          if (index >= 0) listeners.splice(index, 1)
        }
      },
    }

    const service = {
      Status: { OK: "OK" },
      geocode(
        { query }: { query: string },
        callback: (status: string, response: unknown) => void,
      ) {
        queueMicrotask(() => {
          callback("OK", {
            v2: {
              addresses: [
                {
                  roadAddress: query,
                  jibunAddress: "서울 성동구 성수동2가 273-15",
                  englishAddress: "18 Yeonmujang-gil, Seongdong-gu, Seoul",
                  x: "127.0560000",
                  y: "37.5445000",
                },
              ],
            },
          })
        })
      },
      reverseGeocode(
        _options: { coords: MockLatLng; orders: string },
        callback: (status: string, response: unknown) => void,
      ) {
        queueMicrotask(() => {
          callback("OK", {
            v2: {
              address: {
                roadAddress: "서울 중구 세종대로 110",
                jibunAddress: "서울 중구 태평로1가 31",
              },
              results: [
                {
                  name: "admcode",
                  region: {
                    area1: { name: "서울특별시" },
                    area2: { name: "중구" },
                    area3: { name: "태평로1가" },
                    area4: { name: "" },
                  },
                },
              ],
            },
          })
        })
      },
    }

    Reflect.set(window, "naver", {
      maps: {
        Event: event,
        LatLng: MockLatLng,
        LatLngBounds: MockLatLngBounds,
        Map: MockNaverMap,
        Marker: MockMarker,
        Point: MockPoint,
        Position: { TOP_RIGHT: 3 },
        Service: service,
        Size: MockSize,
      },
    })
  })
}
