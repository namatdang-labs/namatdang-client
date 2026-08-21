import { GeocodingError } from "./map-errors"
import { isValidMapCoordinate, type GeocodedAddress } from "./map-types"
import { loadNaverMaps } from "./naver-map-loader"

export async function geocodeAddress(query: string): Promise<GeocodedAddress> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) {
    throw new GeocodingError("empty-query")
  }

  const maps = await loadNaverMaps()

  return new Promise<GeocodedAddress>((resolve, reject) => {
    maps.Service.geocode({ query: normalizedQuery }, (status, response) => {
      if (status !== maps.Service.Status.OK) {
        reject(new GeocodingError("request-failed"))
        return
      }

      const address = response?.v2?.addresses?.[0]
      if (!address) {
        reject(new GeocodingError("no-results"))
        return
      }

      const coordinate = {
        latitude: Number(address.y),
        longitude: Number(address.x),
      }
      if (!isValidMapCoordinate(coordinate)) {
        reject(new GeocodingError("invalid-coordinate"))
        return
      }

      resolve({
        ...coordinate,
        roadAddress: address.roadAddress,
        jibunAddress: address.jibunAddress,
        englishAddress: address.englishAddress,
      })
    })
  })
}
