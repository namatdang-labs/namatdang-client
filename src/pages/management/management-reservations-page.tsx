import { CheckCircle2, ChevronRight, Clock3, PackageCheck } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import {
  formatPrice,
  managementReservations,
  type ManagementReservation,
  type ManagementReservationStatus,
} from "../../features/management/data"
import {
  ManagementPageHeader,
  ManagementPanel,
  ReservationStatusBadge,
} from "../../features/management/management-ui"
import { useManagementStore } from "../../features/management/store-context"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { cn } from "../../shared/lib/utils"
import { Button } from "../../shared/ui/button"

type ReservationFilter = "upcoming" | "completed" | "all"

const reservationFilters: Array<{
  key: ReservationFilter
  label: string
}> = [
  { key: "upcoming", label: "픽업 예정" },
  { key: "completed", label: "완료·취소" },
  { key: "all", label: "전체" },
]

function matchesFilter(
  status: ManagementReservationStatus,
  filter: ReservationFilter,
) {
  if (filter === "upcoming") {
    return status === "pending" || status === "confirmed"
  }
  if (filter === "completed") {
    return (
      status === "picked-up" || status === "canceled" || status === "no-show"
    )
  }
  return true
}

export function ManagementReservationsPage() {
  useDocumentTitle("예약 관리")
  const { store } = useManagementStore()
  const [searchParams] = useSearchParams()
  const requestedReservation = searchParams.get("reservation")
  const storeReservations = useMemo(
    () =>
      managementReservations.filter(
        (reservation) => reservation.storeId === store.id,
      ),
    [store.id],
  )
  const firstReservationId =
    requestedReservation &&
    storeReservations.some(
      (reservation) => reservation.id === requestedReservation,
    )
      ? requestedReservation
      : storeReservations[0]?.id
  const [filter, setFilter] = useState<ReservationFilter>("upcoming")
  const [selectedId, setSelectedId] = useState<string | undefined>(
    firstReservationId,
  )
  const [statusById, setStatusById] = useState<
    Record<string, ManagementReservationStatus>
  >(() =>
    Object.fromEntries(
      managementReservations.map((reservation) => [
        reservation.id,
        reservation.status,
      ]),
    ),
  )
  const [feedback, setFeedback] = useState("")
  const mobileDetailRef = useRef<HTMLElement>(null)

  const visibleReservations = useMemo(
    () =>
      storeReservations.filter((reservation) =>
        matchesFilter(statusById[reservation.id] ?? reservation.status, filter),
      ),
    [filter, statusById, storeReservations],
  )
  const selectedReservation =
    storeReservations.find((reservation) => reservation.id === selectedId) ??
    visibleReservations[0]
  const selectedStatus = selectedReservation
    ? (statusById[selectedReservation.id] ?? selectedReservation.status)
    : undefined
  const visibleFeedback =
    selectedReservation && feedback.includes(selectedReservation.id)
      ? feedback
      : ""

  const selectReservation = (reservation: ManagementReservation) => {
    setSelectedId(reservation.id)
    setFeedback("")

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
    const firstMatch = storeReservations.find((reservation) =>
      matchesFilter(
        statusById[reservation.id] ?? reservation.status,
        nextFilter,
      ),
    )
    setSelectedId(firstMatch?.id)
  }

  const completePickup = () => {
    if (!selectedReservation) return
    setStatusById((current) => ({
      ...current,
      [selectedReservation.id]: "picked-up",
    }))
    setFilter("completed")
    setFeedback(`예약 ${selectedReservation.id}의 픽업을 완료했어요.`)
  }

  return (
    <div className="space-y-6 py-6 lg:space-y-8 lg:py-8">
      <ManagementPageHeader
        eyebrow={store.name}
        title="예약 관리"
        description="가까운 픽업부터 확인하고 준비 상태를 관리하세요."
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
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
          <section
            aria-label="예약 목록"
            className="border-hairline divide-hairline divide-y lg:border-r"
          >
            {visibleReservations.length === 0 ? (
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
                const status = statusById[reservation.id] ?? reservation.status
                const isSelected = selectedReservation?.id === reservation.id

                return (
                  <button
                    key={reservation.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => selectReservation(reservation)}
                    className={cn(
                      "hover:bg-surface grid min-h-24 w-full grid-cols-[68px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left sm:grid-cols-[84px_minmax(0,1fr)_auto] sm:px-5",
                      isSelected && "bg-brand-tint",
                    )}
                  >
                    <span className="text-foreground text-sm font-bold tabular-nums">
                      {reservation.pickupTime}
                    </span>
                    <span className="min-w-0">
                      <span className="text-foreground block truncate text-sm font-semibold">
                        예약 {reservation.id}
                      </span>
                      <span className="text-muted mt-1 block truncate text-xs">
                        {reservation.customerName} · {reservation.totalQuantity}
                        개
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ReservationStatusBadge status={status} />
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
            {selectedReservation && selectedStatus ? (
              <div className="border-hairline bg-canvas rounded-xl border p-4 sm:p-5 lg:sticky lg:top-8">
                <p className="text-brand-link text-xs font-semibold">
                  선택한 예약
                </p>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                  <h2
                    id="reservation-detail-title"
                    className="text-foreground text-lg font-bold"
                  >
                    예약 {selectedReservation.id}
                  </h2>
                  <ReservationStatusBadge status={selectedStatus} />
                </div>

                <dl className="divide-hairline mt-5 divide-y text-sm">
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3">
                    <dt className="text-muted">픽업 시간</dt>
                    <dd className="text-foreground font-semibold tabular-nums">
                      오늘 {selectedReservation.pickupTime}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3">
                    <dt className="text-muted">고객</dt>
                    <dd className="text-foreground font-semibold">
                      {selectedReservation.customerName}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3">
                    <dt className="text-muted">품목</dt>
                    <dd>
                      <ul className="text-foreground grid gap-1 font-medium">
                        {selectedReservation.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3">
                    <dt className="text-muted">예약 금액</dt>
                    <dd className="text-foreground font-bold tabular-nums">
                      {formatPrice(selectedReservation.totalPrice)}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3">
                    <dt className="text-muted">예약 시각</dt>
                    <dd className="text-foreground">
                      {selectedReservation.requestedAt}
                    </dd>
                  </div>
                </dl>

                {selectedReservation.note ? (
                  <p className="bg-surface text-muted mt-4 rounded-lg px-3 py-3 text-sm leading-6">
                    {selectedReservation.note}
                  </p>
                ) : null}

                {visibleFeedback ? (
                  <p
                    role="status"
                    className="bg-brand-tint text-success mt-4 rounded-lg px-3 py-3 text-sm font-semibold"
                  >
                    <CheckCircle2
                      className="mr-1.5 inline size-4"
                      aria-hidden="true"
                    />
                    {visibleFeedback}
                  </p>
                ) : null}

                {selectedStatus === "pending" ||
                selectedStatus === "confirmed" ? (
                  <Button
                    type="button"
                    className="mt-5 w-full"
                    onClick={completePickup}
                  >
                    <PackageCheck aria-hidden="true" />
                    픽업 완료
                  </Button>
                ) : (
                  <p className="text-muted mt-5 text-center text-sm">
                    처리된 예약이에요.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center text-center">
                <p className="text-muted text-sm">
                  확인할 예약을 선택해 주세요.
                </p>
              </div>
            )}
          </aside>
        </div>
      </ManagementPanel>
    </div>
  )
}
