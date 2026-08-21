import type { StoreDealStatus } from "./map-types"

export const STORE_MARKER_IMAGE_URL = "/brand/namatdang-icon.png"
const DEFAULT_MARKER_SIZE = 48
const SELECTED_MARKER_SIZE = 56

// 1024px 원본 자산에서 실제 핀 끝은 대략 (462, 872)에 있다.
const PIN_TIP_X_RATIO = 462 / 1024
const PIN_TIP_Y_RATIO = 872 / 1024

const STORE_DEAL_STATUS_DESCRIPTION: Record<StoreDealStatus, string> = {
  active: "현재 할인 진행 중",
  none: "현재 할인 없음",
  unknown: "할인 정보 확인 중",
}

interface StoreMarkerIconOptions {
  dealStatus: StoreDealStatus
  selected: boolean
  ariaLabel: string
}

interface MarkerStyle {
  imageFilter: string
}

function getMarkerStyle(dealStatus: StoreDealStatus): MarkerStyle {
  if (dealStatus === "active") {
    return {
      imageFilter: "none",
    }
  }

  return {
    imageFilter: "grayscale(1) opacity(0.68)",
  }
}

function createStoreMarkerContent({
  dealStatus,
  selected,
  ariaLabel,
}: StoreMarkerIconOptions) {
  const markerSize = selected ? SELECTED_MARKER_SIZE : DEFAULT_MARKER_SIZE
  const style = getMarkerStyle(dealStatus)
  const root = document.createElement("span")
  const image = document.createElement("img")

  root.dataset.dealStatus = dealStatus
  root.dataset.selected = String(selected)
  root.setAttribute("role", "img")
  root.setAttribute("aria-label", ariaLabel)
  Object.assign(root.style, {
    width: `${markerSize}px`,
    height: `${markerSize}px`,
    display: "block",
    position: "relative",
    boxSizing: "border-box",
    lineHeight: "0",
  })

  image.src = STORE_MARKER_IMAGE_URL
  image.alt = ""
  image.draggable = false
  Object.assign(image.style, {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "contain",
    filter: style.imageFilter,
  })

  root.append(image)
  return root
}

export function getStoreMarkerTitle(
  storeName: string,
  dealStatus: StoreDealStatus,
  selected = false,
) {
  const selectionLabel = selected ? " · 선택됨" : ""
  return `${storeName} · ${STORE_DEAL_STATUS_DESCRIPTION[dealStatus]}${selectionLabel}`
}

export function createStoreMarkerIcon(
  maps: typeof naver.maps,
  options: StoreMarkerIconOptions,
): naver.maps.HtmlIcon {
  const markerSize = options.selected
    ? SELECTED_MARKER_SIZE
    : DEFAULT_MARKER_SIZE

  return {
    content: createStoreMarkerContent(options),
    size: new maps.Size(markerSize, markerSize),
    anchor: new maps.Point(
      Math.round(markerSize * PIN_TIP_X_RATIO),
      Math.round(markerSize * PIN_TIP_Y_RATIO),
    ),
  }
}

export function createStoreLocationMarkerIcon(
  maps: typeof naver.maps,
  selected: boolean,
): naver.maps.ImageIcon {
  const markerSize = selected ? SELECTED_MARKER_SIZE : DEFAULT_MARKER_SIZE

  return {
    url: STORE_MARKER_IMAGE_URL,
    size: new maps.Size(markerSize, markerSize),
    scaledSize: new maps.Size(markerSize, markerSize),
    origin: new maps.Point(0, 0),
    anchor: new maps.Point(
      Math.round(markerSize * PIN_TIP_X_RATIO),
      Math.round(markerSize * PIN_TIP_Y_RATIO),
    ),
  }
}
