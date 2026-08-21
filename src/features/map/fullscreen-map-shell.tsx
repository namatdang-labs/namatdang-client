import type { FormHTMLAttributes, ReactNode } from "react"

import { FullscreenMapHeader } from "./fullscreen-map-header"

interface FullscreenMapShellProps {
  backLabel: string
  children: ReactNode
  description: string
  footer?: ReactNode
  onBack: () => void
  title: string
}

export function FullscreenMapShell({
  backLabel,
  children,
  description,
  footer,
  onBack,
  title,
}: FullscreenMapShellProps) {
  return (
    <div
      data-map-page-layout="fullscreen"
      className="bg-canvas fixed inset-0 z-50 flex min-h-svh flex-col"
    >
      <FullscreenMapHeader
        backLabel={backLabel}
        description={description}
        title={title}
        onBack={onBack}
      />

      <main
        id="main-content"
        data-map-viewport="primary"
        className="bg-surface relative min-h-0 flex-1 overflow-hidden"
      >
        {children}
      </main>

      {footer ? (
        <footer className="border-hairline bg-canvas shrink-0 border-t px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:px-6">
          {footer}
        </footer>
      ) : null}
    </div>
  )
}

export function FullscreenMapTopOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
        {children}
      </div>
    </div>
  )
}

export function FullscreenMapSearchForm({
  children,
  ...props
}: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      {...props}
      className="border-hairline bg-canvas pointer-events-auto flex w-full items-center gap-2 rounded-2xl border p-2"
      role="search"
    >
      {children}
    </form>
  )
}
