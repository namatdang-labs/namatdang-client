import {
  ArrowLeft,
  CalendarCheck,
  LayoutDashboard,
  MapPinned,
  Tags,
} from "lucide-react"
import { Link, NavLink, Outlet } from "react-router"

import {
  ManagementStoreProvider,
  useManagementStore,
} from "../features/management/store-context"
import { cn } from "../shared/lib/utils"
import { Button } from "../shared/ui/button"

const managementNavigation = [
  { to: "/manage", label: "운영 현황", icon: LayoutDashboard, end: true },
  { to: "/manage/deals", label: "할인 관리", icon: Tags, end: false },
  {
    to: "/manage/reservations",
    label: "예약 관리",
    icon: CalendarCheck,
    end: false,
  },
  { to: "/manage/store", label: "가게 정보", icon: MapPinned, end: false },
] as const

function ManagementNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      className={mobile ? "flex gap-2 overflow-x-auto px-4 py-2" : "grid gap-2"}
      aria-label="가게 관리 메뉴"
    >
      {managementNavigation.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "text-foreground hover:bg-surface flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-semibold",
              isActive && "bg-brand-tint text-brand-brown",
            )
          }
        >
          <Icon className="size-5" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function StoreSwitcher({ compact = false }: { compact?: boolean }) {
  const { store, stores, setStoreId } = useManagementStore()

  return (
    <div className={cn("grid gap-2", compact && "min-w-0 flex-1")}>
      <label
        htmlFor={compact ? "mobile-store" : "desktop-store"}
        className={cn("text-muted text-xs font-semibold", compact && "sr-only")}
      >
        현재 관리 가게
      </label>
      <select
        id={compact ? "mobile-store" : "desktop-store"}
        className="border-hairline bg-canvas text-foreground min-h-11 min-w-0 rounded-lg border px-3 text-sm font-semibold"
        value={store.id}
        onChange={(event) => setStoreId(event.target.value)}
      >
        {stores.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ManagementLayout() {
  return (
    <ManagementStoreProvider>
      <div className="bg-background min-h-svh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-hairline bg-canvas hidden border-r p-5 lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:overflow-y-auto">
          <Link
            to="/app"
            className="mb-6 inline-flex min-h-11 items-center gap-3 rounded-lg"
            aria-label="남았당 홈"
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

          <div className="mb-6">
            <StoreSwitcher />
          </div>
          <ManagementNavigation />

          <Button
            asChild
            variant="ghost"
            size="compact"
            className="mt-auto justify-start"
          >
            <Link to="/app">
              <ArrowLeft aria-hidden="true" />
              고객 화면으로
            </Link>
          </Button>
        </aside>

        <div className="min-w-0">
          <header className="border-hairline bg-canvas border-b lg:hidden">
            <div className="flex min-h-16 items-center gap-2 px-4 py-2">
              <Link
                to="/app"
                className="inline-flex min-h-11 shrink-0 items-center rounded-lg"
                aria-label="남았당 홈"
              >
                <img
                  src="/brand/namatdang-icon.png"
                  width="1024"
                  height="1024"
                  className="size-8 rounded-lg"
                  alt=""
                />
              </Link>
              <StoreSwitcher compact />
              <Button asChild variant="ghost" size="icon">
                <Link to="/app" aria-label="고객 화면으로 돌아가기">
                  <ArrowLeft aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <ManagementNavigation mobile />
          </header>

          <main
            id="main-content"
            className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </ManagementStoreProvider>
  )
}
