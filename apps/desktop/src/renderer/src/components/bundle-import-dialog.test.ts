import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const dialogSource = readFileSync(new URL("./bundle-import-dialog.tsx", import.meta.url), "utf8")

describe("bundle import dialog shared helpers", () => {
  it("uses shared bundle API helpers for import selection and result summaries", () => {
    expect(dialogSource).toContain("BUNDLE_COMPONENT_OPTIONS")
    expect(dialogSource).toContain("BUNDLE_IMPORT_CONFLICT_STRATEGY_OPTIONS")
    expect(dialogSource).toContain("getAvailableBundleComponentSelection")
    expect(dialogSource).toContain("getBundleImportChangedItemCount")
    expect(dialogSource).toContain("hasBundleImportConflicts")
    expect(dialogSource).toContain("resolveBundleComponentSelection")
    expect(dialogSource).not.toContain("const DEFAULT_COMPONENTS")
    expect(dialogSource).not.toContain("const COMPONENT_KEYS")
    expect(dialogSource).not.toContain('type ConflictStrategy = "skip"')
  })
})
