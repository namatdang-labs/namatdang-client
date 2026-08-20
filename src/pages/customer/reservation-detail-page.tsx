import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CalendarClock,
  ChevronLeft,
  Clock3,
  MapPin,
  ReceiptText,
  RefreshCw,
  Store as StoreIcon,
} from "lucide-react"
import { Link, useParams } from "react-router"

import {
  cancelReservation,
  customerQueryKeys,
  dealQueryOptions,
  parseNumericReservationId,
  reservationQueryOptions,
  storeQueryOptions,
} from "../../features/customer/customer-api"
import {
  CustomerPage,
  EmptyState,
  formatDateTime,
  formatShortDate,
  formatWon,
  getReservationTotalQuantity,
  ReservationStatusBadge,
} from "../../features/customer/customer-components"
import { ApiError } from "../../shared/api/client"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

function createIdempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }
  return `reservation-cancel-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function ReservationDetailSkeleton() {
  return (
    <div
      className="mt-7 grid gap-5"
      aria-label="예약 상세를 불러오는 중"
      aria-busy="true"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="border-hairline bg-canvas h-44 animate-pulse rounded-2xl border motion-reduce:animate-none"
        />
      ))}
    </div>
  )
}

export function ReservationDetailPage() {
  const { reservationId } = useParams()
  const numericReservationId = parseNumericReservationId(reservationId)
  const hasValidReservationId = numericReservationId !== null
  const queryClient = useQueryClient()
  const [isCancelConfirming, setIsCancelConfirming] = useState(false)
  const [cancelError, setCancelError] = useState("")
  const cancelKeyRef = useRef<string | null>(null)
  const reservationQuery = useQuery({
    ...reservationQueryOptions(numericReservationId ?? 0),
    enabled: hasValidReservationId,
  })
  const reservation = reservationQuery.data
  const storeQuery = useQuery({
    ...storeQueryOptions(reservation?.storeId ?? 0),
    enabled: reservationQuery.isSuccess,
  })
  const dealQuery = useQuery({
    ...dealQueryOptions(reservation?.dealId ?? 0),
    enabled: reservationQuery.isSuccess,
  })

  useDocumentTitle("예약 상세")

  const cancelMutation = useMutation({
    mutationFn: ({ id, key }: { id: number; key: string }) =>
      cancelReservation(id, key),
    onMutate: () => setCancelError(""),
    onSuccess: async (canceledReservation) => {
      queryClient.setQueryData(
        customerQueryKeys.reservation(canceledReservation.reservationId),
        canceledReservation,
      )
      setIsCancelConfirming(false)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["customer", "reservations"],
        }),
        queryClient.invalidateQueries({
          queryKey: customerQueryKeys.deal(canceledReservation.dealId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "deals", "selling"],
        }),
      ])
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        setCancelError("로그인이 만료됐어요. 다시 로그인해 주세요.")
        return
      }
      setCancelError(
        "예약을 취소하지 못했어요. 예약 상태를 확인한 뒤 다시 시도해 주세요.",
      )
    },
  })

  if (!hasValidReservationId) {
    return (
      <CustomerPage className="max-w-3xl">
        <EmptyState
          title="예약을 찾을 수 없어요"
          description="내 예약 목록에서 확인할 예약을 다시 선택해 주세요."
          action={
            <Button asChild>
              <Link to="/reservations">내 예약으로 가기</Link>
            </Button>
          }
        />
      </CustomerPage>
    )
  }

  const notFound =
    reservationQuery.error instanceof ApiError &&
    reservationQuery.error.status === 404

  return (
    <CustomerPage className="max-w-3xl">
      <Button asChild variant="ghost" size="compact" className="-ml-3">
        <Link to="/reservations">
          <ChevronLeft aria-hidden="true" />내 예약
        </Link>
      </Button>

      {reservationQuery.isPending ? <ReservationDetailSkeleton /> : null}

      {reservationQuery.isError ? (
        <EmptyState
          title={
            notFound ? "예약을 찾을 수 없어요" : "예약 상세를 불러오지 못했어요"
          }
          description={
            notFound
              ? "내 예약 목록에서 확인할 예약을 다시 선택해 주세요."
              : "연결 상태를 확인한 뒤 다시 불러와 주세요."
          }
          action={
            notFound ? (
              <Button asChild>
                <Link to="/reservations">내 예약으로 가기</Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void reservationQuery.refetch()}
              >
                <RefreshCw aria-hidden="true" />
                다시 불러오기
              </Button>
            )
          }
        />
      ) : null}

      {reservation ? (
        <>
          <header className="mt-3">
            <p className="text-muted text-sm font-medium tracking-wide">
              예약번호 {reservation.reservationId}
            </p>
            <h1
              data-route-heading
              tabIndex={-1}
              className="text-foreground mt-2 text-2xl font-bold sm:text-3xl"
            >
              예약 상세
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ReservationStatusBadge status={reservation.status} />
              <p className="text-muted text-sm leading-6">
                {reservation.status === "RESERVED"
                  ? "가게에서 픽업할 상품이 예약됐어요."
                  : reservation.status === "PICKED_UP"
                    ? "픽업이 완료된 예약이에요."
                    : "취소된 예약이에요."}
              </p>
            </div>
          </header>

          <div className="mt-7 grid gap-5">
            <section className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-6">
              <h2 className="text-foreground text-lg font-bold">가게 정보</h2>
              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <StoreIcon
                    className="text-muted mt-0.5 size-5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-muted text-sm">가게</dt>
                    <dd className="text-foreground mt-1 font-semibold">
                      <Link
                        to={`/stores/${reservation.storeId}`}
                        className="rounded underline underline-offset-4"
                      >
                        {reservation.storeName ?? "가게 정보"}
                      </Link>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin
                    className="text-muted mt-0.5 size-5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-muted text-sm">주소</dt>
                    <dd className="text-foreground mt-1 font-semibold">
                      {storeQuery.data?.address ??
                        "가게 상세에서 확인해 주세요"}
                    </dd>
                  </div>
                </div>
              </dl>
              {dealQuery.data ? (
                <div className="bg-surface mt-5 flex items-start gap-3 rounded-xl p-4">
                  <Clock3
                    className="text-muted mt-0.5 size-5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-muted text-sm">할인 예약 마감</p>
                    <p className="text-foreground mt-1 text-sm font-semibold">
                      {formatDateTime(dealQuery.data.salesEndsAt)}
                    </p>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-foreground text-lg font-bold">예약 품목</h2>
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
                      <p className="text-foreground font-semibold">
                        {item.name}
                      </p>
                      <p className="text-muted mt-1 text-sm">
                        {formatWon(item.salePrice)} × {item.quantity}개
                      </p>
                    </div>
                    <p className="text-foreground shrink-0 font-bold tabular-nums">
                      {formatWon(item.subtotal)}
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
              <dl className="mt-5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-foreground font-semibold">최종 금액</dt>
                  <dd className="text-foreground text-xl font-bold tabular-nums">
                    {formatWon(reservation.totalAmount)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-6">
              <h2 className="text-foreground flex items-center gap-2 text-lg font-bold">
                <CalendarClock className="size-5" aria-hidden="true" />
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
                    {reservation.reservationId}
                  </dd>
                </div>
                {reservation.pickedUpAt ? (
                  <div>
                    <dt className="text-muted">픽업 완료</dt>
                    <dd className="text-foreground mt-1 font-medium">
                      {formatDateTime(reservation.pickedUpAt)}
                    </dd>
                  </div>
                ) : null}
                {reservation.canceledAt ? (
                  <div>
                    <dt className="text-muted">예약 취소</dt>
                    <dd className="text-foreground mt-1 font-medium">
                      {formatDateTime(reservation.canceledAt)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {reservation.status === "RESERVED" ? (
              <section className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-6">
                <h2 className="text-foreground text-lg font-bold">예약 취소</h2>
                <p className="text-muted mt-2 text-sm leading-6">
                  취소하면 예약한 수량이 다시 판매 가능 수량으로 돌아가요.
                </p>

                {isCancelConfirming ? (
                  <div className="bg-surface mt-4 rounded-xl p-4">
                    <p className="text-foreground text-sm font-semibold">
                      이 예약을 취소할까요?
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={cancelMutation.isPending}
                        onClick={() => {
                          setCancelError("")
                          setIsCancelConfirming(false)
                        }}
                      >
                        예약 유지
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={cancelMutation.isPending}
                        onClick={() => {
                          cancelKeyRef.current ??= createIdempotencyKey()
                          cancelMutation.mutate({
                            id: reservation.reservationId,
                            key: cancelKeyRef.current,
                          })
                        }}
                      >
                        {cancelMutation.isPending ? "취소하는 중" : "예약 취소"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-4"
                    onClick={() => setIsCancelConfirming(true)}
                  >
                    예약 취소하기
                  </Button>
                )}

                {cancelError ? (
                  <p className="text-critical mt-4 text-sm" role="alert">
                    {cancelError}
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        </>
      ) : null}
    </CustomerPage>
  )
}
