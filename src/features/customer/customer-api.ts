import { queryOptions } from "@tanstack/react-query"

import { apiClient, ApiError } from "../../shared/api/client"
import { getSafeInternalPath } from "../../shared/lib/safe-internal-path"

export type StoreDto = {
  id: number
  name: string | null
  address: string | null
  addressDetail: string | null
  phoneNumber: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
}

export type StorePageDto = {
  content: StoreDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type StoreView = {
  id: number
  routeId: string
  name: string
  description: string
  address: string
  district: string
  phoneNumber: string | null
  latitude: number | null
  longitude: number | null
}

export type StorePageView = Omit<StorePageDto, "content"> & {
  content: StoreView[]
}

export type CustomerNotificationType =
  | "DEAL_PUBLISHED"
  | "RESERVATION_CONFIRMED"
  | "RESERVATION_CANCELED"
  | "UNKNOWN"

export type NotificationDto = {
  id: number
  type: string | null
  title: string | null
  body: string | null
  linkUrl: string | null
  read: boolean
  readAt: string | null
  createdAt: string
}

export type NotificationListDto = {
  notifications: NotificationDto[]
  nextCursor: number | null
  hasNext: boolean
}

export type CustomerNotification = {
  id: number
  type: CustomerNotificationType
  title: string
  description: string
  createdAt: string
  isRead: boolean
  href: string
  actionLabel: string
}

export type NotificationListView = Omit<
  NotificationListDto,
  "notifications"
> & {
  notifications: CustomerNotification[]
}

export type UnreadNotificationCountDto = {
  unreadCount: number
}

const knownNotificationTypes = new Set<CustomerNotificationType>([
  "DEAL_PUBLISHED",
  "RESERVATION_CONFIRMED",
  "RESERVATION_CANCELED",
])

function optionalText(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function getDistrict(address: string | null) {
  if (!address) return "지역 정보 준비 중"

  const addressParts = address.split(/\s+/).filter(Boolean)
  return addressParts.slice(0, 2).join(" ") || "지역 정보 준비 중"
}

function toNotificationType(value: string | null): CustomerNotificationType {
  return value && knownNotificationTypes.has(value as CustomerNotificationType)
    ? (value as CustomerNotificationType)
    : "UNKNOWN"
}

function toKoreanDateTime(value: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}+09:00`
}

function getNotificationActionLabel(type: CustomerNotificationType) {
  if (type === "DEAL_PUBLISHED") return "할인 보기"
  if (type === "RESERVATION_CONFIRMED" || type === "RESERVATION_CANCELED") {
    return "예약 보기"
  }
  return "알림 확인"
}

export function adaptStore(dto: StoreDto): StoreView {
  const address = optionalText(dto.address)
  const addressDetail = optionalText(dto.addressDetail)
  const fullAddress = [address, addressDetail].filter(Boolean).join(" ")

  return {
    id: dto.id,
    routeId: String(dto.id),
    name: optionalText(dto.name) ?? "이름을 준비 중인 가게",
    description:
      optionalText(dto.description) ?? "가게 소개를 준비하고 있어요.",
    address: fullAddress || "주소 정보가 아직 없어요.",
    district: getDistrict(address),
    phoneNumber: optionalText(dto.phoneNumber),
    latitude: dto.latitude,
    longitude: dto.longitude,
  }
}

export function adaptNotification(dto: NotificationDto): CustomerNotification {
  const type = toNotificationType(dto.type)

  return {
    id: dto.id,
    type,
    title: optionalText(dto.title) ?? "새로운 소식이 도착했어요",
    description:
      optionalText(dto.body) ?? "알림과 관련된 내용을 확인해 주세요.",
    createdAt: toKoreanDateTime(dto.createdAt),
    isRead: dto.read,
    href: getSafeInternalPath(optionalText(dto.linkUrl), "/notifications"),
    actionLabel: getNotificationActionLabel(type),
  }
}

export function parseNumericStoreId(value: string | undefined) {
  if (!value || !/^[1-9]\d*$/.test(value)) return null

  const storeId = Number(value)
  return Number.isSafeInteger(storeId) ? storeId : null
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401
}

export const customerQueryKeys = {
  all: ["customer"] as const,
  stores: (keyword = "", page = 0, size = 20) =>
    ["customer", "stores", { keyword, page, size }] as const,
  store: (storeId: number) => ["customer", "stores", storeId] as const,
  favorites: ["customer", "favorites"] as const,
  notifications: (size = 100) =>
    ["customer", "notifications", { size }] as const,
  unreadNotificationCount: [
    "customer",
    "notifications",
    "unread-count",
  ] as const,
}

export async function getStores({
  keyword = "",
  page = 0,
  size = 20,
}: {
  keyword?: string
  page?: number
  size?: number
} = {}): Promise<StorePageView> {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  })
  const normalizedKeyword = keyword.trim()

  if (normalizedKeyword) searchParams.set("keyword", normalizedKeyword)

  const response = await apiClient.get<StorePageDto>(
    `/stores?${searchParams.toString()}`,
  )

  return {
    ...response,
    content: response.content.map(adaptStore),
  }
}

export async function getStore(storeId: number) {
  const response = await apiClient.get<StoreDto>(`/stores/${storeId}`)
  return adaptStore(response)
}

export async function getFavoriteStores() {
  const response = await apiClient.get<StoreDto[]>("/favorites")
  return response.map(adaptStore)
}

export function addFavorite(storeId: number) {
  return apiClient.put<void>(`/favorites/${storeId}`)
}

export function removeFavorite(storeId: number) {
  return apiClient.delete<void>(`/favorites/${storeId}`)
}

export async function getNotifications(size = 100) {
  const response = await apiClient.get<NotificationListDto>(
    `/notifications?size=${size}`,
  )

  return {
    ...response,
    notifications: response.notifications.map(adaptNotification),
  } satisfies NotificationListView
}

export function getUnreadNotificationCount() {
  return apiClient.get<UnreadNotificationCountDto>(
    "/notifications/unread-count",
  )
}

export function markNotificationAsRead(notificationId: number) {
  return apiClient.patch<void>(
    `/notifications/${notificationId}/read`,
    undefined,
  )
}

export const favoriteStoresQueryOptions = () =>
  queryOptions({
    queryKey: customerQueryKeys.favorites,
    queryFn: getFavoriteStores,
  })

export const storesQueryOptions = ({
  keyword = "",
  page = 0,
  size = 20,
}: {
  keyword?: string
  page?: number
  size?: number
} = {}) =>
  queryOptions({
    queryKey: customerQueryKeys.stores(keyword.trim(), page, size),
    queryFn: () => getStores({ keyword, page, size }),
  })

export const storeQueryOptions = (storeId: number) =>
  queryOptions({
    queryKey: customerQueryKeys.store(storeId),
    queryFn: () => getStore(storeId),
  })

export const notificationsQueryOptions = (size = 100) =>
  queryOptions({
    queryKey: customerQueryKeys.notifications(size),
    queryFn: () => getNotifications(size),
  })

export const unreadNotificationCountQueryOptions = () =>
  queryOptions({
    queryKey: customerQueryKeys.unreadNotificationCount,
    queryFn: getUnreadNotificationCount,
  })
