import { BadgeCheck, ArrowLeft } from "lucide-react"
import { Link } from "react-router"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"
import { RoutePlaceholder } from "../../shared/ui/route-placeholder"

export function ReservationReviewPage() {
  useDocumentTitle("예약 전 확인")

  return (
    <RoutePlaceholder
      eyebrow="예약 전 확인 · /reservations/review"
      title="선택한 내용을 확인해 주세요"
      description="품목·수량·픽업 시간·최종 금액을 재확인하고 재고 변경에 안전하게 대응하는 예약 제출 화면입니다."
      icon={BadgeCheck}
    >
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h2 className="text-foreground text-base font-bold">연결할 계약</h2>
          <p className="text-muted mt-3 text-sm leading-6">
            라우트 state 대신 예약 draft 스키마와 서버 재고 확인 결과를 기준으로
            구현합니다.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/deals/sample-deal">
            <ArrowLeft aria-hidden="true" />
            상세 골격으로
          </Link>
        </Button>
      </div>
    </RoutePlaceholder>
  )
}
