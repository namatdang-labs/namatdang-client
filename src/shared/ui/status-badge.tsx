import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import type { DomainStatus } from "../types"
import { cn } from "../lib/utils"
import { getStatusLabel } from "./status-label"

const statusTones: Record<DomainStatus, StatusBadgeTone> = {
  draft: "muted",
  pending: "info",
  active: "success",
  paused: "muted",
  selling: "neutral",
  "low-stock": "warning",
  "sold-out": "muted",
  ended: "muted",
  canceled: "critical",
  unavailable: "muted",
  confirmed: "info",
  "picked-up": "success",
  "no-show": "critical",
}

const statusBadgeVariants = cva(
  "inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-hairline bg-surface text-foreground",
        brand: "border-primary bg-brand-tint text-brand-brown",
        muted: "border-hairline bg-surface text-muted",
        warning: "border-warning bg-canvas text-warning",
        critical: "border-critical bg-canvas text-critical",
        info: "border-info bg-canvas text-info",
        success: "border-success bg-canvas text-success",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
)

type StatusBadgeTone = NonNullable<
  VariantProps<typeof statusBadgeVariants>["tone"]
>

type StatusBadgeProps = ComponentProps<"span"> &
  VariantProps<typeof statusBadgeVariants> & {
    status?: DomainStatus
  }

function StatusBadge({
  className,
  status,
  tone,
  children,
  ...props
}: StatusBadgeProps) {
  const resolvedTone = tone ?? (status ? statusTones[status] : "neutral")

  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(statusBadgeVariants({ tone: resolvedTone }), className)}
      {...props}
    >
      {children ?? (status ? getStatusLabel(status) : null)}
    </span>
  )
}

export { StatusBadge }
export type { StatusBadgeProps, StatusBadgeTone }
