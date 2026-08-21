import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, expect, test, vi } from "vitest"

import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from "../../features/auth/auth-session"
import { FUTURE_ACCESS_TOKEN } from "../../test/auth-token"
import { renderWithProviders } from "../../test/render"
import { MyPage } from "./my-page"

const jsonHeaders = { "Content-Type": "application/json" }

const accountUser = {
  id: 7,
  email: "member@example.com",
  name: "남았당 회원",
  phoneNumber: "010-1234-5678",
  roles: ["CONSUMER", "OWNER"],
  createdAt: "2026-08-20T10:00:00",
  updatedAt: "2026-08-20T10:00:00",
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders,
  })
}

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.href
  return input.url
}

function createAccountFetchMock({ deleteConflict = false } = {}) {
  let currentUser = accountUser

  return vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(getRequestUrl(input), "http://localhost")
    const method = init?.method ?? "GET"

    if (url.pathname === "/api/v1/users/me" && method === "GET") {
      return jsonResponse(currentUser)
    }

    if (url.pathname === "/api/v1/users/me" && method === "PATCH") {
      const request = JSON.parse(String(init?.body)) as {
        name: string
        phoneNumber: string
      }
      currentUser = {
        ...currentUser,
        ...request,
        updatedAt: "2026-08-21T10:00:00",
      }
      return jsonResponse(currentUser)
    }

    if (url.pathname === "/api/v1/users/me" && method === "DELETE") {
      return deleteConflict
        ? jsonResponse(
            {
              code: "OWNER_HAS_STORES",
              message: "등록한 가게가 있는 회원은 탈퇴할 수 없습니다.",
            },
            409,
          )
        : new Response(null, { status: 204 })
    }

    if (url.pathname === "/api/v1/favorites") {
      return jsonResponse([])
    }

    if (url.pathname === "/api/v1/reservations") {
      return jsonResponse({
        content: [],
        page: 0,
        size: 1,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      })
    }

    return jsonResponse({ code: "NOT_FOUND" }, 404)
  })
}

function renderMyPage(fetchMock: ReturnType<typeof createAccountFetchMock>) {
  saveAccessToken(FUTURE_ACCESS_TOKEN)
  vi.stubGlobal("fetch", fetchMock)
  const router = createMemoryRouter(
    [
      { path: "/me", element: <MyPage /> },
      { path: "/", element: <h1>남았당 첫 화면</h1> },
      { path: "/login", element: <h1>로그인</h1> },
    ],
    { initialEntries: ["/me"] },
  )

  return {
    ...renderWithProviders(<RouterProvider router={router} />),
    router,
  }
}

afterEach(() => {
  clearAccessToken()
  vi.unstubAllGlobals()
  document.body.style.overflow = ""
})

test("보유 권한을 roles로 보여 주고 이름·전화번호를 수정한다", async () => {
  const user = userEvent.setup()
  const fetchMock = createAccountFetchMock()
  renderMyPage(fetchMock)

  expect(await screen.findByText("가게 관리자")).toBeInTheDocument()
  const nameInput = screen.getByRole("textbox", { name: "이름" })
  const phoneInput = screen.getByRole("textbox", { name: "휴대폰 번호" })
  const saveButton = screen.getByRole("button", { name: "변경 사항 저장" })

  expect(nameInput).toHaveValue("남았당 회원")
  expect(phoneInput).toHaveValue("010-1234-5678")
  expect(saveButton).toBeDisabled()

  await user.clear(nameInput)
  await user.type(nameInput, "픽업 회원")
  await user.clear(phoneInput)
  await user.type(phoneInput, "01099991111")

  expect(phoneInput).toHaveValue("010-9999-1111")
  expect(
    screen.getByText("저장하지 않은 변경 내용이 있어요."),
  ).toBeInTheDocument()
  expect(saveButton).toBeEnabled()

  await user.click(saveButton)

  expect(await screen.findByRole("status", { name: "" })).toHaveTextContent(
    "회원 정보를 저장했어요.",
  )
  expect(saveButton).toBeDisabled()

  const patchCall = fetchMock.mock.calls.find(
    ([, init]) => init?.method === "PATCH",
  )
  expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({
    name: "픽업 회원",
    phoneNumber: "010-9999-1111",
  })
})

test("확인 문구를 입력한 뒤 탈퇴하면 인증 정보를 비우고 첫 화면으로 이동한다", async () => {
  const user = userEvent.setup()
  const fetchMock = createAccountFetchMock()
  const { router } = renderMyPage(fetchMock)

  await user.click(await screen.findByRole("button", { name: "회원 탈퇴" }))
  const dialog = screen.getByRole("dialog", { name: "회원 탈퇴할까요?" })
  expect(
    within(dialog).getByRole("heading", { name: "회원 탈퇴할까요?" }),
  ).toHaveFocus()

  const confirmationInput = within(dialog).getByRole("textbox", {
    name: /확인을 위해/,
  })
  const deleteButton = within(dialog).getByRole("button", {
    name: "회원 탈퇴",
  })
  expect(deleteButton).toBeDisabled()

  await user.type(confirmationInput, "탈퇴")
  expect(deleteButton).toBeEnabled()
  await user.click(deleteButton)

  expect(
    await screen.findByRole("heading", { name: "남았당 첫 화면" }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe("/")
  expect(getAccessToken()).toBeNull()
  expect(
    fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE"),
  ).toBe(true)
})

test("등록한 가게가 있는 회원의 409 탈퇴 거절 이유를 구체적으로 안내한다", async () => {
  const user = userEvent.setup()
  const fetchMock = createAccountFetchMock({ deleteConflict: true })
  renderMyPage(fetchMock)

  await user.click(await screen.findByRole("button", { name: "회원 탈퇴" }))
  const dialog = screen.getByRole("dialog")
  await user.type(
    within(dialog).getByRole("textbox", { name: /확인을 위해/ }),
    "탈퇴",
  )
  await user.click(within(dialog).getByRole("button", { name: "회원 탈퇴" }))

  expect(await within(dialog).findByRole("alert")).toHaveTextContent(
    "등록한 가게가 있어 탈퇴할 수 없어요. 가게 정리를 위해 운영팀에 문의해 주세요.",
  )
  expect(screen.getByRole("dialog")).toBeInTheDocument()
  expect(getAccessToken()).toBe(FUTURE_ACCESS_TOKEN)
})
