import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const updaterSource = readFileSync(new URL("./updater.tsx", import.meta.url), "utf8")
const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8")

describe("disabled updater wiring", () => {
  it("keeps the updater component inert while auto-updates are disabled", () => {
    expect(updaterSource).toContain("return null")
    expect(updaterSource).not.toContain("checkForUpdatesAndDownload")
    expect(updaterSource).not.toContain("useQuery")
  })

  it("does not mount the disabled updater from the root app shell", () => {
    expect(appSource).not.toContain("<Updater />")
    expect(appSource).not.toContain('lazy(() => import("./components/updater"))')
  })
})