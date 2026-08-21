import { useEffect, useId, useRef } from "react"
import { MapContainer } from "./map-container"
import type { MapCoordinate } from "./map-types"
import { isValidMapCoordinate } from "./map-types"
import { STORE_MARKER_IMAGE_URL } from "./store-marker-icon"
import { useNaverMaps } from "./use-naver-maps"

const DEFAULT_ZOOM = 16
const COORDINATE_EPSILON = 0.0000001
const PIN_TIP_X_PERCENT = (462 / 1024) * 100
const PIN_TIP_Y_PERCENT = (872 / 1024) * 100

function readLatLng(coordinate: naver.maps.Coord): MapCoordinate | null {
  if (
    !("lat" in coordinate) ||
    !("lng" in coordinate) ||
    typeof coordinate.lat !== "function" ||
    typeof coordinate.lng !== "function"
  ) {
    return null
  }

  const result = {
    latitude: coordinate.lat(),
    longitude: coordinate.lng(),
  }
  return isValidMapCoordinate(result) ? result : null
}

function isSameCoordinate(first: MapCoordinate, second: MapCoordinate) {
  return (
    Math.abs(first.latitude - second.latitude) < COORDINATE_EPSILON &&
    Math.abs(first.longitude - second.longitude) < COORDINATE_EPSILON
  )
}

export interface LocationPickerMapProps {
  initialPosition: MapCoordinate
  onCenterSettled: (coordinate: MapCoordinate) => void
  ariaLabel?: string
  className?: string
  initialZoom?: number
}

export function LocationPickerMap({
  initialPosition,
  onCenterSettled,
  ariaLabel = "선택할 위치를 정하는 지도",
  className,
  initialZoom = DEFAULT_ZOOM,
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<naver.maps.Map | null>(null)
  const onCenterSettledRef = useRef(onCenterSettled)
  const initialPositionRef = useRef(initialPosition)
  const lastSettledCoordinateRef = useRef(initialPosition)
  const instructionId = useId()
  const naverMapsState = useNaverMaps()
  const maps = naverMapsState.maps
  const validPosition = isValidMapCoordinate(initialPosition)

  useEffect(() => {
    onCenterSettledRef.current = onCenterSettled
  }, [onCenterSettled])

  useEffect(() => {
    initialPositionRef.current = initialPosition
  }, [initialPosition])

  useEffect(() => {
    if (!maps || !containerRef.current || !validPosition) {
      return
    }

    const position = initialPositionRef.current
    const center = new maps.LatLng(position.latitude, position.longitude)
    const map = new maps.Map(containerRef.current, {
      center,
      zoom: initialZoom,
      keyboardShortcuts: true,
      zoomControl: true,
      zoomControlOptions: {
        position: maps.Position.TOP_RIGHT,
      },
    })
    lastSettledCoordinateRef.current = position

    const idleListener = maps.Event.addListener(map, "idle", () => {
      const nextCoordinate = readLatLng(map.getCenter())
      if (
        !nextCoordinate ||
        isSameCoordinate(lastSettledCoordinateRef.current, nextCoordinate)
      ) {
        return
      }

      lastSettledCoordinateRef.current = nextCoordinate
      onCenterSettledRef.current(nextCoordinate)
    })

    mapRef.current = map
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => map.autoResize())
    resizeObserver?.observe(containerRef.current)

    return () => {
      resizeObserver?.disconnect()
      maps.Event.removeListener(idleListener)
      map.destroy()
      mapRef.current = null
    }
  }, [initialZoom, maps, validPosition])

  useEffect(() => {
    const map = mapRef.current
    if (!maps || !map || !validPosition) {
      return
    }

    if (isSameCoordinate(lastSettledCoordinateRef.current, initialPosition)) {
      return
    }

    lastSettledCoordinateRef.current = initialPosition
    map.setCenter(
      new maps.LatLng(initialPosition.latitude, initialPosition.longitude),
    )
  }, [initialPosition, maps, validPosition])

  const invalidPositionError = validPosition
    ? naverMapsState.error
    : ({
        name: "NaverMapLoadError",
        code: "load-failed",
        message: "선택 위치 좌표를 확인해 주세요.",
      } as const)

  return (
    <MapContainer
      ariaLabel={ariaLabel}
      ariaDescribedBy={instructionId}
      className={className}
      containerRef={containerRef}
      status={validPosition ? naverMapsState.status : "error"}
      error={invalidPositionError}
      tabIndex={0}
    >
      <p id={instructionId} className="sr-only">
        지도를 드래그하거나 지도에 초점을 맞춘 뒤 화살표 키로 움직여 위치를
        선택하세요.
      </p>
      {naverMapsState.status === "ready" && validPosition ? (
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 z-[5] h-14 w-14"
          style={{
            transform: `translate(-${PIN_TIP_X_PERCENT}%, -${PIN_TIP_Y_PERCENT}%)`,
          }}
          aria-hidden="true"
        >
          <img
            src={STORE_MARKER_IMAGE_URL}
            alt=""
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>
      ) : null}
    </MapContainer>
  )
}
