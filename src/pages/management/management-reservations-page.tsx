import { CheckCircle2, ChevronRight, Clock3, PackageCheck } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router"

import {
  formatPrice,
  formatShortManagementDateTime,
} from "../../features/management/data"
import {
  getManagementErrorMessage,
  useCompleteOwnerReservationPickup,
  useOwnerReservation,
  useOwnerReservations,
  type OwnerReservationStatus,
  type OwnerReservationSummary,
} from "../../features/management/management-api"
import {
  ManagementPageHeader,
  ManagementPanel,
  ReservationStatusBadge,
} from "../../features/management/management-ui"
import { useManagementStore } from "../../features/management/store-context"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { cn } from "../../shared/lib/utils"
import { Button } from "../../shared/ui/button"

type ReservationFilter = OwnerReservationStatus | "ALL"

const reservationFilters: Array<{
  key: ReservationFilter
  label: string
}> = [
  { key: "RESERVED", label: "픽업 대기" },
  { key: "PICKED_UP", label: "픽업 완료" },
  { key: "CANCELED", label: "취소" },
  { key: "ALL", label: "전체" },
]

function matchesFilter(
  status: OwnerReservationStatus,
  filter: ReservationFilter,
) {
  return filter === "ALL" || status === filter
}

export function ManagementReservationsPage() {
  useDocumentTitle("예약 관리")
  const { store } = useManagementStore()
  const storeId = Number(store.id)
  const reservationsQuery = useOwnerReservations(storeId)
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedReservation = /^\d+$/.test(
    searchParams.get("reservation") ?? "",
  )
    ? Number(searchParams.get("reservation"))
    : null
  const [filter, setFilter] = useState<ReservationFilter>(
    requestedReservation === null ? "RESERVED" : "ALL",
  )
  const [selectedId, setSelectedId] = useState<number | null>(
    requestedReservation,
  )
  const [feedback, setFeedback] = useState("")
  const mobileDetailRef = useRef<HTMLElement>(null)
  const pickupMutation = useCompleteOwnerReservationPickup()

  const visibleReservations = useMemo(
    () =>
      (reservationsQuery.data ?? []).filter((reservation) =>
        matchesFilter(reservation.status, filter),
      ),
    [filter, reservationsQuery.data],
  )
  const selectedSummary =
    (reservationsQuery.data ?? []).find(
      ({ reservationId }) => reservationId === selectedId,
    ) ?? visibleReservations[0]
  const detailQuery = useOwnerReservation(
    selectedSummary?.reservationId ?? null,
  )
  const selectedStatus = detailQuery.data?.status ?? selectedSummary?.status

  const selectReservation = (reservation: OwnerReservationSummary) => {
    setSelectedId(reservation.reservationId)
    setSearchParams({ reservation: String(reservation.reservationId) })
    setFeedback("")
    pickupMutation.reset()

    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      window.setTimeout(() => {
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches
        mobileDetailRef.current?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        })
      }, 0)
    }
  }

  const changeFilter = (nextFilter: ReservationFilter) => {
    setFilter(nextFilter)
    setFeedback("")
    pickupMutation.reset()
    const firstMatch = (reservationsQuery.data ?? []).find((reservation) =>
      matchesFilter(reservation.status, nextFilter),
    )
    setSelectedId(firstMatch?.reservationId ?? null)
    if (firstMatch) {
      setSearchParams({ reservation: String(firstMatch.reservationId) })
    } else {
      setSearchParams({})
    }
  }

  const completePickup = async () => {
    if (!selectedSummary || selectedStatus !== "RESERVED") return

    try {
      await pickupMutation.mutateAsync(selectedSummary.reservationId)
      setFilter("PICKED_UP")
      setFeedback(`예약 #${selectedSummary.reservationId}의 픽업을 완료했어요.`)
    } catch {
      // Mutation state renders the response beside the selected reservation.
    }
  }

  return (
    <div className="space-y-6 py-6 lg:space-y-8 lg:py-8">
      <ManagementPageHeader
        eyebrow={store.name}
        title="예약 관리"
        description="예약 내역을 확인하고 상품을 전달한 뒤 픽업을 완료하세요."
      />

      <ManagementPanel className="p-0 sm:p-0">
        <div
          role="group"
          aria-label="예약 상태"
          className="border-hairline flex gap-1 overflow-x-auto border-b px-3 pt-2 sm:px-5"
        >
          {reservationFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => changeFilter(item.key)}
              className={cn(
                "text-muted relative min-h-12 shrink-0 rounded-t-lg px-4 text-sm font-semibold",
                filter === item.key &&
                  "text-foreground after:bg-primary after:absolute after:right-3 after:bottom-0 after:left-3 after:h-0.5",
              )}
            >
              {item.label}
              {reservationsQuery.data ? (
                <span className="ml-1.5 tabular-nums">
                  {
                    reservationsQuery.data.filter((reservation) =>
                      matchesFilter(reservation.status, item.key),
                    ).length
                  }
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
          <section
            aria-label="예약 목록"
            className="border-hairline divide-hairline divide-y lg:border-r"
          >
            {reservationsQuery.isPending ? (
              <p
                className="text-muted flex min-h-72 items-center justify-center px-5 text-sm"
                role="status"
                aria-busy="true"
              >
                예약 목록을 불러오는 중이에요.
              </p>
            ) : reservationsQuery.isError ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
                <h2 className="text-foreground text-lg font-bold">
                  예약 목록을 불러오지 못했어요
                </h2>
                <p className="text-muted mt-2 text-sm">
                  네트워크 상태를 확인한 뒤 다시 시도해 주세요.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-5"
                  onClick={() => void reservationsQuery.refetch()}
                >
                  다시 시도
                </Button>
              </div>
            ) : visibleReservations.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
                <Clock3 className="text-muted size-8" aria-hidden="true" />
                <h2 className="text-foreground mt-4 text-lg font-bold">
                  이 상태의 예약이 없어요
                </h2>
                <p className="text-muted mt-2 text-sm">
                  다른 상태를 선택하면 이전 예약도 확인할 수 있어요.
                </p>
              </div>
            ) : (
              visibleReservations.map((reservation) => {
                const isSelected =
                  selectedSummary?.reservationId === reservation.reservationId

                return (
                  <button
                    key={reservation.reservationId}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => selectReservation(reservation)}
                    className={cn(
                      "hover:bg-surface grid min-h-24 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left sm:px-5",
                      isSelected && "bg-brand-tint",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="text-foreground block truncate text-sm font-semibold">
                        예약 #{reservation.reservationId}
                      </span>
                      <span className="text-muted mt-1 block truncate text-xs tabular-nums">
                        {formatShortManagementDateTime(reservation.createdAt)}{" "}
                        접수 · {formatPrice(reservation.totalAmount)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ReservationStatusBadge status={reservation.status} />
                      <ChevronRight
                        className="text-muted hidden size-4 sm:block"
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                )
              })
            )}
          </section>

          <aside
            ref={mobileDetailRef}
            aria-labelledby="reservation-detail-title"
            className="bg-surface/50 scroll-mt-4 p-4 sm:p-5 lg:min-h-[560px]"
          >
            {!selectedSummary ? (
              <div className="flex min-h-64 items-center justify-center text-center">
                <p className="text-muted text-sm">
                  확인할 예약을 선택해 주세요.
                </p>
              </div>
            ) : detailQuery.isPending ? (
              <div
                className="text-muted flex min-h-64 items-center justify-center text-sm"
                role="status"
                aria-busy="true"
              >
                예약 상세를 불러오는 중이에요.
              </div>
            ) : detailQuery.isError ? (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <p className="text-foreground text-sm font-semibold">
                  예약 상세를 불러오지 못했어요.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  className="mt-3"
                  onClick={() => void detailQuery.refetch()}
                >
                  다시 시도
                </Button>
              </div>
            ) : (
              <div className="border-hairline bg-canvas rounded-xl border p-4 sm:p-5 lg:sticky lg:top-8">
                <p className="text-brand-link text-xs font-semibold">
                  선택한 예약
                </p>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                  <h2
                    id="reservation-detail-title"
                    className="text-foreground text-lg font-bold"
                  >
                    예약 #{detailQuery.data.reservationId}
                  </h2>
                  <ReservationStatusBadge status={detailQuery.data.status} />
                </div>

                <dl className="divide-hairline mt-5 divide-y text-sm">
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3">
                    <dt className="text-muted">예약 시각</dt>
                    <dd className="text-foreground font-semibold tabular-nums">
                      {formatShortManagementDateTime(
                        detailQuery.data.createdAt,
                      )}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3">
                    <dt className="text-muted">할인 번호</dt>
                    <dd className="text-foreground font-semibold tabular-nums">
                      #{detailQuery.data.dealId}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3">
                    <dt className="text-muted">품목</dt>
                    <dd>
                      <ul className="text-foreground grid gap-2 font-medium">
                        {detailQuery.data.items.map((item) => (
                          <li
                            key={item.dealItemId}
                            className="flex justify-between gap-3"
                          >
                            <span>
                              {item.name} {item.quantity}개
                            </span>
                            <span className="shrink-0 tabular-nums">
                              {formatPrice(item.subtotal)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3">
                    <dt className="text-muted">예약 금액</dt>
                    <dd className="text-foreground font-bold tabular-nums">
                      {formatPrice(detailQuery.data.totalAmount)}
                    </dd>
                  </div>
                  {detailQuery.data.pickedUpAt ? (
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3">
                      <dt className="text-muted">픽업 완료</dt>
                      <dd className="text-foreground tabular-nums">
                        {formatShortManagementDateTime(
                          detailQuery.data.pickedUpAt,
                        )}
                      </dd>
                    </div>
                  ) : null}
                  {detailQuery.data.canceledAt ? (
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3">
                      <dt className="text-muted">취소 시각</dt>
                      <dd className="text-foreground tabular-nums">
                        {formatShortManagementDateTime(
                          detailQuery.data.canceledAt,
                        )}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {feedback ? (
                  <p
                    role="status"
                    className="bg-brand-tint text-success mt-4 rounded-lg px-3 py-3 text-sm font-semibold"
                  >
                    <CheckCircle2
                      className="mr-1.5 inline size-4"
                      aria-hidden="true"
                    />
                    {feedback}
                  </p>
                ) : null}

                {pickupMutation.error ? (
                  <p
                    role="alert"
                    className="bg-critical/5 text-critical mt-4 rounded-lg px-3 py-3 text-sm"
                  >
                    {getManagementErrorMessage(
                      pickupMutation.error,
                      "픽업을 완료하지 못했어요. 예약 상태를 다시 확인해 주세요.",
                    )}
                  </p>
                ) : null}

                {detailQuery.data.status === "RESERVED" ? (
                  <Button
                    type="button"
                    className="mt-5 w-full"
                    disabled={pickupMutation.isPending}
                    onClick={() => void completePickup()}
                  >
                    <PackageCheck aria-hidden="true" />
                    {pickupMutation.isPending ? "처리하는 중" : "픽업 완료"}
                  </Button>
                ) : (
                  <p className="text-muted mt-5 text-center text-sm">
                    처리된 예약이에요.
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      </ManagementPanel>
    </div>
  )
}
