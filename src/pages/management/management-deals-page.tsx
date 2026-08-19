import { Edit3, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router"
import {
  formatPrice,
  managementDeals,
  type ManagementDealStatus,
} from "../../features/management/data"
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

type DealFilter = "active" | "sold-out" | "ended"

const filters: Array<{
  key: DealFilter
  label: string
  statuses: ManagementDealStatus[]
}> = [
  { key: "active", label: "판매 중", statuses: ["selling", "low-stock"] },
  { key: "sold-out", label: "품절", statuses: ["sold-out"] },
  { key: "ended", label: "마감", statuses: ["ended"] },
]

export function ManagementDealsPage() {
  useDocumentTitle("할인 관리")
  const { store } = useManagementStore()
  const [filter, setFilter] = useState<DealFilter>("active")

  const visibleDeals = useMemo(() => {
    const activeFilter = filters.find((item) => item.key === filter)
    return managementDeals.filter(
      (deal) =>
        deal.storeId === store.id &&
        activeFilter?.statuses.includes(deal.status),
    )
  }, [filter, store.id])

  return (
    <div className="space-y-6 py-6 lg:space-y-8 lg:py-8">
      <ManagementPageHeader
        eyebrow={store.name}
        title="할인 관리"
        description="공개한 할인과 재고, 예약 수량을 확인하세요."
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link to="/manage/deals/new">
              <Plus aria-hidden="true" />
              할인 등록하기
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
            </button>
          ))}
        </div>

        {visibleDeals.length === 0 ? (
          <EmptyState
            title="이 상태의 할인이 없어요"
            description="오늘 남은 상품이 있다면 새 할인을 등록해 보세요."
            actionLabel="할인 등록하기"
            actionTo="/manage/deals/new"
          />
        ) : (
          <div className="divide-hairline divide-y">
            {visibleDeals.map((deal) => (
              <article
                key={deal.id}
                className="grid gap-4 px-4 py-5 sm:px-5 xl:grid-cols-[minmax(220px,1.4fr)_120px_120px_180px_auto] xl:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DealStatusBadge status={deal.status} />
                    <h2 className="text-foreground truncate text-base font-bold">
                      {deal.name}
                    </h2>
                  </div>
                  <p className="mt-2 flex items-baseline gap-2">
                    <strong className="text-foreground text-lg tabular-nums">
                      {formatPrice(deal.salePrice)}
                    </strong>
                    <span className="text-muted text-sm tabular-nums line-through">
                      {formatPrice(deal.originalPrice)}
                    </span>
                  </p>
                </div>

                <dl className="grid grid-cols-3 gap-3 xl:contents">
                  <div>
                    <dt className="text-muted text-xs">남은 재고</dt>
                    <dd className="text-foreground mt-1 text-sm font-semibold tabular-nums">
                      {deal.stock}개
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted text-xs">예약 수량</dt>
                    <dd className="text-foreground mt-1 text-sm font-semibold tabular-nums">
                      {deal.reserved}개
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted text-xs">픽업 시간</dt>
                    <dd className="text-foreground mt-1 text-sm font-semibold">
                      {deal.pickupWindow}
                    </dd>
                  </div>
                </dl>

                <Button asChild variant="secondary" size="compact">
                  <Link to={`/manage/deals/${deal.id}/edit`}>
                    <Edit3 aria-hidden="true" />
                    수정
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
