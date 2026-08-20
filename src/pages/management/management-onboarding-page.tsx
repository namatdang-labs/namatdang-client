import { ArrowLeft, Check, Store } from "lucide-react"
import { Link, Navigate } from "react-router"
import { useOwnerStores } from "../../features/management/store-api"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const STORE_BENEFITS = [
  "오늘 남은 상품과 할인 가격을 공개할 수 있어요.",
  "들어온 예약과 픽업 시간을 한곳에서 관리해요.",
  "가게를 등록해도 고객 기능은 그대로 이용할 수 있어요.",
]

export function ManagementOnboardingPage() {
  useDocumentTitle("가게 관리 시작하기")
  const storesQuery = useOwnerStores()

  if (storesQuery.data && storesQuery.data.length > 0) {
    return <Navigate to="/manage" replace />
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-64px)] max-w-3xl items-center py-8 lg:min-h-svh">
      <section className="border-hairline bg-canvas w-full rounded-2xl border px-5 py-8 sm:px-10 sm:py-12">
        <span className="bg-bread-cream text-brand-brown flex size-14 items-center justify-center rounded-2xl">
          <Store className="size-7" aria-hidden="true" />
        </span>
        <p className="text-brand-link mt-6 text-sm font-semibold">가게 관리</p>
        <h1
          data-route-heading
          tabIndex={-1}
          className="text-foreground mt-2 text-2xl leading-[1.35] font-bold sm:text-3xl"
        >
          등록한 가게가 아직 없어요
        </h1>
        <p className="text-muted mt-3 max-w-xl text-base leading-7">
          {storesQuery.isPending
            ? "등록한 가게가 있는지 확인하고 있어요."
            : "가게를 등록하면 오늘의 할인부터 픽업 예약까지 바로 관리할 수 있어요."}
        </p>

        {storesQuery.isError ? (
          <p
            className="border-critical/30 bg-critical/5 text-critical mt-5 rounded-xl border px-4 py-3 text-sm"
            role="alert"
          >
            가게 보유 여부를 확인하지 못했어요. 서버 연결 후 다시 시도해 주세요.
          </p>
        ) : null}

        <ul className="border-hairline mt-8 grid gap-4 border-y py-6">
          {STORE_BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="text-foreground flex items-start gap-3 text-sm leading-6"
            >
              <span className="bg-brand-tint text-success mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                <Check className="size-4" aria-hidden="true" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="sm:min-w-40"
            aria-disabled={storesQuery.isPending}
          >
            <Link to="/manage/register">가게 등록하기</Link>
          </Button>
          <Button asChild variant="secondary" className="sm:min-w-40">
            <Link to="/app">
              <ArrowLeft aria-hidden="true" />
              고객 화면으로
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
