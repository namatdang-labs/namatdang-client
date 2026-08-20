export type CustomerNotificationType =
  "DEAL_PUBLISHED" | "RESERVATION_CONFIRMED" | "RESERVATION_CANCELED"

export type CustomerNotification = {
  id: string
  type: CustomerNotificationType
  title: string
  description: string
  createdAt: string
  isRead: boolean
  href: string
  actionLabel: string
}

export type CustomerNotificationsContext = {
  notifications: CustomerNotification[]
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
}

export const mockCustomerNotifications: CustomerNotification[] = [
  {
    id: "notification-1",
    type: "DEAL_PUBLISHED",
    title: "찜한 가게에 새 할인이 열렸어요",
    description:
      "망원 케이크룸의 ‘조각 케이크 2개 세트’를 9,600원에 픽업할 수 있어요.",
    createdAt: "2026-08-18T17:05:00+09:00",
    isRead: false,
    href: "/deals/cake-slice-set",
    actionLabel: "할인 보기",
  },
  {
    id: "notification-2",
    type: "RESERVATION_CONFIRMED",
    title: "예약이 확정됐어요",
    description: "성수 베이크숍 예약이 확정됐어요. 오후 7시에 픽업해 주세요.",
    createdAt: "2026-08-18T16:43:00+09:00",
    isRead: false,
    href: "/reservations/reservation-1",
    actionLabel: "예약 보기",
  },
  {
    id: "notification-3",
    type: "RESERVATION_CANCELED",
    title: "예약이 취소됐어요",
    description:
      "밀밭 디저트 예약이 취소 처리됐어요. 세부 내용은 예약 상세에서 확인해 주세요.",
    createdAt: "2026-08-17T16:03:00+09:00",
    isRead: true,
    href: "/reservations/reservation-4",
    actionLabel: "예약 보기",
  },
]
