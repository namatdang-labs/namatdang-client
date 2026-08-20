import type { ComponentProps } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../lib/utils"

type SelectProps = ComponentProps<"select"> & {
  wrapperClassName?: string
}

function Select({
  className,
  wrapperClassName,
  children,
  ...props
}: SelectProps) {
  return (
    <span
      data-slot="select-wrapper"
      className={cn("relative block w-full", wrapperClassName)}
    >
      <select
        data-slot="select"
        className={cn(
          "border-hairline bg-canvas text-foreground hover:border-muted focus-visible:border-foreground disabled:bg-surface disabled:text-disabled aria-invalid:border-critical min-h-11 w-full appearance-none rounded-lg border py-2 pr-10 pl-3 text-base transition-colors duration-150 disabled:cursor-not-allowed aria-invalid:border-2 motion-reduce:transition-none",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="text-muted pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2"
        aria-hidden="true"
        strokeWidth={2}
      />
    </span>
  )
}

export { Select }
export type { SelectProps }
