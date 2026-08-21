import { afterEach, expect, test, vi } from "vitest"

import { clearAccessToken } from "../auth/auth-session"
import {
  deleteCurrentUser,
  getCurrentUser,
  updateCurrentUser,
} from "./account-api"

const jsonHeaders = { "Content-Type": "application/json" }

const currentUser = {
  id: 7,
  email: "member@example.com",
  name: "남았당 회원",
  phoneNumber: "010-1234-5678",
  roles: ["CONSUMER", "OWNER"] as const,
  createdAt: "2026-08-20T10:00:00",
  updatedAt: "2026-08-20T10:00:00",
}

afterEach(() => {
  clearAccessToken()
  vi.unstubAllGlobals()
})

test("내 정보 조회·수정·탈퇴를 users/me 계약으로 요청한다", async () => {
  const updatedUser = {
    ...currentUser,
    name: "수정한 회원",
    phoneNumber: "010-9999-1111",
    updatedAt: "2026-08-21T10:00:00",
  }
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      new Response(JSON.stringify(currentUser), {
        status: 200,
        headers: jsonHeaders,
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify(updatedUser), {
        status: 200,
        headers: jsonHeaders,
      }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  vi.stubGlobal("fetch", fetchMock)

  await expect(getCurrentUser()).resolves.toMatchObject({
    roles: ["CONSUMER", "OWNER"],
  })
  await expect(
    updateCurrentUser({
      name: "수정한 회원",
      phoneNumber: "010-9999-1111",
    }),
  ).resolves.toMatchObject({ name: "수정한 회원" })
  await expect(deleteCurrentUser()).resolves.toBeUndefined()

  expect(fetchMock.mock.calls[0]).toEqual([
    "/api/v1/users/me",
    expect.objectContaining({ method: "GET" }),
  ])
  expect(fetchMock.mock.calls[1]).toEqual([
    "/api/v1/users/me",
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({
        name: "수정한 회원",
        phoneNumber: "010-9999-1111",
      }),
    }),
  ])
  expect(fetchMock.mock.calls[2]).toEqual([
    "/api/v1/users/me",
    expect.objectContaining({ method: "DELETE" }),
  ])
})
