import { useMemo, useState } from "react"
import {
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  PackageOpen,
  Store,
} from "lucide-react"
import { Link } from "react-router"
import {
  CustomerPage,
  EmptyState,
  PageIntro,
} from "../../features/customer/customer-components"
import {
  deals,
  formatWon,
  getDiscountRate,
  stores,
  type DealSummary,
  type StoreSummary,
} from "../../features/customer/customer-data"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const initialFavoriteStoreIds = ["seongsu-bread-lab", "mangwon-cake-room"]

function FavoriteStoreCard({
  store,
  activeDeal,
  onRemove,
}: {
  store: StoreSummary
  activeDeal: DealSummary | undefined
  onRemove: (store: StoreSummary) => void
}) {
  return (
    <article className="border-hairline bg-canvas overflow-hidden rounded-2xl border">
      <div className="bg-surface relative aspect-[4/3] overflow-hidden">
        <Link
          to={`/stores/${store.id}`}
          className="block h-full rounded-t-2xl"
          aria-label={`${store.name} 가게 상세 보기`}
        >
          <img
            src={store.imageUrl}
            alt={`${store.name} 대표`}
            className="h-full w-full object-cover transition-transform duration-150 hover:scale-[1.02] motion-reduce:transition-none"
            loading="lazy"
            decoding="async"
          />
        </Link>
        <button
          type="button"
          className="bg-canvas/95 text-primary absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-full border border-white/70"
          aria-label={`${store.name} 찜 해제`}
          aria-pressed="true"
          onClick={() => onRemove(store)}
        >
          <Heart aria-hidden="true" className="fill-primary" size={22} />
        </button>
      </div>

      <div className="p-5">
        <p className="text-brand-link flex items-center gap-2 text-sm font-semibold">
          <MapPin aria-hidden="true" size={17} />
          {store.district}
        </p>
        <Link
          to={`/stores/${store.id}`}
          className="text-foreground mt-2 block rounded text-xl font-bold"
        >
          {store.name}
        </Link>
        <p className="text-muted mt-2 line-clamp-2 text-sm leading-6">
          {store.description}
        </p>
        <p className="text-muted mt-4 flex items-center gap-2 text-sm">
          <Clock3 aria-hidden="true" size={18} />
          {store.openHours}
        </p>

        {activeDeal ? (
          <div className="bg-brand-tint mt-5 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-brand-brown text-xs font-semibold">
                  오늘 예약 가능
                </p>
                <Link
                  to={`/deals/${activeDeal.id}`}
                  className="text-foreground mt-1 block truncate rounded font-bold"
                >
                  {activeDeal.title}
                </Link>
              </div>
              <p className="text-brand-link shrink-0 text-sm font-bold">
                {getDiscountRate(
                  activeDeal.originalPrice,
                  activeDeal.salePrice,
                )}
                % 할인
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-foreground font-bold tabular-nums">
                {formatWon(activeDeal.salePrice)}
              </p>
              <p className="text-warning flex items-center gap-1 font-semibold">
                <PackageOpen aria-hidden="true" size={17} />
                {activeDeal.stock}개 남음
              </p>
            </div>
            <Button asChild variant="secondary" className="mt-4 w-full">
              <Link to={`/deals/${activeDeal.id}`}>
                할인 상세 보기
                <ChevronRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="bg-surface text-muted mt-5 rounded-xl p-4 text-sm leading-6">
            오늘 예약 가능한 할인이 아직 없어요.
          </div>
        )}

        <Link
          to={`/stores/${store.id}`}
          className="border-hairline text-muted mt-4 flex min-h-11 items-center justify-between border-t pt-3 text-sm font-medium"
        >
          <span className="flex items-center gap-2">
            <Store aria-hidden="true" size={18} />
            가게 정보 보기
          </span>
          <ChevronRight aria-hidden="true" size={18} />
        </Link>
      </div>
    </article>
  )
}

export function FavoritesPage() {
  useDocumentTitle("찜한 가게")
  const [favoriteStoreIds, setFavoriteStoreIds] = useState(
    initialFavoriteStoreIds,
  )
  const [removeNotice, setRemoveNotice] = useState("")

  const favoriteStores = useMemo(
    () => stores.filter((store) => favoriteStoreIds.includes(store.id)),
    [favoriteStoreIds],
  )

  const removeFavorite = (store: StoreSummary) => {
    setFavoriteStoreIds((current) =>
      current.filter((storeId) => storeId !== store.id),
    )
    setRemoveNotice(`${store.name} 찜을 해제했어요.`)
  }

  return (
    <CustomerPage>
      <PageIntro
        eyebrow="다시 만나고 싶은 곳"
        title="찜한 가게"
        description="관심 있는 가게의 오늘 할인을 모아보고 바로 예약해 보세요."
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-foreground text-lg font-bold">내 찜 목록</h2>
        <p className="text-muted text-sm" aria-live="polite">
          {favoriteStores.length}개의 가게
        </p>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {removeNotice}
      </p>

      {favoriteStores.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {favoriteStores.map((store) => (
            <FavoriteStoreCard
              key={store.id}
              store={store}
              activeDeal={deals.find((deal) => deal.storeId === store.id)}
              onRemove={removeFavorite}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="아직 찜한 가게가 없어요"
          description="마음에 드는 가게를 찜해 두면 오늘의 할인을 빠르게 확인할 수 있어요."
          action={
            <Button asChild>
              <Link to="/">오늘의 할인 둘러보기</Link>
            </Button>
          }
        />
      )}
    </CustomerPage>
  )
}
