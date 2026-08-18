import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

type RoutePlaceholderProps = {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  children?: ReactNode
}

export function RoutePlaceholder({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: RoutePlaceholderProps) {
  return (
    <section className="mx-auto w-full max-w-3xl py-8 sm:py-12">
      <div className="border-hairline bg-canvas rounded-2xl border p-6 sm:p-8">
        <div
          className="bg-brand-tint text-brand-brown mb-6 flex size-12 items-center justify-center rounded-xl"
          aria-hidden="true"
        >
          <Icon className="size-6" strokeWidth={2} />
        </div>
        <p className="text-brand-link mb-2 text-sm font-semibold">{eyebrow}</p>
        <h1
          className="text-foreground text-2xl leading-[1.35] font-bold tracking-normal"
          tabIndex={-1}
          data-route-heading
        >
          {title}
        </h1>
        <p className="text-muted mt-3 max-w-2xl text-base leading-6">
          {description}
        </p>

        {children ? (
          <div className="border-hairline mt-8 border-t pt-6">{children}</div>
        ) : null}
      </div>
    </section>
  )
}
