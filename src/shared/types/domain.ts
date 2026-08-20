export type UserRole = "ROLE_USER" | "ROLE_OWNER"

export type StoreStatus = "draft" | "pending" | "active" | "paused"

export type DealStatus =
  "selling" | "low-stock" | "sold-out" | "ended" | "canceled"

export type DealItemStatus = "selling" | "sold-out" | "unavailable"

export type ReservationStatus =
  "pending" | "confirmed" | "picked-up" | "canceled" | "no-show"

export type DomainStatus =
  StoreStatus | DealStatus | DealItemStatus | ReservationStatus

export interface User {
  id: string
  name: string
  nickname: string
  email: string
  phone: string
  roles: UserRole[]
  favoriteStoreIds: string[]
  avatarUrl?: string
}

export interface Store {
  id: string
  ownerId: string
  name: string
  description: string
  status: StoreStatus
  category: string
  address: string
  neighborhood: string
  phone: string
  imageUrl?: string
  imageAlt?: string
  businessHours: string
  pickupGuide: string
  latitude: number
  longitude: number
  distanceMeters?: number
}

export interface DealItem {
  id: string
  name: string
  description?: string
  status: DealItemStatus
  originalPrice: number
  salePrice: number
  totalQuantity: number
  remainingQuantity: number
  imageUrl?: string
  imageAlt?: string
}

export interface Deal {
  id: string
  storeId: string
  title: string
  description: string
  status: DealStatus
  items: DealItem[]
  imageUrl?: string
  imageAlt?: string
  pickupStartAt: string
  pickupEndAt: string
  publishedAt: string
  createdAt: string
  updatedAt: string
  isFavorite?: boolean
  tags?: string[]
}

export interface ReservationItem {
  dealItemId: string
  name: string
  quantity: number
  unitOriginalPrice: number
  unitSalePrice: number
}

export interface Reservation {
  id: string
  reservationNumber: string
  userId: string
  storeId: string
  dealId: string
  status: ReservationStatus
  items: ReservationItem[]
  pickupAt: string
  totalOriginalPrice: number
  totalPrice: number
  customerName: string
  customerPhone: string
  customerNote?: string
  createdAt: string
  updatedAt: string
}
