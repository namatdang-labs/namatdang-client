import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { PushNotificationPrompt } from "./push-notification-prompt"
import { requestPushNotificationPromptAfterLogin } from "./push-notification-prompt-events"

const pushMocks = vi.hoisted(() => ({
  enablePushNotifications: vi.fn(),
}))

vi.mock("./push-notifications", () => ({
  enablePushNotifications: pushMocks.enablePushNotifications,
}))

function stubNotification(permission: NotificationPermission) {
  class NotificationStub {
    static permission = permission
  }

  vi.stubGlobal("Notification", NotificationStub)
}

beforeEach(() => {
  vi.clearAllMocks()
  pushMocks.enablePushNotifications.mockResolvedValue({ id: 1 })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test("로그인 후 알림 권한을 아직 선택하지 않았으면 안내창을 보여 준다", async () => {
  const user = userEvent.setup()
  stubNotification("default")
  render(<PushNotificationPrompt />)

  act(() => requestPushNotificationPromptAfterLogin())

  expect(
    screen.getByRole("dialog", {
      name: "할인과 예약 소식을 바로 받아볼까요?",
    }),
  ).toBeInTheDocument()

  await user.click(screen.getByRole("button", { name: "나중에" }))
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  expect(pushMocks.enablePushNotifications).not.toHaveBeenCalled()
})

test("안내창에서 알림 받기를 누르면 FCM 연결을 시작한다", async () => {
  const user = userEvent.setup()
  stubNotification("default")
  render(<PushNotificationPrompt />)

  act(() => requestPushNotificationPromptAfterLogin())
  await user.click(screen.getByRole("button", { name: "알림 받기" }))

  await waitFor(() => {
    expect(pushMocks.enablePushNotifications).toHaveBeenCalledOnce()
  })
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
})

test("이미 권한이 있으면 안내창 없이 FCM 토큰을 갱신한다", async () => {
  stubNotification("granted")
  render(<PushNotificationPrompt />)

  act(() => requestPushNotificationPromptAfterLogin())

  await waitFor(() => {
    expect(pushMocks.enablePushNotifications).toHaveBeenCalledOnce()
  })
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
})
