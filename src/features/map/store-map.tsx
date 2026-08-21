import { useEffect, useRef } from "react"
import type { MapBounds, MapCoordinate, StoreMapItem } from "./map-types"
import { isValidMapCoordinate } from "./map-types"
import { MapContainer } from "./map-container"
import { createStoreMarkerIcon, getStoreMarkerTitle } from "./store-marker-icon"
import { useNaverMaps } from "./use-naver-maps"

const DEFAULT_CENTER: MapCoordinate = {
  latitude: 37.5666103,
  longitude: 126.9783882,
}
const DEFAULT_ZOOM = 15
const MAP_SELECTION_UNINITIALIZED = Symbol("map-selection-uninitialized")

export interface StoreMapProps {
  stores: StoreMapItem[]
  selectedStoreId?: string | null
  onSelect?: (store: StoreMapItem) => void
  onBoundsChange?: (bounds: MapBounds) => void
  fitBounds?: boolean
  initialCenter?: MapCoordinate
  initialZoom?: number
  ariaLabel?: string
  className?: string
}

export function StoreMap({
  stores,
  selectedStoreId = null,
  onSelect,
  onBoundsChange,
  fitBounds = true,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  ariaLabel = "가게 위치 지도",
  className,
}: StoreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<naver.maps.Map | null>(null)
  const markersRef = useRef<Map<string, naver.maps.Marker>>(new Map())
  const onSelectRef = useRef(onSelect)
  const onBoundsChangeRef = useRef(onBoundsChange)
  const selectedStoreIdRef = useRef(selectedStoreId)
  const previousSelectedStoreIdRef = useRef<
    string | null | typeof MAP_SELECTION_UNINITIALIZED
  >(MAP_SELECTION_UNINITIALIZED)
  const naverMapsState = useNaverMaps()
  const maps = naverMapsState.maps
  const initialLatitude = initialCenter.latitude
  const initialLongitude = initialCenter.longitude

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange
  }, [onBoundsChange])

  useEffect(() => {
    selectedStoreIdRef.current = selectedStoreId
  }, [selectedStoreId])

  useEffect(() => {
    if (!maps || !containerRef.current) {
      return
    }

    const requestedCenter = {
      latitude: initialLatitude,
      longitude: initialLongitude,
    }
    const center = isValidMapCoordinate(requestedCenter)
      ? requestedCenter
      : DEFAULT_CENTER
    const map = new maps.Map(containerRef.current, {
      center: new maps.LatLng(center.latitude, center.longitude),
      zoom: initialZoom,
      keyboardShortcuts: true,
      zoomControl: true,
      zoomControlOptions: {
        position: maps.Position.TOP_RIGHT,
      },
    })
    mapRef.current = map
    const markers = markersRef.current
    const listeners: naver.maps.MapEventListener[] = []

    const emitBounds = () => {
      if (typeof map.getBounds !== "function") return
      const bounds = map.getBounds() as naver.maps.LatLngBounds | undefined
      if (!bounds || typeof bounds.getSW !== "function") return
      const sw = bounds.getSW()
      const ne = bounds.getNE()
      onBoundsChangeRef.current?.({
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLng: sw.lng(),
        maxLng: ne.lng(),
      })
    }

    listeners.push(maps.Event.addListener(map, "idle", emitBounds))
    emitBounds()
    previousSelectedStoreIdRef.current = MAP_SELECTION_UNINITIALIZED

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => map.autoResize())
    resizeObserver?.observe(containerRef.current)

    return () => {
      resizeObserver?.disconnect()
      maps.Event.removeListener(listeners)
      markers.forEach((marker) => marker.setMap(null))
      markers.clear()
      map.destroy()
      if (mapRef.current === map) {
        mapRef.current = null
      }
    }
  }, [initialLatitude, initialLongitude, initialZoom, maps])

  useEffect(() => {
    const map = mapRef.current
    if (!maps || !map) {
      return
    }

    const markers = markersRef.current
    const createdMarkers = new Map<string, naver.maps.Marker>()
    const listeners: naver.maps.MapEventListener[] = []

    stores.forEach((store) => {
      if (!isValidMapCoordinate(store)) {
        return
      }

      const selected = store.id === selectedStoreIdRef.current
      const title = getStoreMarkerTitle(store.name, store.dealStatus, selected)
      const marker = new maps.Marker({
        map,
        position: new maps.LatLng(store.latitude, store.longitude),
        title,
        clickable: true,
        cursor: "pointer",
        icon: createStoreMarkerIcon(maps, {
          dealStatus: store.dealStatus,
          selected,
          ariaLabel: title,
        }),
        zIndex: selected ? 100 : 1,
      })
      createdMarkers.set(store.id, marker)
      markers.set(store.id, marker)
      listeners.push(
        maps.Event.addListener(marker, "click", () => {
          onSelectRef.current?.(store)
        }),
      )
    })

    return () => {
      maps.Event.removeListener(listeners)
      createdMarkers.forEach((marker, storeId) => {
        marker.setMap(null)
        if (markers.get(storeId) === marker) {
          markers.delete(storeId)
        }
      })
    }
  }, [initialLatitude, initialLongitude, initialZoom, maps, stores])

  useEffect(() => {
    const map = mapRef.current
    if (!maps || !map || !fitBounds) {
      return
    }

    const validStores = stores.filter(isValidMapCoordinate)
    if (validStores.length === 1) {
      map.setCenter(
        new maps.LatLng(validStores[0].latitude, validStores[0].longitude),
      )
      map.setZoom(initialZoom)
      return
    }

    if (validStores.length > 1) {
      const firstPosition = new maps.LatLng(
        validStores[0].latitude,
        validStores[0].longitude,
      )
      const bounds = new maps.LatLngBounds(firstPosition, firstPosition)
      validStores.slice(1).forEach((store) => {
        bounds.extend(new maps.LatLng(store.latitude, store.longitude))
      })
      map.fitBounds(bounds, {
        top: 56,
        right: 40,
        bottom: 56,
        left: 40,
        maxZoom: 17,
      })
    }
  }, [fitBounds, initialZoom, maps, stores])

  useEffect(() => {
    if (!maps) {
      return
    }

    markersRef.current.forEach((marker, storeId) => {
      const selected = storeId === selectedStoreId
      const store = stores.find((item) => item.id === storeId)
      if (!store) {
        return
      }
      const title = getStoreMarkerTitle(store.name, store.dealStatus, selected)
      marker.setIcon(
        createStoreMarkerIcon(maps, {
          dealStatus: store.dealStatus,
          selected,
          ariaLabel: title,
        }),
      )
      marker.setTitle(title)
      marker.setZIndex(selected ? 100 : 1)
    })
  }, [maps, selectedStoreId, stores])

  useEffect(() => {
    const map = mapRef.current
    if (!maps || !map) {
      return
    }

    const previousSelectedStoreId = previousSelectedStoreIdRef.current
    previousSelectedStoreIdRef.current = selectedStoreId
    if (
      previousSelectedStoreId === MAP_SELECTION_UNINITIALIZED ||
      previousSelectedStoreId === selectedStoreId ||
      !selectedStoreId
    ) {
      return
    }

    const selectedStore = stores.find((store) => store.id === selectedStoreId)
    if (!selectedStore || !isValidMapCoordinate(selectedStore)) {
      return
    }

    map.panTo(
      new maps.LatLng(selectedStore.latitude, selectedStore.longitude),
      { duration: 250 },
    )
  }, [
    fitBounds,
    initialLatitude,
    initialLongitude,
    initialZoom,
    maps,
    selectedStoreId,
    stores,
  ])

  return (
    <MapContainer
      ariaLabel={ariaLabel}
      className={className}
      containerRef={containerRef}
      status={naverMapsState.status}
      error={naverMapsState.error}
    />
  )
}
