import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Copy,
  ExternalLink,
  Heart,
  MapPin,
  Phone,
  RefreshCw,
  Store,
} from "lucide-react"
import { Link, useParams } from "react-router"

import {
  addFavorite,
  customerQueryKeys,
  favoriteStoresQueryOptions,
  isUnauthorizedError,
  parseNumericStoreId,
  removeFavorite,
  storeDealsQueryOptions,
  storeQueryOptions,
  type StoreView,
} from "../../features/customer/customer-api"
import { StoreLocationMap, type MapCoordinate } from "../../features/map"
import {
  BackButton,
  CustomerPage,
  DealCard,
  DealGridSkeleton,
  EmptyState,
  SectionCard,
} from "../../features/customer/customer-components"
import { ApiError } from "../../shared/api/client"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"
import { RepresentativeImage } from "../../shared/ui/representative-image"

type CopyStatus = "idle" | "success" | "error"

function getValidStorePosition(store: StoreView): MapCoordinate | null {
  if (
    typeof store.latitude !== "number" ||
    !Number.isFinite(store.latitude) ||
    store.latitude < -90 ||
    store.latitude > 90 ||
    typeof store.longitude !== "number" ||
    !Number.isFinite(store.longitude) ||
    store.longitude < -180 ||
    store.longitude > 180
  ) {
    return null
  }

  return {
    latitude: store.latitude,
    longitude: store.longitude,
  }
}

function getNaverMapSearchUrl(store: StoreView) {
  const query = `${store.name} ${store.address}`.trim()
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.append(textarea)
  textarea.select()

  try {
    if (!document.execCommand("copy")) throw new Error("copy failed")
  } finally {
    textarea.remove()
  }
}

function StoreLocationSection({ store }: { store: StoreView }) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle")
  const position = getValidStorePosition(store)

  const handleCopyAddress = async () => {
    try {
      await copyText(store.address)
      setCopyStatus("success")
    } catch {
      setCopyStatus("error")
    }
  }

  return (
    <SectionCard className="mt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-foreground flex items-center gap-2 font-bold">
            <MapPin aria-hidden="true" size={20} />
            가게 위치
          </h2>
          <p className="text-muted mt-3 text-sm leading-6">{store.address}</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            size="compact"
            onClick={() => void handleCopyAddress()}
          >
            <Copy aria-hidden="true" />
            주소 복사
          </Button>
          <Button asChild variant="secondary" size="compact">
            <a
              href={getNaverMapSearchUrl(store)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${store.name} 네이버 지도에서 보기 (새 창)`}
            >
              <ExternalLink aria-hidden="true" />
              네이버 지도에서 보기
            </a>
          </Button>
        </div>
      </div>

      <p
        className={`mt-3 min-h-5 text-sm ${
          copyStatus === "error" ? "text-critical" : "text-success"
        }`}
        role="status"
        aria-live="polite"
      >
        {copyStatus === "success"
          ? "주소를 복사했어요."
          : copyStatus === "error"
            ? "주소를 복사하지 못했어요. 주소를 직접 선택해 복사해 주세요."
            : ""}
      </p>

      {position ? (
        <StoreLocationMap
          position={position}
          ariaLabel={`${store.name} 위치 지도`}
          className="mt-3 h-64 w-full rounded-2xl sm:h-80"
        />
      ) : (
        <div className="bg-surface text-muted mt-3 flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl px-6 text-center">
          <span className="bg-canvas flex size-12 items-center justify-center rounded-full">
            <MapPin aria-hidden="true" size={22} />
          </span>
          <p className="text-sm leading-6">
            지도에서 위치를 확인할 수 없어요. 주소로 가게를 확인해 주세요.
          </p>
        </div>
      )}
    </SectionCard>
  )
}

function StoreDetailSkeleton() {
  return (
    <div aria-label="가게 정보를 불러오는 중" aria-busy="true">
      <div className="border-hairline bg-canvas overflow-hidden rounded-2xl border">
        <div className="bg-surface aspect-[16/9] max-h-[420px] animate-pulse motion-reduce:animate-none" />
        <div className="grid gap-3 p-5 sm:p-7">
          <span className="bg-surface h-4 w-1/4 animate-pulse rounded motion-reduce:animate-none" />
          <span className="bg-surface h-9 w-2/3 animate-pulse rounded motion-reduce:animate-none" />
          <span className="bg-surface h-4 w-full animate-pulse rounded motion-reduce:animate-none" />
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="border-hairline bg-canvas h-36 animate-pulse rounded-2xl border motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  )
}

function ApiStoreDetail({
  store,
  isFavorite,
  favoritePending,
  favoriteUnavailable,
  mutationError,
  onToggleFavorite,
}: {
  store: StoreView
  isFavorite: boolean
  favoritePending: boolean
  favoriteUnavailable: boolean
  mutationError: string
  onToggleFavorite: () => void
}) {
  return (
    <>
      <div className="border-hairline bg-canvas overflow-hidden rounded-2xl border">
        <div className="relative aspect-[16/9] max-h-[420px]">
          <RepresentativeImage kind="store" className="h-full w-full" />
          <button
            type="button"
            className="bg-canvas/95 text-foreground absolute top-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            aria-pressed={isFavorite}
            disabled={favoritePending || favoriteUnavailable}
            onClick={onToggleFavorite}
          >
            <Heart
              aria-hidden="true"
              size={20}
              className={isFavorite ? "fill-primary text-primary" : undefined}
            />
            {favoritePending
              ? "찜 처리 중"
              : favoriteUnavailable
                ? "찜 확인 불가"
                : isFavorite
                  ? "찜한 가게"
                  : "찜하기"}
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
          {mutationError ? (
            <p className="text-critical mt-4 text-sm" role="alert">
              {mutationError}
            </p>
          ) : null}
          {favoriteUnavailable ? (
            <p className="text-warning mt-4 text-sm" role="status">
              찜 상태를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.
            </p>
          ) : null}
        </div>
      </div>

      <StoreLocationSection key={store.id} store={store} />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SectionCard>
          <h2 className="text-foreground flex items-center gap-2 font-bold">
            <Phone aria-hidden="true" size={20} />
            전화번호
          </h2>
          {store.phoneNumber ? (
            <a
              className="text-foreground mt-3 inline-flex min-h-11 items-center rounded text-sm font-semibold underline underline-offset-4"
              href={`tel:${store.phoneNumber.replace(/[^\d+]/g, "")}`}
            >
              {store.phoneNumber}
            </a>
          ) : (
            <p className="text-muted mt-3 text-sm leading-6">
              등록된 전화번호가 없어요.
            </p>
          )}
        </SectionCard>
      </div>

      <StoreDealsSection storeId={store.id} />
    </>
  )
}

function StoreDealsSection({ storeId }: { storeId: number }) {
  const dealsQuery = useQuery(storeDealsQueryOptions(storeId, 0, 20))

  return (
    <section className="mt-10" aria-labelledby="store-deals-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-brand-link mb-1 flex items-center gap-2 text-sm font-semibold">
            <Store aria-hidden="true" size={17} />
            오늘의 할인
          </p>
          <h2
            id="store-deals-title"
            className="text-foreground text-xl font-bold"
          >
            예약 가능한 할인
          </h2>
        </div>
        {dealsQuery.isSuccess ? (
          <span className="text-muted text-sm">
            {dealsQuery.data.totalElements}개
          </span>
        ) : null}
      </div>

      {dealsQuery.isPending ? <DealGridSkeleton count={2} /> : null}
      {dealsQuery.isError ? (
        <EmptyState
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
      {dealsQuery.isSuccess && dealsQuery.data.content.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {dealsQuery.data.content.map((deal) => (
            <DealCard key={deal.dealId} deal={deal} />
          ))}
        </div>
      ) : null}
      {dealsQuery.isSuccess && dealsQuery.data.content.length === 0 ? (
        <EmptyState
          title="오늘 공개한 할인이 없어요"
          description="다른 가게의 할인도 둘러보세요."
          action={
            <Button asChild variant="secondary">
              <Link to="/app">오늘의 할인 보기</Link>
            </Button>
          }
        />
      ) : null}
    </section>
  )
}

export function StoreDetailPage() {
  const { storeId } = useParams()
  const numericStoreId = parseNumericStoreId(storeId)
  const hasValidStoreId = numericStoreId !== null
  const queryClient = useQueryClient()
  const [mutationError, setMutationError] = useState("")
  const storeQuery = useQuery({
    ...storeQueryOptions(numericStoreId ?? 0),
    enabled: hasValidStoreId,
  })
  const favoritesQuery = useQuery({
    ...favoriteStoresQueryOptions(),
    enabled: hasValidStoreId && storeQuery.isSuccess,
  })
  const favoriteMutation = useMutation({
    mutationFn: ({
      targetStoreId,
      shouldFavorite,
    }: {
      targetStoreId: number
      shouldFavorite: boolean
    }) =>
      shouldFavorite
        ? addFavorite(targetStoreId)
        : removeFavorite(targetStoreId),
    onMutate: () => setMutationError(""),
    onSuccess: async (_data, variables) => {
      queryClient.setQueryData<StoreView[]>(
        customerQueryKeys.favorites,
        (current = []) => {
          if (!storeQuery.data) return current
          if (variables.shouldFavorite) {
            return current.some((store) => store.id === variables.targetStoreId)
              ? current
              : [...current, storeQuery.data]
          }
          return current.filter((store) => store.id !== variables.targetStoreId)
        },
      )
      await queryClient.invalidateQueries({
        queryKey: customerQueryKeys.favorites,
      })
    },
    onError: (error) => {
      setMutationError(
        isUnauthorizedError(error)
          ? "로그인이 만료되어 찜 상태를 바꾸지 못했어요. 다시 로그인해 주세요."
          : "찜 상태를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.",
      )
    },
  })

  const storeName = storeQuery.data?.name ?? "가게 상세"
  const isFavorite =
    numericStoreId !== null &&
    (favoritesQuery.data?.some((store) => store.id === numericStoreId) ?? false)

  useDocumentTitle(storeName)

  if (!hasValidStoreId) {
    return (
      <CustomerPage className="max-w-4xl">
        <BackButton />
        <EmptyState
          title="가게를 찾을 수 없어요"
          description="주소를 다시 확인하거나 다른 가게를 살펴보세요."
          action={
            <Button asChild variant="secondary">
              <Link to="/app">가게 둘러보기</Link>
            </Button>
          }
        />
      </CustomerPage>
    )
  }

  const unauthorized = isUnauthorizedError(storeQuery.error)
  const notFound =
    storeQuery.error instanceof ApiError && storeQuery.error.status === 404

  return (
    <CustomerPage className="max-w-4xl">
      <BackButton />

      {storeQuery.isPending ? <StoreDetailSkeleton /> : null}

      {storeQuery.isError ? (
        <EmptyState
          title={
            unauthorized
              ? "가게 정보를 보려면 로그인이 필요해요"
              : notFound
                ? "가게를 찾을 수 없어요"
                : "가게 정보를 불러오지 못했어요"
          }
          description={
            unauthorized
              ? "로그인한 뒤 가게 정보와 찜 상태를 확인할 수 있어요."
              : notFound
                ? "주소를 다시 확인하거나 다른 가게를 살펴보세요."
                : "연결 상태를 확인한 뒤 다시 불러와 주세요."
          }
          action={
            unauthorized ? (
              <Button asChild>
                <Link to="/login">로그인하기</Link>
              </Button>
            ) : notFound ? (
              <Button asChild variant="secondary">
                <Link to="/app">가게 둘러보기</Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void storeQuery.refetch()}
              >
                <RefreshCw aria-hidden="true" />
                다시 불러오기
              </Button>
            )
          }
        />
      ) : null}

      {storeQuery.isSuccess ? (
        <ApiStoreDetail
          store={storeQuery.data}
          isFavorite={isFavorite}
          favoritePending={
            favoritesQuery.isPending || favoriteMutation.isPending
          }
          favoriteUnavailable={favoritesQuery.isError}
          mutationError={mutationError}
          onToggleFavorite={() =>
            favoriteMutation.mutate({
              targetStoreId: storeQuery.data.id,
              shouldFavorite: !isFavorite,
            })
          }
        />
      ) : null}
    </CustomerPage>
  )
}
