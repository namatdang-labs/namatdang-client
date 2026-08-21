import { useMemo, useState, type FormEvent } from "react"
import { useQuery } from "@tanstack/react-query"
import { Flame, LoaderCircle, RefreshCw, Search, X } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router"

import {
  MAP_STORE_RESULT_LIMIT,
  storesOnMapQueryOptions,
  type StoreMapView,
} from "../../features/customer/customer-api"
import {
  getLocationSearchBounds,
  readLocationPreference,
} from "../../features/customer/location-preference"
import { StoreMap, type MapBounds, type StoreMapItem } from "../../features/map"
import {
  FullscreenMapSearchForm,
  FullscreenMapShell,
  FullscreenMapTopOverlay,
} from "../../features/map/fullscreen-map-shell"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"
import { RepresentativeImage } from "../../shared/ui/representative-image"
import { StatusBadge } from "../../shared/ui/status-badge"

const DEFAULT_BOUNDS: MapBounds = {
  minLat: 33.0,
  maxLat: 38.8,
  minLng: 124.0,
  maxLng: 131.0,
}

function isStoreWithCoordinates(store: StoreMapView): boolean {
  return (
    typeof store.latitude === "number" &&
    Number.isFinite(store.latitude) &&
    store.latitude >= -90 &&
    store.latitude <= 90 &&
    typeof store.longitude === "number" &&
    Number.isFinite(store.longitude) &&
    store.longitude >= -180 &&
    store.longitude <= 180
  )
}

function toMapItem(store: StoreMapView): StoreMapItem {
  return {
    id: store.routeId,
    name: store.name,
    latitude: store.latitude,
    longitude: store.longitude,
    dealStatus: store.hasActiveDeal ? "active" : "none",
  }
}

export function StoreMapPage() {
  useDocumentTitle("지도에서 가게 찾기")
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [locationPreference] = useState(() => readLocationPreference())
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [currentMapBounds, setCurrentMapBounds] = useState<MapBounds | null>(
    null,
  )
  const [searchedBounds, setSearchedBounds] = useState<MapBounds | null>(() =>
    locationPreference ? getLocationSearchBounds(locationPreference) : null,
  )

  const query = searchParams.get("q") ?? ""
  const onlyDiscounting = searchParams.get("onlyDiscounting") === "true"

  const activeBounds = searchedBounds ?? currentMapBounds ?? DEFAULT_BOUNDS

  const mapStoresQuery = useQuery(
    storesOnMapQueryOptions({
      minLat: activeBounds.minLat,
      maxLat: activeBounds.maxLat,
      minLng: activeBounds.minLng,
      maxLng: activeBounds.maxLng,
      onlyDiscounting,
      keyword: query,
      limit: MAP_STORE_RESULT_LIMIT,
      enabled: Boolean(
        locationPreference || searchedBounds || currentMapBounds,
      ),
    }),
  )

  const stores = useMemo(() => mapStoresQuery.data ?? [], [mapStoresQuery.data])

  const validStores = useMemo(
    () => stores.filter(isStoreWithCoordinates),
    [stores],
  )

  const mapStores = useMemo(() => validStores.map(toMapItem), [validStores])

  const selectedStore = useMemo(() => {
    if (!selectedStoreId) return null
    return stores.find((store) => store.routeId === selectedStoreId) ?? null
  }, [selectedStoreId, stores])

  const activeStoreId = useMemo(() => {
    if (
      selectedStoreId &&
      stores.some((store) => store.routeId === selectedStoreId)
    ) {
      return selectedStoreId
    }
    return null
  }, [selectedStoreId, stores])

  // Is map moved away from current search bounds?
  const isBoundsMoved = useMemo(() => {
    if (!currentMapBounds || !searchedBounds) return false
    const latDiff = Math.abs(currentMapBounds.minLat - searchedBounds.minLat)
    const lngDiff = Math.abs(currentMapBounds.minLng - searchedBounds.minLng)
    return latDiff > 0.005 || lngDiff > 0.005
  }, [currentMapBounds, searchedBounds])

  const handleSearchCurrentLocation = () => {
    if (currentMapBounds) {
      setSearchedBounds(currentMapBounds)
      setSelectedStoreId(null)
    }
  }

  const handleBoundsChange = (bounds: MapBounds) => {
    setCurrentMapBounds(bounds)
    if (!searchedBounds) {
      setSearchedBounds(bounds)
    }
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const nextQuery = String(formData.get("q") ?? "").trim()

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (nextQuery) next.set("q", nextQuery)
      else next.delete("q")
      return next
    })
    setSelectedStoreId(null)
  }

  const listHref = query ? `/app?q=${encodeURIComponent(query)}` : "/app"

  return (
    <FullscreenMapShell
      backLabel="가게 목록으로 돌아가기"
      description="지도를 움직여 원하는 지역의 가게와 할인 정보를 찾아보세요."
      title="지도에서 가게 찾기"
      onBack={() => navigate(listHref)}
    >
      <StoreMap
        stores={mapStores}
        selectedStoreId={activeStoreId}
        onSelect={(store) => setSelectedStoreId(store.id)}
        onBoundsChange={handleBoundsChange}
        fitBounds={!locationPreference && !searchedBounds}
        initialCenter={
          locationPreference
            ? {
                latitude: locationPreference.latitude,
                longitude: locationPreference.longitude,
              }
            : undefined
        }
        ariaLabel="등록된 가게 위치 지도"
        className="h-full w-full"
      />

      {selectedStore ? (
        <article
          data-map-selected-store-card
          className="border-hairline bg-canvas/95 pointer-events-auto absolute inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-40 mx-auto max-h-[calc(100%-24px)] max-w-md overflow-y-auto rounded-2xl border p-3 shadow-lg sm:inset-x-auto sm:left-1/2 sm:w-[min(420px,calc(100%-48px))] sm:-translate-x-1/2 sm:p-4"
          aria-live="polite"
          aria-atomic="true"
          aria-labelledby="selected-map-store-title"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10"
            aria-label={`${selectedStore.name} 간단 정보 닫기`}
            onClick={() => setSelectedStoreId(null)}
          >
            <X aria-hidden="true" />
          </Button>

          <div className="flex min-w-0 gap-3 pr-10">
            <RepresentativeImage
              kind="store"
              className="size-20 shrink-0 rounded-xl"
            />

            <div className="min-w-0 flex-1">
              <h2
                id="selected-map-store-title"
                className="text-foreground truncate text-base font-bold"
              >
                {selectedStore.name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge
                  tone={selectedStore.hasActiveDeal ? "brand" : "muted"}
                >
                  {selectedStore.hasActiveDeal ? "할인 중" : "현재 할인 없음"}
                </StatusBadge>
                {selectedStore.hasActiveDeal ? (
                  <span className="text-foreground text-xs font-semibold tabular-nums">
                    {selectedStore.activeDealCount}개 판매 중
                  </span>
                ) : null}
              </div>
              <p className="text-muted mt-2 line-clamp-2 text-sm leading-5">
                {selectedStore.address}
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="secondary"
            size="compact"
            className="mt-3 w-full"
          >
            <Link to={`/stores/${selectedStore.routeId}`}>가게 정보 보기</Link>
          </Button>
        </article>
      ) : null}

      <FullscreenMapTopOverlay>
        <FullscreenMapSearchForm
          data-map-overlay-controls
          onSubmit={handleSearch}
        >
          <label htmlFor="map-store-search" className="sr-only">
            지도에서 가게 검색
          </label>
          <Search aria-hidden="true" className="text-muted ml-2" size={20} />
          <input
            id="map-store-search"
            key={query}
            type="search"
            name="q"
            defaultValue={query}
            maxLength={80}
            placeholder="가게 이름 또는 동네 검색"
            className="text-foreground placeholder:text-disabled min-h-11 min-w-0 flex-1 rounded bg-transparent px-1 text-base"
          />
          <Button type="submit" size="compact">
            검색
          </Button>
        </FullscreenMapSearchForm>

        <div className="pointer-events-auto flex min-h-11 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={onlyDiscounting ? "default" : "secondary"}
            size="compact"
            className="gap-1.5"
            aria-pressed={onlyDiscounting}
            aria-label="할인 중인 매장만 보기"
            onClick={() => {
              setSearchParams((current) => {
                const next = new URLSearchParams(current)
                if (onlyDiscounting) next.delete("onlyDiscounting")
                else next.set("onlyDiscounting", "true")
                return next
              })
              setSelectedStoreId(null)
            }}
          >
            <Flame
              aria-hidden="true"
              size={16}
              className={
                onlyDiscounting ? "text-primary-foreground" : "text-warning"
              }
            />
            할인 중
          </Button>

          <p className="border-hairline bg-canvas/95 text-muted rounded-full border px-3 py-2 text-xs font-semibold shadow-sm">
            <strong className="text-foreground tabular-nums">
              {stores.length}
            </strong>
            {stores.length >= MAP_STORE_RESULT_LIMIT ? "곳 표시" : "곳"}
          </p>

          <span className="min-w-0 flex-1" aria-hidden="true" />

          {isBoundsMoved ? (
            <Button
              type="button"
              size="compact"
              className="rounded-full px-4 text-xs shadow-lg"
              onClick={handleSearchCurrentLocation}
            >
              <RefreshCw aria-hidden="true" size={14} />이 위치에서 검색
            </Button>
          ) : null}
        </div>

        {mapStoresQuery.isLoading || !currentMapBounds ? (
          <div
            role="status"
            aria-live="polite"
            className="border-hairline bg-canvas/95 text-muted pointer-events-auto flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-sm"
          >
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
              size={16}
            />
            지도 주변 가게를 불러오는 중이에요.
          </div>
        ) : null}

        {mapStoresQuery.isError ? (
          <section
            role="alert"
            aria-labelledby="map-store-error-title"
            className="border-hairline bg-canvas/95 pointer-events-auto rounded-2xl border p-3 shadow-lg"
          >
            <h2
              id="map-store-error-title"
              className="text-foreground text-sm font-bold"
            >
              가게 목록을 불러오지 못했어요
            </h2>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-muted text-xs leading-5">
                지도는 계속 탐색할 수 있어요.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={() => mapStoresQuery.refetch()}
              >
                <RefreshCw aria-hidden="true" size={16} />
                재시도
              </Button>
            </div>
          </section>
        ) : null}

        {mapStoresQuery.isSuccess && validStores.length === 0 ? (
          <section
            aria-labelledby="map-store-empty-title"
            className="border-hairline bg-canvas/95 pointer-events-auto rounded-2xl border p-3 shadow-lg"
          >
            <h2
              id="map-store-empty-title"
              className="text-foreground text-sm font-bold"
            >
              {onlyDiscounting
                ? "현재 이 지역에 진행 중인 할인이 없어요"
                : query
                  ? "검색 결과가 없어요"
                  : "지도에 표시할 가게 위치가 아직 없어요"}
            </h2>
            <p className="text-muted mt-1 text-xs leading-5">
              필터를 바꾸거나 지도를 다른 지역으로 움직여 보세요.
            </p>
          </section>
        ) : null}

        {mapStoresQuery.isSuccess && stores.length >= MAP_STORE_RESULT_LIMIT ? (
          <p
            role="status"
            className="border-hairline bg-canvas/95 text-muted pointer-events-auto rounded-xl border px-3 py-2 text-xs leading-5 shadow-sm"
          >
            검색 결과 중 최대 {MAP_STORE_RESULT_LIMIT}곳을 표시하고 있어요.
          </p>
        ) : null}
      </FullscreenMapTopOverlay>
    </FullscreenMapShell>
  )
}
