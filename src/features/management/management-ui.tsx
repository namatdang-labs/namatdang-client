import type { ComponentProps, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { AlertCircle, ArrowRight, PackageOpen } from "lucide-react"
import { Link } from "react-router"
import { cn } from "../../shared/lib/utils"
import { Button } from "../../shared/ui/button"
import type { OwnerDealStatus, OwnerReservationStatus } from "./management-api"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function ManagementPageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-muted mb-1 text-sm font-medium">{eyebrow}</p>
        ) : null}
        <h1
          data-route-heading
          tabIndex={-1}
          className="text-foreground text-2xl leading-[1.35] font-bold"
        >
          {title}
        </h1>
        {description ? (
          <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export function ManagementPanel({
  className,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "border-hairline bg-canvas rounded-xl border p-4 sm:p-5",
        className,
      )}
      {...props}
    />
  )
}

type StatCardProps = {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  tone?: "neutral" | "warning" | "success"
}

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "neutral",
}: StatCardProps) {
  return (
    <article className="border-hairline bg-canvas rounded-xl border p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted text-sm font-medium">{label}</p>
        <span
          className={cn(
            "bg-surface text-muted flex size-9 items-center justify-center rounded-lg",
            tone === "warning" && "bg-brand-tint text-warning",
            tone === "success" && "bg-brand-tint text-success",
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="text-foreground mt-3 text-2xl font-bold tabular-nums">
        {value}
      </p>
      <p className="text-muted mt-1 text-sm">{helper}</p>
    </article>
  )
}

const dealStatusMap: Record<
  OwnerDealStatus,
  { label: string; className: string }
> = {
  SELLING: { label: "판매 중", className: "bg-brand-tint text-foreground" },
  ENDED: { label: "품절", className: "bg-surface text-muted" },
  CLOSED: { label: "마감", className: "bg-surface text-muted" },
  CANCELED: { label: "취소", className: "bg-surface text-critical" },
}

const reservationStatusMap: Record<
  OwnerReservationStatus,
  { label: string; className: string }
> = {
  RESERVED: {
    label: "픽업 대기",
    className: "bg-brand-tint text-warning",
  },
  PICKED_UP: {
    label: "픽업 완료",
    className: "bg-brand-tint text-success",
  },
  CANCELED: { label: "예약 취소", className: "bg-surface text-critical" },
}

export function DealStatusBadge({ status }: { status: OwnerDealStatus }) {
  const statusInfo = dealStatusMap[status]

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        statusInfo.className,
      )}
    >
      {statusInfo.label}
    </span>
  )
}

export function ReservationStatusBadge({
  status,
}: {
  status: OwnerReservationStatus
}) {
  const statusInfo = reservationStatusMap[status]

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        statusInfo.className,
      )}
    >
      {statusInfo.label}
    </span>
  )
}

type SectionHeadingProps = {
  id?: string
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
}

export function SectionHeading({
  id,
  title,
  description,
  actionLabel,
  actionTo,
}: SectionHeadingProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 id={id} className="text-foreground text-lg font-bold">
          {title}
        </h2>
        {description ? (
          <p className="text-muted mt-1 text-sm leading-5">{description}</p>
        ) : null}
      </div>
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="text-brand-link inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold"
        >
          {actionLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-4 py-10 text-center">
      <span className="bg-surface text-muted flex size-12 items-center justify-center rounded-xl">
        <PackageOpen className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-foreground mt-4 text-lg font-bold">{title}</h2>
      <p className="text-muted mt-2 max-w-md text-sm leading-6">
        {description}
      </p>
      {actionLabel && actionTo ? (
        <Button asChild className="mt-5">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}

type FieldProps = ComponentProps<"input"> & {
  id: string
  label: string
  error?: string
  helper?: string
}

export function FormField({
  id,
  label,
  error,
  helper,
  className,
  ...props
}: FieldProps) {
  const descriptionId = error
    ? `${id}-error`
    : helper
      ? `${id}-helper`
      : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="text-foreground text-sm font-semibold">
        {label}
        {props.required ? <span className="text-critical ml-1">*</span> : null}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        className={cn(
          "border-hairline bg-canvas text-foreground placeholder:text-disabled mt-2 min-h-12 w-full rounded-lg border px-3 text-base transition-colors",
          "focus:border-foreground",
          error && "border-critical border-2",
        )}
        {...props}
      />
      {error ? (
        <p
          id={`${id}-error`}
          className="text-critical mt-1.5 flex items-start gap-1.5 text-sm leading-5"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-helper`} className="text-muted mt-1.5 text-sm leading-5">
          {helper}
        </p>
      ) : null}
    </div>
  )
}

type SelectFieldProps = ComponentProps<"select"> & {
  id: string
  label: string
  error?: string
  children: ReactNode
}

export function SelectField({
  id,
  label,
  error,
  className,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-foreground text-sm font-semibold">
        {label}
        {props.required ? <span className="text-critical ml-1">*</span> : null}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "border-hairline bg-canvas text-foreground focus:border-foreground mt-2 min-h-12 w-full rounded-lg border px-3 text-base",
          error && "border-critical border-2",
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={`${id}-error`} className="text-critical mt-1.5 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type TextareaFieldProps = ComponentProps<"textarea"> & {
  id: string
  label: string
  error?: string
  helper?: string
}

export function TextareaField({
  id,
  label,
  error,
  helper,
  className,
  ...props
}: TextareaFieldProps) {
  const descriptionId = error
    ? `${id}-error`
    : helper
      ? `${id}-helper`
      : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="text-foreground text-sm font-semibold">
        {label}
        {props.required ? <span className="text-critical ml-1">*</span> : null}
      </label>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        className={cn(
          "border-hairline bg-canvas text-foreground placeholder:text-disabled focus:border-foreground mt-2 min-h-28 w-full resize-y rounded-lg border px-3 py-3 text-base leading-6",
          error && "border-critical border-2",
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-critical mt-1.5 text-sm">
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-helper`} className="text-muted mt-1.5 text-sm leading-5">
          {helper}
        </p>
      ) : null}
    </div>
  )
}

export function FormSuccessMessage({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="border-hairline bg-brand-tint text-success rounded-lg border px-4 py-3 text-sm font-semibold"
    >
      {children}
    </p>
  )
}
