import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import {
  APP_SHELL_BUNDLE_IMPORT_PRESENTATION,
  formatAppShellBundleConflictCount,
  formatAppShellBundleCreatedDateLabel,
  formatAppShellBundleImportSuccessToast,
  getAppShellBundleActionLabel,
  getAppShellBundleComponentLabel,
} from "@dotagents/shared/app-shell"

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

  it("uses shared app shell presentation for bundle import copy", () => {
    expect(dialogSource).toContain("APP_SHELL_BUNDLE_IMPORT_PRESENTATION")
    expect(dialogSource).toContain("getAppShellBundleComponentLabel")
    expect(dialogSource).toContain("formatAppShellBundleCreatedDateLabel")
    expect(dialogSource).toContain("formatAppShellBundleConflictCount")
    expect(dialogSource).toContain("formatAppShellBundleImportSuccessToast")
    expect(dialogSource).toContain('getAppShellBundleActionLabel("cancel")')
    expect(dialogSource).toContain('getAppShellBundleActionLabel("import")')
    expect(APP_SHELL_BUNDLE_IMPORT_PRESENTATION.description).toBe(
      "Preview and import a .dotagents bundle file.",
    )
    expect(getAppShellBundleComponentLabel("mcpServers", "detailed")).toBe(
      "MCP Servers",
    )
    expect(formatAppShellBundleCreatedDateLabel("5/11/2026")).toBe(
      "Created: 5/11/2026",
    )
    expect(formatAppShellBundleConflictCount(2)).toBe("2 conflicts")
    expect(formatAppShellBundleImportSuccessToast(2)).toBe(
      "Successfully imported 2 items",
    )
    expect(getAppShellBundleActionLabel("import")).toBe("Import")
  })
})
