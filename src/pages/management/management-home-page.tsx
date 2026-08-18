import { CircleGauge } from "lucide-react"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { RoutePlaceholder } from "../../shared/ui/route-placeholder"

const NEXT_SECTIONS = [
  "픽업 대기·남은 재고·오늘 마감 요약",
  "다음 픽업 예약 목록과 상세 패널",
  "현재 가게 표시와 여러 가게 전환",
  "가게가 없는 회원의 등록 온보딩",
]

export function ManagementHomePage() {
  useDocumentTitle("오늘 운영 현황")

  return (
    <RoutePlaceholder
      eyebrow="가게 관리 · /manage"
      title="오늘 운영 현황"
      description="가게를 등록한 회원이 고객 기능을 그대로 유지하면서 예약·재고·픽업을 관리하는 화면의 시작점입니다."
      icon={CircleGauge}
    >
      <div>
        <h2 className="text-foreground text-base font-bold">다음 구현 단위</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {NEXT_SECTIONS.map((section) => (
            <li
              key={section}
              className="border-hairline bg-surface text-foreground rounded-xl border px-4 py-3 text-sm leading-6"
            >
              {section}
            </li>
          ))}
        </ul>
      </div>
    </RoutePlaceholder>
  )
}
