import {
  AUTHENTICATION_REQUIRED_EVENT,
  clearAccessToken,
  getAuthenticationSnapshot,
  getAccessToken,
  hasUsableAccessToken,
  saveAccessToken,
  subscribeToAuthentication,
} from "./auth-session"
import {
  ALTERNATE_FUTURE_ACCESS_TOKEN,
  EXPIRED_ACCESS_TOKEN,
  FUTURE_ACCESS_TOKEN,
} from "../../test/auth-token"

const ACCESS_TOKEN_STORAGE_KEY = "namatdang.auth.access-token"
const MAX_TIMEOUT_DELAY_MS = 2_147_483_647

function createAccessToken(expirationSeconds: number) {
  const payload = globalThis
    .btoa(JSON.stringify({ exp: expirationSeconds }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  return `header.${payload}.signature`
}

beforeEach(() => {
  window.localStorage.clear()
  clearAccessToken()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

test("액세스 토큰을 localStorage에 저장하고 복원한다", () => {
  saveAccessToken(FUTURE_ACCESS_TOKEN)

  expect(window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe(
    FUTURE_ACCESS_TOKEN,
  )
  expect(getAccessToken()).toBe(FUTURE_ACCESS_TOKEN)

  window.localStorage.setItem(
    ACCESS_TOKEN_STORAGE_KEY,
    ALTERNATE_FUTURE_ACCESS_TOKEN,
  )
  expect(getAccessToken()).toBe(ALTERNATE_FUTURE_ACCESS_TOKEN)
})

test("로그아웃하면 메모리와 localStorage의 토큰을 모두 삭제한다", () => {
  saveAccessToken(FUTURE_ACCESS_TOKEN)

  clearAccessToken()

  expect(getAccessToken()).toBeNull()
  expect(window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull()
})

test("미래 exp가 있는 JWT 형태만 보호 경로 세션으로 사용한다", () => {
  expect(hasUsableAccessToken(FUTURE_ACCESS_TOKEN)).toBe(true)
  expect(hasUsableAccessToken(EXPIRED_ACCESS_TOKEN)).toBe(false)
  expect(hasUsableAccessToken("not-a-jwt")).toBe(false)
  expect(hasUsableAccessToken("header.invalid-base64.signature")).toBe(false)
})

test("동일 탭에서 세션을 저장하거나 삭제하면 구독자에게 한 번씩 알린다", () => {
  const subscriber = vi.fn()
  const authenticationRequiredListener = vi.fn()
  const unsubscribe = subscribeToAuthentication(subscriber)
  window.addEventListener(
    AUTHENTICATION_REQUIRED_EVENT,
    authenticationRequiredListener,
  )

  saveAccessToken(FUTURE_ACCESS_TOKEN)
  saveAccessToken(FUTURE_ACCESS_TOKEN)

  expect(getAuthenticationSnapshot()).toBe(true)
  expect(subscriber).toHaveBeenCalledOnce()

  clearAccessToken()
  clearAccessToken()

  expect(getAuthenticationSnapshot()).toBe(false)
  expect(subscriber).toHaveBeenCalledTimes(2)
  expect(authenticationRequiredListener).not.toHaveBeenCalled()

  window.removeEventListener(
    AUTHENTICATION_REQUIRED_EVENT,
    authenticationRequiredListener,
  )
  unsubscribe()
})

test("페이지를 열어 둔 채 JWT가 5초 안전 구간에 진입하면 세션을 만료한다", () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-08-21T00:00:00.000Z"))

  const subscriber = vi.fn()
  const authenticationRequiredListener = vi.fn()
  const unsubscribe = subscribeToAuthentication(subscriber)
  const accessToken = createAccessToken(Math.floor(Date.now() / 1000) + 7)
  window.addEventListener(
    AUTHENTICATION_REQUIRED_EVENT,
    authenticationRequiredListener,
  )

  saveAccessToken(accessToken)

  expect(getAuthenticationSnapshot()).toBe(true)
  expect(subscriber).toHaveBeenCalledOnce()

  vi.advanceTimersByTime(1_999)
  expect(getAuthenticationSnapshot()).toBe(true)

  vi.advanceTimersByTime(1)
  expect(getAuthenticationSnapshot()).toBe(false)
  expect(getAccessToken()).toBeNull()
  expect(subscriber).toHaveBeenCalledTimes(2)
  expect(authenticationRequiredListener).toHaveBeenCalledOnce()

  window.removeEventListener(
    AUTHENTICATION_REQUIRED_EVENT,
    authenticationRequiredListener,
  )
  unsubscribe()
})

test("백그라운드에서 만료된 세션은 화면이 다시 보일 때 즉시 정리한다", () => {
  vi.useFakeTimers()
  const initialTime = new Date("2026-08-21T00:00:00.000Z")
  vi.setSystemTime(initialTime)

  const subscriber = vi.fn()
  const authenticationRequiredListener = vi.fn()
  const unsubscribe = subscribeToAuthentication(subscriber)
  saveAccessToken(
    createAccessToken(Math.floor(initialTime.getTime() / 1000) + 7),
  )
  window.addEventListener(
    AUTHENTICATION_REQUIRED_EVENT,
    authenticationRequiredListener,
  )

  vi.setSystemTime(new Date(initialTime.getTime() + 2_000))
  document.dispatchEvent(new Event("visibilitychange"))

  expect(getAuthenticationSnapshot()).toBe(false)
  expect(getAccessToken()).toBeNull()
  expect(subscriber).toHaveBeenCalledTimes(2)
  expect(authenticationRequiredListener).toHaveBeenCalledOnce()

  window.removeEventListener(
    AUTHENTICATION_REQUIRED_EVENT,
    authenticationRequiredListener,
  )
  unsubscribe()
})

test("원거리 만료 토큰은 브라우저 타이머 한계로 나누어 재검사한다", () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-08-21T00:00:00.000Z"))
  const timeoutSpy = vi.spyOn(globalThis, "setTimeout")
  const subscriber = vi.fn()
  const unsubscribe = subscribeToAuthentication(subscriber)

  saveAccessToken(FUTURE_ACCESS_TOKEN)

  expect(timeoutSpy).toHaveBeenLastCalledWith(
    expect.any(Function),
    MAX_TIMEOUT_DELAY_MS,
  )

  vi.advanceTimersByTime(1)

  expect(getAuthenticationSnapshot()).toBe(true)
  expect(subscriber).toHaveBeenCalledOnce()

  unsubscribe()
})
