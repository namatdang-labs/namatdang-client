import { useMemo, useState } from "react"
import { CalendarCheck2 } from "lucide-react"
import { Link } from "react-router"

import { ReservationCard } from "../../features/customer/reservation-components"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import {
  getReservationsByUserId,
  getStoreById,
  mockUser,
} from "../../shared/mock"
import type { ReservationStatus } from "../../shared/types"
import { Button } from "../../shared/ui/button"
import { EmptyState } from "../../shared/ui/empty-state"

type ReservationFilter = "all" | "active" | "complete" | "canceled"

const filters: Array<{ id: ReservationFilter; label: string }> = [
  { id: "all", label: "전체" },
  { id: "active", label: "진행 중" },
  { id: "complete", label: "완료" },
  { id: "canceled", label: "취소·미방문" },
]

const statusesByFilter: Record<
  Exclude<ReservationFilter, "all">,
  ReservationStatus[]
> = {
  active: ["pending", "confirmed"],
  complete: ["picked-up"],
  canceled: ["canceled", "no-show"],
}

export function ReservationsPage() {
  const [filter, setFilter] = useState<ReservationFilter>("all")
  const reservations = getReservationsByUserId(mockUser.id)
  const visibleReservations = useMemo(() => {
    if (filter === "all") {
      return reservations
    }

    return reservations.filter((reservation) =>
      statusesByFilter[filter].includes(reservation.status),
    )
  }, [filter, reservations])

  useDocumentTitle("내 예약")

  return (
    <div className="mx-auto w-full max-w-3xl py-6 sm:py-10">
      <header>
        <p className="text-brand-link text-sm font-semibold">
          픽업 일정을 한곳에서
        </p>
        <h1
          data-route-heading
          tabIndex={-1}
          className="text-foreground mt-2 text-2xl font-bold sm:text-3xl"
        >
          내 예약
        </h1>
        <p className="text-muted mt-2 text-sm leading-6 sm:text-base">
          예약 상태와 픽업 시간, 가게 위치를 확인해 보세요.
        </p>
      </header>

      <div
        className="mt-7 flex gap-2 overflow-x-auto pb-1"
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

      <p className="text-muted mt-5 text-sm" aria-live="polite">
        {visibleReservations.length}개의 예약
      </p>

      {visibleReservations.length > 0 ? (
        <div className="mt-4 grid gap-4">
          {visibleReservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              store={getStoreById(reservation.storeId)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-4"
          icon={<CalendarCheck2 className="size-6" />}
          title="이 상태의 예약이 아직 없어요"
          description="다른 상태를 선택하거나 오늘 예약할 수 있는 할인을 둘러보세요."
          action={
            <Button asChild variant="secondary">
              <Link to="/">오늘의 할인 보기</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
