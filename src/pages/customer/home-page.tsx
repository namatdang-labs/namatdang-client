import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import {
  Map as MapIcon,
  MapPin,
  RefreshCw,
  Search,
  Store as StoreIcon,
} from "lucide-react"
import { Link, useLocation, useSearchParams } from "react-router"

import {
  CustomerPage,
  DealCard,
  DealGridSkeleton,
  EmptyState,
} from "../../features/customer/customer-components"
import {
  infiniteSellingDealsQueryOptions,
  infiniteStoresQueryOptions,
  storesOnMapQueryOptions,
  type StoreMapView,
  type StoreView,
} from "../../features/customer/customer-api"
import {
  LOCATION_SEARCH_RADIUS_KILOMETERS,
  getDistanceKilometers,
  getLocationSearchBounds,
  readLocationPreference,
} from "../../features/customer/location-preference"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const STORE_PAGE_SIZE = 20
const DEAL_PAGE_SIZE = 20
const DISABLED_MAP_BOUNDS = {
  minLat: 0,
  maxLat: 0,
  minLng: 0,
  maxLng: 0,
}

type RegisteredStore = Pick<
  StoreView | StoreMapView,
  "id" | "routeId" | "name" | "address"
> & {
  distanceKilometers?: number
}

function RegisteredStoreCard({ store }: { store: RegisteredStore }) {
  return (
    <Link
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
      {typeof store.distanceKilometers === "number" ? (
        <span className="text-brand-link mt-2 block text-sm font-semibold tabular-nums">
          {store.distanceKilometers < 1
            ? `${Math.round(store.distanceKilometers * 1_000)}m`
            : `${store.distanceKilometers.toFixed(1)}km`}
        </span>
      ) : null}
      <span className="text-brand-link mt-4 block text-sm font-semibold">
        가게 정보 보기
      </span>
    </Link>
  )
}

export function HomePage() {
  useDocumentTitle("지금 예약 가능한 할인")
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("q") ?? ""
  const [locationPreference] = useState(readLocationPreference)
  const locationBounds = useMemo(
    () =>
      locationPreference ? getLocationSearchBounds(locationPreference) : null,
    [locationPreference],
  )
  const usesSelectedLocation = locationPreference !== null
  const storesQuery = useInfiniteQuery(
    infiniteStoresQueryOptions({
      keyword: query,
      size: STORE_PAGE_SIZE,
      enabled: !usesSelectedLocation,
    }),
  )
  const fetchNextNetworkStorePage = storesQuery.fetchNextPage
  const nearbyStoresQuery = useQuery(
    storesOnMapQueryOptions({
      ...(locationBounds ?? DISABLED_MAP_BOUNDS),
      keyword: query,
      enabled: usesSelectedLocation,
    }),
  )
  const dealsQuery = useInfiniteQuery(
    infiniteSellingDealsQueryOptions({
      size: DEAL_PAGE_SIZE,
      keyword: query,
      centerLat: locationPreference?.latitude,
      centerLng: locationPreference?.longitude,
      radiusMeters: LOCATION_SEARCH_RADIUS_KILOMETERS * 1_000,
    }),
  )
  const networkStores = useMemo(() => {
    const seenStoreIds = new Set<number>()

    return (storesQuery.data?.pages ?? []).flatMap((page) =>
      page.content.filter((store) => {
        if (seenStoreIds.has(store.id)) return false
        seenStoreIds.add(store.id)
        return true
      }),
    )
  }, [storesQuery.data?.pages])
  const nearbyStores = useMemo(() => {
    if (!locationPreference) return []

    return (nearbyStoresQuery.data ?? [])
      .map((store) => ({
        ...store,
        distanceKilometers: getDistanceKilometers(locationPreference, store),
      }))
      .filter(
        (store) =>
          store.distanceKilometers <= LOCATION_SEARCH_RADIUS_KILOMETERS,
      )
      .sort(
        (left, right) =>
          left.distanceKilometers - right.distanceKilometers ||
          left.id - right.id,
      )
  }, [locationPreference, nearbyStoresQuery.data])
  const nearbyPaginationKey = locationPreference
    ? `${locationPreference.latitude}:${locationPreference.longitude}:${query.trim()}`
    : ""
  const [nearbyPagination, setNearbyPagination] = useState({
    key: nearbyPaginationKey,
    count: STORE_PAGE_SIZE,
  })
  const nearbyVisibleCount =
    nearbyPagination.key === nearbyPaginationKey
      ? nearbyPagination.count
      : STORE_PAGE_SIZE
  const registeredStores = usesSelectedLocation
    ? nearbyStores.slice(0, nearbyVisibleCount)
    : networkStores
  const totalStores = usesSelectedLocation
    ? nearbyStores.length
    : (storesQuery.data?.pages[0]?.totalElements ?? 0)
  const hasNextStorePage = usesSelectedLocation
    ? nearbyVisibleCount < nearbyStores.length
    : storesQuery.hasNextPage
  const isFetchingNextStorePage = usesSelectedLocation
    ? false
    : storesQuery.isFetchingNextPage
  const storesDataReady = usesSelectedLocation
    ? nearbyStoresQuery.data !== undefined
    : storesQuery.data !== undefined
  const storesPending = usesSelectedLocation
    ? nearbyStoresQuery.isPending
    : storesQuery.isPending
  const storesError = usesSelectedLocation
    ? nearbyStoresQuery.isError
    : storesQuery.isError
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const visibleRegisteredStores = registeredStores
  const visibleDeals = useMemo(() => {
    const seenDealIds = new Set<number>()

    return (dealsQuery.data?.pages ?? []).flatMap((page) =>
      page.content.filter((deal) => {
        if (seenDealIds.has(deal.dealId)) return false
        seenDealIds.add(deal.dealId)
        return true
      }),
    )
  }, [dealsQuery.data?.pages])
  const totalDeals = dealsQuery.data?.pages[0]?.totalElements ?? 0
  const hasSearchQuery = Boolean(query.trim())

  const setQuery = (value: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete("view")
        if (value) next.set("q", value)
        else next.delete("q")
        return next
      },
      { replace: true },
    )
  }

  const mapSearchParams = new URLSearchParams({ onlyDiscounting: "true" })
  if (query.trim()) mapSearchParams.set("q", query.trim())
  const mapPath = `/map?${mapSearchParams.toString()}`
  const returnTo = `${location.pathname}${location.search}`
  const locationSelectionPath = `/location?returnTo=${encodeURIComponent(returnTo)}`

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setQuery(String(formData.get("q") ?? "").trim())
  }

  const fetchNextStorePage = () => {
    if (usesSelectedLocation) {
      setNearbyPagination((current) => {
        const currentCount =
          current.key === nearbyPaginationKey ? current.count : STORE_PAGE_SIZE
        return {
          key: nearbyPaginationKey,
          count: Math.min(currentCount + STORE_PAGE_SIZE, nearbyStores.length),
        }
      })
      return
    }
    void fetchNextNetworkStorePage()
  }

  const refetchStores = () => {
    if (usesSelectedLocation) {
      void nearbyStoresQuery.refetch()
      return
    }

    void storesQuery.refetch()
  }

  useEffect(() => {
    const target = loadMoreRef.current
    if (
      !target ||
      !hasNextStorePage ||
      typeof IntersectionObserver === "undefined"
    ) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextStorePage) {
          if (usesSelectedLocation) {
            setNearbyPagination((current) => {
              const currentCount =
                current.key === nearbyPaginationKey
                  ? current.count
                  : STORE_PAGE_SIZE
              return {
                key: nearbyPaginationKey,
                count: Math.min(
                  currentCount + STORE_PAGE_SIZE,
                  nearbyStores.length,
                ),
              }
            })
          } else {
            void fetchNextNetworkStorePage()
          }
        }
      },
      { rootMargin: "320px 0px" },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [
    hasNextStorePage,
    isFetchingNextStorePage,
    nearbyPaginationKey,
    nearbyStores.length,
    fetchNextNetworkStorePage,
    usesSelectedLocation,
  ])

  return (
    <CustomerPage>
      <section className="mb-5" aria-label="할인 탐색">
        <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto]">
          <Button
            asChild
            variant="secondary"
            size="compact"
            className="min-w-0 flex-1 justify-start sm:max-w-52 sm:flex-none"
          >
            <Link
              to={locationSelectionPath}
              aria-label={
                locationPreference
                  ? `${locationPreference.label} 5km 기준 위치 변경`
                  : "동네 위치 설정"
              }
            >
              <MapPin aria-hidden="true" />
              <span className="truncate">
                {locationPreference
                  ? `${locationPreference.label} · 5km`
                  : "동네 설정"}
              </span>
            </Link>
          </Button>

          <form
            key={query}
            className="border-hairline bg-canvas order-3 flex min-h-12 w-full items-center rounded-xl border sm:order-none sm:min-h-11 sm:w-auto"
            role="search"
            onSubmit={handleSearch}
          >
            <label htmlFor="home-search" className="sr-only">
              가게와 할인 품목 검색
            </label>
            <Search aria-hidden="true" className="text-muted ml-3" size={20} />
            <input
              id="home-search"
              type="search"
              name="q"
              defaultValue={query}
              maxLength={80}
              className="text-foreground placeholder:text-disabled min-h-11 min-w-0 flex-1 rounded bg-transparent px-2 text-base"
              placeholder="가게·할인 품목 검색"
            />
            <Button type="submit" size="compact" className="mr-0.5 rounded-lg">
              검색
            </Button>
          </form>

          <Button asChild variant="secondary" size="compact">
            <Link to={mapPath} aria-label="현재 조건으로 지도보기">
              <MapIcon aria-hidden="true" />
              지도
            </Link>
          </Button>
        </div>
      </section>

      <section className="mb-10" aria-labelledby="selling-deals-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              id="selling-deals-title"
              data-route-heading
              tabIndex={-1}
              className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {locationPreference
                ? `${locationPreference.label} 근처 예약 가능한 할인`
                : "지금 예약 가능한 할인"}
            </h1>
            <p className="text-muted mt-1 text-sm leading-6">
              {locationPreference
                ? "선택한 위치에서 5km 안의 할인을 가까운 순으로 보여드려요."
                : "판매 중인 품목을 예약하고 가게에서 픽업해 보세요."}
            </p>
          </div>
          {dealsQuery.data ? (
            <p className="text-muted text-sm" aria-live="polite">
              {totalDeals}개 중 {visibleDeals.length}개 표시
            </p>
          ) : null}
        </div>

        {dealsQuery.isPending ? <DealGridSkeleton /> : null}

        {dealsQuery.isError && !dealsQuery.data ? (
          <EmptyState
            className="min-h-44 py-8"
            title="할인을 불러오지 못했어요"
            description="연결 상태를 확인한 뒤 다시 불러와 주세요."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => void dealsQuery.refetch()}
              >
                <RefreshCw aria-hidden="true" />
                다시 불러오기
              </Button>
            }
          />
        ) : null}

        {visibleDeals.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {visibleDeals.map((deal) => (
              <DealCard key={deal.dealId} deal={deal} />
            ))}
          </div>
        ) : null}

        {dealsQuery.data && visibleDeals.length === 0 ? (
          <EmptyState
            className="min-h-44 py-8"
            title={
              hasSearchQuery
                ? "검색 조건에 맞는 할인이 없어요"
                : "지금 예약할 수 있는 할인이 없어요"
            }
            description={
              hasSearchQuery
                ? "다른 가게나 할인 이름으로 검색해 보세요."
                : "새 할인이 열리면 이곳에서 바로 확인할 수 있어요."
            }
            action={
              hasSearchQuery ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setQuery("")}
                >
                  검색어 지우기
                </Button>
              ) : undefined
            }
          />
        ) : null}

        {visibleDeals.length > 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center gap-2">
            {dealsQuery.hasNextPage ? (
              <Button
                type="button"
                variant="secondary"
                size="compact"
                disabled={dealsQuery.isFetchingNextPage}
                onClick={() => void dealsQuery.fetchNextPage()}
              >
                {dealsQuery.isFetchingNextPage
                  ? "할인을 더 불러오는 중"
                  : "할인 더 보기"}
              </Button>
            ) : (
              <p className="text-muted text-sm" role="status">
                모든 할인을 확인했어요.
              </p>
            )}

            {dealsQuery.isFetchNextPageError ? (
              <p className="text-critical text-sm" role="alert">
                다음 할인을 불러오지 못했어요. 다시 시도해 주세요.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="mb-10" aria-labelledby="registered-stores-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="registered-stores-title"
              className="text-foreground text-xl font-bold"
            >
              {locationPreference
                ? `${locationPreference.label} 근처 가게 둘러보기`
                : "가게 둘러보기"}
            </h2>
            <p className="text-muted mt-1 text-sm leading-6">
              {locationPreference
                ? "선택한 위치에서 5km 안의 가게를 가까운 순으로 보여드려요."
                : "동네 가게의 위치와 가게 정보를 확인해 보세요."}
            </p>
          </div>
          {storesDataReady ? (
            <span className="text-muted text-sm" aria-live="polite">
              {totalStores}곳 중 {registeredStores.length}곳
            </span>
          ) : null}
        </div>

        {storesPending ? (
          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="가게를 불러오는 중"
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

        {storesError && registeredStores.length === 0 ? (
          <EmptyState
            title="가게 목록을 불러오지 못했어요"
            description="연결 상태를 확인한 뒤 다시 불러와 주세요."
            action={
              <Button type="button" variant="secondary" onClick={refetchStores}>
                <RefreshCw aria-hidden="true" />
                다시 불러오기
              </Button>
            }
          />
        ) : null}

        {visibleRegisteredStores.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleRegisteredStores.map((store) => (
              <RegisteredStoreCard key={store.id} store={store} />
            ))}
          </div>
        ) : null}

        {storesDataReady && visibleRegisteredStores.length === 0 ? (
          <EmptyState
            title={
              hasSearchQuery
                ? "검색 결과가 없어요"
                : locationPreference
                  ? "선택 위치 5km 안에 가게가 없어요"
                  : "둘러볼 가게가 없어요"
            }
            description={
              hasSearchQuery
                ? "다른 가게 이름으로 검색하거나 위치를 변경해 보세요."
                : locationPreference
                  ? "지도에서 다른 위치를 선택해 보세요."
                  : "가게가 등록되면 이곳에서 확인할 수 있어요."
            }
          />
        ) : null}

        {registeredStores.length > 0 ? (
          <div
            ref={loadMoreRef}
            className="mt-6 flex min-h-12 flex-col items-center justify-center gap-3"
          >
            {hasNextStorePage ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isFetchingNextStorePage}
                onClick={fetchNextStorePage}
              >
                {isFetchingNextStorePage
                  ? "가게를 더 불러오는 중"
                  : "가게 더 보기"}
              </Button>
            ) : (
              <p className="text-muted text-sm" role="status">
                모든 가게를 확인했어요.
              </p>
            )}

            {!usesSelectedLocation && storesQuery.isFetchNextPageError ? (
              <p className="text-critical text-sm" role="alert">
                다음 가게를 불러오지 못했어요. 다시 시도해 주세요.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </CustomerPage>
  )
}
