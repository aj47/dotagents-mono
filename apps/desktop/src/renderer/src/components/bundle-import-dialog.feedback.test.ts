import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./bundle-import-dialog.tsx", import.meta.url), "utf8")

describe("desktop bundle import dialog preview failures", () => {
  it("keeps invalid selected bundle files distinct from a real cancel", () => {
    expect(source).toContain("interface BundlePreviewDialogResult")
    expect(source).toContain("if (dialogResult.canceled) {")
    expect(source).toContain("if (dialogResult.error || !dialogResult.filePath) {")
    expect(source).toContain("success: false,")
    expect(source).toContain('error: dialogResult.error || "Failed to parse bundle file"')
  })

  it("prevents importing a failed preview and offers a retry path", () => {
    expect(source).toContain("if (!preview?.success || !preview.filePath) return")
    expect(source).toContain("const canImport = !!preview?.success && !!preview.filePath")
    expect(source).toContain("Choose Another File")
    expect(source).toContain("Choose File")
  })
})

