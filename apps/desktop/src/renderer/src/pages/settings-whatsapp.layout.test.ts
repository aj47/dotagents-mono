import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsWhatsAppSource = readFileSync(
  new URL("./settings-whatsapp.tsx", import.meta.url),
  "utf8",
)

describe("settings whatsapp page layout", () => {
  it("stacks WhatsApp settings helper and status copy beneath their controls", () => {
    expect(settingsWhatsAppSource).toContain(
      'className="px-3 [&>div:first-child]:sm:max-w-[30%] [&>div:last-child]:sm:max-w-[70%]"',
    )
    expect(settingsWhatsAppSource).toContain(
      'className="flex w-full min-w-0 flex-col items-start gap-1.5 text-left sm:max-w-[360px]"',
    )
    const toggleStackMatches = settingsWhatsAppSource.match(
      /className="flex w-full min-w-0 flex-col items-start gap-1 sm:max-w-\[360px\]"/g,
    )
    const toggleRowMatches = settingsWhatsAppSource.match(
      /className="flex w-full items-center justify-start sm:justify-end"/g,
    )

    expect(toggleStackMatches).toHaveLength(2)
    expect(toggleRowMatches).toHaveLength(2)
    expect(settingsWhatsAppSource).toContain(
      'className="text-xs text-muted-foreground break-words [overflow-wrap:anywhere]"',
    )
    expect(settingsWhatsAppSource).toContain(
      'className="text-xs text-amber-600 dark:text-amber-400 break-words [overflow-wrap:anywhere]"',
    )
    expect(settingsWhatsAppSource).toContain(
      'className="text-xs text-green-600 dark:text-green-400 break-words [overflow-wrap:anywhere]"',
    )
  })
})