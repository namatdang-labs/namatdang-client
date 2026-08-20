import type { ComponentProps } from "react"
import { cn } from "../lib/utils"

type InputProps = ComponentProps<"input">

function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-hairline bg-canvas text-foreground placeholder:text-disabled hover:border-muted focus-visible:border-foreground disabled:bg-surface disabled:text-disabled aria-invalid:border-critical min-h-11 w-full rounded-lg border px-3 py-2 text-base transition-colors duration-150 disabled:cursor-not-allowed aria-invalid:border-2 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
export type { InputProps }
