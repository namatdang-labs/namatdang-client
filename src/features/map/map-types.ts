export interface MapBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export interface MapCoordinate {
  latitude: number
  longitude: number
}

export type StoreDealStatus = "active" | "none" | "unknown"

export interface StoreMapItem extends MapCoordinate {
  id: string
  name: string
  dealStatus: StoreDealStatus
}

export interface GeocodedAddress extends MapCoordinate {
  roadAddress: string
  jibunAddress: string
  englishAddress: string
}

export interface ReverseGeocodedLocation {
  coordinate: MapCoordinate
  address: string
  label: string
}

export function isValidMapCoordinate(
  coordinate: MapCoordinate,
): coordinate is MapCoordinate {
  return (
    Number.isFinite(coordinate.latitude) &&
    Number.isFinite(coordinate.longitude) &&
    coordinate.latitude >= -90 &&
    coordinate.latitude <= 90 &&
    coordinate.longitude >= -180 &&
    coordinate.longitude <= 180
  )
}
