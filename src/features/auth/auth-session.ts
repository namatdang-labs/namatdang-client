export const ACCESS_TOKEN_STORAGE_KEY = "namatdang.auth.access-token"

export const AUTHENTICATION_REQUIRED_EVENT = "namatdang:authentication-required"

let memoryAccessToken: string | null = null

function getLocalStorage() {
  if (typeof window === "undefined") return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function getAccessToken() {
  const storage = getLocalStorage()
  if (!storage) return memoryAccessToken

  try {
    return storage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    return memoryAccessToken
  }
}

export function hasUsableAccessToken(
  accessToken = getAccessToken(),
  now = Date.now(),
) {
  if (!accessToken) return false

  try {
    const [, encodedPayload] = accessToken.split(".")
    if (!encodedPayload || typeof globalThis.atob !== "function") return false

    const normalizedPayload = encodedPayload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "=",
    )
    const payload = JSON.parse(globalThis.atob(paddedPayload)) as {
      exp?: unknown
    }

    return (
      typeof payload.exp === "number" &&
      payload.exp > Math.floor(now / 1000) + 5
    )
  } catch {
    return false
  }
}

export function saveAccessToken(accessToken: string) {
  const normalizedToken = accessToken.trim()

  if (!normalizedToken) {
    clearAccessToken()
    return
  }

  memoryAccessToken = normalizedToken

  try {
    getLocalStorage()?.setItem(ACCESS_TOKEN_STORAGE_KEY, normalizedToken)
  } catch {
    // In-memory storage keeps authentication working when storage is blocked.
  }
}

export function clearAccessToken() {
  memoryAccessToken = null

  try {
    getLocalStorage()?.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    // The in-memory token has still been cleared.
  }
}

export function notifyAuthenticationRequired() {
  if (typeof window === "undefined") return

  window.dispatchEvent(new Event(AUTHENTICATION_REQUIRED_EVENT))
}
