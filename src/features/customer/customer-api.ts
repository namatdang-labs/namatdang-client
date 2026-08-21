import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query"

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

export type SellingDealDto = {
  dealId: number
  storeId: number
  storeName: string | null
  salesEndsAt: string
  status: string
  description: string | null
  itemCount: number
  lowestSalePrice: number
  headlineItemName?: string | null
  totalRemainingQuantity?: number
  maxDiscountRate?: number
  distanceMeters?: number | null
  createdAt: string
}

export type SellingDealSearchParams = {
  page?: number
  size?: number
  keyword?: string
  centerLat?: number | null
  centerLng?: number | null
  radiusMeters?: number | null
}

export type InfiniteSellingDealSearchParams = Omit<
  SellingDealSearchParams,
  "page"
> & {
  enabled?: boolean
}

export type DealItemDto = {
  dealItemId: number
  name: string
  totalQuantity: number
  remainingQuantity: number
  originalPrice: number
  salePrice: number
  discountRate: number
  status: string
}

export type DealDetailDto = {
  dealId: number
  storeId: number
  storeName: string | null
  salesEndsAt: string
  status: string
  description: string | null
  items: DealItemDto[]
  createdAt: string
}

export type SellingDealPageDto = {
  content: SellingDealDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type SellingDealCatalog = {
  content: SellingDealDto[]
  complete: boolean
}

export type ReservationStatusDto = "RESERVED" | "PICKED_UP" | "CANCELED"

export type ReservationItemDto = {
  dealItemId: number
  name: string
  salePrice: number
  quantity: number
  subtotal: number
}

export type ReservationSummaryDto = {
  reservationId: number
  dealId: number
  storeId: number
  storeName: string | null
  status: ReservationStatusDto
  totalAmount: number
  createdAt: string
  canceledAt: string | null
  pickedUpAt: string | null
}

export type ReservationDetailDto = ReservationSummaryDto & {
  items: ReservationItemDto[]
}

export type ReservationPageDto = {
  content: ReservationSummaryDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type ReservationCreateRequest = {
  dealId: number
  items: Array<{
    dealItemId: number
    quantity: number
  }>
}

export type CustomerNotificationType =
  "DEAL_CREATED" | "RESERVATION_CONFIRMED" | "RESERVATION_CANCELED" | "UNKNOWN"

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
  "DEAL_CREATED",
  "RESERVATION_CONFIRMED",
  "RESERVATION_CANCELED",
])

function optionalText(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function getDistrict(address: string | null) {
  if (!address) return "지역 정보 없음"

  const addressParts = address.split(/\s+/).filter(Boolean)
  return addressParts.slice(0, 2).join(" ") || "지역 정보 없음"
}

function toNotificationType(value: string | null): CustomerNotificationType {
  return value && knownNotificationTypes.has(value as CustomerNotificationType)
    ? (value as CustomerNotificationType)
    : "UNKNOWN"
}

export function toKoreanDateTime(value: string): string
export function toKoreanDateTime(value: string | null): string | null
export function toKoreanDateTime(value: string | null) {
  if (value === null) return null
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}+09:00`
}

function adaptSellingDeal(dto: SellingDealDto): SellingDealDto {
  return {
    ...dto,
    salesEndsAt: toKoreanDateTime(dto.salesEndsAt),
    createdAt: toKoreanDateTime(dto.createdAt),
  }
}

function adaptDealDetail(dto: DealDetailDto): DealDetailDto {
  return {
    ...dto,
    salesEndsAt: toKoreanDateTime(dto.salesEndsAt),
    createdAt: toKoreanDateTime(dto.createdAt),
  }
}

function adaptReservationSummary(
  dto: ReservationSummaryDto,
): ReservationSummaryDto {
  return {
    ...dto,
    createdAt: toKoreanDateTime(dto.createdAt),
    canceledAt: toKoreanDateTime(dto.canceledAt),
    pickedUpAt: toKoreanDateTime(dto.pickedUpAt),
  }
}

function adaptReservationDetail(
  dto: ReservationDetailDto,
): ReservationDetailDto {
  return {
    ...adaptReservationSummary(dto),
    items: dto.items,
  }
}

function getNotificationActionLabel(type: CustomerNotificationType) {
  if (type === "DEAL_CREATED") return "할인 보기"
  if (type === "RESERVATION_CONFIRMED" || type === "RESERVATION_CANCELED") {
    return "예약 보기"
  }
  return "알림 확인"
}

export interface StoreMapDto {
  id: number
  name: string
  address: string
  addressDetail?: string | null
  phoneNumber?: string | null
  latitude: number
  longitude: number
  hasActiveDeal: boolean
  activeDealCount: number
}

export type StoreMapView = StoreMapDto & {
  routeId: string
}

export function adaptStoreMap(dto: StoreMapDto): StoreMapView {
  return {
    ...dto,
    routeId: String(dto.id),
  }
}

export function adaptStore(dto: StoreDto): StoreView {
  const address = optionalText(dto.address)
  const addressDetail = optionalText(dto.addressDetail)
  const fullAddress = [address, addressDetail].filter(Boolean).join(" ")

  return {
    id: dto.id,
    routeId: String(dto.id),
    name: optionalText(dto.name) ?? "이름이 등록되지 않은 가게",
    description: optionalText(dto.description) ?? "등록된 가게 소개가 없어요.",
    address: fullAddress || "등록된 주소가 없어요.",
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

export const parseNumericDealId = parseNumericStoreId
export const parseNumericReservationId = parseNumericStoreId

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401
}

export const customerQueryKeys = {
  all: ["customer"] as const,
  storesMap: (params: {
    minLat?: number
    maxLat?: number
    minLng?: number
    maxLng?: number
    onlyDiscounting?: boolean
    keyword?: string
    limit?: number
  }) => ["customer", "stores", "map", params] as const,
  stores: (keyword = "", page = 0, size = 20) =>
    ["customer", "stores", { keyword, page, size }] as const,
  storePages: (keyword = "", size = 20) =>
    ["customer", "stores", "infinite", { keyword, size }] as const,
  store: (storeId: number) => ["customer", "stores", storeId] as const,
  storeDeals: (storeId: number, page = 0, size = 20) =>
    ["customer", "stores", storeId, "deals", { page, size }] as const,
  sellingDeals: (params: {
    page: number
    size: number
    keyword: string
    centerLat: number | null
    centerLng: number | null
    radiusMeters: number | null
  }) => ["customer", "deals", "selling", params] as const,
  sellingDealPages: (params: {
    size: number
    keyword: string
    centerLat: number | null
    centerLng: number | null
    radiusMeters: number | null
  }) => ["customer", "deals", "selling", "infinite", params] as const,
  sellingDealCatalog: (size = 100) =>
    ["customer", "deals", "selling", "catalog", { size }] as const,
  deal: (dealId: number) => ["customer", "deals", dealId] as const,
  reservations: (
    status: ReservationStatusDto | undefined,
    page = 0,
    size = 100,
  ) => ["customer", "reservations", { status, page, size }] as const,
  reservation: (reservationId: number) =>
    ["customer", "reservations", reservationId] as const,
  favorites: ["customer", "favorites"] as const,
  notifications: (size = 20) =>
    ["customer", "notifications", "infinite", { size }] as const,
  unreadNotificationCount: [
    "customer",
    "notifications",
    "unread-count",
  ] as const,
}

export const MAP_STORE_RESULT_LIMIT = 50

export async function getStoresOnMap({
  minLat,
  maxLat,
  minLng,
  maxLng,
  onlyDiscounting = false,
  keyword = "",
  limit = MAP_STORE_RESULT_LIMIT,
}: {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
  onlyDiscounting?: boolean
  keyword?: string
  limit?: number
}): Promise<StoreMapView[]> {
  const searchParams = new URLSearchParams({
    minLat: String(minLat),
    maxLat: String(maxLat),
    minLng: String(minLng),
    maxLng: String(maxLng),
    limit: String(limit),
  })

  if (onlyDiscounting) searchParams.set("onlyDiscounting", "true")
  const normalizedKeyword = keyword.trim()
  if (normalizedKeyword) searchParams.set("keyword", normalizedKeyword)

  const response = await apiClient.get<StoreMapDto[]>(
    `/stores/map?${searchParams.toString()}`,
    { auth: false },
  )

  return response.map(adaptStoreMap)
}

export const storesOnMapQueryOptions = (params: {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
  onlyDiscounting?: boolean
  keyword?: string
  limit?: number
  enabled?: boolean
}) => {
  const queryParams = {
    minLat: params.minLat,
    maxLat: params.maxLat,
    minLng: params.minLng,
    maxLng: params.maxLng,
    onlyDiscounting: params.onlyDiscounting ?? false,
    keyword: params.keyword?.trim() ?? "",
    limit: params.limit ?? MAP_STORE_RESULT_LIMIT,
  }

  return queryOptions({
    queryKey: customerQueryKeys.storesMap(queryParams),
    queryFn: () => getStoresOnMap(queryParams),
    enabled: params.enabled ?? true,
  })
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
    { auth: false },
  )

  return {
    ...response,
    content: response.content.map(adaptStore),
  }
}

export async function getStore(storeId: number) {
  const response = await apiClient.get<StoreDto>(`/stores/${storeId}`, {
    auth: false,
  })
  return adaptStore(response)
}

function normalizeSellingDealSearchParams({
  page = 0,
  size = 100,
  keyword = "",
  centerLat,
  centerLng,
  radiusMeters = 5_000,
}: SellingDealSearchParams = {}) {
  const hasCenter =
    typeof centerLat === "number" && typeof centerLng === "number"

  return {
    page,
    size,
    keyword: keyword.trim(),
    centerLat: hasCenter ? centerLat : null,
    centerLng: hasCenter ? centerLng : null,
    radiusMeters: hasCenter ? (radiusMeters ?? 5_000) : null,
  }
}

export async function getSellingDeals(params: SellingDealSearchParams = {}) {
  const normalized = normalizeSellingDealSearchParams(params)
  const searchParams = new URLSearchParams({
    page: String(normalized.page),
    size: String(normalized.size),
  })

  if (normalized.keyword) searchParams.set("keyword", normalized.keyword)
  if (
    normalized.centerLat !== null &&
    normalized.centerLng !== null &&
    normalized.radiusMeters !== null
  ) {
    searchParams.set("centerLat", String(normalized.centerLat))
    searchParams.set("centerLng", String(normalized.centerLng))
    searchParams.set("radiusMeters", String(normalized.radiusMeters))
  }

  const response = await apiClient.get<SellingDealPageDto>(
    `/deals?${searchParams.toString()}`,
    { auth: false },
  )

  return {
    ...response,
    content: response.content.map(adaptSellingDeal),
  }
}

export async function getStoreDeals(storeId: number, page = 0, size = 20) {
  const response = await apiClient.get<SellingDealPageDto>(
    `/stores/${storeId}/deals?page=${page}&size=${size}`,
    { auth: false },
  )

  return {
    ...response,
    content: response.content.map(adaptSellingDeal),
  }
}

export async function getDeal(dealId: number) {
  const response = await apiClient.get<DealDetailDto>(`/deals/${dealId}`, {
    auth: false,
  })
  return adaptDealDetail(response)
}

export async function getSellingDealCatalog(
  size = 100,
): Promise<SellingDealCatalog> {
  const firstPage = await getSellingDeals({ page: 0, size })
  const content = [...firstPage.content]

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await getSellingDeals({ page, size })
    content.push(...nextPage.content)
  }

  return {
    content,
    complete:
      firstPage.totalPages === 0 || content.length >= firstPage.totalElements,
  }
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

export async function getReservations({
  status,
  page = 0,
  size = 100,
}: {
  status?: ReservationStatusDto
  page?: number
  size?: number
} = {}) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  })
  if (status) searchParams.set("status", status)

  const response = await apiClient.get<ReservationPageDto>(
    `/reservations?${searchParams.toString()}`,
  )

  return {
    ...response,
    content: response.content.map(adaptReservationSummary),
  }
}

export async function getReservation(reservationId: number) {
  const response = await apiClient.get<ReservationDetailDto>(
    `/reservations/${reservationId}`,
  )
  return adaptReservationDetail(response)
}

export async function createReservation(
  request: ReservationCreateRequest,
  idempotencyKey: string,
) {
  const response = await apiClient.post<ReservationDetailDto>(
    "/reservations",
    request,
    { headers: { "Idempotency-Key": idempotencyKey } },
  )
  return adaptReservationDetail(response)
}

export async function cancelReservation(
  reservationId: number,
  idempotencyKey: string,
) {
  const response = await apiClient.post<ReservationDetailDto>(
    `/reservations/${reservationId}/cancel`,
    undefined,
    { headers: { "Idempotency-Key": idempotencyKey } },
  )
  return adaptReservationDetail(response)
}

export async function getNotifications({
  cursor,
  size = 20,
}: {
  cursor?: number
  size?: number
} = {}) {
  const searchParams = new URLSearchParams()
  if (typeof cursor === "number") searchParams.set("cursor", String(cursor))
  searchParams.set("size", String(size))

  const response = await apiClient.get<NotificationListDto>(
    `/notifications?${searchParams.toString()}`,
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

export const infiniteStoresQueryOptions = ({
  keyword = "",
  size = 20,
  enabled = true,
}: {
  keyword?: string
  size?: number
  enabled?: boolean
} = {}) => {
  const normalizedKeyword = keyword.trim()

  return infiniteQueryOptions({
    queryKey: customerQueryKeys.storePages(normalizedKeyword, size),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getStores({ keyword: normalizedKeyword, page: pageParam, size }),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.page + 1,
    enabled,
  })
}

export const storeQueryOptions = (storeId: number) =>
  queryOptions({
    queryKey: customerQueryKeys.store(storeId),
    queryFn: () => getStore(storeId),
  })

export const storeDealsQueryOptions = (storeId: number, page = 0, size = 20) =>
  queryOptions({
    queryKey: customerQueryKeys.storeDeals(storeId, page, size),
    queryFn: () => getStoreDeals(storeId, page, size),
  })

export const sellingDealsQueryOptions = (
  params: SellingDealSearchParams = {},
) => {
  const normalized = normalizeSellingDealSearchParams(params)

  return queryOptions({
    queryKey: customerQueryKeys.sellingDeals(normalized),
    queryFn: () => getSellingDeals(normalized),
  })
}

export const infiniteSellingDealsQueryOptions = ({
  enabled = true,
  ...params
}: InfiniteSellingDealSearchParams = {}) => {
  const normalizedSearch = normalizeSellingDealSearchParams({
    ...params,
    page: 0,
  })
  const normalized = {
    size: normalizedSearch.size,
    keyword: normalizedSearch.keyword,
    centerLat: normalizedSearch.centerLat,
    centerLng: normalizedSearch.centerLng,
    radiusMeters: normalizedSearch.radiusMeters,
  }

  return infiniteQueryOptions({
    queryKey: customerQueryKeys.sellingDealPages(normalized),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getSellingDeals({ ...normalized, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.last || lastPage.page + 1 >= lastPage.totalPages
        ? undefined
        : lastPage.page + 1,
    enabled,
  })
}

export const sellingDealCatalogQueryOptions = (size = 100) =>
  queryOptions({
    queryKey: customerQueryKeys.sellingDealCatalog(size),
    queryFn: () => getSellingDealCatalog(size),
  })

export const dealQueryOptions = (dealId: number) =>
  queryOptions({
    queryKey: customerQueryKeys.deal(dealId),
    queryFn: () => getDeal(dealId),
  })

export const reservationsQueryOptions = ({
  status,
  page = 0,
  size = 100,
}: {
  status?: ReservationStatusDto
  page?: number
  size?: number
} = {}) =>
  queryOptions({
    queryKey: customerQueryKeys.reservations(status, page, size),
    queryFn: () => getReservations({ status, page, size }),
  })

export const reservationQueryOptions = (reservationId: number) =>
  queryOptions({
    queryKey: customerQueryKeys.reservation(reservationId),
    queryFn: () => getReservation(reservationId),
  })

export const notificationsQueryOptions = (size = 20) =>
  infiniteQueryOptions({
    queryKey: customerQueryKeys.notifications(size),
    initialPageParam: null as number | null,
    queryFn: ({ pageParam }) =>
      getNotifications({ cursor: pageParam ?? undefined, size }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNext && lastPage.nextCursor !== null
        ? lastPage.nextCursor
        : undefined,
  })

export const unreadNotificationCountQueryOptions = () =>
  queryOptions({
    queryKey: customerQueryKeys.unreadNotificationCount,
    queryFn: getUnreadNotificationCount,
  })
