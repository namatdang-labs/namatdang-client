import { useState } from "react"
import { BellRing, LoaderCircle } from "lucide-react"

import { Button } from "../../shared/ui/button"
import { getPushNotificationErrorMessage } from "./push-notification-error-message"
import { enablePushNotifications } from "./push-notifications"

type PushConnectionStatus = "idle" | "pending" | "success"

export function PushNotificationControl() {
  const [status, setStatus] = useState<PushConnectionStatus>("idle")
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  const handleEnable = async () => {
    setStatus("pending")
    setMessage("")
    setIsError(false)

    try {
      await enablePushNotifications()
      setStatus("success")
      setMessage("이 브라우저로 할인과 예약 푸시 알림을 받을 수 있어요.")
    } catch (error) {
      setStatus("idle")
      setIsError(true)
      setMessage(getPushNotificationErrorMessage(error))
    }
  }

  return (
    <section
      className="border-hairline bg-canvas mt-7 rounded-2xl border p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6"
      aria-labelledby="push-notification-title"
    >
      <div className="flex items-start gap-4">
        <span
          className="bg-brand-tint text-brand-brown flex size-11 shrink-0 items-center justify-center rounded-xl"
          aria-hidden="true"
        >
          <BellRing className="size-5" />
        </span>
        <div>
          <h2
            id="push-notification-title"
            className="text-foreground text-base font-bold"
          >
            실시간 푸시 알림
          </h2>
          <p className="text-muted mt-1 text-sm leading-6">
            찜한 가게의 새 할인과 예약 상태 변경을 바로 알려드려요.
          </p>
          {message ? (
            <p
              className={
                isError
                  ? "text-critical mt-2 text-sm"
                  : "text-success mt-2 text-sm"
              }
              role={isError ? "alert" : "status"}
            >
              {message}
            </p>
          ) : null}
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="mt-4 w-full sm:mt-0 sm:w-auto"
        disabled={status === "pending" || status === "success"}
        onClick={() => void handleEnable()}
      >
        {status === "pending" ? (
          <LoaderCircle className="animate-spin motion-reduce:animate-none" />
        ) : (
          <BellRing />
        )}
        {status === "pending"
          ? "푸시 알림 연결 중"
          : status === "success"
            ? "푸시 알림 연결됨"
            : "푸시 알림 켜기"}
      </Button>
    </section>
  )
}
