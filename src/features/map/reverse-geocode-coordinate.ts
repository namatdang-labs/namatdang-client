import { ReverseGeocodingError } from "./map-errors"
import {
  isValidMapCoordinate,
  type MapCoordinate,
  type ReverseGeocodedLocation,
} from "./map-types"
import { loadNaverMaps } from "./naver-map-loader"

const REVERSE_GEOCODE_ORDERS = "admcode,legalcode,roadaddr,addr"

function findResult(results: naver.maps.Service.ResultItem[], name: string) {
  return results.find((result) => result.name.toLowerCase() === name)
}

function readAreaName(
  result: naver.maps.Service.ResultItem | undefined,
  area: "area1" | "area2" | "area3",
) {
  return result?.region[area]?.name.trim() ?? ""
}

function createRegionAddress(
  result: naver.maps.Service.ResultItem | undefined,
) {
  if (!result) {
    return ""
  }

  return [
    result.region.area1.name,
    result.region.area2.name,
    result.region.area3.name,
    result.region.area4.name,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
}

export async function reverseGeocodeCoordinate(
  coordinate: MapCoordinate,
): Promise<ReverseGeocodedLocation> {
  if (!isValidMapCoordinate(coordinate)) {
    throw new ReverseGeocodingError("invalid-coordinate")
  }

  const maps = await loadNaverMaps()
  const coords = new maps.LatLng(coordinate.latitude, coordinate.longitude)

  return new Promise<ReverseGeocodedLocation>((resolve, reject) => {
    maps.Service.reverseGeocode(
      { coords, orders: REVERSE_GEOCODE_ORDERS },
      (status, response) => {
        if (status !== maps.Service.Status.OK) {
          reject(new ReverseGeocodingError("request-failed"))
          return
        }

        const results = response?.v2?.results ?? []
        if (results.length === 0) {
          reject(new ReverseGeocodingError("no-results"))
          return
        }

        const administrative = findResult(results, "admcode")
        const legal = findResult(results, "legalcode")
        const addressResult =
          findResult(results, "roadaddr") ??
          findResult(results, "addr") ??
          administrative ??
          legal ??
          results[0]
        const label =
          readAreaName(administrative, "area3") ||
          readAreaName(legal, "area3") ||
          readAreaName(addressResult, "area3") ||
          readAreaName(administrative, "area2") ||
          readAreaName(legal, "area2") ||
          readAreaName(addressResult, "area2") ||
          readAreaName(addressResult, "area1")
        const address =
          response.v2.address.roadAddress.trim() ||
          response.v2.address.jibunAddress.trim() ||
          createRegionAddress(addressResult)

        if (!label || !address) {
          reject(new ReverseGeocodingError("no-results"))
          return
        }

        resolve({
          coordinate: { ...coordinate },
          address,
          label,
        })
      },
    )
  })
}
