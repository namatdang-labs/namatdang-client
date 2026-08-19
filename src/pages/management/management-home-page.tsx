import { CalendarClock, Package, Plus, Tags, TimerReset } from "lucide-react"
import { Link } from "react-router"
import {
  formatPrice,
  managementDeals,
  managementReservations,
} from "../../features/management/data"
import {
  DealStatusBadge,
  ManagementPageHeader,
  ManagementPanel,
  ReservationStatusBadge,
  SectionHeading,
  StatCard,
} from "../../features/management/management-ui"
import { useManagementStore } from "../../features/management/store-context"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

export function ManagementHomePage() {
  useDocumentTitle("오늘 운영 현황")
  const { store } = useManagementStore()

  const storeReservations = managementReservations.filter(
    (reservation) => reservation.storeId === store.id,
  )
  const storeDeals = managementDeals.filter((deal) => deal.storeId === store.id)
  const upcomingReservations = storeReservations
    .filter(
      (reservation) =>
        reservation.status === "pending" || reservation.status === "confirmed",
    )
    .slice(0, 3)
  const activeDeals = storeDeals.filter(
    (deal) => deal.status === "selling" || deal.status === "low-stock",
  )
  const remainingStock = activeDeals.reduce(
    (total, deal) => total + deal.stock,
    0,
  )
  const nextReservation = upcomingReservations[0]

  return (
    <div className="space-y-6 py-6 lg:space-y-8 lg:py-8">
      <ManagementPageHeader
        eyebrow={`8월 18일 화요일 · ${store.name}`}
        title="오늘 운영 현황"
        description="픽업할 예약과 남은 상품을 확인하고 다음 운영을 준비하세요."
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link to="/manage/deals/new">
              <Plus aria-hidden="true" />
              할인 등록하기
            </Link>
          </Button>
        }
      />

      <section
        aria-label="오늘의 운영 요약"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        <StatCard
          label="픽업 대기"
          value={`${upcomingReservations.length}건`}
          helper={
            nextReservation
              ? `다음 픽업 ${nextReservation.pickupTime}`
              : "예정된 픽업 없음"
          }
          icon={CalendarClock}
          tone="warning"
        />
        <StatCard
          label="오늘 할인"
          value={`${activeDeals.length}개`}
          helper="판매 중인 할인"
          icon={Tags}
        />
        <StatCard
          label="남은 재고"
          value={`${remainingStock}개`}
          helper={
            activeDeals.some((deal) => deal.status === "low-stock")
              ? "재고가 적은 상품이 있어요"
              : "판매 가능한 전체 수량"
          }
          icon={Package}
          tone="warning"
        />
        <StatCard
          label="다음 픽업"
          value={nextReservation?.pickupTime ?? "없음"}
          helper={nextReservation?.customerName ?? "예약을 기다리고 있어요"}
          icon={TimerReset}
        />
      </section>

      <ManagementPanel aria-labelledby="upcoming-reservations-title">
        <SectionHeading
          id="upcoming-reservations-title"
          title="다음 픽업 예약"
          description="픽업 시간이 가까운 순서예요."
          actionLabel="예약 관리"
          actionTo="/manage/reservations"
        />
        <div className="divide-hairline border-hairline overflow-hidden rounded-lg border">
          {upcomingReservations.map((reservation) => (
            <Link
              key={reservation.id}
              to={`/manage/reservations?reservation=${reservation.id}`}
              className="hover:bg-surface grid min-h-20 grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 border-b px-3 py-3 last:border-b-0 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:px-4"
            >
              <strong className="text-foreground text-sm tabular-nums">
                {reservation.pickupTime}
              </strong>
              <span className="min-w-0">
                <span className="text-foreground block truncate text-sm font-semibold">
                  예약 {reservation.id}
                </span>
                <span className="text-muted mt-1 block truncate text-xs">
                  {reservation.items.join(" · ")}
                </span>
              </span>
              <ReservationStatusBadge status={reservation.status} />
            </Link>
          ))}
        </div>
      </ManagementPanel>

      <ManagementPanel aria-labelledby="today-deals-title">
        <SectionHeading
          id="today-deals-title"
          title="오늘 할인"
          description="공개 중인 할인과 남은 재고예요."
          actionLabel="할인 관리"
          actionTo="/manage/deals"
        />
        <div className="grid gap-3">
          {activeDeals.map((deal) => (
            <article
              key={deal.id}
              className="border-hairline grid gap-3 rounded-lg border p-4 lg:grid-cols-[auto_minmax(200px,1fr)_120px_180px_100px] lg:items-center"
            >
              <DealStatusBadge status={deal.status} />
              <div className="min-w-0">
                <h3 className="text-foreground truncate text-sm font-bold">
                  {deal.name}
                </h3>
                <p className="text-muted mt-1 text-xs">
                  {formatPrice(deal.salePrice)} · 예약 {deal.reserved}개
                </p>
              </div>
              <p className="text-foreground text-sm font-semibold tabular-nums">
                {deal.stock}개 남음
              </p>
              <p className="text-muted text-sm">{deal.pickupWindow}</p>
              <Link
                to={`/manage/deals/${deal.id}/edit`}
                className="text-brand-link inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold lg:justify-start"
              >
                할인 보기
              </Link>
            </article>
          ))}
        </div>
      </ManagementPanel>
    </div>
  )
}
