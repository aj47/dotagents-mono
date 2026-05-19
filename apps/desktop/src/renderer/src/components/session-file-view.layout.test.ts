import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionFileViewSource = readFileSync(
  new URL("./session-file-view.tsx", import.meta.url),
  "utf8",
)

describe("session file view layout", () => {
  it("bounds the file tree and preview panes so both can scroll inside the tab", () => {
    expect(sessionFileViewSource).toContain(
      'className="flex max-h-[14rem] min-h-0 flex-col border-b border-border/40 md:max-h-none md:w-[18rem] md:border-b-0 md:border-r"',
    )
    expect(sessionFileViewSource).toContain(
      'className="min-h-0 flex-1 overflow-y-auto px-2 py-2"',
    )
    expect(sessionFileViewSource).toContain(
      'className="min-h-0 flex-1 overflow-y-auto p-3"',
    )
  })

  it("keeps collapsed file tree rows and toolbar actions to one line", () => {
    expect(sessionFileViewSource).toContain(
      'className="flex flex-nowrap items-center gap-2 overflow-x-auto border-b border-border/40 px-3 py-2"',
    )
    expect(sessionFileViewSource).toContain(
      "shrink-0 gap-1.5 whitespace-nowrap",
    )
    expect(sessionFileViewSource).toContain(
      "whitespace-nowrap rounded px-1 py-1 text-left text-sm",
    )
    expect(sessionFileViewSource).toContain("title={entry.name}")
  })

  it("renders markdown and text previews with overflow-safe chrome", () => {
    expect(sessionFileViewSource).toContain(
      'className="max-w-full overflow-x-hidden rounded-md border bg-background p-3 text-sm [overflow-wrap:anywhere]"',
    )
    expect(sessionFileViewSource).toContain(
      'className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md border bg-background p-3 text-xs leading-5 text-foreground [overflow-wrap:anywhere]"',
    )
  })

  it("hydrates and clears temporary roots for saved conversation file views", () => {
    expect(sessionFileViewSource).toContain(
      'sessionId.startsWith("pending-") && conversationId',
    )
    expect(sessionFileViewSource).toContain(
      "tipcClient.hydrateConversationFileActivity",
    )
    expect(sessionFileViewSource).toContain("clearTrackedSessionFileActivity")
  })

})
