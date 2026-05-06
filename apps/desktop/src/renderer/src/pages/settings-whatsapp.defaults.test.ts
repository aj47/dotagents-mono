import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getPageSource(fileName: string): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, fileName), "utf8")
}

describe("settings whatsapp defaults", () => {
  it("uses shared WhatsApp integration defaults", () => {
    const whatsappSource = getPageSource("settings-whatsapp.tsx")
    const generalSource = getPageSource("settings-general.tsx")

    expect(generalSource).toContain("DEFAULT_WHATSAPP_ENABLED")
    expect(whatsappSource).toContain("DEFAULT_WHATSAPP_ENABLED")
    expect(whatsappSource).toContain("DEFAULT_WHATSAPP_AUTO_REPLY")
    expect(whatsappSource).toContain("DEFAULT_WHATSAPP_LOG_MESSAGES")
  })
})
