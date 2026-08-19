import {
  CalendarClock,
  CheckCircle2,
  MapPin,
  PackageCheck,
  ReceiptText,
} from "lucide-react"
import { Link, useLocation, useSearchParams } from "react-router"

import {
  getStore,
  type ReservationDraft,
} from "../../features/customer/customer-data"
import {
  formatDateTime,
  formatWon,
  getReservationItemSummary,
  getReservationTotalQuantity,
} from "../../features/customer/reservation-components"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import {
  getReservationById,
  getReservationsByUserId,
  getStoreById,
  mockUser,
} from "../../shared/mock"
import { Button } from "../../shared/ui/button"

export function ReservationCompletePage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const draft = (
    location.state as { reservation?: ReservationDraft } | null | undefined
  )?.reservation
  const requestedReservationId = searchParams.get("reservationId")
  const fallbackReservation = getReservationsByUserId(mockUser.id)[0]
  const reservation = requestedReservationId
    ? getReservationById(requestedReservationId)
    : fallbackReservation
  const store = reservation ? getStoreById(reservation.storeId) : undefined
  const draftStore = draft ? getStore(draft.storeId) : undefined

  const reservationNumber =
    draft?.reservationNumber ?? reservation?.reservationNumber
  const pickupTime = draft
    ? `${draft.pickupDate} ${draft.pickupTime}`
    : reservation
      ? formatDateTime(reservation.pickupAt)
      : undefined
  const storeName = draft?.storeName ?? store?.name
  const storeAddress = draftStore?.address ?? store?.address
  const itemSummary = draft
    ? draft.items.map((item) => `${item.name} ${item.quantity}개`).join(", ")
    : reservation
      ? getReservationItemSummary(reservation)
      : undefined
  const totalQuantity =
    draft?.totalQuantity ??
    (reservation ? getReservationTotalQuantity(reservation) : undefined)
  const totalPrice = draft?.totalPrice ?? reservation?.totalPrice

  useDocumentTitle("예약 완료")

  if (!draft && !reservation) {
    return (
      <div className="mx-auto w-full max-w-2xl py-8 sm:py-12">
        <section className="border-hairline bg-canvas rounded-2xl border px-6 py-12 text-center">
          <h1
            data-route-heading
            tabIndex={-1}
            className="text-foreground text-2xl font-bold"
          >
            예약 내용을 확인하고 있어요
          </h1>
          <p className="text-muted mt-2 text-sm leading-6">
            내 예약에서 완료된 예약을 다시 확인할 수 있어요.
          </p>
          <Button asChild className="mt-6">
            <Link to="/reservations">내 예약 보기</Link>
          </Button>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl py-8 sm:py-12">
      <section
        className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-8"
        aria-live="polite"
      >
        <div className="flex flex-col items-center text-center">
          <span
            className="bg-brand-tint text-success flex size-14 items-center justify-center rounded-full"
            aria-hidden="true"
          >
            <CheckCircle2 className="size-8" strokeWidth={2} />
          </span>
          <p className="text-brand-link mt-5 text-sm font-semibold">
            예약번호 {reservationNumber}
          </p>
          <h1
            data-route-heading
            tabIndex={-1}
            className="text-foreground mt-2 text-2xl font-bold sm:text-3xl"
          >
            예약이 완료됐어요
          </h1>
          <p className="text-muted mt-3 text-sm leading-6 sm:text-base">
            픽업할 때 예약번호를 가게에 보여 주세요.
          </p>
        </div>

        <dl className="bg-surface mt-8 grid gap-5 rounded-xl p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <CalendarClock
              className="text-muted mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted text-sm">픽업 시간</dt>
              <dd className="text-foreground mt-1 font-semibold tabular-nums">
                {pickupTime}
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
                {storeName ?? "가게 정보 확인 중"}
              </dd>
              {storeAddress ? (
                <dd className="text-muted mt-1 text-sm leading-6">
                  {storeAddress}
                </dd>
              ) : null}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <PackageCheck
              className="text-muted mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted text-sm">예약 품목</dt>
              <dd className="text-foreground mt-1 font-semibold">
                {itemSummary} · 총 {totalQuantity}개
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ReceiptText
              className="text-muted mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted text-sm">최종 금액</dt>
              <dd className="text-foreground mt-1 text-lg font-bold tabular-nums">
                {formatWon(totalPrice ?? 0)}
              </dd>
            </div>
          </div>
        </dl>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button asChild>
            {draft ? (
              <Link to="/reservations">내 예약 보기</Link>
            ) : (
              <Link to={`/reservations/${reservation?.id}`}>
                예약 상세 보기
              </Link>
            )}
          </Button>
          <Button asChild variant="secondary">
            <Link to="/">홈으로 가기</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
