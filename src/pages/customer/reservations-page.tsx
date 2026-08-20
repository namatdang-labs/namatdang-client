import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  CalendarCheck2,
  CalendarClock,
  ChevronRight,
  RefreshCw,
  Store,
} from "lucide-react"
import { Link } from "react-router"

import {
  isUnauthorizedError,
  reservationsQueryOptions,
  type ReservationStatusDto,
  type ReservationSummaryDto,
} from "../../features/customer/customer-api"
import {
  CustomerPage,
  EmptyState,
  formatDateTime,
  formatWon,
  PageIntro,
  ReservationStatusBadge,
} from "../../features/customer/customer-components"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

type ReservationFilter = "ALL" | ReservationStatusDto

const filters: Array<{ id: ReservationFilter; label: string }> = [
  { id: "ALL", label: "전체" },
  { id: "RESERVED", label: "픽업 대기" },
  { id: "PICKED_UP", label: "픽업 완료" },
  { id: "CANCELED", label: "예약 취소" },
]

function ReservationCard({
  reservation,
}: {
  reservation: ReservationSummaryDto
}) {
  const statusDate =
    reservation.status === "PICKED_UP"
      ? reservation.pickedUpAt
      : reservation.status === "CANCELED"
        ? reservation.canceledAt
        : null

  return (
    <article className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted text-xs font-medium tracking-wide">
            예약번호 {reservation.reservationId}
          </p>
          <h2 className="text-foreground mt-1 text-lg font-bold">
            {reservation.storeName ?? "가게 정보"}
          </h2>
        </div>
        <ReservationStatusBadge status={reservation.status} />
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex items-start gap-3">
          <CalendarClock
            className="text-muted mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <dt className="text-muted">예약 일시</dt>
            <dd className="text-foreground mt-0.5 font-semibold tabular-nums">
              {formatDateTime(reservation.createdAt)}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Store
            className="text-muted mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <dt className="text-muted">예약 금액</dt>
            <dd className="text-foreground mt-0.5 font-bold tabular-nums">
              {formatWon(reservation.totalAmount)}
            </dd>
          </div>
        </div>
        {statusDate ? (
          <div>
            <dt className="text-muted">
              {reservation.status === "PICKED_UP" ? "픽업 일시" : "취소 일시"}
            </dt>
            <dd className="text-foreground mt-0.5 tabular-nums">
              {formatDateTime(statusDate)}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="border-hairline mt-5 flex justify-end border-t pt-4">
        <Link
          to={`/reservations/${reservation.reservationId}`}
          className="text-brand-link inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold"
          aria-label={`${reservation.storeName ?? "가게"} 예약 상세 보기`}
        >
          예약 상세
          <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

function ReservationsSkeleton() {
  return (
    <div
      className="mt-4 grid gap-4"
      aria-label="예약을 불러오는 중"
      aria-busy="true"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="border-hairline bg-canvas grid gap-4 rounded-2xl border p-5"
        >
          <span className="bg-surface h-6 w-1/2 animate-pulse rounded motion-reduce:animate-none" />
          <span className="bg-surface h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none" />
          <span className="bg-surface h-4 w-1/3 animate-pulse rounded motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  )
}

export function ReservationsPage() {
  const [filter, setFilter] = useState<ReservationFilter>("ALL")
  const reservationsQuery = useQuery(
    reservationsQueryOptions({
      status: filter === "ALL" ? undefined : filter,
      size: 100,
    }),
  )
  const reservations = reservationsQuery.data?.content ?? []
  const unauthorized = isUnauthorizedError(reservationsQuery.error)

  useDocumentTitle("내 예약")

  return (
    <CustomerPage className="max-w-3xl">
      <PageIntro
        eyebrow="픽업 일정을 한곳에서"
        title="내 예약"
        description="예약 상태와 품목, 가게 위치를 확인해 보세요."
      />

      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="예약 상태 필터"
      >
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors motion-reduce:transition-none ${
              filter === item.id
                ? "border-foreground bg-foreground text-canvas"
                : "border-hairline bg-canvas text-foreground hover:bg-surface"
            }`}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {reservationsQuery.isSuccess ? (
        <p className="text-muted mt-5 text-sm" aria-live="polite">
          {reservationsQuery.data.totalElements}개의 예약
        </p>
      ) : null}

      {reservationsQuery.isPending ? <ReservationsSkeleton /> : null}

      {reservationsQuery.isError ? (
        <EmptyState
          title={
            unauthorized
              ? "예약을 보려면 로그인이 필요해요"
              : "예약을 불러오지 못했어요"
          }
          description={
            unauthorized
              ? "다시 로그인한 뒤 예약 내역을 확인해 주세요."
              : "연결 상태를 확인한 뒤 다시 불러와 주세요."
          }
          action={
            unauthorized ? (
              <Button asChild>
                <Link to="/login">로그인하기</Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void reservationsQuery.refetch()}
              >
                <RefreshCw aria-hidden="true" />
                다시 불러오기
              </Button>
            )
          }
        />
      ) : null}

      {reservationsQuery.isSuccess && reservations.length > 0 ? (
        <div className="mt-4 grid gap-4">
          {reservations.map((reservation) => (
            <ReservationCard
              key={reservation.reservationId}
              reservation={reservation}
            />
          ))}
        </div>
      ) : null}

      {reservationsQuery.isSuccess && reservations.length === 0 ? (
        <EmptyState
          title="이 상태의 예약이 없어요"
          description="다른 상태를 선택하거나 오늘 예약할 수 있는 할인을 둘러보세요."
          action={
            <Button asChild variant="secondary">
              <Link to="/app">
                <CalendarCheck2 aria-hidden="true" />
                오늘의 할인 보기
              </Link>
            </Button>
          }
        />
      ) : null}
    </CustomerPage>
  )
}
