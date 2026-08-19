import {
  clearAccessToken,
  getAccessToken,
  hasUsableAccessToken,
  saveAccessToken,
} from "./auth-session"
import {
  ALTERNATE_FUTURE_ACCESS_TOKEN,
  EXPIRED_ACCESS_TOKEN,
  FUTURE_ACCESS_TOKEN,
} from "../../test/auth-token"

const ACCESS_TOKEN_STORAGE_KEY = "namatdang.auth.access-token"

beforeEach(() => {
  window.localStorage.clear()
  clearAccessToken()
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
