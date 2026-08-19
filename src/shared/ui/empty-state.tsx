import type { ComponentProps, ReactNode } from "react"
import { PackageOpen } from "lucide-react"
import { cn } from "../lib/utils"

type EmptyStateProps = ComponentProps<"section"> & {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

function EmptyState({
  className,
  title,
  description,
  icon,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <section
      data-slot="empty-state"
      className={cn(
        "border-hairline bg-canvas flex min-h-56 flex-col items-center justify-center rounded-xl border px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      <span
        className="bg-surface text-muted mb-4 flex size-12 items-center justify-center rounded-full"
        aria-hidden="true"
      >
        {icon ?? <PackageOpen className="size-6" strokeWidth={2} />}
      </span>
      <h2 className="text-foreground text-lg font-bold">{title}</h2>
      {description ? (
        <p className="text-muted mt-2 max-w-md text-sm leading-6">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  )
}

export { EmptyState }
export type { EmptyStateProps }
