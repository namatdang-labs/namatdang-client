export type NaverMapLoadErrorCode =
  "missing-key" | "load-failed" | "auth-failed"

const NAVER_MAP_ERROR_MESSAGES: Record<NaverMapLoadErrorCode, string> = {
  "missing-key":
    "지도 연결을 준비하지 못했어요. 주소 정보는 계속 확인할 수 있어요.",
  "load-failed":
    "지도를 불러오지 못했어요. 네트워크 연결을 확인하고 다시 시도해 주세요.",
  "auth-failed":
    "지도 사용 권한을 확인하지 못했어요. 주소 정보는 계속 확인할 수 있어요.",
}

export class NaverMapLoadError extends Error {
  readonly code: NaverMapLoadErrorCode

  constructor(code: NaverMapLoadErrorCode, options?: ErrorOptions) {
    super(NAVER_MAP_ERROR_MESSAGES[code], options)
    this.name = "NaverMapLoadError"
    this.code = code
  }
}

export function isNaverMapLoadError(
  error: unknown,
): error is NaverMapLoadError {
  return error instanceof NaverMapLoadError
}

export type GeocodingErrorCode =
  "empty-query" | "no-results" | "invalid-coordinate" | "request-failed"

const GEOCODING_ERROR_MESSAGES: Record<GeocodingErrorCode, string> = {
  "empty-query": "검색할 주소를 입력해 주세요.",
  "no-results":
    "입력한 주소를 찾지 못했어요. 도로명과 건물 번호를 확인해 주세요.",
  "invalid-coordinate":
    "주소의 위치 정보를 확인하지 못했어요. 다른 주소로 다시 검색해 주세요.",
  "request-failed": "주소를 검색하지 못했어요. 잠시 후 다시 시도해 주세요.",
}

export class GeocodingError extends Error {
  readonly code: GeocodingErrorCode

  constructor(code: GeocodingErrorCode, options?: ErrorOptions) {
    super(GEOCODING_ERROR_MESSAGES[code], options)
    this.name = "GeocodingError"
    this.code = code
  }
}

export function isGeocodingError(error: unknown): error is GeocodingError {
  return error instanceof GeocodingError
}

export type ReverseGeocodingErrorCode =
  "invalid-coordinate" | "no-results" | "request-failed"

const REVERSE_GEOCODING_ERROR_MESSAGES: Record<
  ReverseGeocodingErrorCode,
  string
> = {
  "invalid-coordinate": "선택한 위치의 좌표를 확인해 주세요.",
  "no-results": "선택한 위치의 주소를 찾지 못했어요.",
  "request-failed":
    "선택한 위치의 주소를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
}

export class ReverseGeocodingError extends Error {
  readonly code: ReverseGeocodingErrorCode

  constructor(code: ReverseGeocodingErrorCode, options?: ErrorOptions) {
    super(REVERSE_GEOCODING_ERROR_MESSAGES[code], options)
    this.name = "ReverseGeocodingError"
    this.code = code
  }
}

export function isReverseGeocodingError(
  error: unknown,
): error is ReverseGeocodingError {
  return error instanceof ReverseGeocodingError
}
