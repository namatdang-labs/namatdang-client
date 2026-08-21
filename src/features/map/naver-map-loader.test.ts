import { afterEach, beforeEach, expect, test, vi } from "vitest"
import {
  __resetNaverMapsLoaderForTests,
  loadNaverMaps,
} from "./naver-map-loader"

const appendedScripts: HTMLScriptElement[] = []

function createReadyMaps() {
  return {
    Map: class {},
    Marker: class {},
    Service: {
      geocode: vi.fn(),
    },
  } as unknown as typeof naver.maps
}

function installReadyMaps() {
  const maps = createReadyMaps()
  Object.defineProperty(window, "naver", {
    configurable: true,
    value: { maps },
    writable: true,
  })
  return maps
}

beforeEach(() => {
  __resetNaverMapsLoaderForTests()
  vi.stubEnv("VITE_NAVER_MAP_NCP_KEY_ID", "test-client-id")
  appendedScripts.length = 0
  vi.spyOn(document.head, "append").mockImplementation((...nodes) => {
    nodes.forEach((node) => {
      if (node instanceof HTMLScriptElement) {
        appendedScripts.push(node)
      }
    })
  })
})

afterEach(() => {
  __resetNaverMapsLoaderForTests()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

test("API 키가 없으면 스크립트를 추가하지 않고 안내한다", async () => {
  vi.stubEnv("VITE_NAVER_MAP_NCP_KEY_ID", "")

  await expect(loadNaverMaps()).rejects.toMatchObject({
    code: "missing-key",
  })
  expect(document.querySelector("script[src*='oapi.map.naver.com']")).toBeNull()
})

test("준비된 SDK가 있으면 API 키 없이도 그대로 사용한다", async () => {
  const maps = installReadyMaps()
  vi.stubEnv("VITE_NAVER_MAP_NCP_KEY_ID", "")

  await expect(loadNaverMaps()).resolves.toBe(maps)
  expect(document.querySelector("script[src*='oapi.map.naver.com']")).toBeNull()
})

test("동시에 요청해도 geocoder를 포함한 SDK 스크립트를 하나만 로드한다", async () => {
  const firstLoad = loadNaverMaps()
  const secondLoad = loadNaverMaps()

  expect(secondLoad).toBe(firstLoad)
  expect(appendedScripts).toHaveLength(1)
  const source = new URL(appendedScripts[0].src)
  expect(source.searchParams.get("ncpKeyId")).toBe("test-client-id")
  expect(source.searchParams.get("submodules")).toBe("geocoder")

  const maps = installReadyMaps()
  window.__namatdangNaverMapsReady?.()

  await expect(firstLoad).resolves.toBe(maps)
})

test("네이버 인증 실패 콜백을 로드 실패와 구분한다", async () => {
  const pendingLoad = loadNaverMaps()
  const rejection = expect(pendingLoad).rejects.toMatchObject({
    code: "auth-failed",
  })

  window.navermap_authFailure?.()

  await rejection
})

test("SDK 스크립트 네트워크 실패를 안내한다", async () => {
  const pendingLoad = loadNaverMaps()
  const rejection = expect(pendingLoad).rejects.toMatchObject({
    code: "load-failed",
  })
  const script = appendedScripts[0]

  script?.dispatchEvent(new Event("error"))

  await rejection
  expect(appendedScripts).toHaveLength(1)
})
