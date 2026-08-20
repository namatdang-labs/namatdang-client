import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Clock3,
  Heart,
  Image as ImageIcon,
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
  storeQueryOptions,
  type StoreView,
} from "../../features/customer/customer-api"
import {
  BackButton,
  CustomerPage,
  DealCard,
  EmptyState,
  SectionCard,
} from "../../features/customer/customer-components"
import {
  deals,
  getStore as getMockStore,
} from "../../features/customer/customer-data"
import { ApiError } from "../../shared/api/client"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

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
        <div className="bg-surface text-muted relative flex aspect-[16/9] max-h-[420px] flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="bg-canvas flex size-14 items-center justify-center rounded-full">
            <ImageIcon aria-hidden="true" size={24} />
          </span>
          <span className="text-sm">대표 이미지를 준비하고 있어요</span>
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

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <SectionCard>
          <h2 className="text-foreground flex items-center gap-2 font-bold">
            <MapPin aria-hidden="true" size={20} />
            가게 위치
          </h2>
          <p className="text-muted mt-3 text-sm leading-6">{store.address}</p>
          {store.latitude !== null && store.longitude !== null ? (
            <p className="text-muted mt-2 text-xs tabular-nums">
              위도 {store.latitude}, 경도 {store.longitude}
            </p>
          ) : null}
        </SectionCard>
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
              전화번호를 준비하고 있어요.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard className="mt-4">
        <h2 className="text-foreground flex items-center gap-2 font-bold">
          <Clock3 aria-hidden="true" size={20} />
          영업시간
        </h2>
        <p className="text-muted mt-3 text-sm leading-6">
          영업시간은 아직 서버에서 제공하지 않아요. 방문 전 가게에 문의해
          주세요.
        </p>
      </SectionCard>

      <section className="mt-10" aria-labelledby="store-deals-title">
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
        <EmptyState
          title="할인 목록 연결을 준비하고 있어요"
          description="현재 서버에는 가게별 할인 조회 API가 없어 실제 가게 정보만 보여 드리고 있어요."
        />
      </section>
    </>
  )
}

function MockStoreDetail({ storeId }: { storeId: string }) {
  const store = getMockStore(storeId)
  const storeDeals = deals.filter((deal) => deal.storeId === storeId)

  if (!store) {
    return (
      <>
        <h1 data-route-heading tabIndex={-1} className="text-2xl font-bold">
          가게를 찾을 수 없어요
        </h1>
        <p className="text-muted mt-3">홈에서 다른 가게를 살펴보세요.</p>
      </>
    )
  }

  return (
    <>
      <p className="bg-brand-tint text-brand-brown mb-4 rounded-xl px-4 py-3 text-sm leading-6">
        이 화면은 기존 디자인을 확인하기 위한 예시 데이터예요. 숫자로 된 실제
        가게 주소에서 서버 데이터와 찜 기능을 사용할 수 있어요.
      </p>
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
            className="bg-canvas/95 text-muted absolute top-4 right-4 inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-full px-4 text-sm font-semibold"
            disabled
          >
            <Heart aria-hidden="true" size={20} />
            예시 화면
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
        </SectionCard>
      </div>

      <section className="mt-10" aria-labelledby="mock-store-deals-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-brand-link mb-1 flex items-center gap-2 text-sm font-semibold">
              <Store aria-hidden="true" size={17} />
              디자인 예시 할인
            </p>
            <h2
              id="mock-store-deals-title"
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
            description="다른 가게의 예시 할인을 살펴보세요."
          />
        )}
      </section>
    </>
  )
}

export function StoreDetailPage() {
  const { storeId } = useParams()
  const numericStoreId = parseNumericStoreId(storeId)
  const isApiStore = numericStoreId !== null
  const queryClient = useQueryClient()
  const [mutationError, setMutationError] = useState("")
  const storeQuery = useQuery({
    ...storeQueryOptions(numericStoreId ?? 0),
    enabled: isApiStore,
  })
  const favoritesQuery = useQuery({
    ...favoriteStoresQueryOptions(),
    enabled: isApiStore && storeQuery.isSuccess,
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

  const mockStore = isApiStore ? undefined : getMockStore(storeId)
  const storeName = storeQuery.data?.name ?? mockStore?.name ?? "가게 상세"
  const isFavorite =
    numericStoreId !== null &&
    (favoritesQuery.data?.some((store) => store.id === numericStoreId) ?? false)

  useDocumentTitle(storeName)

  if (!isApiStore) {
    return (
      <CustomerPage className="max-w-4xl">
        <BackButton />
        <MockStoreDetail storeId={storeId ?? ""} />
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
              ? "로그인한 뒤 실제 가게 정보와 찜 상태를 확인할 수 있어요."
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
