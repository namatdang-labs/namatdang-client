export type DealCategory = "빵" | "디저트" | "케이크"

export type DealItem = {
  id: string
  name: string
  description: string
  originalPrice: number
  salePrice: number
  stock: number
}

export type StoreSummary = {
  id: string
  name: string
  district: string
  address: string
  description: string
  pickupGuide: string
  openHours: string
  imageUrl: string
}

export type DealSummary = {
  id: string
  storeId: string
  title: string
  category: DealCategory
  imageUrl: string
  originalPrice: number
  salePrice: number
  stock: number
  pickupStart: string
  pickupEnd: string
  distance: string
  items: DealItem[]
}

export type ReservationStatus = "confirmed" | "picked-up" | "canceled"

export type ReservationSummary = {
  id: string
  reservationNumber: string
  dealId: string
  storeId: string
  status: ReservationStatus
  pickupDate: string
  pickupTime: string
  itemSummary: string
  totalQuantity: number
  totalPrice: number
}

export type ReservationDraftItem = DealItem & {
  quantity: number
}

export type ReservationDraft = {
  reservationNumber: string
  dealId: string
  storeId: string
  storeName: string
  pickupDate: string
  pickupTime: string
  items: ReservationDraftItem[]
  totalPrice: number
  totalQuantity: number
}

export const stores: StoreSummary[] = [
  {
    id: "seongsu-bread-lab",
    name: "성수 빵연구소",
    district: "성수동",
    address: "서울 성동구 연무장길 18 1층",
    description:
      "매일 오전 국산 밀가루로 빵을 굽는 동네 베이커리예요. 당일 남은 빵은 마감 할인으로 준비해요.",
    pickupGuide: "입구 오른쪽 픽업대에서 예약 번호를 보여 주세요.",
    openHours: "오전 8:00 ~ 오후 8:00",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=82",
  },
  {
    id: "forest-scone",
    name: "포레스트 스콘",
    district: "연남동",
    address: "서울 마포구 동교로46길 12",
    description:
      "버터 향이 좋은 스콘과 계절 잼을 만들어요. 느긋한 오후에는 당일 판매 제품을 더 가볍게 만나보세요.",
    pickupGuide: "카운터에서 이름과 예약 번호를 알려 주세요.",
    openHours: "오전 10:00 ~ 오후 9:00",
    imageUrl:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=82",
  },
  {
    id: "mangwon-cake-room",
    name: "망원 케이크룸",
    district: "망원동",
    address: "서울 마포구 망원로 72 2층",
    description:
      "매일 다른 크림과 과일로 조각 케이크를 만들어요. 편안한 한 조각을 동네에서 픽업해 보세요.",
    pickupGuide: "2층 주문대에서 남았당 픽업을 말씀해 주세요.",
    openHours: "오전 11:00 ~ 오후 9:00",
    imageUrl:
      "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1200&q=82",
  },
]

export const deals: DealSummary[] = [
  {
    id: "salt-bread-today",
    storeId: "seongsu-bread-lab",
    title: "오늘의 소금빵 모음",
    category: "빵",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=82",
    originalPrice: 6500,
    salePrice: 3900,
    stock: 5,
    pickupStart: "오후 6:30",
    pickupEnd: "오후 8:00",
    distance: "650m",
    items: [
      {
        id: "salt-bread",
        name: "소금빵",
        description: "겉은 바삭하고 속은 촉촉해요",
        originalPrice: 3500,
        salePrice: 2100,
        stock: 3,
      },
      {
        id: "onion-bread",
        name: "어니언 크림치즈빵",
        description: "달콤한 양파와 크림치즈를 넣었어요",
        originalPrice: 5000,
        salePrice: 3900,
        stock: 2,
      },
    ],
  },
  {
    id: "scone-box",
    storeId: "forest-scone",
    title: "오늘의 스콘 세트",
    category: "디저트",
    imageUrl:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=82",
    originalPrice: 12000,
    salePrice: 7200,
    stock: 4,
    pickupStart: "오후 7:00",
    pickupEnd: "오후 8:30",
    distance: "1.2km",
    items: [
      {
        id: "plain-scone",
        name: "플레인 스콘 2개",
        description: "버터 향이 깊은 기본 스콘이에요",
        originalPrice: 8000,
        salePrice: 4800,
        stock: 3,
      },
      {
        id: "earl-grey-scone",
        name: "얼그레이 스콘",
        description: "은은한 홍차 향이 나요",
        originalPrice: 4000,
        salePrice: 2400,
        stock: 1,
      },
    ],
  },
  {
    id: "cake-slice-set",
    storeId: "mangwon-cake-room",
    title: "조각 케이크 2개 세트",
    category: "케이크",
    imageUrl:
      "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1200&q=82",
    originalPrice: 16000,
    salePrice: 9600,
    stock: 2,
    pickupStart: "오후 7:30",
    pickupEnd: "오후 9:00",
    distance: "2.1km",
    items: [
      {
        id: "strawberry-cake",
        name: "딸기 생크림 케이크",
        description: "가벼운 생크림과 딸기를 올렸어요",
        originalPrice: 8000,
        salePrice: 4800,
        stock: 1,
      },
      {
        id: "chocolate-cake",
        name: "초콜릿 케이크",
        description: "진한 카카오 크림을 사용했어요",
        originalPrice: 8000,
        salePrice: 4800,
        stock: 1,
      },
    ],
  },
]

export const reservations: ReservationSummary[] = [
  {
    id: "reservation-1042",
    reservationNumber: "NMD-0818-1042",
    dealId: "salt-bread-today",
    storeId: "seongsu-bread-lab",
    status: "confirmed",
    pickupDate: "8월 18일 오늘",
    pickupTime: "오후 6:30 ~ 8:00",
    itemSummary: "소금빵 1개 외 1개",
    totalQuantity: 2,
    totalPrice: 6000,
  },
  {
    id: "reservation-0987",
    reservationNumber: "NMD-0812-0987",
    dealId: "scone-box",
    storeId: "forest-scone",
    status: "picked-up",
    pickupDate: "8월 12일",
    pickupTime: "오후 7:00 ~ 8:30",
    itemSummary: "플레인 스콘 2개",
    totalQuantity: 1,
    totalPrice: 4800,
  },
  {
    id: "reservation-0913",
    reservationNumber: "NMD-0804-0913",
    dealId: "cake-slice-set",
    storeId: "mangwon-cake-room",
    status: "canceled",
    pickupDate: "8월 4일",
    pickupTime: "오후 7:30 ~ 9:00",
    itemSummary: "딸기 생크림 케이크 1개",
    totalQuantity: 1,
    totalPrice: 4800,
  },
]

export function getStore(storeId: string | undefined) {
  return stores.find((store) => store.id === storeId)
}

export function getDeal(dealId: string | undefined) {
  return deals.find((deal) => deal.id === dealId)
}

export function getReservation(reservationId: string | undefined) {
  return reservations.find((reservation) => reservation.id === reservationId)
}

export function formatWon(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`
}

export function getDiscountRate(originalPrice: number, salePrice: number) {
  return Math.round((1 - salePrice / originalPrice) * 100)
}
