import type { NaverMapLoadError } from "./map-errors"

interface MapStatusOverlayProps {
  status: "loading" | "error"
  error?: NaverMapLoadError | null
}

export function MapStatusOverlay({ status, error }: MapStatusOverlayProps) {
  return (
    <div className="bg-surface absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
      {status === "loading" ? (
        <p className="text-muted text-sm" role="status">
          지도를 불러오는 중이에요.
        </p>
      ) : (
        <div role="alert">
          <p className="text-foreground text-sm font-semibold">
            지도를 보여주지 못했어요
          </p>
          <p className="text-muted mt-2 text-sm">{error?.message}</p>
        </div>
      )}
    </div>
  )
}
