import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Heart, MapPin, Phone, RefreshCw, Store } from "lucide-react"
import { Link } from "react-router"

import {
  customerQueryKeys,
  favoriteStoresQueryOptions,
  isUnauthorizedError,
  removeFavorite,
  type StoreView,
} from "../../features/customer/customer-api"
import {
  CustomerPage,
  EmptyState,
  PageIntro,
} from "../../features/customer/customer-components"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

function FavoriteStoreCard({
  store,
  isRemoving,
  onRemove,
}: {
  store: StoreView
  isRemoving: boolean
  onRemove: (store: StoreView) => void
}) {
  return (
    <article className="border-hairline bg-canvas overflow-hidden rounded-2xl border">
      <Link
        to={`/stores/${store.routeId}`}
        className="bg-surface text-muted flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-t-2xl px-6 text-center"
        aria-label={`${store.name} 가게 상세 보기`}
      >
        <span className="bg-canvas flex size-14 items-center justify-center rounded-full">
          <Store aria-hidden="true" size={24} />
        </span>
        <span className="text-sm">대표 이미지를 준비하고 있어요</span>
      </Link>

      <div className="p-5">
        <p className="text-brand-link flex items-center gap-2 text-sm font-semibold">
          <MapPin aria-hidden="true" size={17} />
          {store.district}
        </p>
        <Link
          to={`/stores/${store.routeId}`}
          className="text-foreground mt-2 block rounded text-xl font-bold"
        >
          {store.name}
        </Link>
        <p className="text-muted mt-2 line-clamp-2 text-sm leading-6">
          {store.description}
        </p>
        <p className="text-muted mt-4 flex min-h-6 items-center gap-2 text-sm">
          <Phone aria-hidden="true" size={18} />
          {store.phoneNumber ?? "전화번호를 준비하고 있어요"}
        </p>

        <div className="bg-surface text-muted mt-5 rounded-xl p-4 text-sm leading-6">
          할인 정보는 아직 서버에서 제공하지 않아요. 가게 정보는 상세 화면에서
          확인할 수 있어요.
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary" className="flex-1">
            <Link to={`/stores/${store.routeId}`}>가게 정보 보기</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            aria-label={`${store.name} 찜 해제`}
            disabled={isRemoving}
            onClick={() => onRemove(store)}
          >
            <Heart aria-hidden="true" className="fill-primary text-primary" />
            {isRemoving ? "찜 해제 중" : "찜 해제"}
          </Button>
        </div>
      </div>
    </article>
  )
}

function FavoriteGridSkeleton() {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:gap-6"
      aria-label="찜한 가게를 불러오는 중"
      aria-busy="true"
    >
      {[0, 1].map((index) => (
        <div
          key={index}
          className="border-hairline bg-canvas overflow-hidden rounded-2xl border"
        >
          <div className="bg-surface aspect-[4/3] animate-pulse motion-reduce:animate-none" />
          <div className="grid gap-3 p-5">
            <span className="bg-surface h-4 w-1/3 animate-pulse rounded motion-reduce:animate-none" />
            <span className="bg-surface h-7 w-2/3 animate-pulse rounded motion-reduce:animate-none" />
            <span className="bg-surface h-4 w-full animate-pulse rounded motion-reduce:animate-none" />
            <span className="bg-surface h-11 w-full animate-pulse rounded-xl motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function FavoritesPage() {
  useDocumentTitle("찜한 가게")
  const queryClient = useQueryClient()
  const favoritesQuery = useQuery(favoriteStoresQueryOptions())
  const [notice, setNotice] = useState("")
  const [mutationError, setMutationError] = useState("")

  const removeMutation = useMutation({
    mutationFn: (store: StoreView) => removeFavorite(store.id),
    onMutate: () => {
      setMutationError("")
    },
    onSuccess: async (_data, removedStore) => {
      queryClient.setQueryData<StoreView[]>(
        customerQueryKeys.favorites,
        (current) =>
          current?.filter((store) => store.id !== removedStore.id) ?? [],
      )
      setNotice(`${removedStore.name} 찜을 해제했어요.`)
      await queryClient.invalidateQueries({
        queryKey: customerQueryKeys.favorites,
      })
    },
    onError: (error) => {
      setMutationError(
        isUnauthorizedError(error)
          ? "로그인이 만료되어 찜을 해제하지 못했어요. 다시 로그인해 주세요."
          : "찜을 해제하지 못했어요. 잠시 후 다시 시도해 주세요.",
      )
    },
  })

  const favoriteStores = favoritesQuery.data ?? []
  const unauthorized = isUnauthorizedError(favoritesQuery.error)

  return (
    <CustomerPage>
      <PageIntro
        eyebrow="다시 만나고 싶은 곳"
        title="찜한 가게"
        description="관심 있는 가게를 모아보고 상세 정보를 확인해 보세요."
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-foreground text-lg font-bold">내 찜 목록</h2>
        {!favoritesQuery.isPending && !favoritesQuery.isError ? (
          <p className="text-muted text-sm" aria-live="polite">
            {favoriteStores.length}개의 가게
          </p>
        ) : null}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {notice}
      </p>
      {mutationError ? (
        <p
          className="border-critical/20 bg-canvas text-critical mb-4 rounded-xl border px-4 py-3 text-sm"
          role="alert"
        >
          {mutationError}
        </p>
      ) : null}

      {favoritesQuery.isPending ? <FavoriteGridSkeleton /> : null}

      {favoritesQuery.isError ? (
        <EmptyState
          title={
            unauthorized
              ? "찜한 가게를 보려면 로그인이 필요해요"
              : "찜한 가게를 불러오지 못했어요"
          }
          description={
            unauthorized
              ? "로그인한 뒤 저장한 가게를 다시 확인할 수 있어요."
              : "연결 상태를 확인한 뒤 다시 불러와 주세요."
          }
          action={
            unauthorized ? (
              <Button asChild>
                <Link to="/login">로그인하기</Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void favoritesQuery.refetch()}
              >
                <RefreshCw aria-hidden="true" />
                다시 불러오기
              </Button>
            )
          }
        />
      ) : null}

      {favoritesQuery.isSuccess && favoriteStores.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {favoriteStores.map((store) => (
            <FavoriteStoreCard
              key={store.id}
              store={store}
              isRemoving={
                removeMutation.isPending &&
                removeMutation.variables.id === store.id
              }
              onRemove={(selectedStore) => removeMutation.mutate(selectedStore)}
            />
          ))}
        </div>
      ) : null}

      {favoritesQuery.isSuccess && favoriteStores.length === 0 ? (
        <EmptyState
          title="아직 찜한 가게가 없어요"
          description="마음에 드는 가게를 찜해 두면 이곳에서 다시 확인할 수 있어요."
          action={
            <Button asChild>
              <Link to="/app">가게 둘러보기</Link>
            </Button>
          }
        />
      ) : null}
    </CustomerPage>
  )
}
