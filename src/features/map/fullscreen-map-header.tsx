import { ArrowLeft } from "lucide-react"

import { Button } from "../../shared/ui/button"

interface FullscreenMapHeaderProps {
  backLabel: string
  description: string
  onBack: () => void
  title: string
}

export function FullscreenMapHeader({
  backLabel,
  description,
  onBack,
  title,
}: FullscreenMapHeaderProps) {
  return (
    <header className="border-hairline bg-canvas flex min-h-16 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="-ml-2"
        aria-label={backLabel}
        onClick={onBack}
      >
        <ArrowLeft aria-hidden="true" />
      </Button>
      <div className="min-w-0">
        <h1
          data-route-heading
          tabIndex={-1}
          className="text-foreground text-lg font-bold sm:text-xl"
        >
          {title}
        </h1>
        <p className="text-muted hidden text-sm sm:block">{description}</p>
      </div>
    </header>
  )
}
