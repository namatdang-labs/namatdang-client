import {
  CalendarClock,
  ChevronLeft,
  MapPin,
  PackageCheck,
  Phone,
  ReceiptText,
  Store as StoreIcon,
  UserRound,
} from "lucide-react"
import { Link, useParams } from "react-router"

import {
  formatDateTime,
  formatShortDate,
  formatWon,
  getReservationTotalQuantity,
  ReservationStatusSummary,
} from "../../features/customer/reservation-components"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import {
  getDealById,
  getReservationById,
  getStoreById,
} from "../../shared/mock"
import { Button } from "../../shared/ui/button"
import { EmptyState } from "../../shared/ui/empty-state"

export function ReservationDetailPage() {
  const { reservationId = "" } = useParams()
  const reservation = getReservationById(reservationId)
  const store = reservation ? getStoreById(reservation.storeId) : undefined
  const deal = reservation ? getDealById(reservation.dealId) : undefined

  useDocumentTitle("예약 상세")

  if (!reservation) {
    return (
      <div className="mx-auto w-full max-w-3xl py-6 sm:py-10">
        <EmptyState
          icon={<PackageCheck className="size-6" />}
          title="예약을 찾을 수 없어요"
          description="내 예약 목록에서 확인할 예약을 다시 선택해 주세요."
          action={
            <Button asChild>
              <Link to="/reservations">내 예약으로 가기</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl py-6 sm:py-10">
      <Button asChild variant="ghost" size="compact" className="-ml-3">
        <Link to="/reservations">
          <ChevronLeft aria-hidden="true" />내 예약
        </Link>
      </Button>

      <header className="mt-3">
        <p className="text-muted text-sm font-medium tracking-wide">
          {reservation.reservationNumber}
        </p>
        <h1
          data-route-heading
          tabIndex={-1}
          className="text-foreground mt-2 text-2xl font-bold sm:text-3xl"
        >
          예약 상세
        </h1>
        <div className="mt-4">
          <ReservationStatusSummary reservation={reservation} />
        </div>
      </header>

      <div className="mt-7 grid gap-5">
        <section className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-6">
          <h2 className="text-foreground text-lg font-bold">픽업 정보</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <CalendarClock
                className="text-muted mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <dt className="text-muted text-sm">픽업 시간</dt>
                <dd className="text-foreground mt-1 font-semibold tabular-nums">
                  {formatDateTime(reservation.pickupAt)}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin
                className="text-muted mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <dt className="text-muted text-sm">픽업 장소</dt>
                <dd className="text-foreground mt-1 font-semibold">
                  {store?.name ?? "가게 정보 확인 중"}
                </dd>
                {store ? (
                  <dd className="text-muted mt-1 text-sm leading-6">
                    {store.address}
                  </dd>
                ) : null}
              </div>
            </div>
          </dl>
          {store ? (
            <div className="bg-surface mt-5 rounded-xl p-4">
              <p className="text-foreground text-sm font-semibold">
                매장 픽업 안내
              </p>
              <p className="text-muted mt-1 text-sm leading-6">
                {store.pickupGuide}
              </p>
            </div>
          ) : null}
        </section>

        <section className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-foreground text-lg font-bold">예약 품목</h2>
              {deal ? (
                <p className="text-muted mt-1 text-sm">{deal.title}</p>
              ) : null}
            </div>
            <span className="bg-surface text-foreground rounded-full px-3 py-1 text-xs font-semibold">
              총 {getReservationTotalQuantity(reservation)}개
            </span>
          </div>

          <ul className="divide-hairline mt-5 divide-y">
            {reservation.items.map((item) => (
              <li
                key={item.dealItemId}
                className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-foreground font-semibold">{item.name}</p>
                  <p className="text-muted mt-1 text-sm">
                    {formatWon(item.unitSalePrice)} × {item.quantity}개
                  </p>
                </div>
                <p className="text-foreground shrink-0 font-bold tabular-nums">
                  {formatWon(item.unitSalePrice * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-6">
          <h2 className="text-foreground flex items-center gap-2 text-lg font-bold">
            <ReceiptText className="size-5" aria-hidden="true" />
            금액 정보
          </h2>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">정가 합계</dt>
              <dd className="text-muted tabular-nums line-through">
                {formatWon(reservation.totalOriginalPrice)}
              </dd>
            </div>
            <div className="border-hairline flex items-center justify-between gap-4 border-t pt-4">
              <dt className="text-foreground font-semibold">최종 금액</dt>
              <dd className="text-foreground text-xl font-bold tabular-nums">
                {formatWon(reservation.totalPrice)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-6">
          <h2 className="text-foreground text-lg font-bold">예약자 정보</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <UserRound
                className="text-muted mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <dt className="text-muted">예약자</dt>
                <dd className="text-foreground mt-1 font-medium">
                  {reservation.customerName}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone
                className="text-muted mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <dt className="text-muted">연락처</dt>
                <dd className="text-foreground mt-1 font-medium tabular-nums">
                  {reservation.customerPhone}
                </dd>
              </div>
            </div>
          </dl>
          {reservation.customerNote ? (
            <div className="bg-surface mt-5 rounded-xl p-4">
              <p className="text-muted text-xs font-medium">가게에 남긴 메모</p>
              <p className="text-foreground mt-1 text-sm leading-6">
                {reservation.customerNote}
              </p>
            </div>
          ) : null}
        </section>

        <section className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-6">
          <h2 className="text-foreground flex items-center gap-2 text-lg font-bold">
            <StoreIcon className="size-5" aria-hidden="true" />
            예약 기록
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">예약한 날</dt>
              <dd className="text-foreground mt-1 font-medium">
                {formatShortDate(reservation.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">예약번호</dt>
              <dd className="text-foreground mt-1 font-medium tabular-nums">
                {reservation.reservationNumber}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
