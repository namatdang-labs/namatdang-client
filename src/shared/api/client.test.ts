import {
  AUTHENTICATION_REQUIRED_EVENT,
  getAccessToken,
  saveAccessToken,
} from "../../features/auth/auth-session"
import { FUTURE_ACCESS_TOKEN } from "../../test/auth-token"
import { apiClient, ApiError } from "./client"

const jsonHeaders = { "Content-Type": "application/json" }

afterEach(() => {
  window.localStorage.clear()
  vi.unstubAllGlobals()
})

test("저장된 JWT를 Bearer 토큰으로 첨부하고 쿠키는 전송하지 않는다", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify({ id: 1 }), {
      status: 200,
      headers: jsonHeaders,
    }),
  )
  vi.stubGlobal("fetch", fetchMock)
  saveAccessToken(FUTURE_ACCESS_TOKEN)

  await apiClient.get<{ id: number }>("/users/me")

  expect(fetchMock).toHaveBeenCalledOnce()
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe("/api/v1/users/me")
  expect(new Headers(init?.headers).get("Authorization")).toBe(
    `Bearer ${FUTURE_ACCESS_TOKEN}`,
  )
  expect(init).not.toHaveProperty("credentials")
})

test("401 응답이 오면 세션을 삭제하고 재로그인 이벤트를 보낸다", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        code: "INVALID_TOKEN",
        message: "유효하지 않은 인증 토큰입니다.",
      }),
      { status: 401, headers: jsonHeaders },
    ),
  )
  const authenticationRequiredListener = vi.fn()
  vi.stubGlobal("fetch", fetchMock)
  saveAccessToken(FUTURE_ACCESS_TOKEN)
  window.addEventListener(
    AUTHENTICATION_REQUIRED_EVENT,
    authenticationRequiredListener,
  )

  await expect(apiClient.get("/users/me")).rejects.toBeInstanceOf(ApiError)

  expect(getAccessToken()).toBeNull()
  expect(authenticationRequiredListener).toHaveBeenCalledOnce()

  window.removeEventListener(
    AUTHENTICATION_REQUIRED_EVENT,
    authenticationRequiredListener,
  )
})
