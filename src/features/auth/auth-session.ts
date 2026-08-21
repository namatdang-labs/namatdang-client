export const ACCESS_TOKEN_STORAGE_KEY = "namatdang.auth.access-token"

export const AUTHENTICATION_REQUIRED_EVENT = "namatdang:authentication-required"

const ACCESS_TOKEN_EXPIRATION_SAFETY_MARGIN_SECONDS = 5
const MAX_TIMEOUT_DELAY_MS = 2_147_483_647

let memoryAccessToken: string | null = null
let expirationTimer: ReturnType<typeof setTimeout> | null = null

const authenticationSubscribers = new Set<() => void>()

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

function getAccessTokenExpirationSeconds(accessToken: string) {
  try {
    const [, encodedPayload] = accessToken.split(".")
    if (!encodedPayload || typeof globalThis.atob !== "function") return null

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

    return typeof payload.exp === "number" ? payload.exp : null
  } catch {
    return null
  }
}

export function hasUsableAccessToken(
  accessToken = getAccessToken(),
  now = Date.now(),
) {
  if (!accessToken) return false

  const expirationSeconds = getAccessTokenExpirationSeconds(accessToken)

  return (
    expirationSeconds !== null &&
    expirationSeconds >
      Math.floor(now / 1000) + ACCESS_TOKEN_EXPIRATION_SAFETY_MARGIN_SECONDS
  )
}

function clearExpirationTimer() {
  if (expirationTimer === null) return

  clearTimeout(expirationTimer)
  expirationTimer = null
}

function scheduleExpirationCheck() {
  clearExpirationTimer()

  if (authenticationSubscribers.size === 0) return

  const accessToken = getAccessToken()
  if (!accessToken || !hasUsableAccessToken(accessToken)) return

  const expirationSeconds = getAccessTokenExpirationSeconds(accessToken)
  if (expirationSeconds === null) return

  const expirationBoundary =
    (expirationSeconds - ACCESS_TOKEN_EXPIRATION_SAFETY_MARGIN_SECONDS) * 1000
  const delay = Math.min(
    Math.max(expirationBoundary - Date.now(), 0),
    MAX_TIMEOUT_DELAY_MS,
  )

  expirationTimer = setTimeout(() => {
    expirationTimer = null

    const currentAccessToken = getAccessToken()
    if (currentAccessToken && !hasUsableAccessToken(currentAccessToken)) {
      clearAccessToken()
      if (!hasUsableAccessToken()) notifyAuthenticationRequired()
      return
    }

    scheduleExpirationCheck()
  }, delay)
}

function emitAuthenticationChange() {
  scheduleExpirationCheck()
  authenticationSubscribers.forEach((subscriber) => subscriber())
}

function handleAccessTokenStorageChange(event: StorageEvent) {
  if (event.key !== ACCESS_TOKEN_STORAGE_KEY) return

  memoryAccessToken = event.newValue?.trim() || null
  emitAuthenticationChange()
}

function handleVisibilityChange() {
  if (document.visibilityState !== "visible") return

  const accessToken = getAccessToken()
  if (accessToken && !hasUsableAccessToken(accessToken)) {
    clearAccessToken()
    if (!hasUsableAccessToken()) notifyAuthenticationRequired()
    return
  }

  emitAuthenticationChange()
}

function startAuthenticationObservation() {
  if (typeof window === "undefined") return

  window.addEventListener("storage", handleAccessTokenStorageChange)
  document.addEventListener("visibilitychange", handleVisibilityChange)
  scheduleExpirationCheck()
}

function stopAuthenticationObservation() {
  if (typeof window === "undefined") return

  window.removeEventListener("storage", handleAccessTokenStorageChange)
  document.removeEventListener("visibilitychange", handleVisibilityChange)
  clearExpirationTimer()
}

export function getAuthenticationSnapshot() {
  return hasUsableAccessToken()
}

export function subscribeToAuthentication(subscriber: () => void) {
  authenticationSubscribers.add(subscriber)

  if (authenticationSubscribers.size === 1) startAuthenticationObservation()

  return () => {
    authenticationSubscribers.delete(subscriber)

    if (authenticationSubscribers.size === 0) stopAuthenticationObservation()
  }
}

export function saveAccessToken(accessToken: string) {
  const normalizedToken = accessToken.trim()

  if (!normalizedToken) {
    clearAccessToken()
    return
  }

  const previousAccessToken = getAccessToken()
  memoryAccessToken = normalizedToken

  try {
    getLocalStorage()?.setItem(ACCESS_TOKEN_STORAGE_KEY, normalizedToken)
  } catch {
    // In-memory storage keeps authentication working when storage is blocked.
  }

  if (previousAccessToken !== normalizedToken) emitAuthenticationChange()
}

export function clearAccessToken() {
  const hadAccessToken = getAccessToken() !== null || memoryAccessToken !== null
  memoryAccessToken = null

  try {
    getLocalStorage()?.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    // The in-memory token has still been cleared.
  }

  if (hadAccessToken) emitAuthenticationChange()
}

export function notifyAuthenticationRequired() {
  if (typeof window === "undefined") return

  window.dispatchEvent(new Event(AUTHENTICATION_REQUIRED_EVENT))
}
