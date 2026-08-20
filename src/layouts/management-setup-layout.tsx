import { ArrowLeft } from "lucide-react"
import { Link, Outlet } from "react-router"

import { Button } from "../shared/ui/button"

export function ManagementSetupLayout() {
  return (
    <div className="bg-background min-h-svh">
      <header className="border-hairline bg-canvas border-b">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/app"
            className="text-brand-brown inline-flex min-h-11 items-center gap-2 rounded-lg font-bold"
            aria-label="남았당 홈"
          >
            <img
              src="/brand/namatdang-icon.png"
              width="1024"
              height="1024"
              className="size-8 rounded-lg"
              alt=""
            />
            가게 관리 시작
          </Link>
          <Button asChild variant="ghost" size="compact">
            <Link to="/me">
              <ArrowLeft aria-hidden="true" />
              마이로 돌아가기
            </Link>
          </Button>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6"
      >
        <Outlet />
      </main>
    </div>
  )
}
