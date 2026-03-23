export function LocalOnlySecretNote({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground ${className}`.trim()}>
      API keys and other secrets stay in local app config and are omitted from shareable <span className="font-mono">.agents</span> files.
    </div>
  )
}
