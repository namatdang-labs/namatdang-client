import { clearAccessToken, saveAccessToken } from "./auth-session"
import { login, signup } from "./auth-api"
import {
  ALTERNATE_FUTURE_ACCESS_TOKEN,
  FUTURE_ACCESS_TOKEN,
} from "../../test/auth-token"

const jsonHeaders = { "Content-Type": "application/json" }

afterEach(() => {
  clearAccessToken()
  vi.unstubAllGlobals()
})

test("로그인 API가 서버 응답 DTO를 반환한다", async () => {
  const responseBody = {
    accessToken: FUTURE_ACCESS_TOKEN,
    tokenType: "Bearer" as const,
    expiresIn: 3600,
    user: {
      id: 12,
      email: "user@example.com",
      name: "남았당",
      roles: ["CONSUMER"] as const,
    },
  }
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: jsonHeaders,
    }),
  )
  vi.stubGlobal("fetch", fetchMock)
  saveAccessToken(ALTERNATE_FUTURE_ACCESS_TOKEN)

  await expect(
    login({ email: "user@example.com", password: "password123" }),
  ).resolves.toEqual(responseBody)

  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe("/api/v1/auth/login")
  expect(new Headers(init?.headers).has("Authorization")).toBe(false)
  expect(JSON.parse(String(init?.body))).toEqual({
    email: "user@example.com",
    password: "password123",
  })
})

test("회원가입 API가 역할 필드 없이 가입 정보를 보낸다", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        id: 13,
        email: "new@example.com",
        name: "신규회원",
        phoneNumber: "010-1234-5678",
        roles: ["CONSUMER"],
      }),
      { status: 201, headers: jsonHeaders },
    ),
  )
  vi.stubGlobal("fetch", fetchMock)

  await signup({
    email: "new@example.com",
    password: "password123",
    name: "신규회원",
    phoneNumber: "010-1234-5678",
  })

  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe("/api/v1/auth/signup")
  expect(JSON.parse(String(init?.body))).toEqual({
    email: "new@example.com",
    password: "password123",
    name: "신규회원",
    phoneNumber: "010-1234-5678",
  })
})
