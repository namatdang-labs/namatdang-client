import type { DomainStatus } from "../types"

const statusLabels: Record<DomainStatus, string> = {
  draft: "작성 중",
  pending: "확인 대기",
  active: "운영 중",
  paused: "운영 일시 중지",
  selling: "판매 중",
  "low-stock": "재고 부족",
  "sold-out": "품절",
  ended: "마감",
  canceled: "취소",
  unavailable: "판매 불가",
  confirmed: "예약 확정",
  "picked-up": "픽업 완료",
  "no-show": "미방문",
}

function getStatusLabel(status: DomainStatus) {
  return statusLabels[status]
}

export { getStatusLabel }
