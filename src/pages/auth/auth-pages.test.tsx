import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import {
  clearAccessToken,
  getAccessToken,
} from "../../features/auth/auth-session"
import { renderWithProviders } from "../../test/render"
import { FUTURE_ACCESS_TOKEN } from "../../test/auth-token"
import { LoginPage } from "./login-page"
import { SignupPage } from "./signup-page"

const jsonHeaders = { "Content-Type": "application/json" }

function renderAuthRoute(initialEntry: string) {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
      { path: "/app", element: <h1>고객 홈</h1> },
      { path: "/reservations", element: <h1>내 예약</h1> },
    ],
    { initialEntries: [initialEntry] },
  )

  return {
    ...renderWithProviders(<RouterProvider router={router} />),
    router,
  }
}

afterEach(() => {
  clearAccessToken()
  vi.unstubAllGlobals()
})

test("로그인에 성공하면 토큰을 저장하고 요청했던 내부 화면으로 이동한다", async () => {
  const user = userEvent.setup()
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: FUTURE_ACCESS_TOKEN,
          tokenType: "Bearer",
          expiresIn: 3600,
          user: {
            id: 1,
            email: "user@example.com",
            name: "회원",
            roles: ["CONSUMER"],
          },
        }),
        { status: 200, headers: jsonHeaders },
      ),
    ),
  )
  renderAuthRoute("/login?redirect=%2Freservations")

  await user.type(
    screen.getByRole("textbox", { name: "이메일" }),
    "user@example.com",
  )
  await user.type(screen.getByLabelText("비밀번호"), "password123")
  await user.click(screen.getByRole("button", { name: "로그인" }))

  expect(
    await screen.findByRole("heading", { level: 1, name: "내 예약" }),
  ).toBeInTheDocument()
  expect(getAccessToken()).toBe(FUTURE_ACCESS_TOKEN)
})

test.each([
  ["퍼센트 백슬래시", "/login?redirect=%2F%255Cevil.com"],
  ["직접 백슬래시", "/login?redirect=/%5Cevil.com"],
  ["외부 origin", "/login?redirect=https%3A%2F%2Fevil.example%2Fphishing"],
  ["프로토콜 생략 origin", "/login?redirect=%2F%2Fevil.example"],
] as const)(
  "로그인 redirect가 %s이면 고객 홈으로 돌아간다",
  async (_caseName, initialEntry) => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            accessToken: FUTURE_ACCESS_TOKEN,
            tokenType: "Bearer",
            expiresIn: 3600,
            user: {
              id: 1,
              email: "user@example.com",
              name: "회원",
              roles: ["CONSUMER"],
            },
          }),
          { status: 200, headers: jsonHeaders },
        ),
      ),
    )
    const { router } = renderAuthRoute(initialEntry)

    await user.type(
      screen.getByRole("textbox", { name: "이메일" }),
      "user@example.com",
    )
    await user.type(screen.getByLabelText("비밀번호"), "password123")
    await user.click(screen.getByRole("button", { name: "로그인" }))

    expect(
      await screen.findByRole("heading", { level: 1, name: "고객 홈" }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/app")
  },
)

test("로그인 실패 시 서버가 제공한 한국어 안내를 보여준다", async () => {
  const user = userEvent.setup()
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "AUTHENTICATION_FAILED",
          message: "이메일 또는 비밀번호를 확인해 주세요.",
        }),
        { status: 401, headers: jsonHeaders },
      ),
    ),
  )
  renderAuthRoute("/login")

  await user.type(
    screen.getByRole("textbox", { name: "이메일" }),
    "user@example.com",
  )
  await user.type(screen.getByLabelText("비밀번호"), "wrong-password")
  await user.click(screen.getByRole("button", { name: "로그인" }))

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "이메일 또는 비밀번호를 확인해 주세요.",
  )
})

test("로그인 화면에는 아직 제공하지 않는 비밀번호 재설정 행동을 노출하지 않는다", () => {
  renderAuthRoute("/login")

  expect(
    screen.queryByRole("button", { name: "비밀번호 찾기" }),
  ).not.toBeInTheDocument()
  expect(screen.queryByText(/API 연결 후 제공/)).not.toBeInTheDocument()
})

test("회원가입은 역할 필드 없이 요청하고 로그인 이동 경로를 유지한다", async () => {
  const user = userEvent.setup()
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        id: 2,
        email: "new@example.com",
        name: "신규회원",
        phoneNumber: "010-1234-5678",
        roles: ["CONSUMER"],
      }),
      { status: 201, headers: jsonHeaders },
    ),
  )
  vi.stubGlobal("fetch", fetchMock)
  const { router } = renderAuthRoute("/signup?redirect=%2Fmanage%2Fonboarding")

  expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
    "href",
    "/login?redirect=%2Fmanage%2Fonboarding",
  )

  await user.type(screen.getByRole("textbox", { name: "이름" }), "신규회원")
  await user.type(
    screen.getByRole("textbox", { name: "전화번호" }),
    "01012345678",
  )
  expect(screen.getByRole("textbox", { name: "전화번호" })).toHaveValue(
    "010-1234-5678",
  )
  await user.type(
    screen.getByRole("textbox", { name: "이메일" }),
    "new@example.com",
  )
  await user.type(
    screen.getByLabelText("비밀번호", { selector: "input" }),
    "password123",
  )
  await user.type(screen.getByLabelText("비밀번호 확인"), "password123")
  await user.click(screen.getByRole("checkbox"))
  await user.click(screen.getByRole("button", { name: "회원가입" }))

  expect(
    await screen.findByRole("status", {
      name: "",
    }),
  ).toHaveTextContent("회원가입이 완료됐어요. 로그인해 주세요.")
  expect(router.state.location.pathname).toBe("/login")
  expect(router.state.location.search).toBe(
    "?joined=1&redirect=%2Fmanage%2Fonboarding",
  )

  const [, init] = fetchMock.mock.calls[0]
  expect(JSON.parse(String(init?.body))).toEqual({
    name: "신규회원",
    email: "new@example.com",
    phoneNumber: "010-1234-5678",
    password: "password123",
  })
})
