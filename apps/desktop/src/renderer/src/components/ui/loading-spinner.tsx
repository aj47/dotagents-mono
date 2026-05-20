import { cn } from "@renderer/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
  text?: string
}

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
}

export function LoadingSpinner({
  className,
  size = "md",
  showText = false,
  text = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex items-center gap-2">
        <span
          role="status"
          aria-label={text}
          className={cn(
            "dotagents-loading-spinner block shrink-0 rounded-full border-current/20 border-t-current motion-safe:animate-spin",
            sizeClasses[size],
          )}
        />
        {showText && (
          <span className="text-sm text-muted-foreground">{text}</span>
        )}
      </div>
    </div>
  )
}
