import { Store } from "lucide-react"
import { Link, Outlet } from "react-router"
import { Button } from "../shared/ui/button"

export function CustomerLayout() {
  return (
    <div className="bg-customer-canvas min-h-svh">
      <header className="border-hairline bg-canvas/95 sticky top-0 z-40 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-lg"
            aria-label="남았당 홈"
          >
            <img
              src="/brand/namatdang-logo.png"
              width="2048"
              height="768"
              className="h-9 w-auto"
              alt="남았당"
            />
          </Link>

          <nav aria-label="고객 주요 메뉴">
            <Button asChild variant="ghost" size="compact">
              <Link to="/manage">
                <Store aria-hidden="true" />
                <span className="hidden sm:inline">가게 관리</span>
                <span className="sm:hidden">관리</span>
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        className="min-h-[calc(100svh-4rem)] px-4 sm:px-6"
      >
        <Outlet />
      </main>
    </div>
  )
}
