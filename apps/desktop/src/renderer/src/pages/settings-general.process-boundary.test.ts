import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsGeneralSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-general.tsx"), "utf8")
}

describe("settings general process boundary", () => {
  it("uses the renderer TIPC client instead of raw Langfuse IPC channels", () => {
    const source = getSettingsGeneralSource()

    expect(source).toContain("tipcClient.isLangfuseInstalled()")
    expect(source).not.toContain('ipcRenderer.invoke("isLangfuseInstalled")')
  })
})
