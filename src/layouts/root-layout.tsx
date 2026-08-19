import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Outlet,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "react-router"

import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTHENTICATION_REQUIRED_EVENT,
  clearAccessToken,
} from "../features/auth/auth-session"

export function RootLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pathname } = location

  useEffect(() => {
    const handleAuthenticationRequired = () => {
      const redirectTo = `${location.pathname}${location.search}`
      queryClient.clear()
      void navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`, {
        replace: true,
      })
    }

    window.addEventListener(
      AUTHENTICATION_REQUIRED_EVENT,
      handleAuthenticationRequired,
    )

    return () =>
      window.removeEventListener(
        AUTHENTICATION_REQUIRED_EVENT,
        handleAuthenticationRequired,
      )
  }, [location.pathname, location.search, navigate, queryClient])

  useEffect(() => {
    const handleAccessTokenStorageChange = (event: StorageEvent) => {
      if (event.key !== ACCESS_TOKEN_STORAGE_KEY) return

      if (event.newValue) {
        if (location.pathname === "/login") {
          queryClient.clear()
          void navigate("/", { replace: true })
          return
        }

        void queryClient.resetQueries()
        return
      }

      clearAccessToken()
      queryClient.clear()

      if (location.pathname !== "/login") {
        const redirectTo = `${location.pathname}${location.search}`
        void navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`, {
          replace: true,
        })
      }
    }

    window.addEventListener("storage", handleAccessTokenStorageChange)
    return () =>
      window.removeEventListener("storage", handleAccessTokenStorageChange)
  }, [location.pathname, location.search, navigate, queryClient])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      document
        .querySelector<HTMLElement>("[data-route-heading]")
        ?.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [pathname])

  return (
    <>
      <a
        href="#main-content"
        className="bg-foreground text-canvas fixed top-4 left-4 z-50 -translate-y-24 rounded-lg px-4 py-3 text-sm font-semibold transition-transform duration-150 focus:translate-y-0 motion-reduce:transition-none"
      >
        본문 바로가기
      </a>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
