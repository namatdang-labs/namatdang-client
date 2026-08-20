import type { ReactNode, Ref } from "react"
import { cn } from "@/shared/lib/utils"
import type { NaverMapLoadError } from "./map-errors"
import { MapStatusOverlay } from "./map-status-overlay"

interface MapContainerProps {
  ariaLabel: string
  ariaDescribedBy?: string
  children?: ReactNode
  className?: string
  containerRef: Ref<HTMLDivElement>
  status: "loading" | "ready" | "error"
  error: NaverMapLoadError | null
  tabIndex?: number
}

export function MapContainer({
  ariaLabel,
  ariaDescribedBy,
  children,
  className,
  containerRef,
  status,
  error,
  tabIndex,
}: MapContainerProps) {
  return (
    <div
      className={cn(
        "border-hairline bg-surface relative min-h-64 overflow-hidden rounded-2xl border",
        className,
      )}
      aria-busy={status === "loading"}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        role="region"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        tabIndex={tabIndex}
      />
      {children}
      {status !== "ready" ? (
        <MapStatusOverlay status={status} error={error} />
      ) : null}
    </div>
  )
}
