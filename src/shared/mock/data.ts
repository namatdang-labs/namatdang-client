import type { Deal, Reservation, Store, User } from "../types"

const bakeryPhoto = "https://loremflickr.com/1200/900/bakery,bread/all?lock=173"
const croissantPhoto =
  "https://loremflickr.com/800/800/croissant,bakery/all?lock=284"
const cakePhoto = "https://loremflickr.com/800/800/cake,dessert/all?lock=395"

export const mockUser: User = {
  id: "user-1",
  name: "김남당",
  nickname: "빵산책",
  email: "namdang@example.com",
  phone: "010-1234-5678",
  roles: ["ROLE_USER", "ROLE_OWNER"],
  favoriteStoreIds: ["store-1", "store-3"],
}

export const mockStores: Store[] = [
  {
    id: "store-1",
    ownerId: "user-1",
    name: "성수 베이크샵",
    description: "매일 아침 매장에서 직접 굽는 동네 빵집이에요.",
    status: "active",
    category: "베이커리",
    address: "서울 성동구 연무장길 24 1층",
    neighborhood: "성수동",
    phone: "02-123-4567",
    imageUrl: bakeryPhoto,
    imageAlt: "성수 베이크샵 진열대의 갓 구운 빵",
    businessHours: "매일 오전 8:00–오후 9:00",
    pickupGuide: "매장 안쪽 픽업대에서 예약번호를 보여 주세요.",
    latitude: 37.5446,
    longitude: 127.0559,
    distanceMeters: 320,
  },
  {
    id: "store-2",
    ownerId: "user-1",
    name: "건대 디저트룸",
    description: "계절 과일과 크림으로 만드는 작은 디저트 가게예요.",
    status: "active",
    category: "디저트",
    address: "서울 광진구 능동로 120 2층",
    neighborhood: "화양동",
    phone: "02-987-6543",
    imageUrl: cakePhoto,
    imageAlt: "건대 디저트룸의 과일 케이크",
    businessHours: "화–일 오전 11:00–오후 8:00",
    pickupGuide: "계산대에서 예약자 이름을 말씀해 주세요.",
    latitude: 37.5415,
    longitude: 127.071,
    distanceMeters: 1800,
  },
  {
    id: "store-3",
    ownerId: "user-2",
    name: "밀밭 디저트",
    description: "고소한 곡물과 버터로 매일 다른 구움과자를 만들어요.",
    status: "active",
    category: "구움과자",
    address: "서울 성동구 아차산로 42 1층",
    neighborhood: "성수동",
    phone: "02-555-2026",
    imageUrl: croissantPhoto,
    imageAlt: "밀밭 디저트의 크루아상과 구움과자",
    businessHours: "월–토 오전 10:00–오후 8:00",
    pickupGuide: "입구 오른쪽 픽업 선반에서 직원에게 말씀해 주세요.",
    latitude: 37.5463,
    longitude: 127.0521,
    distanceMeters: 640,
  },
]

export const mockDeals: Deal[] = [
  {
    id: "deal-1",
    storeId: "store-1",
    title: "오늘의 베이커리 픽업",
    description: "오늘 구운 크루아상과 소금빵을 원하는 수량만큼 골라 보세요.",
    status: "selling",
    imageUrl: bakeryPhoto,
    imageAlt: "바구니에 담긴 버터 크루아상과 소금빵",
    pickupStartAt: "2026-08-18T18:00:00+09:00",
    pickupEndAt: "2026-08-18T20:00:00+09:00",
    publishedAt: "2026-08-18T15:00:00+09:00",
    createdAt: "2026-08-18T14:52:00+09:00",
    updatedAt: "2026-08-18T16:20:00+09:00",
    isFavorite: true,
    tags: ["오늘 픽업", "베이커리"],
    items: [
      {
        id: "item-1",
        name: "버터 크루아상",
        description: "프랑스산 버터를 넣어 겹겹이 구웠어요.",
        status: "selling",
        originalPrice: 6000,
        salePrice: 3900,
        totalQuantity: 8,
        remainingQuantity: 3,
        imageUrl: croissantPhoto,
        imageAlt: "노릇하게 구운 버터 크루아상",
      },
      {
        id: "item-2",
        name: "소금빵",
        description: "담백한 반죽에 천일염을 살짝 올렸어요.",
        status: "selling",
        originalPrice: 3000,
        salePrice: 1500,
        totalQuantity: 10,
        remainingQuantity: 5,
      },
    ],
  },
  {
    id: "deal-2",
    storeId: "store-3",
    title: "오늘의 빵 꾸러미",
    description: "휘낭시에와 스콘을 한 꾸러미로 준비했어요.",
    status: "low-stock",
    imageUrl: croissantPhoto,
    imageAlt: "종이 상자에 담긴 오늘의 빵 꾸러미",
    pickupStartAt: "2026-08-18T17:30:00+09:00",
    pickupEndAt: "2026-08-18T19:30:00+09:00",
    publishedAt: "2026-08-18T14:30:00+09:00",
    createdAt: "2026-08-18T14:20:00+09:00",
    updatedAt: "2026-08-18T17:05:00+09:00",
    isFavorite: true,
    tags: ["2개 남음", "구움과자"],
    items: [
      {
        id: "item-3",
        name: "구움과자 꾸러미",
        description: "휘낭시에 2개와 플레인 스콘 1개가 들어 있어요.",
        status: "selling",
        originalPrice: 11000,
        salePrice: 6900,
        totalQuantity: 6,
        remainingQuantity: 2,
      },
    ],
  },
  {
    id: "deal-3",
    storeId: "store-2",
    title: "조각 케이크 모음",
    description: "오늘 준비한 조각 케이크를 골라 픽업해 주세요.",
    status: "sold-out",
    imageUrl: cakePhoto,
    imageAlt: "진열대에 놓인 여러 종류의 조각 케이크",
    pickupStartAt: "2026-08-18T18:00:00+09:00",
    pickupEndAt: "2026-08-18T20:00:00+09:00",
    publishedAt: "2026-08-18T13:00:00+09:00",
    createdAt: "2026-08-18T12:45:00+09:00",
    updatedAt: "2026-08-18T17:30:00+09:00",
    isFavorite: false,
    tags: ["품절", "케이크"],
    items: [
      {
        id: "item-4",
        name: "제철 과일 조각 케이크",
        status: "sold-out",
        originalPrice: 7800,
        salePrice: 4900,
        totalQuantity: 4,
        remainingQuantity: 0,
      },
    ],
  },
  {
    id: "deal-4",
    storeId: "store-1",
    title: "어제의 마감 할인",
    description: "운영 화면의 마감 상태를 확인하기 위한 예시예요.",
    status: "ended",
    imageUrl: bakeryPhoto,
    imageAlt: "베이커리의 빵 진열대",
    pickupStartAt: "2026-08-17T18:00:00+09:00",
    pickupEndAt: "2026-08-17T20:00:00+09:00",
    publishedAt: "2026-08-17T15:00:00+09:00",
    createdAt: "2026-08-17T14:50:00+09:00",
    updatedAt: "2026-08-17T20:00:00+09:00",
    isFavorite: false,
    tags: ["마감"],
    items: [
      {
        id: "item-5",
        name: "플레인 스콘",
        status: "unavailable",
        originalPrice: 4500,
        salePrice: 2800,
        totalQuantity: 5,
        remainingQuantity: 1,
      },
    ],
  },
]

export const mockReservations: Reservation[] = [
  {
    id: "reservation-1",
    reservationNumber: "NMD-0818-014",
    userId: "user-1",
    storeId: "store-1",
    dealId: "deal-1",
    status: "confirmed",
    items: [
      {
        dealItemId: "item-1",
        name: "버터 크루아상",
        quantity: 1,
        unitOriginalPrice: 6000,
        unitSalePrice: 3900,
      },
      {
        dealItemId: "item-2",
        name: "소금빵",
        quantity: 2,
        unitOriginalPrice: 3000,
        unitSalePrice: 1500,
      },
    ],
    pickupAt: "2026-08-18T19:00:00+09:00",
    totalOriginalPrice: 12000,
    totalPrice: 6900,
    customerName: "김남당",
    customerPhone: "010-1234-5678",
    customerNote: "도착하면 예약번호를 보여 드릴게요.",
    createdAt: "2026-08-18T16:42:00+09:00",
    updatedAt: "2026-08-18T16:42:00+09:00",
  },
  {
    id: "reservation-2",
    reservationNumber: "NMD-0818-015",
    userId: "user-3",
    storeId: "store-1",
    dealId: "deal-1",
    status: "pending",
    items: [
      {
        dealItemId: "item-2",
        name: "소금빵",
        quantity: 2,
        unitOriginalPrice: 3000,
        unitSalePrice: 1500,
      },
    ],
    pickupAt: "2026-08-18T18:30:00+09:00",
    totalOriginalPrice: 6000,
    totalPrice: 3000,
    customerName: "이성수",
    customerPhone: "010-2345-6789",
    createdAt: "2026-08-18T16:51:00+09:00",
    updatedAt: "2026-08-18T16:51:00+09:00",
  },
  {
    id: "reservation-3",
    reservationNumber: "NMD-0818-009",
    userId: "user-4",
    storeId: "store-1",
    dealId: "deal-1",
    status: "picked-up",
    items: [
      {
        dealItemId: "item-1",
        name: "버터 크루아상",
        quantity: 1,
        unitOriginalPrice: 6000,
        unitSalePrice: 3900,
      },
    ],
    pickupAt: "2026-08-18T18:00:00+09:00",
    totalOriginalPrice: 6000,
    totalPrice: 3900,
    customerName: "박빵순",
    customerPhone: "010-3456-7890",
    createdAt: "2026-08-18T15:10:00+09:00",
    updatedAt: "2026-08-18T18:06:00+09:00",
  },
  {
    id: "reservation-4",
    reservationNumber: "NMD-0817-031",
    userId: "user-1",
    storeId: "store-3",
    dealId: "deal-2",
    status: "canceled",
    items: [
      {
        dealItemId: "item-3",
        name: "구움과자 꾸러미",
        quantity: 1,
        unitOriginalPrice: 11000,
        unitSalePrice: 6900,
      },
    ],
    pickupAt: "2026-08-17T19:00:00+09:00",
    totalOriginalPrice: 11000,
    totalPrice: 6900,
    customerName: "김남당",
    customerPhone: "010-1234-5678",
    createdAt: "2026-08-17T15:20:00+09:00",
    updatedAt: "2026-08-17T16:03:00+09:00",
  },
  {
    id: "reservation-5",
    reservationNumber: "NMD-0818-021",
    userId: "user-5",
    storeId: "store-2",
    dealId: "deal-3",
    status: "confirmed",
    items: [
      {
        dealItemId: "item-4",
        name: "제철 과일 조각 케이크",
        quantity: 1,
        unitOriginalPrice: 7800,
        unitSalePrice: 4900,
      },
    ],
    pickupAt: "2026-08-18T19:30:00+09:00",
    totalOriginalPrice: 7800,
    totalPrice: 4900,
    customerName: "최디저트",
    customerPhone: "010-4567-8901",
    createdAt: "2026-08-18T17:12:00+09:00",
    updatedAt: "2026-08-18T17:12:00+09:00",
  },
]

export function getStoreById(storeId: string) {
  return mockStores.find((store) => store.id === storeId)
}

export function getDealById(dealId: string) {
  return mockDeals.find((deal) => deal.id === dealId)
}

export function getDealsByStoreId(storeId: string) {
  return mockDeals.filter((deal) => deal.storeId === storeId)
}

export function getReservationById(reservationId: string) {
  return mockReservations.find(
    (reservation) =>
      reservation.id === reservationId ||
      reservation.reservationNumber === reservationId,
  )
}

export function getReservationsByStoreId(storeId: string) {
  return mockReservations.filter(
    (reservation) => reservation.storeId === storeId,
  )
}

export function getReservationsByUserId(userId: string) {
  return mockReservations.filter((reservation) => reservation.userId === userId)
}

export function getDealRemainingQuantity(deal: Deal) {
  return deal.items.reduce(
    (quantity, item) => quantity + item.remainingQuantity,
    0,
  )
}

export function getDealStartingPrice(deal: Deal) {
  const availablePrices = deal.items
    .filter((item) => item.remainingQuantity > 0)
    .map((item) => item.salePrice)

  return availablePrices.length > 0 ? Math.min(...availablePrices) : undefined
}
