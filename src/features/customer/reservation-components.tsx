/* eslint-disable react-refresh/only-export-components -- 예약 UI와 표시 함수를 하나의 도메인 모듈로 공유합니다. */
import { CalendarClock, ChevronRight, MapPin, PackageCheck } from "lucide-react"
import { Link } from "react-router"

import type { Reservation, ReservationStatus, Store } from "../../shared/types"
import { StatusBadge } from "../../shared/ui/status-badge"

const reservationStatusDescriptions: Record<ReservationStatus, string> = {
  pending: "가게에서 예약을 확인하고 있어요.",
  confirmed: "예약이 확정됐어요. 픽업 시간을 확인해 주세요.",
  "picked-up": "픽업이 완료된 예약이에요.",
  canceled: "취소된 예약이에요.",
  "no-show": "미방문 상태의 예약이에요.",
}

export function formatWon(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Seoul",
  }).format(new Date(value))
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(value))
}

export function getReservationItemSummary(reservation: Reservation) {
  const [firstItem] = reservation.items

  if (!firstItem) {
    return "품목 확인 중"
  }

  if (reservation.items.length === 1) {
    return `${firstItem.name} ${firstItem.quantity}개`
  }

  return `${firstItem.name} ${firstItem.quantity}개 외 ${reservation.items.length - 1}종`
}

export function getReservationTotalQuantity(reservation: Reservation) {
  return reservation.items.reduce((total, item) => total + item.quantity, 0)
}

export function ReservationStatusSummary({
  reservation,
}: {
  reservation: Reservation
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <StatusBadge status={reservation.status} />
      <p className="text-muted text-sm leading-6">
        {reservationStatusDescriptions[reservation.status]}
      </p>
    </div>
  )
}

export function ReservationCard({
  reservation,
  store,
}: {
  reservation: Reservation
  store?: Store
}) {
  return (
    <article className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted text-xs font-medium tracking-wide">
            {reservation.reservationNumber}
          </p>
          <h2 className="text-foreground mt-1 text-lg font-bold">
            {store?.name ?? "가게 정보 확인 중"}
          </h2>
        </div>
        <StatusBadge status={reservation.status} />
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex items-start gap-3">
          <CalendarClock
            className="text-muted mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <dt className="text-muted">픽업 시간</dt>
            <dd className="text-foreground mt-0.5 font-semibold tabular-nums">
              {formatDateTime(reservation.pickupAt)}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <PackageCheck
            className="text-muted mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <dt className="text-muted">예약 품목</dt>
            <dd className="text-foreground mt-0.5 font-medium">
              {getReservationItemSummary(reservation)}
            </dd>
          </div>
        </div>
        {store ? (
          <div className="flex items-start gap-3">
            <MapPin
              className="text-muted mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted">픽업 장소</dt>
              <dd className="text-foreground mt-0.5">{store.address}</dd>
            </div>
          </div>
        ) : null}
      </dl>

      <div className="border-hairline mt-5 flex items-center justify-between gap-4 border-t pt-4">
        <p className="text-foreground font-bold tabular-nums">
          {formatWon(reservation.totalPrice)}
        </p>
        <Link
          to={`/reservations/${reservation.id}`}
          className="text-brand-link inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold"
          aria-label={`${store?.name ?? "가게"} 예약 상세 보기`}
        >
          예약 상세
          <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
