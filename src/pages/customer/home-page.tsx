import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import {
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Store as StoreIcon,
} from "lucide-react"
import { Link } from "react-router"
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
import { storesQueryOptions } from "../../features/customer/customer-api"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const filters: Array<"전체" | DealCategory> = ["전체", "빵", "디저트", "케이크"]
const todayLabel = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
}).format(new Date())

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
  const storesQuery = useQuery(
    storesQueryOptions({ keyword: query, size: 100 }),
  )
  const registeredStores = storesQuery.data?.content ?? []

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
        eyebrow={`${todayLabel} 오늘`}
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
        aria-label="등록된 가게 안내"
      >
        <div>
          <p className="text-brand-brown flex items-center gap-2 text-sm font-semibold">
            <MapPin aria-hidden="true" size={18} />
            서버에 등록된 가게를 찾고 있어요
          </p>
          <p className="text-foreground mt-2 text-lg font-bold">
            {storesQuery.isPending
              ? "가게 수를 확인하는 중"
              : `${storesQuery.data?.totalElements ?? 0}곳을 둘러볼 수 있어요`}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-4 sm:mt-0"
          onClick={() => setSearchOpen(true)}
        >
          <Search aria-hidden="true" />
          가게 검색
        </Button>
      </section>

      <section className="mb-10" aria-labelledby="registered-stores-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-brand-link text-sm font-semibold">
              실시간 가게 정보
            </p>
            <h2
              id="registered-stores-title"
              className="text-foreground mt-1 text-xl font-bold"
            >
              등록된 가게
            </h2>
          </div>
          {storesQuery.isSuccess ? (
            <span className="text-muted text-sm">
              {storesQuery.data.totalElements}곳
            </span>
          ) : null}
        </div>

        {storesQuery.isPending ? (
          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="등록된 가게를 불러오는 중"
            aria-busy="true"
          >
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="border-hairline bg-canvas grid gap-3 rounded-2xl border p-5"
              >
                <span className="bg-surface size-11 animate-pulse rounded-xl motion-reduce:animate-none" />
                <span className="bg-surface h-6 w-2/3 animate-pulse rounded motion-reduce:animate-none" />
                <span className="bg-surface h-4 w-full animate-pulse rounded motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        ) : null}

        {storesQuery.isError ? (
          <EmptyState
            title="가게 목록을 불러오지 못했어요"
            description="백엔드 컨테이너 연결을 확인한 뒤 다시 시도해 주세요."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => void storesQuery.refetch()}
              >
                <RefreshCw aria-hidden="true" />
                다시 불러오기
              </Button>
            }
          />
        ) : null}

        {storesQuery.isSuccess && registeredStores.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {registeredStores.map((store) => (
              <Link
                key={store.id}
                to={`/stores/${store.routeId}`}
                className="border-hairline bg-canvas hover:border-primary group rounded-2xl border p-5 transition-colors"
              >
                <span className="bg-bread-cream text-brand-brown flex size-11 items-center justify-center rounded-xl">
                  <StoreIcon aria-hidden="true" size={21} />
                </span>
                <span className="text-foreground mt-4 block text-lg font-bold group-hover:underline">
                  {store.name}
                </span>
                <span className="text-muted mt-2 block text-sm leading-6">
                  {store.address}
                </span>
                <span className="text-brand-link mt-4 block text-sm font-semibold">
                  가게 정보 보기
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        {storesQuery.isSuccess && registeredStores.length === 0 ? (
          <EmptyState
            title={query ? "검색 결과가 없어요" : "아직 등록된 가게가 없어요"}
            description={
              query
                ? "다른 가게 이름이나 주소로 검색해 보세요."
                : "가게를 처음 등록하면 이곳에 바로 표시돼요."
            }
          />
        ) : null}
      </section>

      <div className="bg-surface text-muted mb-5 rounded-xl px-4 py-3 text-sm leading-6">
        아래 할인·예약 카드는 화면 개발을 위한 예시 데이터예요. 백엔드 Deal과
        Reservation API가 추가되면 실제 데이터로 전환됩니다.
      </div>

      <div
        className="mb-6 flex items-center gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="예시 상품 종류 필터"
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
        <h2 className="text-foreground text-lg font-bold">
          할인 화면 미리보기
        </h2>
        <p className="text-muted text-sm" aria-live="polite">
          {visibleDeals.length}개의 예시
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
