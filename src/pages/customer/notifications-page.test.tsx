import { act, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { MemoryRouter } from "react-router"

import { renderWithProviders } from "../../test/render"
import { NotificationsPage } from "./notifications-page"

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status,
  })
}

function notificationDto(id: number, title: string, read = false) {
  return {
    id,
    type: "DEAL_CREATED",
    title,
    body: `${title} 내용을 확인해 보세요.`,
    linkUrl: `/stores/${id}`,
    read,
    readAt: read ? "2026-08-19T10:00:00" : null,
    createdAt: `2026-08-19T09:${String(id).padStart(2, "0")}:00`,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

test("커서로 이전 알림을 불러오고 중복 알림은 한 번만 표시한다", async () => {
  const user = userEvent.setup()
  let resolveOlderPage!: (response: Response) => void
  const olderPage = new Promise<Response>((resolve) => {
    resolveOlderPage = resolve
  })

  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input) => {
      const url = String(input)
      if (url === "/api/v1/notifications?size=20") {
        return jsonResponse({
          notifications: [
            notificationDto(3, "가장 최근 알림"),
            notificationDto(2, "페이지 경계 알림"),
          ],
          nextCursor: 2,
          hasNext: true,
        })
      }
      if (url === "/api/v1/notifications?cursor=2&size=20") {
        return olderPage
      }
      if (url === "/api/v1/notifications/unread-count") {
        return jsonResponse({ unreadCount: 3 })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

  renderWithProviders(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>,
  )

  expect(await screen.findByText("가장 최근 알림")).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "이전 알림 더 보기" }))

  expect(
    screen.getByRole("button", { name: "이전 알림을 불러오는 중" }),
  ).toBeDisabled()
  expect(screen.getByText("가장 최근 알림")).toBeInTheDocument()

  act(() => {
    resolveOlderPage(
      jsonResponse({
        notifications: [
          notificationDto(2, "페이지 경계 알림"),
          notificationDto(1, "이전 알림"),
        ],
        nextCursor: null,
        hasNext: false,
      }),
    )
  })

  expect(await screen.findByText("이전 알림")).toBeInTheDocument()
  expect(screen.getAllByText("페이지 경계 알림")).toHaveLength(1)
  expect(screen.getByText("모든 알림을 확인했어요.")).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/notifications?cursor=2&size=20",
    expect.objectContaining({ method: "GET" }),
  )
})

test("이전 알림 요청이 실패해도 불러온 목록을 유지한다", async () => {
  const user = userEvent.setup()

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input)
    if (url === "/api/v1/notifications?size=20") {
      return jsonResponse({
        notifications: [notificationDto(3, "유지되어야 하는 알림")],
        nextCursor: 3,
        hasNext: true,
      })
    }
    if (url === "/api/v1/notifications?cursor=3&size=20") {
      return jsonResponse({ code: "TEMPORARY_ERROR" }, 500)
    }
    if (url === "/api/v1/notifications/unread-count") {
      return jsonResponse({ unreadCount: 1 })
    }
    throw new Error(`Unexpected request: ${url}`)
  })

  renderWithProviders(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>,
  )

  expect(await screen.findByText("유지되어야 하는 알림")).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "이전 알림 더 보기" }))

  expect(
    await screen.findByText(
      "이전 알림을 불러오지 못했어요. 다시 시도해 주세요.",
    ),
  ).toBeInTheDocument()
  expect(screen.getByText("유지되어야 하는 알림")).toBeInTheDocument()
  expect(
    screen.queryByRole("heading", { name: "알림을 불러오지 못했어요" }),
  ).not.toBeInTheDocument()
})

test("첫 알림 목록 요청이 실패하면 전체 오류 안내를 보여 준다", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input)
    if (url === "/api/v1/notifications?size=20") {
      return jsonResponse({ code: "TEMPORARY_ERROR" }, 500)
    }
    if (url === "/api/v1/notifications/unread-count") {
      return jsonResponse({ unreadCount: 3 })
    }
    throw new Error(`Unexpected request: ${url}`)
  })

  renderWithProviders(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole("heading", {
      name: "알림을 불러오지 못했어요",
    }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: "다시 불러오기" }),
  ).toBeInTheDocument()
  expect(screen.queryByLabelText("알림 목록")).not.toBeInTheDocument()
})

test("읽지 않은 개수 요청만 실패하면 목록을 유지하고 재시도한다", async () => {
  const user = userEvent.setup()
  let unreadCountRequestCount = 0

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input)
    if (url === "/api/v1/notifications?size=20") {
      return jsonResponse({
        notifications: [
          notificationDto(3, "읽지 않은 알림"),
          notificationDto(2, "읽은 알림", true),
        ],
        nextCursor: null,
        hasNext: false,
      })
    }
    if (url === "/api/v1/notifications/unread-count") {
      unreadCountRequestCount += 1
      return unreadCountRequestCount === 1
        ? jsonResponse({ code: "TEMPORARY_ERROR" }, 500)
        : jsonResponse({ unreadCount: 7 })
    }
    throw new Error(`Unexpected request: ${url}`)
  })

  renderWithProviders(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>,
  )

  expect(await screen.findByText("읽지 않은 알림")).toBeInTheDocument()
  expect(screen.getByText("읽은 알림")).toBeInTheDocument()
  expect(screen.getByText("안 읽은 알림 1개")).toBeInTheDocument()
  expect(
    screen.getByText(
      "전체 안 읽은 알림 수를 확인하지 못했어요. 지금 불러온 목록을 기준으로 표시해요.",
    ),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole("heading", { name: "알림을 불러오지 못했어요" }),
  ).not.toBeInTheDocument()

  await user.click(screen.getByRole("button", { name: "알림 수 다시 확인" }))

  expect(await screen.findByText("안 읽은 알림 7개")).toBeInTheDocument()
  await waitFor(() => {
    expect(
      screen.queryByRole("alert", {
        name: "읽지 않은 알림 수 확인 안내",
      }),
    ).not.toBeInTheDocument()
  })
  expect(unreadCountRequestCount).toBe(2)
})

test("현재 불러온 알림만 모두 읽음 처리한다", async () => {
  const user = userEvent.setup()
  const unreadIds = new Set([1, 2, 3, 4])
  const patchedIds: number[] = []

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input)
    if (url === "/api/v1/notifications?size=20") {
      return jsonResponse({
        notifications: [
          notificationDto(3, "첫 번째 알림", !unreadIds.has(3)),
          notificationDto(2, "두 번째 알림", !unreadIds.has(2)),
        ],
        nextCursor: 2,
        hasNext: true,
      })
    }
    if (url === "/api/v1/notifications?cursor=2&size=20") {
      return jsonResponse({
        notifications: [notificationDto(1, "세 번째 알림", !unreadIds.has(1))],
        nextCursor: null,
        hasNext: false,
      })
    }
    if (url === "/api/v1/notifications/unread-count") {
      return jsonResponse({ unreadCount: unreadIds.size })
    }
    const readMatch = url.match(/^\/api\/v1\/notifications\/(\d+)\/read$/)
    if (readMatch && init?.method === "PATCH") {
      const notificationId = Number(readMatch[1])
      patchedIds.push(notificationId)
      unreadIds.delete(notificationId)
      return new Response(null, { status: 204 })
    }
    throw new Error(`Unexpected request: ${init?.method} ${url}`)
  })

  renderWithProviders(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>,
  )

  expect(await screen.findByText("안 읽은 알림 4개")).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "이전 알림 더 보기" }))
  expect(await screen.findByText("세 번째 알림")).toBeInTheDocument()

  await user.click(screen.getByRole("button", { name: "현재 목록 읽음 처리" }))

  await waitFor(() => {
    expect(patchedIds.sort((left, right) => left - right)).toEqual([1, 2, 3])
  })
  expect(await screen.findByText("안 읽은 알림 1개")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "현재 목록 읽음" })).toBeDisabled()
  expect(patchedIds).not.toContain(4)
})
