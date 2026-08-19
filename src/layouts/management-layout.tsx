import { ArrowLeft, LayoutDashboard } from "lucide-react"
import { Link, NavLink, Outlet } from "react-router"
import { Button } from "../shared/ui/button"
import { cn } from "../shared/lib/utils"

function ManagementNavigation() {
  return (
    <nav className="grid gap-2" aria-label="가게 관리 메뉴">
      <NavLink
        to="/manage"
        end
        className={({ isActive }) =>
          cn(
            "text-foreground hover:bg-surface flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold",
            isActive && "bg-brand-tint text-brand-brown",
          )
        }
      >
        <LayoutDashboard className="size-5" aria-hidden="true" />
        운영 현황
      </NavLink>
    </nav>
  )
}

export function ManagementLayout() {
  return (
    <div className="bg-background min-h-svh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-hairline bg-canvas hidden border-r p-5 lg:flex lg:min-h-svh lg:flex-col">
        <Link
          to="/manage"
          className="mb-8 inline-flex min-h-11 items-center gap-3 rounded-lg"
          aria-label="남았당 가게 관리 홈"
        >
          <img
            src="/brand/namatdang-icon.png"
            width="1024"
            height="1024"
            className="size-9 rounded-lg"
            alt=""
          />
          <span className="text-brand-brown font-bold">가게 관리</span>
        </Link>

        <ManagementNavigation />

        <Button
          asChild
          variant="ghost"
          size="compact"
          className="mt-auto justify-start"
        >
          <Link to="/">
            <ArrowLeft aria-hidden="true" />
            고객 화면으로
          </Link>
        </Button>
      </aside>

      <div className="min-w-0">
        <header className="border-hairline bg-canvas flex h-16 items-center justify-between border-b px-4 lg:hidden">
          <Link
            to="/manage"
            className="text-brand-brown inline-flex min-h-11 items-center gap-2 rounded-lg font-bold"
          >
            <img
              src="/brand/namatdang-icon.png"
              width="1024"
              height="1024"
              className="size-8 rounded-lg"
              alt=""
            />
            가게 관리
          </Link>
          <Button asChild variant="ghost" size="compact">
            <Link to="/">
              <ArrowLeft aria-hidden="true" />
              고객 화면
            </Link>
          </Button>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1440px] px-4 lg:px-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
