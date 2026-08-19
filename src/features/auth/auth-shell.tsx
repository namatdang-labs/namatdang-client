import type { ReactNode } from "react"

export const authInputClass =
  "border-hairline bg-canvas text-foreground placeholder:text-disabled min-h-12 w-full rounded-xl border px-4 text-base transition-colors focus:border-foreground disabled:bg-surface disabled:text-disabled aria-[invalid=true]:border-critical aria-[invalid=true]:border-2"

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="border-hairline bg-canvas rounded-2xl border p-6 sm:p-8">
      <header className="mb-7">
        <h1
          data-route-heading
          tabIndex={-1}
          className="text-foreground text-2xl font-bold tracking-tight"
        >
          {title}
        </h1>
        <p className="text-muted mt-2 text-sm leading-6">{description}</p>
      </header>
      {children}
    </section>
  )
}

export function FieldMessage({
  id,
  children,
}: {
  id: string
  children?: string
}) {
  if (!children) return null

  return (
    <p id={id} className="text-critical mt-2 text-sm" role="alert">
      {children}
    </p>
  )
}
