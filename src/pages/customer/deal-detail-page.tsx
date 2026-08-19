import { ClipboardList, ChevronRight } from "lucide-react"
import { Link, useParams } from "react-router"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"
import { RoutePlaceholder } from "../../shared/ui/route-placeholder"

export function DealDetailPage() {
  const { dealId = "" } = useParams()
  useDocumentTitle("할인 상세")

  return (
    <RoutePlaceholder
      eyebrow="할인 상세 · /deals/:dealId"
      title="할인과 픽업 정보"
      description="4:3 대표 이미지와 품목별 재고, 수량 선택, 픽업 시간과 주소를 연결하는 상세 화면의 시작점입니다."
      icon={ClipboardList}
    >
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-foreground text-sm font-semibold">
            현재 라우트 파라미터
          </p>
          <code className="bg-surface text-muted mt-2 inline-flex rounded-lg px-3 py-2 font-mono text-sm">
            {dealId}
          </code>
          <p className="text-muted mt-3 text-sm leading-6">
            Deal Query와 재고 상한을 연결한 뒤 수량 선택을 활성화합니다.
          </p>
        </div>
        <Button asChild>
          <Link to="/reservations/review">
            예약 전 확인 골격 보기
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </RoutePlaceholder>
  )
}
