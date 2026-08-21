import { useState } from "react"

export type RepresentativeImageKind = "store" | "deal"

const DEFAULT_REPRESENTATIVE_IMAGE = "/brand/namatdang-icon.png"

const fallbackLabel: Record<RepresentativeImageKind, string> = {
  store: "가게 기본 이미지",
  deal: "상품 기본 이미지",
}

export function RepresentativeImage({
  kind,
  src,
  alt,
  className = "",
}: {
  kind: RepresentativeImageKind
  src?: string | null
  alt?: string
  className?: string
}) {
  const normalizedSource = src?.trim() || null
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const showFallback =
    normalizedSource === null || normalizedSource === failedSource

  return (
    <div
      className={`bg-bread-cream relative flex items-center justify-center overflow-hidden ${className}`}
    >
      {showFallback ? (
        <>
          <img
            src={DEFAULT_REPRESENTATIVE_IMAGE}
            alt=""
            aria-hidden="true"
            className="relative h-[46%] max-h-36 w-[46%] max-w-36 object-contain"
          />
          <span className="sr-only">{fallbackLabel[kind]}</span>
        </>
      ) : (
        <img
          src={normalizedSource}
          alt={
            alt ?? (kind === "store" ? "가게 대표 이미지" : "상품 대표 이미지")
          }
          className="h-full w-full object-cover"
          onError={() => setFailedSource(normalizedSource)}
        />
      )}
    </div>
  )
}
