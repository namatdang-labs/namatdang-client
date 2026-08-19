import { useMemo, useState } from "react"
import {
  BadgePercent,
  Bell,
  CalendarCheck2,
  CalendarX2,
  Check,
  CheckCheck,
  ChevronRight,
} from "lucide-react"
import { Link, useOutletContext } from "react-router"

import {
  type CustomerNotification,
  type CustomerNotificationsContext,
  type CustomerNotificationType,
} from "../../features/customer/notifications-data"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { cn } from "../../shared/lib/utils"
import { Button } from "../../shared/ui/button"
import { EmptyState } from "../../shared/ui/empty-state"

type NotificationFilter = "all" | "unread"

const notificationPresentation: Record<
  CustomerNotificationType,
  {
    label: string
    icon: typeof Bell
    iconClassName: string
  }
> = {
  DEAL_PUBLISHED: {
    label: "새 할인",
    icon: BadgePercent,
    iconClassName: "bg-brand-tint text-brand-link",
  },
  RESERVATION_CONFIRMED: {
    label: "예약 확정",
    icon: CalendarCheck2,
    iconClassName: "bg-surface text-success",
  },
  RESERVATION_CANCELED: {
    label: "예약 취소",
    icon: CalendarX2,
    iconClassName: "bg-surface text-critical",
  },
}

const filters: Array<{ id: NotificationFilter; label: string }> = [
  { id: "all", label: "전체" },
  { id: "unread", label: "안 읽음" },
]

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value))
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: CustomerNotification
  onRead: (notificationId: string) => void
}) {
  const presentation = notificationPresentation[notification.type]
  const Icon = presentation.icon

  return (
    <li>
      <article
        className={cn(
          "border-hairline relative rounded-2xl border p-5 transition-colors motion-reduce:transition-none sm:p-6",
          notification.isRead ? "bg-canvas" : "bg-brand-tint",
        )}
      >
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              presentation.iconClassName,
            )}
            aria-hidden="true"
          >
            <Icon className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 pr-9 sm:pr-0">
              <span className="text-muted text-xs font-semibold">
                {presentation.label}
              </span>
              {!notification.isRead ? (
                <span className="bg-primary text-primary-foreground inline-flex rounded-full px-2 py-0.5 text-xs font-semibold">
                  안 읽음
                </span>
              ) : (
                <span className="text-muted inline-flex items-center gap-1 text-xs">
                  <Check aria-hidden="true" className="size-3.5" />
                  읽음
                </span>
              )}
            </div>

            <h2 className="text-foreground mt-2 text-base font-bold sm:text-lg">
              {notification.title}
            </h2>
            <p className="text-muted mt-2 text-sm leading-6">
              {notification.description}
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <time
                dateTime={notification.createdAt}
                className="text-muted text-xs tabular-nums"
              >
                {formatNotificationDate(notification.createdAt)}
              </time>
              <Button asChild variant="ghost" size="compact">
                <Link
                  to={notification.href}
                  onClick={() => onRead(notification.id)}
                  aria-label={`${notification.title}: ${notification.actionLabel}`}
                >
                  {notification.actionLabel}
                  <ChevronRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {!notification.isRead ? (
          <button
            type="button"
            className="border-hairline bg-canvas text-muted hover:text-foreground absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-full border transition-colors motion-reduce:transition-none sm:top-5 sm:right-5"
            aria-label={`${notification.title} 읽음 처리`}
            onClick={() => onRead(notification.id)}
          >
            <Check aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </article>
    </li>
  )
}

export function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } =
    useOutletContext<CustomerNotificationsContext>()
  const [filter, setFilter] = useState<NotificationFilter>("all")

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length
  const visibleNotifications = useMemo(
    () =>
      filter === "unread"
        ? notifications.filter((notification) => !notification.isRead)
        : notifications,
    [filter, notifications],
  )

  useDocumentTitle("알림 센터")

  return (
    <div className="mx-auto w-full max-w-4xl py-6 sm:py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-brand-link text-sm font-semibold">
            할인과 예약 소식을 한곳에서
          </p>
          <h1
            data-route-heading
            tabIndex={-1}
            className="text-foreground mt-2 text-2xl font-bold sm:text-3xl"
          >
            알림 센터
          </h1>
          <p className="text-muted mt-2 text-sm leading-6 sm:text-base">
            찜한 가게의 새 할인과 예약 상태 변경을 확인해 보세요.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="compact"
          disabled={unreadCount === 0}
          onClick={markAllAsRead}
        >
          <CheckCheck aria-hidden="true" />
          {unreadCount === 0 ? "모두 읽음" : "전체 읽음"}
        </Button>
      </header>

      <section
        className="bg-bread-cream mt-7 flex items-center gap-4 rounded-2xl p-5 sm:p-6"
        aria-label="알림 요약"
      >
        <span
          className="bg-canvas text-brand-brown flex size-12 shrink-0 items-center justify-center rounded-full"
          aria-hidden="true"
        >
          <Bell className="size-6" />
        </span>
        <div>
          <p className="text-brand-brown text-sm font-semibold">새로운 소식</p>
          <p
            className="text-brand-brown mt-1 text-xl font-bold tabular-nums"
            aria-live="polite"
          >
            안 읽은 알림 {unreadCount}개
          </p>
        </div>
      </section>

      <div className="mt-7 flex items-center justify-between gap-4">
        <div
          className="flex gap-2"
          role="group"
          aria-label="알림 읽음 상태 필터"
        >
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors motion-reduce:transition-none",
                filter === item.id
                  ? "border-foreground bg-foreground text-canvas"
                  : "border-hairline bg-canvas text-foreground hover:bg-surface",
              )}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              {item.id === "unread" ? ` ${unreadCount}` : ""}
            </button>
          ))}
        </div>
        <p className="text-muted hidden text-sm sm:block" aria-live="polite">
          {visibleNotifications.length}개의 알림
        </p>
      </div>

      {visibleNotifications.length > 0 ? (
        <ul className="mt-4 grid gap-3" aria-label="알림 목록">
          {visibleNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markAsRead}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mt-4"
          icon={<Bell className="size-6" />}
          title={
            notifications.length === 0
              ? "아직 알림이 없어요"
              : "새로운 알림을 모두 확인했어요"
          }
          description={
            notifications.length === 0
              ? "찜한 가게에 할인이 열리거나 예약 상태가 바뀌면 알려 드릴게요."
              : "지난 알림은 전체 목록에서 다시 볼 수 있어요."
          }
          action={
            notifications.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setFilter("all")}
              >
                전체 알림 보기
              </Button>
            ) : (
              <Button asChild variant="secondary">
                <Link to="/">오늘의 할인 보기</Link>
              </Button>
            )
          }
        />
      )}
    </div>
  )
}
