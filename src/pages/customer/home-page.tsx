import { useMemo, useState } from "react"
import { LocateFixed, MapPin, Search, SlidersHorizontal } from "lucide-react"
import {
  CustomerPage,
  DealCard,
  EmptyState,
  PageIntro,
} from "../../features/customer/customer-components"
import {
  deals,
  getStore,
  type DealCategory,
} from "../../features/customer/customer-data"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const filters: Array<"전체" | DealCategory> = ["전체", "빵", "디저트", "케이크"]

function distanceInMeters(distance: string) {
  const value = Number.parseFloat(distance)
  return distance.endsWith("km") ? value * 1000 : value
}

export function HomePage() {
  useDocumentTitle("오늘의 할인")
  const [filter, setFilter] = useState<(typeof filters)[number]>("전체")
  const [nearbyOnly, setNearbyOnly] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [area, setArea] = useState("성수동")

  const visibleDeals = useMemo(() => {
    const categoryDeals =
      filter === "전체"
        ? deals
        : deals.filter((deal) => deal.category === filter)
    const distanceDeals = nearbyOnly
      ? categoryDeals.filter((deal) => distanceInMeters(deal.distance) <= 1000)
      : categoryDeals
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR")
    if (!normalizedQuery) return distanceDeals

    return distanceDeals.filter((deal) => {
      const storeName = getStore(deal.storeId)?.name ?? ""
      return `${deal.title} ${storeName}`
        .toLocaleLowerCase("ko-KR")
        .includes(normalizedQuery)
    })
  }, [filter, nearbyOnly, query])

  return (
    <CustomerPage>
      <PageIntro
        eyebrow="8월 18일 오늘"
        title="근처의 마감 할인"
        description="픽업할 수 있는 시간과 남은 수량을 한 번에 비교해 보세요."
        action={
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="할인 검색"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((value) => !value)}
          >
            <Search aria-hidden="true" />
          </Button>
        }
      />

      {searchOpen ? (
        <div className="mb-5">
          <label htmlFor="deal-search" className="sr-only">
            가게 또는 할인 검색
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="text-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
              size={20}
            />
            <input
              id="deal-search"
              type="search"
              value={query}
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
              className="border-hairline bg-canvas text-foreground placeholder:text-disabled min-h-12 w-full rounded-xl border pr-4 pl-12"
              placeholder="가게 또는 상품 이름을 입력해 주세요"
            />
          </div>
        </div>
      ) : null}

      <section
        className="bg-bread-cream mb-7 overflow-hidden rounded-2xl p-5 sm:flex sm:items-center sm:justify-between sm:p-7"
        aria-label="현재 지역"
      >
        <div>
          <p className="text-brand-brown flex items-center gap-2 text-sm font-semibold">
            <MapPin aria-hidden="true" size={18} />
            {area}에서 찾고 있어요
          </p>
          <p className="text-foreground mt-2 text-lg font-bold">
            오늘 픽업할 수 있는 가게 3곳
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-4 sm:mt-0"
          onClick={() =>
            setArea((current) => (current === "성수동" ? "연남동" : "성수동"))
          }
        >
          <LocateFixed aria-hidden="true" />
          지역 바꾸기
        </Button>
      </section>

      <div
        className="mb-6 flex items-center gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="상품 종류 필터"
      >
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${
              filter === item
                ? "border-foreground bg-foreground text-canvas"
                : "border-hairline bg-canvas text-foreground hover:bg-surface"
            }`}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className={`ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${
            nearbyOnly
              ? "border-brand-link bg-brand-tint text-brand-brown"
              : "border-hairline bg-canvas text-foreground"
          }`}
          aria-pressed={nearbyOnly}
          onClick={() => setNearbyOnly((value) => !value)}
        >
          <SlidersHorizontal aria-hidden="true" size={18} />
          1km 이내
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-foreground text-lg font-bold">오늘 예약 가능</h2>
        <p className="text-muted text-sm" aria-live="polite">
          {visibleDeals.length}개의 할인
        </p>
      </div>

      {visibleDeals.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="조건에 맞는 할인이 없어요"
          description="거리 조건을 넓히거나 다른 상품 종류를 선택해 보세요."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFilter("전체")
                setNearbyOnly(false)
                setQuery("")
              }}
            >
              필터 초기화
            </Button>
          }
        />
      )}
    </CustomerPage>
  )
}
