import { ChevronRight, MapPin } from "lucide-react"
import { Link } from "react-router"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"
import { RoutePlaceholder } from "../../shared/ui/route-placeholder"

export function HomePage() {
  useDocumentTitle("오늘의 할인")

  return (
    <RoutePlaceholder
      eyebrow="고객 홈 · /"
      title="오늘 가까운 할인"
      description="지역과 필터를 고른 뒤, 최종가·남은 수량·픽업 마감을 한번에 비교하는 Deal 목록을 이 라우트에서 구현합니다."
      icon={MapPin}
    >
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h2 className="text-foreground text-base font-bold">
            다음 구현 단위
          </h2>
          <ul className="text-muted mt-3 grid gap-2 text-sm leading-6">
            <li>• 지역·필터 URL 상태와 Deal 목록 Query</li>
            <li>• 정상·로딩·빈 결과·품절 상태</li>
            <li>• 1:1 사진 카드와 반응형 목록</li>
          </ul>
        </div>
        <Button asChild>
          <Link to="/deals/sample-deal">
            할인 상세 골격 보기
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </RoutePlaceholder>
  )
}
