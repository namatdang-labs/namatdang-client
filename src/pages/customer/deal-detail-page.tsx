import { useEffect, useRef, useState } from "react"
import {
  Check,
  Clock3,
  Heart,
  MapPin,
  Minus,
  PackageOpen,
  Plus,
  Store,
  X,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import {
  BackButton,
  CustomerPage,
  SectionCard,
} from "../../features/customer/customer-components"
import {
  formatWon,
  getDeal,
  getDiscountRate,
  getStore,
  type ReservationDraft,
} from "../../features/customer/customer-data"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

export function DealDetailPage() {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const deal = getDeal(dealId)
  const store = getStore(deal?.storeId)
  const [liked, setLiked] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  useDocumentTitle(deal?.title ?? "할인 상세")

  const selectedItems = (deal?.items ?? [])
    .map((item) => ({ ...item, quantity: quantities[item.id] ?? 0 }))
    .filter((item) => item.quantity > 0)
  const totalQuantity = selectedItems.reduce(
    (total, item) => total + item.quantity,
    0,
  )
  const totalPrice = selectedItems.reduce(
    (total, item) => total + item.salePrice * item.quantity,
    0,
  )

  if (!deal || !store) {
    return (
      <CustomerPage>
        <BackButton />
        <h1 data-route-heading tabIndex={-1} className="text-2xl font-bold">
          할인을 찾을 수 없어요
        </h1>
        <p className="text-muted mt-3">
          판매가 마감됐거나 정보가 바뀌었을 수 있어요.
        </p>
      </CustomerPage>
    )
  }

  const changeQuantity = (itemId: string, next: number, max: number) => {
    setQuantities((current) => ({
      ...current,
      [itemId]: Math.min(Math.max(next, 0), max),
    }))
  }

  const submitReservation = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => window.setTimeout(resolve, 600))

    const draft: ReservationDraft = {
      reservationNumber: "NMD-0818-1842",
      dealId: deal.id,
      storeId: store.id,
      storeName: store.name,
      pickupDate: "8월 18일 오늘",
      pickupTime: `${deal.pickupStart} ~ ${deal.pickupEnd}`,
      items: selectedItems,
      totalPrice,
      totalQuantity,
    }

    navigate("/reservations/complete", { state: { reservation: draft } })
  }

  return (
    <>
      <CustomerPage className="max-w-6xl pb-28 lg:pb-10">
        <BackButton />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-5">
            <div className="border-hairline bg-canvas overflow-hidden rounded-2xl border">
              <div className="bg-surface relative aspect-[4/3] max-h-[560px]">
                <img
                  src={deal.imageUrl}
                  alt={`${deal.title} 상품`}
                  className="h-full w-full object-cover"
                  fetchPriority="high"
                />
                <button
                  type="button"
                  className="bg-canvas/95 absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-full"
                  aria-label={
                    liked ? `${store.name} 찜 해제` : `${store.name} 찜하기`
                  }
                  aria-pressed={liked}
                  onClick={() => setLiked((value) => !value)}
                >
                  <Heart
                    aria-hidden="true"
                    className={liked ? "fill-primary text-primary" : undefined}
                  />
                </button>
              </div>

              <div className="p-5 sm:p-7">
                <Link
                  to={`/stores/${store.id}`}
                  className="text-muted inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold"
                >
                  <Store aria-hidden="true" size={18} />
                  {store.name} · {store.district}
                </Link>
                <h1
                  data-route-heading
                  tabIndex={-1}
                  className="text-foreground mt-1 text-2xl font-bold sm:text-3xl"
                >
                  {deal.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-brand-link text-lg font-bold">
                    {getDiscountRate(deal.originalPrice, deal.salePrice)}%
                  </span>
                  <strong className="text-foreground text-2xl tabular-nums">
                    {formatWon(deal.salePrice)}
                  </strong>
                  <span className="text-muted text-sm tabular-nums line-through">
                    {formatWon(deal.originalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <SectionCard>
              <h2 className="text-foreground text-lg font-bold">픽업 안내</h2>
              <dl className="mt-4 grid gap-4 text-sm">
                <div className="flex gap-3">
                  <Clock3
                    aria-hidden="true"
                    className="text-muted mt-0.5 shrink-0"
                    size={20}
                  />
                  <div>
                    <dt className="text-muted">픽업 시간</dt>
                    <dd className="text-foreground mt-1 font-semibold">
                      오늘 {deal.pickupStart} ~ {deal.pickupEnd}
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
                      {store.address}
                    </dd>
                    <dd className="text-muted mt-1 leading-6">
                      {store.pickupGuide}
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
                  원하는 수량을 골라 주세요.
                </p>
              </div>
              <span className="text-warning flex shrink-0 items-center gap-1 text-sm font-semibold">
                <PackageOpen aria-hidden="true" size={18} />총 {deal.stock}개
              </span>
            </div>

            <div className="divide-hairline divide-y">
              {deal.items.map((item) => {
                const quantity = quantities[item.id] ?? 0
                return (
                  <div key={item.id} className="py-5 first:pt-0">
                    <h3 className="text-foreground font-semibold">
                      {item.name}
                    </h3>
                    <p className="text-muted mt-1 text-xs leading-5">
                      {item.description}
                    </p>
                    <p className="text-foreground mt-2 font-bold tabular-nums">
                      {formatWon(item.salePrice)}
                      <span className="text-muted ml-2 text-xs font-normal line-through">
                        {formatWon(item.originalPrice)}
                      </span>
                    </p>
                    <p className="text-warning mt-1 text-xs font-semibold">
                      {item.stock}개 남았어요
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
                        disabled={quantity === 0}
                        onClick={() =>
                          changeQuantity(item.id, quantity - 1, item.stock)
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
                        disabled={quantity === item.stock}
                        onClick={() =>
                          changeQuantity(item.id, quantity + 1, item.stock)
                        }
                      >
                        <Plus aria-hidden="true" size={18} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

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
                disabled={totalQuantity === 0}
                onClick={() => setIsReviewOpen(true)}
              >
                선택 확인하기
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
            disabled={totalQuantity === 0}
            onClick={() => setIsReviewOpen(true)}
          >
            선택 확인하기
          </Button>
        </div>
      </div>

      {isReviewOpen ? (
        <ReservationReviewDialog
          storeName={store.name}
          pickupTime={`오늘 ${deal.pickupStart} ~ ${deal.pickupEnd}`}
          items={selectedItems}
          totalPrice={totalPrice}
          isSubmitting={isSubmitting}
          onClose={() => setIsReviewOpen(false)}
          onSubmit={submitReservation}
        />
      ) : null}
    </>
  )
}

function ReservationReviewDialog({
  storeName,
  pickupTime,
  items,
  totalPrice,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  storeName: string
  pickupTime: string
  items: Array<{
    id: string
    name: string
    quantity: number
    salePrice: number
  }>
  totalPrice: number
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
            <dt className="text-muted">픽업</dt>
            <dd className="text-foreground font-semibold">{pickupTime}</dd>
          </div>
          <div className="grid grid-cols-[88px_1fr] gap-3 py-4">
            <dt className="text-muted">품목</dt>
            <dd className="grid gap-2">
              {items.map((item) => (
                <span key={item.id} className="flex justify-between gap-3">
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
          예약 후 안내된 시간에 가게에서 상품을 픽업해 주세요.
        </p>

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
            {isSubmitting ? "재고를 확인하는 중" : "예약하기"}
          </Button>
        </div>
      </section>
    </div>
  )
}
