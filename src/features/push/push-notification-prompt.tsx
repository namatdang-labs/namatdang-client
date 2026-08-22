import { useEffect, useState } from "react"
import { BellRing, LoaderCircle } from "lucide-react"

import { Button } from "../../shared/ui/button"
import { getPushNotificationErrorMessage } from "./push-notification-error-message"
import { PUSH_NOTIFICATION_PROMPT_EVENT } from "./push-notification-prompt-events"
import { enablePushNotifications } from "./push-notifications"

export function PushNotificationPrompt() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const handlePromptRequest = () => {
      if (typeof Notification === "undefined") return

      if (Notification.permission === "granted") {
        void enablePushNotifications().catch(() => {
          // The notification center keeps the explicit recovery action.
        })
        return
      }

      if (Notification.permission === "default") {
        setErrorMessage("")
        setIsOpen(true)
      }
    }

    window.addEventListener(PUSH_NOTIFICATION_PROMPT_EVENT, handlePromptRequest)
    return () =>
      window.removeEventListener(
        PUSH_NOTIFICATION_PROMPT_EVENT,
        handlePromptRequest,
      )
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) setIsOpen(false)
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, isPending])

  if (!isOpen) return null

  const handleEnable = async () => {
    setIsPending(true)
    setErrorMessage("")

    try {
      await enablePushNotifications()
      setIsOpen(false)
    } catch (error) {
      setErrorMessage(getPushNotificationErrorMessage(error))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-5">
      <section
        className="bg-canvas w-full max-w-md rounded-3xl p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-prompt-title"
        aria-describedby="push-prompt-description"
      >
        <span
          className="bg-brand-tint text-brand-brown flex size-14 items-center justify-center rounded-2xl"
          aria-hidden="true"
        >
          <BellRing className="size-7" />
        </span>
        <h2
          id="push-prompt-title"
          className="text-foreground mt-5 text-xl font-bold"
        >
          할인과 예약 소식을 바로 받아볼까요?
        </h2>
        <p
          id="push-prompt-description"
          className="text-muted mt-3 text-sm leading-6"
        >
          찜한 가게의 새 할인과 예약 상태 변경을 브라우저 알림으로 알려드려요.
          언제든 브라우저 설정에서 끌 수 있어요.
        </p>

        {errorMessage ? (
          <p className="text-critical mt-4 text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => setIsOpen(false)}
          >
            나중에
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => void handleEnable()}
          >
            {isPending ? (
              <LoaderCircle className="animate-spin motion-reduce:animate-none" />
            ) : (
              <BellRing />
            )}
            {isPending ? "연결 중" : "알림 받기"}
          </Button>
        </div>
      </section>
    </div>
  )
}
