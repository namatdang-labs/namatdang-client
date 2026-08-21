import { useQuery } from "@tanstack/react-query"
import {
  CalendarClock,
  CheckCircle2,
  MapPin,
  PackageCheck,
  ReceiptText,
  RefreshCw,
} from "lucide-react"
import { Link, useLocation, useSearchParams } from "react-router"

import {
  parseNumericReservationId,
  reservationQueryOptions,
  storeQueryOptions,
  type ReservationDetailDto,
} from "../../features/customer/customer-api"
import {
  CustomerPage,
  EmptyState,
  formatDateTime,
  formatWon,
  getReservationItemSummary,
  getReservationTotalQuantity,
} from "../../features/customer/customer-components"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

function getStateReservation(state: unknown) {
  if (!state || typeof state !== "object" || !("reservation" in state)) {
    return null
  }
  const reservation = state.reservation
  if (
    !reservation ||
    typeof reservation !== "object" ||
    !("reservationId" in reservation) ||
    typeof reservation.reservationId !== "number" ||
    !("items" in reservation) ||
    !Array.isArray(reservation.items)
  ) {
    return null
  }
  return reservation as ReservationDetailDto
}

function CompleteSkeleton() {
  return (
    <section
      className="border-hairline bg-canvas grid gap-5 rounded-2xl border p-6"
      aria-label="완료된 예약을 불러오는 중"
      aria-busy="true"
    >
      <span className="bg-surface mx-auto size-14 animate-pulse rounded-full motion-reduce:animate-none" />
      <span className="bg-surface mx-auto h-8 w-2/3 animate-pulse rounded motion-reduce:animate-none" />
      <span className="bg-surface h-64 w-full animate-pulse rounded-xl motion-reduce:animate-none" />
    </section>
  )
}

export function ReservationCompletePage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const stateReservation = getStateReservation(location.state)
  const requestedReservationId = parseNumericReservationId(
    searchParams.get("reservationId") ?? undefined,
  )
  const reservationQuery = useQuery({
    ...reservationQueryOptions(requestedReservationId ?? 0),
    enabled: !stateReservation && requestedReservationId !== null,
  })
  const reservation = stateReservation ?? reservationQuery.data
  const storeQuery = useQuery({
    ...storeQueryOptions(reservation?.storeId ?? 0),
    enabled: Boolean(reservation),
  })

  useDocumentTitle("예약 완료")

  if (!stateReservation && requestedReservationId === null) {
    return (
      <CustomerPage className="max-w-2xl">
        <EmptyState
          title="완료된 예약을 찾을 수 없어요"
          description="내 예약에서 예약 내역을 확인해 주세요."
          action={
            <Button asChild>
              <Link to="/reservations">내 예약 보기</Link>
            </Button>
          }
        />
      </CustomerPage>
    )
  }

  if (reservationQuery.isPending && !stateReservation) {
    return (
      <CustomerPage className="max-w-2xl">
        <CompleteSkeleton />
      </CustomerPage>
    )
  }

  if (reservationQuery.isError || !reservation) {
    return (
      <CustomerPage className="max-w-2xl">
        <EmptyState
          title="예약 내용을 불러오지 못했어요"
          description="연결 상태를 확인한 뒤 다시 불러와 주세요."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => void reservationQuery.refetch()}
            >
              <RefreshCw aria-hidden="true" />
              다시 불러오기
            </Button>
          }
        />
      </CustomerPage>
    )
  }

  return (
    <CustomerPage className="max-w-2xl">
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
            예약번호 {reservation.reservationId}
          </p>
          <h1
            data-route-heading
            tabIndex={-1}
            className="text-foreground mt-2 text-2xl font-bold sm:text-3xl"
          >
            예약이 완료됐어요
          </h1>
          <p className="text-muted mt-3 text-sm leading-6 sm:text-base">
            가게에서 예약번호를 보여 주고 상품을 픽업해 주세요.
          </p>
        </div>

        <dl className="bg-surface mt-8 grid gap-5 rounded-xl p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <CalendarClock
              className="text-muted mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted text-sm">예약 일시</dt>
              <dd className="text-foreground mt-1 font-semibold tabular-nums">
                {formatDateTime(reservation.createdAt)}
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
                {reservation.storeName ?? "가게 정보"}
              </dd>
              {storeQuery.data ? (
                <dd className="text-muted mt-1 text-sm leading-6">
                  {storeQuery.data.address}
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
                {getReservationItemSummary(reservation)} · 총{" "}
                {getReservationTotalQuantity(reservation)}개
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
                {formatWon(reservation.totalAmount)}
              </dd>
            </div>
          </div>
        </dl>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button asChild>
            <Link to={`/reservations/${reservation.reservationId}`}>
              예약 상세 보기
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/app">홈으로 가기</Link>
          </Button>
        </div>
      </section>
    </CustomerPage>
  )
}
