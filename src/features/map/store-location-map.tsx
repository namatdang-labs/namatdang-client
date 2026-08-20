import { useEffect, useRef } from "react"
import { MapContainer } from "./map-container"
import type { MapCoordinate } from "./map-types"
import { isValidMapCoordinate } from "./map-types"
import { createStoreLocationMarkerIcon } from "./store-marker-icon"
import { useNaverMaps } from "./use-naver-maps"

const DEFAULT_ZOOM = 17

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

export interface StoreLocationMapProps {
  position: MapCoordinate
  draggable?: boolean
  onPositionChange?: (position: MapCoordinate) => void
  initialZoom?: number
  ariaLabel?: string
  className?: string
}

export function StoreLocationMap({
  position,
  draggable = false,
  onPositionChange,
  initialZoom = DEFAULT_ZOOM,
  ariaLabel = "가게 위치 확인 지도",
  className,
}: StoreLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<naver.maps.Map | null>(null)
  const markerRef = useRef<naver.maps.Marker | null>(null)
  const onPositionChangeRef = useRef(onPositionChange)
  const positionRef = useRef(position)
  const draggableRef = useRef(draggable)
  const naverMapsState = useNaverMaps()
  const maps = naverMapsState.maps
  const validPosition = isValidMapCoordinate(position)

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange
  }, [onPositionChange])

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    draggableRef.current = draggable
  }, [draggable])

  useEffect(() => {
    if (!maps || !containerRef.current || !validPosition) {
      return
    }

    const initialPosition = positionRef.current
    const center = new maps.LatLng(
      initialPosition.latitude,
      initialPosition.longitude,
    )
    const map = new maps.Map(containerRef.current, {
      center,
      zoom: initialZoom,
      keyboardShortcuts: true,
      zoomControl: true,
      zoomControlOptions: {
        position: maps.Position.TOP_RIGHT,
      },
    })
    const marker = new maps.Marker({
      map,
      position: center,
      title: "가게 위치",
      draggable: draggableRef.current,
      cursor: draggableRef.current ? "grab" : "default",
      icon: createStoreLocationMarkerIcon(maps, true),
      zIndex: 100,
    })
    const dragListener = maps.Event.addListener(marker, "dragend", () => {
      const nextPosition = readLatLng(marker.getPosition())
      if (nextPosition) {
        onPositionChangeRef.current?.(nextPosition)
      }
    })

    mapRef.current = map
    markerRef.current = marker

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => map.autoResize())
    resizeObserver?.observe(containerRef.current)

    return () => {
      resizeObserver?.disconnect()
      maps.Event.removeListener(dragListener)
      marker.setMap(null)
      markerRef.current = null
      map.destroy()
      mapRef.current = null
    }
  }, [initialZoom, maps, validPosition])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!maps || !map || !marker || !validPosition) {
      return
    }

    const nextPosition = new maps.LatLng(position.latitude, position.longitude)
    marker.setPosition(nextPosition)
    map.panTo(nextPosition, { duration: 250 })
  }, [maps, position.latitude, position.longitude, validPosition])

  useEffect(() => {
    const marker = markerRef.current
    if (!marker) {
      return
    }
    marker.setDraggable(draggable)
    marker.setCursor(draggable ? "grab" : "default")
  }, [draggable, maps, validPosition])

  const invalidPositionError = validPosition
    ? naverMapsState.error
    : ({
        name: "NaverMapLoadError",
        code: "load-failed",
        message: "가게 위치 좌표를 확인해 주세요.",
      } as const)

  return (
    <MapContainer
      ariaLabel={ariaLabel}
      className={className}
      containerRef={containerRef}
      status={validPosition ? naverMapsState.status : "error"}
      error={invalidPositionError}
    />
  )
}
