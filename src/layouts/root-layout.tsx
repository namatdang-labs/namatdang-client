import { useEffect } from "react"
import { Outlet, ScrollRestoration, useLocation } from "react-router"

export function RootLayout() {
  const { pathname } = useLocation()

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
