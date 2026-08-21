/* eslint-disable react-refresh/only-export-components -- 고객 화면이 같은 표시 함수와 UI 구조를 공유합니다. */
import type { ReactNode } from "react"
import {
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Image as ImageIcon,
  Store,
} from "lucide-react"
import { Link, useNavigate } from "react-router"
import { Button } from "../../shared/ui/button"
import { RepresentativeImage } from "../../shared/ui/representative-image"
import {
  type ReservationDetailDto,
  type ReservationStatusDto,
  type SellingDealDto,
} from "./customer-api"

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

export function formatWon(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "시간 확인 필요"

  return new Intl.DateTimeFormat("ko-KR", {
    ...options,
    timeZone: "Asia/Seoul",
  }).format(date)
}

export function formatDateTime(value: string) {
  return formatDate(value, {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function formatShortDate(value: string) {
  return formatDate(value, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function getDealDisplayName(
  deal: Pick<SellingDealDto, "headlineItemName" | "description" | "storeName">,
) {
  return (
    deal.headlineItemName?.trim() ||
    deal.description?.trim() ||
    `${deal.storeName ?? "가게"}의 오늘 할인`
  )
}

function formatDistance(distanceMeters: number) {
  return distanceMeters < 1_000
    ? `${Math.round(distanceMeters)}m`
    : `${(distanceMeters / 1_000).toFixed(1)}km`
}

export function getReservationTotalQuantity(reservation: ReservationDetailDto) {
  return reservation.items.reduce((total, item) => total + item.quantity, 0)
}

export function getReservationItemSummary(reservation: ReservationDetailDto) {
  const [firstItem] = reservation.items
  if (!firstItem) return "예약 품목"
  if (reservation.items.length === 1) {
    return `${firstItem.name} ${firstItem.quantity}개`
  }
  return `${firstItem.name} ${firstItem.quantity}개 외 ${reservation.items.length - 1}종`
}

export function DealCard({ deal }: { deal: SellingDealDto }) {
  const title = getDealDisplayName(deal)

  return (
    <article className="border-hairline bg-canvas grid grid-cols-[116px_minmax(0,1fr)] overflow-hidden rounded-2xl border sm:block">
      <Link
        to={`/deals/${deal.dealId}`}
        className="relative block min-h-40 overflow-hidden sm:aspect-video sm:min-h-0 sm:rounded-t-2xl"
        aria-label={`${title} 할인 상세 보기`}
      >
        <RepresentativeImage
          kind="deal"
          className="absolute inset-0 h-full w-full"
        />
        <span className="bg-primary text-primary-foreground absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold sm:top-3 sm:left-3 sm:gap-1.5 sm:px-2.5 sm:text-xs">
          <BadgePercent aria-hidden="true" size={15} />
          판매 중
        </span>
        <span className="bg-canvas/95 text-foreground absolute right-3 bottom-3 hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:block">
          {typeof deal.totalRemainingQuantity === "number"
            ? `${deal.totalRemainingQuantity}개 남음`
            : `${deal.itemCount}개 품목`}
        </span>
      </Link>

      <div className="min-w-0 p-3 sm:p-4">
        <Link
          to={`/deals/${deal.dealId}`}
          className="text-foreground line-clamp-2 block rounded text-base leading-5 font-bold sm:text-lg sm:leading-6"
        >
          {title}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 sm:mt-2">
          {typeof deal.maxDiscountRate === "number" &&
          deal.maxDiscountRate > 0 ? (
            <span className="text-primary text-sm font-bold tabular-nums sm:text-base">
              {deal.maxDiscountRate}%
            </span>
          ) : null}
          <p className="text-foreground text-lg font-bold tabular-nums sm:text-xl">
            {formatWon(deal.lowestSalePrice)}부터
          </p>
        </div>

        <p className="text-muted mt-1.5 text-xs leading-5 sm:text-sm">
          <span className="sm:hidden">
            {typeof deal.totalRemainingQuantity === "number"
              ? `${deal.totalRemainingQuantity}개 남음 · `
              : ""}
          </span>
          {deal.itemCount}개 품목
        </p>

        <p className="text-muted mt-1.5 flex items-start gap-1.5 text-xs leading-5 sm:mt-3 sm:gap-2 sm:text-sm">
          <Clock3 aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
          {formatDateTime(deal.salesEndsAt)}까지 예약
        </p>

        <Link
          to={`/stores/${deal.storeId}`}
          className="border-hairline text-muted mt-1.5 flex min-h-11 items-center justify-between gap-2 border-t pt-1.5 text-xs font-medium sm:mt-3 sm:pt-2 sm:text-sm"
        >
          <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <Store aria-hidden="true" className="shrink-0" size={18} />
            <span className="truncate">{deal.storeName ?? "가게 정보"}</span>
            {typeof deal.distanceMeters === "number" ? (
              <span className="text-brand-link shrink-0 tabular-nums">
                {formatDistance(deal.distanceMeters)}
              </span>
            ) : null}
          </span>
          <ChevronRight aria-hidden="true" className="shrink-0" size={18} />
        </Link>
      </div>
    </article>
  )
}

const reservationStatusLabel: Record<ReservationStatusDto, string> = {
  RESERVED: "픽업 대기",
  PICKED_UP: "픽업 완료",
  CANCELED: "예약 취소",
}

const reservationStatusClass: Record<ReservationStatusDto, string> = {
  RESERVED: "bg-canvas border-info text-info",
  PICKED_UP: "bg-canvas border-success text-success",
  CANCELED: "bg-canvas border-critical text-critical",
}

export function ReservationStatusBadge({
  status,
}: {
  status: ReservationStatusDto
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-semibold ${reservationStatusClass[status]}`}
    >
      {reservationStatusLabel[status]}
    </span>
  )
}

export function EmptyState({
  title,
  description,
  action,
  className = "min-h-72 py-12",
}: {
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`border-hairline bg-canvas flex flex-col items-center justify-center rounded-2xl border px-6 text-center ${className}`}
    >
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
      className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
      aria-label="오늘의 할인을 불러오는 중"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="border-hairline bg-canvas grid grid-cols-[116px_minmax(0,1fr)] overflow-hidden rounded-2xl border sm:block"
        >
          <div className="bg-surface min-h-40 animate-pulse motion-reduce:animate-none sm:aspect-video sm:min-h-0" />
          <div className="grid gap-3 p-3 sm:p-4">
            <span className="bg-surface h-6 w-4/5 animate-pulse rounded motion-reduce:animate-none" />
            <span className="bg-surface h-6 w-1/2 animate-pulse rounded motion-reduce:animate-none" />
            <span className="bg-surface h-4 w-3/4 animate-pulse rounded motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  )
}
