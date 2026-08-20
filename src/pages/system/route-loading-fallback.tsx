export function RouteLoadingFallback() {
  return (
    <main
      id="main-content"
      className="bg-customer-canvas flex min-h-svh items-center justify-center px-4"
      aria-busy="true"
      aria-label="화면을 불러오는 중"
    >
      <div className="text-center">
        <img
          src="/brand/namatdang-icon.png"
          width="1024"
          height="1024"
          className="mx-auto size-12 rounded-xl"
          alt=""
        />
        <p className="text-muted mt-4 text-sm font-medium">
          화면을 불러오는 중이에요
        </p>
      </div>
    </main>
  )
}
