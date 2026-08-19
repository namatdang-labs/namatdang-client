import type { ComponentProps } from "react"
import { cn } from "../lib/utils"

type TextareaProps = ComponentProps<"textarea">

function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-hairline bg-canvas text-foreground placeholder:text-disabled hover:border-muted focus-visible:border-foreground disabled:bg-surface disabled:text-disabled aria-invalid:border-critical min-h-28 w-full resize-y rounded-lg border px-3 py-3 text-base transition-colors duration-150 disabled:cursor-not-allowed aria-invalid:border-2 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
export type { TextareaProps }
