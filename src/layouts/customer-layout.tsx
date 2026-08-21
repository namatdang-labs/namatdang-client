import { useSyncExternalStore } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bell,
  CalendarCheck,
  Heart,
  Home,
  LogIn,
  Map,
  Store,
  UserRound,
} from "lucide-react"
import { Link, NavLink, Outlet } from "react-router"

import {
  getAuthenticationSnapshot,
  subscribeToAuthentication,
} from "../features/auth/auth-session"
import { unreadNotificationCountQueryOptions } from "../features/customer/customer-api"
import { cn } from "../shared/lib/utils"
import { Button } from "../shared/ui/button"

const managementEntryPath = "/manage/onboarding"

const customerNavigation = [
  { to: "/app", label: "홈", icon: Home, end: true },
  { to: "/favorites", label: "찜", icon: Heart, end: false },
  { to: "/reservations", label: "예약", icon: CalendarCheck, end: false },
  { to: "/me", label: "마이", icon: UserRound, end: false },
] as const

const guestDesktopNavigation = [
  { to: "/app", label: "홈", icon: Home, end: true },
  { to: "/map", label: "지도", icon: Map, end: false },
] as const

const guestMobileNavigation = [
  ...guestDesktopNavigation,
  { to: "/favorites", label: "찜", icon: Heart, end: false },
  {
    to: "/login?redirect=%2Fapp",
    label: "로그인",
    icon: LogIn,
    end: false,
  },
] as const

function CustomerNavigation({
  authenticated,
  mobile = false,
}: {
  authenticated: boolean
  mobile?: boolean
}) {
  const navigation = authenticated
    ? customerNavigation
    : mobile
      ? guestMobileNavigation
      : guestDesktopNavigation

  return (
    <nav
      aria-label={mobile ? "고객 하단 메뉴" : "고객 주요 메뉴"}
      className={cn(
        mobile ? "grid grid-cols-4" : "hidden items-center gap-1 md:flex",
      )}
    >
      {navigation.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "text-muted hover:bg-surface hover:text-foreground inline-flex min-h-11 items-center justify-center rounded-xl text-sm transition-colors",
              mobile ? "flex-col gap-1 px-2 py-2" : "gap-2 px-3",
              isActive && "text-brand-link font-semibold",
            )
          }
        >
          <Icon className="size-5" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export function CustomerLayout() {
  const authenticated = useSyncExternalStore(
    subscribeToAuthentication,
    getAuthenticationSnapshot,
    () => false,
  )

  const unreadCountQuery = useQuery({
    ...unreadNotificationCountQueryOptions(),
    enabled: authenticated,
  })
  const unreadNotificationCount = unreadCountQuery.data?.unreadCount ?? 0

  return (
    <div className="bg-customer-canvas min-h-svh">
      <header className="border-hairline bg-canvas/95 sticky top-0 z-40 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/app"
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

          <div className="flex items-center gap-2">
            <CustomerNavigation authenticated={authenticated} />
            {authenticated ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="relative"
                >
                  <Link
                    to="/notifications"
                    aria-label={
                      unreadNotificationCount > 0
                        ? `알림 센터, 안 읽은 알림 ${unreadNotificationCount}개`
                        : "알림 센터"
                    }
                  >
                    <Bell aria-hidden="true" />
                    {unreadNotificationCount > 0 ? (
                      <span className="bg-critical text-canvas absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold tabular-nums">
                        {unreadNotificationCount}
                      </span>
                    ) : null}
                  </Link>
                </Button>
                <Button asChild variant="low" size="compact">
                  <Link to={managementEntryPath} aria-label="가게 관리">
                    <Store aria-hidden="true" />
                    <span className="hidden sm:inline">가게 관리</span>
                    <span className="sm:hidden">관리</span>
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="low" size="compact">
                <Link to="/login?redirect=%2Fapp">
                  <LogIn aria-hidden="true" />
                  로그인
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="min-h-[calc(100svh-4rem)] px-4 pb-24 sm:px-6 md:pb-10"
      >
        <Outlet />
      </main>

      <div className="border-hairline bg-canvas fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden">
        <CustomerNavigation authenticated={authenticated} mobile />
      </div>
    </div>
  )
}
