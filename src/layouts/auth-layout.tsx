import { ArrowRight } from "lucide-react"
import { Link, Outlet } from "react-router"

const customerJourney = ["할인 발견", "상품 예약", "매장 픽업"]

export function AuthLayout() {
  return (
    <div className="bg-customer-canvas min-h-svh lg:grid lg:grid-cols-2">
      <aside
        aria-labelledby="auth-brand-title"
        className="border-hairline bg-bread-cream hidden min-h-svh border-r px-8 py-16 lg:flex lg:items-center lg:justify-center"
      >
        <div className="w-full max-w-md">
          <img
            src="/brand/namatdang-icon.png"
            width="1024"
            height="1024"
            className="h-24 w-24 object-contain"
            alt=""
          />
          <p className="text-brand-link mt-8 text-sm font-semibold">
            오늘 동네에서 만나는 할인
          </p>
          <h2
            id="auth-brand-title"
            className="text-brand-brown mt-3 text-4xl leading-[1.35] font-bold"
          >
            남은 상품을 발견하고,
            <br />
            가볍게 예약해요
          </h2>
          <p className="text-brand-brown/80 mt-5 max-w-sm text-base leading-7">
            원하는 상품을 미리 예약하고 동네 가게에서 직접 받아요.
          </p>

          <ol
            aria-label="남았당 이용 방법"
            className="border-brand-brown/15 mt-10 flex items-center border-y py-5"
          >
            {customerJourney.map((step, index) => (
              <li
                key={step}
                className="text-brand-brown flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold"
              >
                <span className="border-brand-brown/25 inline-flex size-8 shrink-0 items-center justify-center rounded-full border tabular-nums">
                  {index + 1}
                </span>
                <span className="whitespace-nowrap">{step}</span>
                {index < customerJourney.length - 1 ? (
                  <ArrowRight
                    aria-hidden="true"
                    className="ml-auto shrink-0"
                    size={18}
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <div className="flex min-h-svh flex-col px-4 py-8 sm:px-8 sm:py-12 lg:px-12">
        <header className="mx-auto flex w-full max-w-md justify-center">
          <Link to="/" className="inline-flex min-h-11 items-center rounded-lg">
            <img
              src="/brand/namatdang-logo.png"
              width="2048"
              height="768"
              className="h-11 w-auto"
              alt="남았당 홈"
            />
          </Link>
        </header>

        <main
          id="main-content"
          className="flex w-full flex-1 items-start justify-center py-8 lg:items-center"
        >
          <div className="w-full max-w-md">
            <Outlet />
            <p className="mt-4 text-center">
              <Link
                to="/app"
                className="text-brand-link inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold underline-offset-4 hover:underline"
              >
                로그인 없이 할인 둘러보기
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
