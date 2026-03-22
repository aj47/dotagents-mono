import { cn } from "@renderer/lib/utils"

export function SecureStorageNote({ className }: { className?: string }) {
  return (
    <p className={cn("mt-2 text-xs text-muted-foreground", className)}>
      Stored securely on this device and omitted from shareable <span className="font-mono">.agents</span> JSON.
    </p>
  )
}
