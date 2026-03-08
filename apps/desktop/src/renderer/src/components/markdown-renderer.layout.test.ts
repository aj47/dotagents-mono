import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const markdownRendererSource = readFileSync(new URL("./markdown-renderer.tsx", import.meta.url), "utf8")

describe("markdown renderer layout", () => {
  it("keeps long links, inline code, and fenced code blocks readable in narrow tiles", () => {
    expect(markdownRendererSource).toContain(
      'className="mb-3 leading-relaxed text-foreground break-words [overflow-wrap:anywhere]"'
    )
    expect(markdownRendererSource).toContain(
      'className="break-words text-primary underline underline-offset-2 hover:text-primary/80 [overflow-wrap:anywhere]"'
    )
    expect(markdownRendererSource).toContain(
      'className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.8125rem] text-current dark:bg-white/10 [overflow-wrap:anywhere]"'
    )
    expect(markdownRendererSource).toContain(
      'className="mb-3 max-w-full overflow-x-auto rounded-lg border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"'
    )
  })

  it("reuses the overflow-safe markdown chrome for think sections and table content", () => {
    expect(markdownRendererSource).toContain("components={sharedMarkdownComponents}")
    expect(markdownRendererSource).toContain(
      'className="mb-3 max-w-full overflow-x-auto rounded-lg border border-border/80"'
    )
    expect(markdownRendererSource).toContain(
      'className="w-max min-w-full border-collapse text-sm"'
    )
    expect(markdownRendererSource).toContain(
      'className="border-b border-r border-border px-3 py-2 align-top last:border-r-0 [overflow-wrap:anywhere]"'
    )
  })
})