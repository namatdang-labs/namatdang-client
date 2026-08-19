import type { ComponentProps } from "react"
import { cn } from "../lib/utils"

type LabelProps = ComponentProps<"label"> & {
  requiredIndicator?: boolean
}

function Label({
  className,
  children,
  requiredIndicator = false,
  ...props
}: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-foreground peer-disabled:text-disabled inline-flex items-center gap-1 text-sm font-semibold peer-disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
      {requiredIndicator ? (
        <span className="text-critical" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  )
}

export { Label }
export type { LabelProps }
