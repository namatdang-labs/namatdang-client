import {
  isValidMapCoordinate,
  type MapBounds,
  type MapCoordinate,
} from "../map/map-types"

export const LOCATION_PREFERENCE_STORAGE_KEY =
  "namatdang.customer.location-preference"

const LEGACY_NEIGHBORHOOD_STORAGE_KEY = "namatdang.customer.neighborhood"
const EARTH_RADIUS_KILOMETERS = 6_371.0088

export const LOCATION_SEARCH_RADIUS_KILOMETERS = 5

export interface LocationPreference {
  v: 1
  latitude: number
  longitude: number
  label: string
  address: string
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI
}

export function getLocationSearchBounds(
  center: MapCoordinate,
  radiusKilometers = LOCATION_SEARCH_RADIUS_KILOMETERS,
): MapBounds {
  const safeRadius =
    Number.isFinite(radiusKilometers) && radiusKilometers > 0
      ? radiusKilometers
      : LOCATION_SEARCH_RADIUS_KILOMETERS
  const angularDistance = safeRadius / EARTH_RADIUS_KILOMETERS
  const latitudeDelta = toDegrees(angularDistance)
  const latitudeRadians = toRadians(center.latitude)
  const longitudeScale = Math.abs(Math.cos(latitudeRadians))
  const longitudeDelta =
    longitudeScale < Number.EPSILON
      ? 180
      : Math.min(180, toDegrees(angularDistance / longitudeScale))

  return {
    minLat: Math.max(-90, center.latitude - latitudeDelta),
    maxLat: Math.min(90, center.latitude + latitudeDelta),
    minLng: Math.max(-180, center.longitude - longitudeDelta),
    maxLng: Math.min(180, center.longitude + longitudeDelta),
  }
}

export function getDistanceKilometers(from: MapCoordinate, to: MapCoordinate) {
  const fromLatitude = toRadians(from.latitude)
  const toLatitude = toRadians(to.latitude)
  const latitudeDelta = toLatitude - fromLatitude
  const longitudeDelta = toRadians(to.longitude - from.longitude)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2

  return (
    2 * EARTH_RADIUS_KILOMETERS * Math.asin(Math.min(1, Math.sqrt(haversine)))
  )
}

function normalizedText(value: unknown) {
  if (typeof value !== "string") return null

  const normalized = value.trim().replace(/\s+/g, " ")
  return normalized ? normalized : null
}

export function isLocationPreference(
  value: unknown,
): value is LocationPreference {
  if (!value || typeof value !== "object") return false

  const candidate = value as Partial<LocationPreference>
  return (
    candidate.v === 1 &&
    isValidMapCoordinate({
      latitude: candidate.latitude ?? Number.NaN,
      longitude: candidate.longitude ?? Number.NaN,
    }) &&
    normalizedText(candidate.label) !== null &&
    normalizedText(candidate.address) !== null
  )
}

export function readLocationPreference(): LocationPreference | null {
  try {
    const storedValue = window.localStorage.getItem(
      LOCATION_PREFERENCE_STORAGE_KEY,
    )
    if (!storedValue) return null

    const parsedValue: unknown = JSON.parse(storedValue)
    if (!isLocationPreference(parsedValue)) return null

    return {
      v: 1,
      latitude: parsedValue.latitude,
      longitude: parsedValue.longitude,
      label: parsedValue.label.trim().replace(/\s+/g, " "),
      address: parsedValue.address.trim().replace(/\s+/g, " "),
    }
  } catch {
    return null
  }
}

export function saveLocationPreference(preference: LocationPreference) {
  if (!isLocationPreference(preference)) return false

  const normalizedPreference: LocationPreference = {
    v: 1,
    latitude: preference.latitude,
    longitude: preference.longitude,
    label: preference.label.trim().replace(/\s+/g, " "),
    address: preference.address.trim().replace(/\s+/g, " "),
  }

  try {
    window.localStorage.setItem(
      LOCATION_PREFERENCE_STORAGE_KEY,
      JSON.stringify(normalizedPreference),
    )
    window.localStorage.removeItem(LEGACY_NEIGHBORHOOD_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function clearLocationPreference() {
  try {
    window.localStorage.removeItem(LOCATION_PREFERENCE_STORAGE_KEY)
    window.localStorage.removeItem(LEGACY_NEIGHBORHOOD_STORAGE_KEY)
  } catch {
    // 저장소를 사용할 수 없어도 현재 화면의 선택은 해제합니다.
  }
}
