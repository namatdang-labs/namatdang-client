import type { ComponentProps, ReactNode } from "react"
import { cn } from "../lib/utils"

type SectionHeaderProps = ComponentProps<"header"> & {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  headingLevel?: 1 | 2 | 3
}

function SectionHeader({
  className,
  title,
  description,
  action,
  headingLevel = 2,
  ...props
}: SectionHeaderProps) {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3"

  return (
    <header
      data-slot="section-header"
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        <Heading className="text-foreground text-2xl leading-[1.35] font-bold">
          {title}
        </Heading>
        {description ? (
          <p className="text-muted mt-1 text-sm leading-6">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export { SectionHeader }
export type { SectionHeaderProps }
