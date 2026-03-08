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

  it("surfaces Cloudflare prerequisite and error states as wrap-safe alert cards", () => {
    expect(settingsRemoteServerSource).toContain(
      'const CLOUDFLARE_NOTICE_CARD_CLASS_NAME =',
    )
    expect(settingsRemoteServerSource).toContain(
      'const CLOUDFLARE_ERROR_CARD_CLASS_NAME =',
    )
    expect(settingsRemoteServerSource).toContain(
      'className="inline-block max-w-full rounded bg-muted px-1 py-0.5 font-mono text-xs text-amber-800 dark:text-amber-200 break-all [overflow-wrap:anywhere]"',
    )
    expect(settingsRemoteServerSource).toContain(
      'className="ml-1 cursor-pointer break-all underline [overflow-wrap:anywhere] hover:text-foreground"',
    )
    expect(settingsRemoteServerSource).toContain('role="alert"')

    const stackedNoticeButtonMatches = settingsRemoteServerSource.match(
      /className="w-full sm:w-auto"/g,
    )
    expect(stackedNoticeButtonMatches?.length ?? 0).toBeGreaterThanOrEqual(2)
  })
})