import {
  CalendarClock,
  CircleDollarSign,
  Package,
  Plus,
  Tags,
} from "lucide-react"
import { Link } from "react-router"

import {
  formatPrice,
  formatShortManagementDateTime,
} from "../../features/management/data"
import {
  useOwnerDeals,
  useOwnerReservations,
} from "../../features/management/management-api"
import {
  DealStatusBadge,
  EmptyState,
  ManagementPageHeader,
  ManagementPanel,
  ReservationStatusBadge,
  SectionHeading,
  StatCard,
} from "../../features/management/management-ui"
import { useManagementStore } from "../../features/management/store-context"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const managementDateLabel = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "long",
  timeZone: "Asia/Seoul",
}).format(new Date())

function statValue(isPending: boolean, isError: boolean, value: string) {
  if (isPending) return "—"
  return isError ? "확인 필요" : value
}

export function ManagementHomePage() {
  useDocumentTitle("오늘 운영 현황")
  const { store } = useManagementStore()
  const storeId = Number(store.id)
  const dealsQuery = useOwnerDeals(storeId)
  const reservationsQuery = useOwnerReservations(storeId)
  const sellingDeals = (dealsQuery.data ?? []).filter(
    ({ status }) => status === "SELLING",
  )
  const reservedReservations = (reservationsQuery.data ?? []).filter(
    ({ status }) => status === "RESERVED",
  )
  const totalItemCount = sellingDeals.reduce(
    (total, deal) => total + deal.itemCount,
    0,
  )
  const pendingAmount = reservedReservations.reduce(
    (total, reservation) => total + reservation.totalAmount,
    0,
  )

  return (
    <div className="space-y-6 py-6 lg:space-y-8 lg:py-8">
      <ManagementPageHeader
        eyebrow={`${managementDateLabel} · ${store.name}`}
        title="오늘 운영 현황"
        description="판매 중인 할인과 픽업을 기다리는 예약을 확인하세요."
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link to="/manage/deals/new">
              <Plus aria-hidden="true" />
              할인 등록
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
          value={statValue(
            reservationsQuery.isPending,
            reservationsQuery.isError,
            `${reservedReservations.length}건`,
          )}
          helper="수령을 기다리는 예약"
          icon={CalendarClock}
          tone="warning"
        />
        <StatCard
          label="판매 중 할인"
          value={statValue(
            dealsQuery.isPending,
            dealsQuery.isError,
            `${sellingDeals.length}개`,
          )}
          helper="지금 예약 가능한 할인"
          icon={Tags}
        />
        <StatCard
          label="공개 품목"
          value={statValue(
            dealsQuery.isPending,
            dealsQuery.isError,
            `${totalItemCount}개`,
          )}
          helper="판매 중인 할인 품목"
          icon={Package}
        />
        <StatCard
          label="대기 예약 금액"
          value={statValue(
            reservationsQuery.isPending,
            reservationsQuery.isError,
            formatPrice(pendingAmount),
          )}
          helper="픽업 대기 예약 합계"
          icon={CircleDollarSign}
        />
      </section>

      <ManagementPanel aria-labelledby="reserved-reservations-title">
        <SectionHeading
          id="reserved-reservations-title"
          title="픽업 대기 예약"
          description="최근 접수된 예약부터 보여 드려요."
          actionLabel="예약 관리"
          actionTo="/manage/reservations"
        />

        {reservationsQuery.isPending ? (
          <p
            className="text-muted flex min-h-40 items-center justify-center text-sm"
            role="status"
            aria-busy="true"
          >
            예약을 불러오는 중이에요.
          </p>
        ) : reservationsQuery.isError ? (
          <div className="flex min-h-40 flex-col items-center justify-center text-center">
            <p className="text-foreground text-sm font-semibold">
              예약을 불러오지 못했어요.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="compact"
              className="mt-3"
              onClick={() => void reservationsQuery.refetch()}
            >
              다시 시도
            </Button>
          </div>
        ) : reservedReservations.length === 0 ? (
          <EmptyState
            title="아직 픽업 대기 예약이 없어요"
            description="새 예약이 접수되면 여기에서 바로 확인할 수 있어요."
          />
        ) : (
          <div className="divide-hairline border-hairline overflow-hidden rounded-lg border">
            {reservedReservations.slice(0, 3).map((reservation) => (
              <Link
                key={reservation.reservationId}
                to={`/manage/reservations?reservation=${reservation.reservationId}`}
                className="hover:bg-surface grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-3 py-3 last:border-b-0 sm:px-4"
              >
                <span className="min-w-0">
                  <strong className="text-foreground block truncate text-sm">
                    예약 #{reservation.reservationId}
                  </strong>
                  <span className="text-muted mt-1 block truncate text-xs tabular-nums">
                    {formatShortManagementDateTime(reservation.createdAt)} 접수
                    · {formatPrice(reservation.totalAmount)}
                  </span>
                </span>
                <ReservationStatusBadge status={reservation.status} />
              </Link>
            ))}
          </div>
        )}
      </ManagementPanel>

      <ManagementPanel aria-labelledby="selling-deals-title">
        <SectionHeading
          id="selling-deals-title"
          title="판매 중 할인"
          description="고객이 지금 예약할 수 있는 할인이에요."
          actionLabel="할인 관리"
          actionTo="/manage/deals"
        />

        {dealsQuery.isPending ? (
          <p
            className="text-muted flex min-h-40 items-center justify-center text-sm"
            role="status"
            aria-busy="true"
          >
            할인을 불러오는 중이에요.
          </p>
        ) : dealsQuery.isError ? (
          <div className="flex min-h-40 flex-col items-center justify-center text-center">
            <p className="text-foreground text-sm font-semibold">
              할인을 불러오지 못했어요.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="compact"
              className="mt-3"
              onClick={() => void dealsQuery.refetch()}
            >
              다시 시도
            </Button>
          </div>
        ) : sellingDeals.length === 0 ? (
          <EmptyState
            title="오늘 공개한 할인이 없어요"
            description="남은 상품과 판매 수량을 확인한 뒤 첫 할인을 등록해 보세요."
            actionLabel="할인 등록"
            actionTo="/manage/deals/new"
          />
        ) : (
          <div className="grid gap-3">
            {sellingDeals.slice(0, 3).map((deal) => (
              <article
                key={deal.dealId}
                className="border-hairline grid gap-3 rounded-lg border p-4 lg:grid-cols-[auto_minmax(200px,1fr)_120px_180px_100px] lg:items-center"
              >
                <DealStatusBadge status={deal.status} />
                <div className="min-w-0">
                  <h3 className="text-foreground truncate text-sm font-bold">
                    {deal.description || `할인 #${deal.dealId}`}
                  </h3>
                  <p className="text-muted mt-1 text-xs">
                    {formatPrice(deal.lowestSalePrice)}부터 · 품목{" "}
                    {deal.itemCount}개
                  </p>
                </div>
                <p className="text-foreground text-sm font-semibold tabular-nums">
                  품목 {deal.itemCount}개
                </p>
                <p className="text-muted text-sm tabular-nums">
                  {formatShortManagementDateTime(deal.salesEndsAt)} 마감
                </p>
                <Link
                  to={`/manage/deals/${deal.dealId}`}
                  className="text-brand-link inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold lg:justify-start"
                >
                  상세 보기
                </Link>
              </article>
            ))}
          </div>
        )}
      </ManagementPanel>
    </div>
  )
}
