import { useState, type ReactNode } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Image as ImageIcon,
  MapPin,
  PackageOpen,
  Store,
} from "lucide-react"
import { Link, useNavigate } from "react-router"
import { Button } from "../../shared/ui/button"
import {
  formatWon,
  getDiscountRate,
  getStore,
  type DealSummary,
  type ReservationStatus,
} from "./customer-data"

export function CustomerPage({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`mx-auto w-full max-w-5xl pt-6 pb-28 sm:pt-10 ${className}`}
    >
      {children}
    </div>
  )
}

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="mb-7 flex items-start justify-between gap-4 sm:mb-9">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-brand-link mb-2 text-sm font-semibold">
            {eyebrow}
          </p>
        ) : null}
        <h1
          data-route-heading
          tabIndex={-1}
          className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl"
        >
          {title}
        </h1>
        {description ? (
          <p className="text-muted mt-2 max-w-2xl text-sm leading-6 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  )
}

export function BackButton({ label = "뒤로" }: { label?: string }) {
  const navigate = useNavigate()

  return (
    <Button
      type="button"
      variant="ghost"
      size="compact"
      className="mb-3 -ml-3"
      onClick={() => navigate(-1)}
    >
      <ChevronLeft aria-hidden="true" />
      {label}
    </Button>
  )
}

export function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`border-hairline bg-canvas rounded-2xl border p-5 sm:p-6 ${className}`}
    >
      {children}
    </section>
  )
}

export function DealCard({ deal }: { deal: DealSummary }) {
  const [liked, setLiked] = useState(false)
  const store = getStore(deal.storeId)

  return (
    <article className="border-hairline bg-canvas overflow-hidden rounded-2xl border">
      <div className="bg-surface relative aspect-square overflow-hidden">
        <Link
          to={`/deals/${deal.id}`}
          className="block h-full rounded-t-2xl"
          aria-label={`${deal.title} 할인 상세 보기`}
        >
          <img
            src={deal.imageUrl}
            alt={`${deal.title} 상품`}
            className="h-full w-full object-cover transition-transform duration-150 hover:scale-[1.02] motion-reduce:transition-none"
            loading="lazy"
            decoding="async"
          />
        </Link>
        <button
          type="button"
          className="bg-canvas/95 text-foreground absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-full border border-white/70"
          aria-label={
            liked
              ? `${store?.name ?? "가게"} 찜 해제`
              : `${store?.name ?? "가게"} 찜하기`
          }
          aria-pressed={liked}
          onClick={() => setLiked((value) => !value)}
        >
          <Heart
            aria-hidden="true"
            className={liked ? "fill-primary text-primary" : "text-foreground"}
            size={22}
          />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 text-sm">
          <span className="text-brand-link font-semibold">
            {getDiscountRate(deal.originalPrice, deal.salePrice)}%
          </span>
          <span className="text-muted line-through">
            {formatWon(deal.originalPrice)}
          </span>
        </div>
        <Link
          to={`/deals/${deal.id}`}
          className="text-foreground block rounded text-lg leading-6 font-bold"
        >
          {deal.title}
        </Link>
        <p className="text-foreground mt-2 text-xl font-bold tabular-nums">
          {formatWon(deal.salePrice)}
        </p>

        <div className="text-muted mt-4 grid gap-2 text-sm">
          <p className="text-warning flex items-center gap-2 font-semibold">
            <PackageOpen aria-hidden="true" size={18} />
            {deal.stock}개 남았어요
          </p>
          <p className="flex items-center gap-2">
            <Clock3 aria-hidden="true" size={18} />
            {deal.pickupEnd}까지 픽업
          </p>
          <p className="flex items-center gap-2">
            <MapPin aria-hidden="true" size={18} />
            {store?.district} · {deal.distance}
          </p>
        </div>

        {store ? (
          <Link
            to={`/stores/${store.id}`}
            className="border-hairline text-muted mt-4 flex min-h-11 items-center justify-between border-t pt-3 text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <Store aria-hidden="true" size={18} />
              {store.name}
            </span>
            <ChevronRight aria-hidden="true" size={18} />
          </Link>
        ) : null}
      </div>
    </article>
  )
}

const reservationStatusLabel: Record<ReservationStatus, string> = {
  confirmed: "예약 확정",
  "picked-up": "픽업 완료",
  canceled: "예약 취소",
}

const reservationStatusClass: Record<ReservationStatus, string> = {
  confirmed: "bg-brand-tint text-brand-brown",
  "picked-up": "bg-surface text-success",
  canceled: "bg-surface text-critical",
}

export function ReservationStatusBadge({
  status,
}: {
  status: ReservationStatus
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${reservationStatusClass[status]}`}
    >
      {reservationStatusLabel[status]}
    </span>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="border-hairline bg-canvas flex min-h-72 flex-col items-center justify-center rounded-2xl border px-6 py-12 text-center">
      <span className="bg-surface text-muted mb-5 inline-flex size-14 items-center justify-center rounded-full">
        <ImageIcon aria-hidden="true" size={24} />
      </span>
      <h2 className="text-foreground text-lg font-bold">{title}</h2>
      <p className="text-muted mt-2 max-w-sm text-sm leading-6">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function DealGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="오늘의 할인을 불러오는 중"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="border-hairline bg-canvas overflow-hidden rounded-2xl border"
        >
          <div className="bg-surface aspect-square animate-pulse motion-reduce:animate-none" />
          <div className="grid gap-3 p-4">
            <span className="bg-surface h-4 w-1/3 animate-pulse rounded motion-reduce:animate-none" />
            <span className="bg-surface h-6 w-4/5 animate-pulse rounded motion-reduce:animate-none" />
            <span className="bg-surface h-6 w-1/2 animate-pulse rounded motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  )
}
