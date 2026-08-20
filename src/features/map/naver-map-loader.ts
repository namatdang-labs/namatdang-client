import { NaverMapLoadError } from "./map-errors"

const NAVER_MAPS_SCRIPT_ID = "namatdang-naver-maps-sdk"
const NAVER_MAPS_SCRIPT_BASE_URL =
  "https://oapi.map.naver.com/openapi/v3/maps.js"
const NAVER_MAPS_READY_CALLBACK = "__namatdangNaverMapsReady"
const LOAD_TIMEOUT_MS = 10_000

type NaverMapsNamespace = typeof naver.maps
type NaverMapsGlobal = { maps: NaverMapsNamespace }
type AuthFailureListener = (error: NaverMapLoadError) => void

declare global {
  interface Window {
    naver?: NaverMapsGlobal
    navermap_authFailure?: () => void
    __namatdangNaverMapsReady?: () => void
  }
}

let loaderPromise: Promise<NaverMapsNamespace> | null = null
let latestAuthFailure: NaverMapLoadError | null = null
let authFailureHandlerInstalled = false
let previousAuthFailureHandler: (() => void) | undefined
const authFailureListeners = new Set<AuthFailureListener>()

function getReadyMaps(): NaverMapsNamespace | null {
  const maps = window.naver?.maps

  if (
    typeof maps?.Map !== "function" ||
    typeof maps.Marker !== "function" ||
    typeof maps.Service?.geocode !== "function"
  ) {
    return null
  }

  return maps
}

function installAuthFailureHandler() {
  if (authFailureHandlerInstalled) {
    return
  }

  previousAuthFailureHandler = window.navermap_authFailure
  window.navermap_authFailure = () => {
    const error = new NaverMapLoadError("auth-failed")
    latestAuthFailure = error
    authFailureListeners.forEach((listener) => listener(error))
    previousAuthFailureHandler?.()
  }
  authFailureHandlerInstalled = true
}

function createScriptSource(apiKey: string) {
  const source = new URL(NAVER_MAPS_SCRIPT_BASE_URL)
  source.searchParams.set("ncpKeyId", apiKey)
  source.searchParams.set("submodules", "geocoder")
  source.searchParams.set("callback", NAVER_MAPS_READY_CALLBACK)
  return source.toString()
}

function findExistingScript() {
  return (
    document.getElementById(NAVER_MAPS_SCRIPT_ID) ??
    document.querySelector<HTMLScriptElement>(
      `script[src^="${NAVER_MAPS_SCRIPT_BASE_URL}"]`,
    )
  )
}

export function subscribeToNaverMapAuthFailure(listener: AuthFailureListener) {
  authFailureListeners.add(listener)
  return () => authFailureListeners.delete(listener)
}

export function loadNaverMaps(): Promise<NaverMapsNamespace> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new NaverMapLoadError("load-failed"))
  }

  installAuthFailureHandler()

  if (latestAuthFailure) {
    return Promise.reject(latestAuthFailure)
  }

  const readyMaps = getReadyMaps()
  if (readyMaps) {
    return Promise.resolve(readyMaps)
  }

  const apiKey = import.meta.env.VITE_NAVER_MAP_NCP_KEY_ID?.trim()
  if (!apiKey) {
    return Promise.reject(new NaverMapLoadError("missing-key"))
  }

  if (loaderPromise) {
    return loaderPromise
  }

  const pendingLoad = new Promise<NaverMapsNamespace>((resolve, reject) => {
    let settled = false
    let script = findExistingScript()

    const cleanUp = () => {
      window.clearTimeout(timeoutId)
      script?.removeEventListener("load", handleScriptLoad)
      script?.removeEventListener("error", handleScriptError)
      unsubscribeAuthFailure()
      delete window.__namatdangNaverMapsReady
    }

    const finish = () => {
      if (settled) {
        return
      }

      const maps = getReadyMaps()
      if (!maps) {
        fail(new NaverMapLoadError("load-failed"))
        return
      }

      settled = true
      cleanUp()
      const ownedScript = document.getElementById(NAVER_MAPS_SCRIPT_ID)
      if (ownedScript instanceof HTMLScriptElement) {
        ownedScript.dataset.loadState = "loaded"
      }
      resolve(maps)
    }

    const fail = (error: NaverMapLoadError) => {
      if (settled) {
        return
      }

      settled = true
      cleanUp()
      const ownedScript = document.getElementById(NAVER_MAPS_SCRIPT_ID)
      if (ownedScript instanceof HTMLScriptElement) {
        ownedScript.remove()
      }
      reject(error)
    }

    const handleScriptLoad = () => {
      const maps = getReadyMaps()
      if (maps) {
        finish()
      }
    }

    const handleScriptError = () => {
      fail(new NaverMapLoadError("load-failed"))
    }

    const timeoutId = window.setTimeout(() => {
      const maps = getReadyMaps()
      if (maps) {
        finish()
        return
      }
      fail(new NaverMapLoadError("load-failed"))
    }, LOAD_TIMEOUT_MS)

    const unsubscribeAuthFailure = subscribeToNaverMapAuthFailure(fail)
    window.__namatdangNaverMapsReady = finish

    if (script instanceof HTMLScriptElement) {
      script.addEventListener("load", handleScriptLoad)
      script.addEventListener("error", handleScriptError)

      if (getReadyMaps()) {
        queueMicrotask(finish)
      }
    } else {
      const nextScript = document.createElement("script")
      nextScript.id = NAVER_MAPS_SCRIPT_ID
      nextScript.src = createScriptSource(apiKey)
      nextScript.async = true
      nextScript.referrerPolicy = "strict-origin-when-cross-origin"
      nextScript.dataset.loadState = "loading"
      nextScript.addEventListener("load", handleScriptLoad)
      nextScript.addEventListener("error", handleScriptError)
      script = nextScript
      document.head.append(nextScript)
    }
  })

  loaderPromise = pendingLoad.catch((error: unknown) => {
    loaderPromise = null
    throw error
  })

  return loaderPromise
}

export function __resetNaverMapsLoaderForTests() {
  loaderPromise = null
  latestAuthFailure = null
  authFailureListeners.clear()
  document.getElementById(NAVER_MAPS_SCRIPT_ID)?.remove()
  delete window.__namatdangNaverMapsReady
  Reflect.deleteProperty(window, "naver")

  if (authFailureHandlerInstalled) {
    window.navermap_authFailure = previousAuthFailureHandler
  }
  previousAuthFailureHandler = undefined
  authFailureHandlerInstalled = false
}
