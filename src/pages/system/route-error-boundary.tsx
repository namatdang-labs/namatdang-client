import { AlertCircle, RotateCcw } from "lucide-react"
import { Link, isRouteErrorResponse, useRouteError } from "react-router"
import { Button } from "../../shared/ui/button"

export function RouteErrorBoundary() {
  const error = useRouteError()
  const isNotFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <main
      id="main-content"
      className="bg-background grid min-h-svh place-items-center px-4 py-12"
    >
      <section className="border-hairline bg-canvas w-full max-w-lg rounded-2xl border p-6 sm:p-8">
        <div
          className="bg-surface text-critical mb-6 flex size-12 items-center justify-center rounded-xl"
          aria-hidden="true"
        >
          <AlertCircle className="size-6" />
        </div>
        <h1
          className="text-foreground text-2xl leading-[1.35] font-bold"
          tabIndex={-1}
          data-route-heading
        >
          {isNotFound
            ? "요청한 페이지를 찾을 수 없어요"
            : "페이지를 불러오지 못했어요"}
        </h1>
        <p className="text-muted mt-3 text-base leading-6">
          {isNotFound
            ? "주소를 다시 확인하거나 홈으로 이동해 주세요."
            : "입력한 내용은 유지하고 있어요. 연결을 확인한 뒤 다시 시도해 주세요."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {isNotFound ? (
            <Button asChild>
              <Link to="/">홈으로 이동</Link>
            </Button>
          ) : (
            <Button type="button" onClick={() => window.location.reload()}>
              <RotateCcw aria-hidden="true" />
              다시 시도
            </Button>
          )}
        </div>
      </section>
    </main>
  )
}
