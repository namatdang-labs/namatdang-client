export const PUSH_NOTIFICATION_PROMPT_EVENT =
  "namatdang:push-notification-prompt"

export function requestPushNotificationPromptAfterLogin() {
  if (typeof window === "undefined") return

  window.dispatchEvent(new Event(PUSH_NOTIFICATION_PROMPT_EVENT))
}
