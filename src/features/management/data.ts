import type { ReservationStatus } from "../../shared/types"

export type ManagementDealStatus =
  "selling" | "low-stock" | "sold-out" | "ended"

export type ManagementDeal = {
  id: string
  storeId: string
  name: string
  status: ManagementDealStatus
  originalPrice: number
  salePrice: number
  stock: number
  reserved: number
  pickupWindow: string
}

export type ManagementReservationStatus = ReservationStatus

export type ManagementReservation = {
  id: string
  storeId: string
  customerName: string
  pickupTime: string
  items: string[]
  totalQuantity: number
  totalPrice: number
  status: ManagementReservationStatus
  requestedAt: string
  note?: string
}

export const managementDeals: ManagementDeal[] = [
  {
    id: "deal-001",
    storeId: "seongsu",
    name: "버터 크루아상 세트",
    status: "selling",
    originalPrice: 12000,
    salePrice: 6900,
    stock: 3,
    reserved: 5,
    pickupWindow: "오후 7:00–8:00",
  },
  {
    id: "deal-002",
    storeId: "seongsu",
    name: "오늘의 빵 꾸러미",
    status: "low-stock",
    originalPrice: 15000,
    salePrice: 7900,
    stock: 1,
    reserved: 3,
    pickupWindow: "오후 6:30–7:30",
  },
  {
    id: "deal-003",
    storeId: "seongsu",
    name: "마들렌 4종 상자",
    status: "sold-out",
    originalPrice: 10000,
    salePrice: 5900,
    stock: 0,
    reserved: 4,
    pickupWindow: "오후 6:00–7:00",
  },
  {
    id: "deal-004",
    storeId: "seongsu",
    name: "어제 등록한 스콘 세트",
    status: "ended",
    originalPrice: 11000,
    salePrice: 6500,
    stock: 2,
    reserved: 2,
    pickupWindow: "어제 오후 8:00 마감",
  },
  {
    id: "deal-101",
    storeId: "geondae",
    name: "과일 조각 케이크",
    status: "selling",
    originalPrice: 7800,
    salePrice: 4900,
    stock: 4,
    reserved: 2,
    pickupWindow: "오후 6:00–7:30",
  },
  {
    id: "deal-102",
    storeId: "geondae",
    name: "크림 디저트 상자",
    status: "ended",
    originalPrice: 13000,
    salePrice: 7500,
    stock: 1,
    reserved: 3,
    pickupWindow: "어제 오후 7:30 마감",
  },
]

export const managementReservations: ManagementReservation[] = [
  {
    id: "NMD-0818-001",
    storeId: "seongsu",
    customerName: "김남았",
    pickupTime: "오후 7:00",
    items: ["버터 크루아상 세트 1개", "오늘의 빵 꾸러미 1개"],
    totalQuantity: 2,
    totalPrice: 14800,
    status: "confirmed",
    requestedAt: "오늘 오후 4:12",
    note: "도착하면 매장 직원에게 예약번호를 보여 주세요.",
  },
  {
    id: "NMD-0818-002",
    storeId: "seongsu",
    customerName: "박단골",
    pickupTime: "오후 7:20",
    items: ["버터 크루아상 세트 2개"],
    totalQuantity: 2,
    totalPrice: 13800,
    status: "pending",
    requestedAt: "오늘 오후 4:35",
  },
  {
    id: "NMD-0818-003",
    storeId: "seongsu",
    customerName: "이동네",
    pickupTime: "오후 7:40",
    items: ["오늘의 빵 꾸러미 1개", "마들렌 4종 상자 1개"],
    totalQuantity: 2,
    totalPrice: 13800,
    status: "pending",
    requestedAt: "오늘 오후 5:02",
  },
  {
    id: "NMD-0818-004",
    storeId: "seongsu",
    customerName: "최빵순",
    pickupTime: "오후 6:30",
    items: ["마들렌 4종 상자 1개"],
    totalQuantity: 1,
    totalPrice: 5900,
    status: "picked-up",
    requestedAt: "오늘 오후 3:18",
  },
  {
    id: "NMD-0818-101",
    storeId: "geondae",
    customerName: "정디저트",
    pickupTime: "오후 6:40",
    items: ["과일 조각 케이크 1개"],
    totalQuantity: 1,
    totalPrice: 4900,
    status: "confirmed",
    requestedAt: "오늘 오후 4:48",
  },
]

export const formatPrice = (price: number) =>
  `${price.toLocaleString("ko-KR")}원`
