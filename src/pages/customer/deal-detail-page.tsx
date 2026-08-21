import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  Clock3,
  MapPin,
  Minus,
  PackageOpen,
  Plus,
  RefreshCw,
  Store,
  X,
} from "lucide-react"
import { Link, useLocation, useNavigate, useParams } from "react-router"

import { hasUsableAccessToken } from "../../features/auth/auth-session"
import {
  createReservation,
  customerQueryKeys,
  dealQueryOptions,
  parseNumericDealId,
  storeQueryOptions,
  type DealItemDto,
  type ReservationCreateRequest,
} from "../../features/customer/customer-api"
import {
  BackButton,
  CustomerPage,
  EmptyState,
  formatDateTime,
  formatWon,
  SectionCard,
} from "../../features/customer/customer-components"
import { ApiError } from "../../shared/api/client"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"
import { RepresentativeImage } from "../../shared/ui/representative-image"

type SelectedDealItem = DealItemDto & { quantity: number }

function createIdempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }
  return `reservation-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getReservationErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "예약하지 못했어요. 연결 상태를 확인한 뒤 다시 시도해 주세요."
  }

  const code =
    typeof error.payload === "object" &&
    error.payload !== null &&
    "code" in error.payload
      ? String(error.payload.code)
      : ""

  if (error.status === 401) return "로그인이 만료됐어요. 다시 로그인해 주세요."
  if (code === "OUT_OF_STOCK") {
    return "선택한 품목의 남은 수량이 바뀌었어요. 수량을 다시 확인해 주세요."
  }
  if (code === "DEAL_NOT_RESERVABLE") {
    return "이 할인은 예약이 마감됐어요. 다른 할인을 선택해 주세요."
  }
  if (code === "RESERVATION_ALREADY_EXISTS") {
    return "이미 예약한 할인이에요. 내 예약에서 내용을 확인해 주세요."
  }
  return "예약하지 못했어요. 잠시 후 다시 시도해 주세요."
}

function DealDetailSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
      aria-label="할인 정보를 불러오는 중"
      aria-busy="true"
    >
      <div className="border-hairline bg-canvas overflow-hidden rounded-2xl border">
        <div className="bg-surface aspect-[4/3] animate-pulse motion-reduce:animate-none" />
        <div className="grid gap-3 p-6">
          <span className="bg-surface h-5 w-1/3 animate-pulse rounded motion-reduce:animate-none" />
          <span className="bg-surface h-8 w-2/3 animate-pulse rounded motion-reduce:animate-none" />
          <span className="bg-surface h-6 w-1/2 animate-pulse rounded motion-reduce:animate-none" />
        </div>
      </div>
      <div className="border-hairline bg-canvas h-96 animate-pulse rounded-2xl border motion-reduce:animate-none" />
    </div>
  )
}

export function DealDetailPage() {
  const { dealId } = useParams()
  const numericDealId = parseNumericDealId(dealId)
  const hasValidDealId = numericDealId !== null
  const authenticated = hasUsableAccessToken()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [reservationError, setReservationError] = useState("")
  const attemptRef = useRef<{
    fingerprint: string
    idempotencyKey: string
  } | null>(null)
  const dealQuery = useQuery({
    ...dealQueryOptions(numericDealId ?? 0),
    enabled: hasValidDealId,
  })
  const storeQuery = useQuery({
    ...storeQueryOptions(dealQuery.data?.storeId ?? 0),
    enabled: dealQuery.isSuccess,
  })
  const deal = dealQuery.data
  const title =
    deal?.description?.trim() ||
    (deal ? `${deal.storeName ?? "가게"}의 오늘 할인` : "할인 상세")

  useDocumentTitle(title)

  const selectedItems = useMemo<SelectedDealItem[]>(
    () =>
      (deal?.items ?? [])
        .map((item) => ({
          ...item,
          quantity: Math.min(
            quantities[item.dealItemId] ?? 0,
            item.remainingQuantity,
            10,
          ),
        }))
        .filter((item) => item.quantity > 0),
    [deal?.items, quantities],
  )
  const totalQuantity = selectedItems.reduce(
    (total, item) => total + item.quantity,
    0,
  )
  const totalPrice = selectedItems.reduce(
    (total, item) => total + item.salePrice * item.quantity,
    0,
  )
  const totalRemaining = (deal?.items ?? []).reduce(
    (total, item) => total + item.remainingQuantity,
    0,
  )
  const lowestPrice =
    deal && deal.items.length > 0
      ? Math.min(...deal.items.map((item) => item.salePrice))
      : 0
  const isReservable = deal?.status === "SELLING" && totalRemaining > 0

  const reservationMutation = useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: ReservationCreateRequest
      idempotencyKey: string
    }) => createReservation(request, idempotencyKey),
    onMutate: () => setReservationError(""),
    onSuccess: async (reservation) => {
      queryClient.setQueryData(
        customerQueryKeys.reservation(reservation.reservationId),
        reservation,
      )
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: customerQueryKeys.deal(reservation.dealId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "deals", "selling"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "reservations"],
        }),
      ])
      navigate(
        `/reservations/complete?reservationId=${reservation.reservationId}`,
        { state: { reservation } },
      )
    },
    onError: (error) => {
      setReservationError(getReservationErrorMessage(error))
      if (error instanceof ApiError) {
        const code =
          typeof error.payload === "object" &&
          error.payload !== null &&
          "code" in error.payload
            ? String(error.payload.code)
            : ""
        if (code === "OUT_OF_STOCK" || code === "DEAL_NOT_RESERVABLE") {
          void dealQuery.refetch()
        }
      }
    },
  })

  if (!hasValidDealId) {
    return (
      <CustomerPage>
        <BackButton />
        <EmptyState
          title="할인을 찾을 수 없어요"
          description="주소를 다시 확인하거나 다른 할인을 살펴보세요."
          action={
            <Button asChild variant="secondary">
              <Link to="/app">오늘의 할인 보기</Link>
            </Button>
          }
        />
      </CustomerPage>
    )
  }

  if (dealQuery.isPending) {
    return (
      <CustomerPage className="max-w-6xl">
        <BackButton />
        <DealDetailSkeleton />
      </CustomerPage>
    )
  }

  if (dealQuery.isError || !deal) {
    const notFound =
      dealQuery.error instanceof ApiError && dealQuery.error.status === 404
    return (
      <CustomerPage>
        <BackButton />
        <EmptyState
          title={
            notFound ? "할인을 찾을 수 없어요" : "할인 정보를 불러오지 못했어요"
          }
          description={
            notFound
              ? "판매가 끝났거나 주소가 올바르지 않을 수 있어요."
              : "연결 상태를 확인한 뒤 다시 불러와 주세요."
          }
          action={
            notFound ? (
              <Button asChild variant="secondary">
                <Link to="/app">오늘의 할인 보기</Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void dealQuery.refetch()}
              >
                <RefreshCw aria-hidden="true" />
                다시 불러오기
              </Button>
            )
          }
        />
      </CustomerPage>
    )
  }

  const changeQuantity = (itemId: number, next: number, max: number) => {
    setReservationError("")
    attemptRef.current = null
    setQuantities((current) => ({
      ...current,
      [itemId]: Math.min(Math.max(next, 0), max, 10),
    }))
  }

  const submitReservation = () => {
    if (!authenticated) {
      const redirectTo = `${location.pathname}${location.search}`
      navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`)
      return
    }

    const request: ReservationCreateRequest = {
      dealId: deal.dealId,
      items: selectedItems.map((item) => ({
        dealItemId: item.dealItemId,
        quantity: item.quantity,
      })),
    }
    const fingerprint = JSON.stringify(request)
    if (attemptRef.current?.fingerprint !== fingerprint) {
      attemptRef.current = {
        fingerprint,
        idempotencyKey: createIdempotencyKey(),
      }
    }
    reservationMutation.mutate({
      request,
      idempotencyKey: attemptRef.current.idempotencyKey,
    })
  }

  const openReservationReview = () => {
    if (!authenticated) {
      const redirectTo = `${location.pathname}${location.search}`
      navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`)
      return
    }

    setReservationError("")
    setIsReviewOpen(true)
  }

  return (
    <>
      <CustomerPage className="max-w-6xl pb-28 lg:pb-10">
        <BackButton />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-5">
            <div className="border-hairline bg-canvas overflow-hidden rounded-2xl border">
              <RepresentativeImage
                kind="deal"
                className="aspect-[4/3] max-h-[560px] w-full"
              />

              <div className="p-5 sm:p-7">
                <Link
                  to={`/stores/${deal.storeId}`}
                  className="text-muted inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold"
                >
                  <Store aria-hidden="true" size={18} />
                  {deal.storeName ?? "가게 정보"}
                </Link>
                <h1
                  data-route-heading
                  tabIndex={-1}
                  className="text-foreground mt-1 text-2xl font-bold sm:text-3xl"
                >
                  {title}
                </h1>
                <p className="text-foreground mt-4 text-2xl font-bold tabular-nums">
                  {formatWon(lowestPrice)}부터
                </p>
              </div>
            </div>

            <SectionCard>
              <h2 className="text-foreground text-lg font-bold">예약 안내</h2>
              <dl className="mt-4 grid gap-4 text-sm">
                <div className="flex gap-3">
                  <Clock3
                    aria-hidden="true"
                    className="text-muted mt-0.5 shrink-0"
                    size={20}
                  />
                  <div>
                    <dt className="text-muted">예약 마감</dt>
                    <dd className="text-foreground mt-1 font-semibold">
                      {formatDateTime(deal.salesEndsAt)}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin
                    aria-hidden="true"
                    className="text-muted mt-0.5 shrink-0"
                    size={20}
                  />
                  <div>
                    <dt className="text-muted">픽업 장소</dt>
                    <dd className="text-foreground mt-1 font-semibold">
                      {storeQuery.data?.address ?? deal.storeName ?? "가게"}
                    </dd>
                    <dd className="text-muted mt-1 leading-6">
                      방문 전에 가게 위치와 운영 시간을 확인해 주세요.
                    </dd>
                  </div>
                </div>
              </dl>
            </SectionCard>
          </div>

          <SectionCard className="lg:sticky lg:top-24">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-foreground text-lg font-bold">품목 선택</h2>
                <p className="text-muted mt-1 text-sm">
                  품목별로 최대 10개까지 선택할 수 있어요.
                </p>
              </div>
              <span className="text-warning flex shrink-0 items-center gap-1 text-sm font-semibold">
                <PackageOpen aria-hidden="true" size={18} />총 {totalRemaining}
                개
              </span>
            </div>

            <div className="divide-hairline divide-y">
              {deal.items.map((item) => {
                const maxQuantity = Math.min(item.remainingQuantity, 10)
                const quantity = Math.min(
                  quantities[item.dealItemId] ?? 0,
                  maxQuantity,
                )
                const itemAvailable =
                  isReservable && item.status === "SELLING" && maxQuantity > 0
                return (
                  <div key={item.dealItemId} className="py-5 first:pt-0">
                    <h3 className="text-foreground font-semibold">
                      {item.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-baseline gap-2">
                      <span className="text-brand-link text-sm font-semibold">
                        {item.discountRate}%
                      </span>
                      <strong className="text-foreground tabular-nums">
                        {formatWon(item.salePrice)}
                      </strong>
                      <span className="text-muted text-xs tabular-nums line-through">
                        {formatWon(item.originalPrice)}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-xs font-semibold ${
                        itemAvailable ? "text-warning" : "text-muted"
                      }`}
                    >
                      {itemAvailable
                        ? `${item.remainingQuantity}개 남았어요`
                        : "품절된 품목이에요"}
                    </p>
                    <div
                      className="mt-3 flex items-center justify-end gap-1"
                      role="group"
                      aria-label={`${item.name} 수량`}
                    >
                      <button
                        type="button"
                        className="border-hairline bg-canvas inline-flex size-11 items-center justify-center rounded-xl border disabled:opacity-40"
                        aria-label={`${item.name} 수량 줄이기`}
                        disabled={
                          quantity === 0 || reservationMutation.isPending
                        }
                        onClick={() =>
                          changeQuantity(
                            item.dealItemId,
                            quantity - 1,
                            maxQuantity,
                          )
                        }
                      >
                        <Minus aria-hidden="true" size={18} />
                      </button>
                      <output
                        className="text-foreground inline-flex min-w-11 items-center justify-center font-bold tabular-nums"
                        aria-live="polite"
                      >
                        {quantity}
                      </output>
                      <button
                        type="button"
                        className="border-hairline bg-canvas inline-flex size-11 items-center justify-center rounded-xl border disabled:opacity-40"
                        aria-label={`${item.name} 수량 늘리기`}
                        disabled={
                          !itemAvailable ||
                          quantity >= maxQuantity ||
                          reservationMutation.isPending
                        }
                        onClick={() =>
                          changeQuantity(
                            item.dealItemId,
                            quantity + 1,
                            maxQuantity,
                          )
                        }
                      >
                        <Plus aria-hidden="true" size={18} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {!isReservable ? (
              <p className="bg-surface text-muted mt-4 rounded-xl p-4 text-sm leading-6">
                이 할인은 예약이 마감됐어요.
              </p>
            ) : null}

            <div className="border-hairline mt-1 border-t pt-5">
              <div className="mb-4 flex items-end justify-between gap-4">
                <span className="text-muted text-sm">총 {totalQuantity}개</span>
                <strong className="text-foreground text-xl tabular-nums">
                  {formatWon(totalPrice)}
                </strong>
              </div>
              <Button
                type="button"
                className="hidden w-full lg:inline-flex"
                disabled={
                  !isReservable || (authenticated && totalQuantity === 0)
                }
                onClick={openReservationReview}
              >
                {authenticated ? "선택 확인하기" : "로그인하고 예약하기"}
              </Button>
            </div>
          </SectionCard>
        </div>
      </CustomerPage>

      <div className="border-hairline bg-canvas fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t p-3 md:bottom-0 md:pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div className="min-w-24">
            <p className="text-muted text-xs">총 {totalQuantity}개</p>
            <p className="text-foreground font-bold tabular-nums">
              {formatWon(totalPrice)}
            </p>
          </div>
          <Button
            type="button"
            className="flex-1"
            disabled={!isReservable || (authenticated && totalQuantity === 0)}
            onClick={openReservationReview}
          >
            {authenticated ? "선택 확인하기" : "로그인하고 예약하기"}
          </Button>
        </div>
      </div>

      {isReviewOpen ? (
        <ReservationReviewDialog
          storeName={deal.storeName ?? "가게"}
          reservationDeadline={formatDateTime(deal.salesEndsAt)}
          items={selectedItems}
          totalPrice={totalPrice}
          errorMessage={reservationError}
          isSubmitting={reservationMutation.isPending}
          onClose={() => setIsReviewOpen(false)}
          onSubmit={submitReservation}
        />
      ) : null}
    </>
  )
}

function ReservationReviewDialog({
  storeName,
  reservationDeadline,
  items,
  totalPrice,
  errorMessage,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  storeName: string
  reservationDeadline: string
  items: SelectedDealItem[]
  totalPrice: number
  errorMessage: string
  isSubmitting: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const dialogRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    titleRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose()
        return
      }

      if (event.key !== "Tab") return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [isSubmitting, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose()
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-review-title"
        className="bg-canvas max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:rounded-2xl sm:p-6"
      >
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-brand-link mb-1 text-sm font-semibold">
              예약 전 확인
            </p>
            <h2
              ref={titleRef}
              id="reservation-review-title"
              tabIndex={-1}
              className="text-foreground text-xl font-bold"
            >
              선택한 내용이 맞나요?
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="예약 확인 닫기"
            disabled={isSubmitting}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </header>

        <dl className="border-hairline divide-hairline divide-y rounded-xl border px-4 text-sm">
          <div className="grid grid-cols-[88px_1fr] gap-3 py-4">
            <dt className="text-muted">가게</dt>
            <dd className="text-foreground font-semibold">{storeName}</dd>
          </div>
          <div className="grid grid-cols-[88px_1fr] gap-3 py-4">
            <dt className="text-muted">예약 마감</dt>
            <dd className="text-foreground font-semibold">
              {reservationDeadline}
            </dd>
          </div>
          <div className="grid grid-cols-[88px_1fr] gap-3 py-4">
            <dt className="text-muted">품목</dt>
            <dd className="grid gap-2">
              {items.map((item) => (
                <span
                  key={item.dealItemId}
                  className="flex justify-between gap-3"
                >
                  <span>
                    {item.name} {item.quantity}개
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatWon(item.salePrice * item.quantity)}
                  </span>
                </span>
              ))}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-muted text-sm">총 금액</span>
          <strong className="text-foreground text-xl tabular-nums">
            {formatWon(totalPrice)}
          </strong>
        </div>

        <p className="bg-brand-tint text-brand-brown mt-5 flex gap-2 rounded-xl p-4 text-sm leading-6">
          <Check aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
          예약이 완료되면 가게에서 상품을 픽업해 주세요.
        </p>

        {errorMessage ? (
          <p className="text-critical mt-4 text-sm leading-6" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-[auto_1fr] gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={onClose}
          >
            다시 고르기
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={onSubmit}>
            {isSubmitting ? "예약하는 중" : "예약하기"}
          </Button>
        </div>
      </section>
    </div>
  )
}
