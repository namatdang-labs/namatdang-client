import { Link, Outlet } from "react-router"

export function AuthLayout() {
  return (
    <div className="bg-customer-canvas min-h-svh px-4 py-8 sm:py-12">
      <header className="mx-auto mb-8 flex w-full max-w-md justify-center">
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
      <main id="main-content" className="mx-auto w-full max-w-md">
        <Outlet />
      </main>
    </div>
  )
}
