import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsRemoteServerSource = readFileSync(
  new URL("./settings-remote-server.tsx", import.meta.url),
  "utf8",
)

describe("settings remote server page layout", () => {
  it("stacks remote-server helper and warning copy beneath primary controls", () => {
    expect(settingsRemoteServerSource).toContain(
      'className="flex w-full min-w-0 flex-col items-start gap-1 sm:max-w-[220px]"',
    )
    expect(settingsRemoteServerSource).toContain(
      'className="flex w-full min-w-0 flex-col items-start gap-1.5 sm:max-w-[360px]"',
    )
    expect(settingsRemoteServerSource).toContain(
      'className="flex w-full min-w-0 flex-col items-start gap-1.5 text-left sm:max-w-[360px]"',
    )
    expect(settingsRemoteServerSource).toContain(
      'className="text-xs text-muted-foreground break-words [overflow-wrap:anywhere]"',
    )
    expect(settingsRemoteServerSource).toContain(
      'className="text-xs text-amber-600 dark:text-amber-400 break-words [overflow-wrap:anywhere]"',
    )
    expect(settingsRemoteServerSource).toContain(
      'className="flex w-full min-w-0 flex-wrap items-center gap-2"',
    )
  })
})