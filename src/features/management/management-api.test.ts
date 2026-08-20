import { afterEach, describe, expect, test, vi } from "vitest"

import {
  completeOwnerReservationPickup,
  createOwnerDeal,
  getOwnerDeal,
  getOwnerDeals,
  getOwnerReservation,
  getOwnerReservations,
} from "./management-api"

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

const dealSummary = {
  dealId: 41,
  storeId: 7,
  storeName: "성수 오늘빵",
  salesEndsAt: "2026-08-20T20:00:00",
  status: "SELLING",
  description: "오늘 구운 빵",
  itemCount: 1,
  lowestSalePrice: 3900,
  createdAt: "2026-08-20T16:00:00",
} as const

const dealDetail = {
  ...dealSummary,
  items: [
    {
      dealItemId: 51,
      name: "버터 크루아상",
      totalQuantity: 5,
      remainingQuantity: 3,
      originalPrice: 6000,
      salePrice: 3900,
      discountRate: 35,
      status: "SELLING",
    },
  ],
}

const reservationSummary = {
  reservationId: 91,
  dealId: 41,
  storeId: 7,
  storeName: "성수 오늘빵",
  status: "RESERVED",
  totalAmount: 7800,
  createdAt: "2026-08-20T17:00:00",
  canceledAt: null,
  pickedUpAt: null,
} as const

const reservationDetail = {
  ...reservationSummary,
  items: [
    {
      dealItemId: 51,
      name: "버터 크루아상",
      salePrice: 3900,
      quantity: 2,
      subtotal: 7800,
    },
  ],
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("management API", () => {
  test("딜 목록의 모든 페이지를 읽고 한국 시각 오프셋을 보완한다", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = new URL(String(input), "http://localhost")
      const page = Number(url.searchParams.get("page"))
      expect(url.pathname).toBe("/api/v1/owner/stores/7/deals")
      expect(url.searchParams.get("size")).toBe("100")

      return jsonResponse({
        content: [{ ...dealSummary, dealId: 41 + page }],
        page,
        size: 100,
        totalElements: 2,
        totalPages: 2,
        first: page === 0,
        last: page === 1,
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    const deals = await getOwnerDeals(7)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(deals.map(({ dealId }) => dealId)).toEqual([41, 42])
    expect(deals[0].salesEndsAt).toBe("2026-08-20T20:00:00+09:00")
    expect(deals[0].createdAt).toBe("2026-08-20T16:00:00+09:00")
  })

  test("백엔드 계약 필드만 사용해 딜을 등록하고 상세을 조회한다", async () => {
    const requestBodies: unknown[] = []
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = new URL(String(input), "http://localhost")
      if (init?.method === "POST") {
        requestBodies.push(JSON.parse(String(init.body)))
        return jsonResponse(dealDetail, 201)
      }
      expect(url.pathname).toBe("/api/v1/owner/deals/41")
      return jsonResponse(dealDetail)
    })
    vi.stubGlobal("fetch", fetchMock)

    const request = {
      salesEndsAt: "2026-08-20T20:00:00",
      description: "오늘 구운 빵",
      items: [
        {
          name: "버터 크루아상",
          totalQuantity: 5,
          originalPrice: 6000,
          salePrice: 3900,
        },
      ],
    }
    const created = await createOwnerDeal(7, request)
    const detail = await getOwnerDeal(41)

    expect(requestBodies).toEqual([request])
    expect(created.items[0]).toMatchObject({
      name: "버터 크루아상",
      remainingQuantity: 3,
    })
    expect(detail.salesEndsAt).toBe("2026-08-20T20:00:00+09:00")
  })

  test("예약 목록·상세 조회와 픽업 완료 요청을 실제 경로로 보낸다", async () => {
    const requests: string[] = []
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = new URL(String(input), "http://localhost")
      requests.push(`${init?.method ?? "GET"} ${url.pathname}${url.search}`)

      if (url.pathname.endsWith("/pickup")) {
        return jsonResponse({
          ...reservationDetail,
          status: "PICKED_UP",
          pickedUpAt: "2026-08-20T18:00:00",
        })
      }
      if (url.pathname === "/api/v1/owner/reservations/91") {
        return jsonResponse(reservationDetail)
      }
      return jsonResponse({
        content: [reservationSummary],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    const reservations = await getOwnerReservations(7)
    const detail = await getOwnerReservation(91)
    const completed = await completeOwnerReservationPickup(91)

    expect(requests).toEqual([
      "GET /api/v1/owner/stores/7/reservations?page=0&size=100",
      "GET /api/v1/owner/reservations/91",
      "POST /api/v1/owner/reservations/91/pickup",
    ])
    expect(reservations[0].createdAt).toBe("2026-08-20T17:00:00+09:00")
    expect(detail.items[0].subtotal).toBe(7800)
    expect(completed).toMatchObject({
      status: "PICKED_UP",
      pickedUpAt: "2026-08-20T18:00:00+09:00",
    })
  })
})
