import { useState } from "react"
import { Clock3, Heart, MapPin, Navigation, Store } from "lucide-react"
import { useParams } from "react-router"
import {
  BackButton,
  CustomerPage,
  DealCard,
  EmptyState,
  SectionCard,
} from "../../features/customer/customer-components"
import { deals, getStore } from "../../features/customer/customer-data"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

export function StoreDetailPage() {
  const { storeId } = useParams()
  const store = getStore(storeId)
  const [liked, setLiked] = useState(false)
  const [directionNotice, setDirectionNotice] = useState(false)
  const storeDeals = deals.filter((deal) => deal.storeId === storeId)
  useDocumentTitle(store?.name ?? "가게 상세")

  if (!store) {
    return (
      <CustomerPage>
        <BackButton />
        <h1 data-route-heading tabIndex={-1} className="text-2xl font-bold">
          가게를 찾을 수 없어요
        </h1>
        <p className="text-muted mt-3">홈에서 다른 가게를 살펴보세요.</p>
      </CustomerPage>
    )
  }

  return (
    <CustomerPage className="max-w-4xl">
      <BackButton />

      <div className="border-hairline bg-canvas overflow-hidden rounded-2xl border">
        <div className="bg-surface relative aspect-[16/9] max-h-[420px]">
          <img
            src={store.imageUrl}
            alt={`${store.name} 대표`}
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
          <button
            type="button"
            className="bg-canvas/95 absolute top-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
            aria-pressed={liked}
            onClick={() => setLiked((value) => !value)}
          >
            <Heart
              aria-hidden="true"
              size={20}
              className={liked ? "fill-primary text-primary" : undefined}
            />
            {liked ? "찜한 가게" : "찜하기"}
          </button>
        </div>

        <div className="p-5 sm:p-7">
          <p className="text-brand-link text-sm font-semibold">
            {store.district}
          </p>
          <h1
            data-route-heading
            tabIndex={-1}
            className="text-foreground mt-1 text-2xl font-bold sm:text-3xl"
          >
            {store.name}
          </h1>
          <p className="text-muted mt-4 max-w-2xl text-sm leading-6 sm:text-base">
            {store.description}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <SectionCard>
          <h2 className="text-foreground flex items-center gap-2 font-bold">
            <Clock3 aria-hidden="true" size={20} />
            오늘 영업
          </h2>
          <p className="text-muted mt-3 text-sm leading-6">{store.openHours}</p>
        </SectionCard>
        <SectionCard>
          <h2 className="text-foreground flex items-center gap-2 font-bold">
            <MapPin aria-hidden="true" size={20} />
            가게 위치
          </h2>
          <p className="text-muted mt-3 text-sm leading-6">{store.address}</p>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 -ml-3"
            onClick={() => setDirectionNotice(true)}
          >
            <Navigation aria-hidden="true" />
            길찾기
          </Button>
          {directionNotice ? (
            <p className="text-info mt-1 text-sm" role="status">
              지도 연결 전이라 주소를 먼저 확인해 주세요.
            </p>
          ) : null}
        </SectionCard>
      </div>

      <section className="mt-10" aria-labelledby="store-deals-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-brand-link mb-1 flex items-center gap-2 text-sm font-semibold">
              <Store aria-hidden="true" size={17} />
              오늘만 만나요
            </p>
            <h2
              id="store-deals-title"
              className="text-foreground text-xl font-bold"
            >
              예약 가능한 할인
            </h2>
          </div>
          <span className="text-muted text-sm">{storeDeals.length}개</span>
        </div>

        {storeDeals.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {storeDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="오늘 공개한 할인이 없어요"
            description="찜해 두면 새 할인이 열렸을 때 확인하기 쉬워요."
          />
        )}
      </section>
    </CustomerPage>
  )
}
