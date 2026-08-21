import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiClient, ApiError } from "../../shared/api/client"

export type OwnerDealStatus = "SELLING" | "ENDED" | "CLOSED" | "CANCELED"

export type OwnerDealItemStatus = "SELLING" | "SOLD_OUT"

export type OwnerDealSummary = {
  dealId: number
  storeId: number
  storeName: string
  salesEndsAt: string
  status: OwnerDealStatus
  description: string | null
  itemCount: number
  lowestSalePrice: number
  createdAt: string
}

export type OwnerDealItem = {
  dealItemId: number
  name: string
  totalQuantity: number
  remainingQuantity: number
  originalPrice: number
  salePrice: number
  discountRate: number
  status: OwnerDealItemStatus
}

export type OwnerDealDetail = Omit<
  OwnerDealSummary,
  "itemCount" | "lowestSalePrice"
> & {
  items: OwnerDealItem[]
}

export type OwnerDealCreateRequest = {
  salesEndsAt: string
  description: string | null
  items: Array<{
    name: string
    totalQuantity: number
    originalPrice: number
    salePrice: number
  }>
}

export type OwnerReservationStatus = "RESERVED" | "CANCELED" | "PICKED_UP"

export type OwnerReservationSummary = {
  reservationId: number
  dealId: number
  storeId: number
  storeName: string
  status: OwnerReservationStatus
  totalAmount: number
  createdAt: string
  canceledAt: string | null
  pickedUpAt: string | null
}

export type OwnerReservationItem = {
  dealItemId: number
  name: string
  salePrice: number
  quantity: number
  subtotal: number
}

export type OwnerReservationDetail = OwnerReservationSummary & {
  items: OwnerReservationItem[]
}

type PageDto<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

const CATALOG_PAGE_SIZE = 100

export const ownerManagementKeys = {
  deals: (storeId: number) => ["owner", "stores", storeId, "deals"] as const,
  deal: (dealId: number) => ["owner", "deals", dealId] as const,
  reservations: (storeId: number) =>
    ["owner", "stores", storeId, "reservations"] as const,
  reservation: (reservationId: number) =>
    ["owner", "reservations", reservationId] as const,
}

function normalizeKoreanDateTime(value: string): string
function normalizeKoreanDateTime(value: string | null): string | null
function normalizeKoreanDateTime(value: string | null) {
  if (value === null) return null
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}+09:00`
}

function normalizeDealSummary(deal: OwnerDealSummary): OwnerDealSummary {
  return {
    ...deal,
    salesEndsAt: normalizeKoreanDateTime(deal.salesEndsAt),
    createdAt: normalizeKoreanDateTime(deal.createdAt),
  }
}

function normalizeDealDetail(deal: OwnerDealDetail): OwnerDealDetail {
  return {
    ...deal,
    salesEndsAt: normalizeKoreanDateTime(deal.salesEndsAt),
    createdAt: normalizeKoreanDateTime(deal.createdAt),
  }
}

function normalizeReservationSummary(
  reservation: OwnerReservationSummary,
): OwnerReservationSummary {
  return {
    ...reservation,
    createdAt: normalizeKoreanDateTime(reservation.createdAt),
    canceledAt: normalizeKoreanDateTime(reservation.canceledAt),
    pickedUpAt: normalizeKoreanDateTime(reservation.pickedUpAt),
  }
}

function normalizeReservationDetail(
  reservation: OwnerReservationDetail,
): OwnerReservationDetail {
  return {
    ...normalizeReservationSummary(reservation),
    items: reservation.items,
  }
}

async function getAllPages<T>(
  getPage: (page: number) => Promise<PageDto<T>>,
): Promise<T[]> {
  const firstPage = await getPage(0)
  const content = [...firstPage.content]

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await getPage(page)
    content.push(...nextPage.content)
  }

  return content
}

export function getOwnerDealPage(
  storeId: number,
  page = 0,
  size = CATALOG_PAGE_SIZE,
) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  return apiClient
    .get<PageDto<OwnerDealSummary>>(
      `owner/stores/${storeId}/deals?${searchParams}`,
    )
    .then((result) => ({
      ...result,
      content: result.content.map(normalizeDealSummary),
    }))
}

export function getOwnerDeals(storeId: number) {
  return getAllPages((page) =>
    getOwnerDealPage(storeId, page, CATALOG_PAGE_SIZE),
  )
}

export function getOwnerDeal(dealId: number) {
  return apiClient
    .get<OwnerDealDetail>(`owner/deals/${dealId}`)
    .then(normalizeDealDetail)
}

export function createOwnerDeal(
  storeId: number,
  request: OwnerDealCreateRequest,
) {
  return apiClient
    .post<OwnerDealDetail>(`owner/stores/${storeId}/deals`, request)
    .then(normalizeDealDetail)
}

export function getOwnerReservationPage(
  storeId: number,
  page = 0,
  size = CATALOG_PAGE_SIZE,
) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  return apiClient
    .get<PageDto<OwnerReservationSummary>>(
      `owner/stores/${storeId}/reservations?${searchParams}`,
    )
    .then((result) => ({
      ...result,
      content: result.content.map(normalizeReservationSummary),
    }))
}

export function getOwnerReservations(storeId: number) {
  return getAllPages((page) =>
    getOwnerReservationPage(storeId, page, CATALOG_PAGE_SIZE),
  )
}

export function getOwnerReservation(reservationId: number) {
  return apiClient
    .get<OwnerReservationDetail>(`owner/reservations/${reservationId}`)
    .then(normalizeReservationDetail)
}

export function completeOwnerReservationPickup(reservationId: number) {
  return apiClient
    .post<OwnerReservationDetail>(`owner/reservations/${reservationId}/pickup`)
    .then(normalizeReservationDetail)
}

export function useOwnerDeals(storeId: number) {
  return useQuery({
    queryKey: ownerManagementKeys.deals(storeId),
    queryFn: () => getOwnerDeals(storeId),
  })
}

export function useOwnerDeal(dealId: number | null) {
  return useQuery({
    queryKey: ownerManagementKeys.deal(dealId ?? 0),
    queryFn: () => getOwnerDeal(dealId as number),
    enabled: dealId !== null,
  })
}

export function useCreateOwnerDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      storeId,
      request,
    }: {
      storeId: number
      request: OwnerDealCreateRequest
    }) => createOwnerDeal(storeId, request),
    retry: false,
    onSuccess: async (deal, { storeId }) => {
      queryClient.setQueryData(ownerManagementKeys.deal(deal.dealId), deal)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ownerManagementKeys.deals(storeId),
        }),
        queryClient.invalidateQueries({ queryKey: ["customer", "deals"] }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "stores", storeId, "deals"],
        }),
      ])
    },
  })
}

export function useOwnerReservations(storeId: number) {
  return useQuery({
    queryKey: ownerManagementKeys.reservations(storeId),
    queryFn: () => getOwnerReservations(storeId),
  })
}

export function useOwnerReservation(reservationId: number | null) {
  return useQuery({
    queryKey: ownerManagementKeys.reservation(reservationId ?? 0),
    queryFn: () => getOwnerReservation(reservationId as number),
    enabled: reservationId !== null,
  })
}

export function useCompleteOwnerReservationPickup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: completeOwnerReservationPickup,
    onSuccess: async (reservation) => {
      queryClient.setQueryData(
        ownerManagementKeys.reservation(reservation.reservationId),
        reservation,
      )
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ownerManagementKeys.reservations(reservation.storeId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "reservations"],
        }),
      ])
    },
  })
}

type ErrorPayload = {
  message?: unknown
}

function hasMessage(payload: unknown): payload is ErrorPayload {
  return typeof payload === "object" && payload !== null && "message" in payload
}

export function getManagementErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && hasMessage(error.payload)) {
    const message = error.payload.message
    if (typeof message === "string" && message.trim()) return message
  }

  if (error instanceof TypeError) {
    return "서비스에 연결하지 못했어요. 네트워크 상태를 확인한 뒤 다시 시도해 주세요."
  }

  return fallback
}
