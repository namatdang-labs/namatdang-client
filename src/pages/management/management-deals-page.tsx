import { Eye, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router"

import {
  formatPrice,
  formatShortManagementDateTime,
} from "../../features/management/data"
import {
  useOwnerDeals,
  type OwnerDealStatus,
} from "../../features/management/management-api"
import {
  DealStatusBadge,
  EmptyState,
  ManagementPageHeader,
  ManagementPanel,
} from "../../features/management/management-ui"
import { useManagementStore } from "../../features/management/store-context"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { cn } from "../../shared/lib/utils"
import { Button } from "../../shared/ui/button"

const filters: Array<{
  key: OwnerDealStatus
  label: string
  emptyTitle: string
  emptyDescription: string
}> = [
  {
    key: "SELLING",
    label: "판매 중",
    emptyTitle: "판매 중인 할인이 없어요",
    emptyDescription: "오늘 남은 상품이 있다면 새 할인을 공개해 보세요.",
  },
  {
    key: "ENDED",
    label: "품절",
    emptyTitle: "품절된 할인이 없어요",
    emptyDescription: "모든 수량이 예약된 할인은 이곳에서 확인할 수 있어요.",
  },
  {
    key: "CLOSED",
    label: "마감",
    emptyTitle: "마감된 할인이 없어요",
    emptyDescription: "예약 마감 시각이 지난 할인은 이곳에 모여요.",
  },
  {
    key: "CANCELED",
    label: "취소",
    emptyTitle: "취소된 할인이 없어요",
    emptyDescription: "취소 상태의 할인이 생기면 이곳에서 확인할 수 있어요.",
  },
]

export function ManagementDealsPage() {
  useDocumentTitle("할인 관리")
  const { store } = useManagementStore()
  const storeId = Number(store.id)
  const dealsQuery = useOwnerDeals(storeId)
  const [filter, setFilter] = useState<OwnerDealStatus>("SELLING")
  const activeFilter = filters.find(({ key }) => key === filter) ?? filters[0]
  const visibleDeals = useMemo(
    () => (dealsQuery.data ?? []).filter((deal) => deal.status === filter),
    [dealsQuery.data, filter],
  )

  return (
    <div className="space-y-6 py-6 lg:space-y-8 lg:py-8">
      <ManagementPageHeader
        eyebrow={store.name}
        title="할인 관리"
        description="공개한 할인과 예약 마감 상태를 확인하세요."
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link to="/manage/deals/new">
              <Plus aria-hidden="true" />
              할인 등록
            </Link>
          </Button>
        }
      />

      <ManagementPanel className="p-0 sm:p-0">
        <div
          role="group"
          aria-label="할인 상태"
          className="border-hairline flex gap-1 overflow-x-auto border-b px-3 pt-2 sm:px-5"
        >
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              className={cn(
                "text-muted relative min-h-12 shrink-0 rounded-t-lg px-4 text-sm font-semibold",
                filter === item.key &&
                  "text-foreground after:bg-primary after:absolute after:right-3 after:bottom-0 after:left-3 after:h-0.5",
              )}
            >
              {item.label}
              {dealsQuery.data ? (
                <span className="ml-1.5 tabular-nums">
                  {
                    dealsQuery.data.filter((deal) => deal.status === item.key)
                      .length
                  }
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {dealsQuery.isPending ? (
          <div
            className="text-muted flex min-h-72 items-center justify-center px-5 text-sm"
            role="status"
            aria-busy="true"
          >
            할인 목록을 불러오는 중이에요.
          </div>
        ) : dealsQuery.isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <h2 className="text-foreground text-lg font-bold">
              할인 목록을 불러오지 못했어요
            </h2>
            <p className="text-muted mt-2 text-sm">
              네트워크 상태를 확인한 뒤 다시 시도해 주세요.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-5"
              onClick={() => void dealsQuery.refetch()}
            >
              다시 시도
            </Button>
          </div>
        ) : visibleDeals.length === 0 ? (
          <EmptyState
            title={activeFilter.emptyTitle}
            description={activeFilter.emptyDescription}
            actionLabel={filter === "SELLING" ? "할인 등록" : undefined}
            actionTo={filter === "SELLING" ? "/manage/deals/new" : undefined}
          />
        ) : (
          <div className="divide-hairline divide-y">
            {visibleDeals.map((deal) => (
              <article
                key={deal.dealId}
                className="grid gap-4 px-4 py-5 sm:px-5 xl:grid-cols-[minmax(220px,1.4fr)_120px_180px_auto] xl:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DealStatusBadge status={deal.status} />
                    <h2 className="text-foreground truncate text-base font-bold">
                      {deal.description || `할인 #${deal.dealId}`}
                    </h2>
                  </div>
                  <p className="mt-2 flex items-baseline gap-2">
                    <strong className="text-foreground text-lg tabular-nums">
                      {formatPrice(deal.lowestSalePrice)}부터
                    </strong>
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-3 xl:contents">
                  <div>
                    <dt className="text-muted text-xs">등록 품목</dt>
                    <dd className="text-foreground mt-1 text-sm font-semibold tabular-nums">
                      {deal.itemCount}개
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted text-xs">예약 마감</dt>
                    <dd className="text-foreground mt-1 text-sm font-semibold tabular-nums">
                      {formatShortManagementDateTime(deal.salesEndsAt)}
                    </dd>
                  </div>
                </dl>

                <Button asChild variant="secondary" size="compact">
                  <Link to={`/manage/deals/${deal.dealId}`}>
                    <Eye aria-hidden="true" />
                    상세 보기
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        )}
      </ManagementPanel>
    </div>
  )
}
