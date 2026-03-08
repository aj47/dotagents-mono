import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const bundleExportDialogSource = readFileSync(new URL("./bundle-export-dialog.tsx", import.meta.url), "utf8")
const bundleImportDialogSource = readFileSync(new URL("./bundle-import-dialog.tsx", import.meta.url), "utf8")
const bundlePublishDialogSource = readFileSync(new URL("./bundle-publish-dialog.tsx", import.meta.url), "utf8")

describe("bundle dialog layout", () => {
  it("keeps export bundle actions reachable while long bundle content scrolls", () => {
    expect(bundleExportDialogSource).toContain(
      'className="max-w-xl max-h-[min(90vh,calc(100%-40px))] !overflow-hidden [grid-template-rows:auto_minmax(0,1fr)_auto]"',
    )
    expect(bundleExportDialogSource).toContain(
      'className="min-h-0 space-y-4 overflow-y-auto py-2 pr-1"',
    )
    expect(bundleExportDialogSource).toContain(
      'className="gap-2 border-t pt-4 sm:space-x-0"',
    )
  })

  it("keeps hub export actions visible in both metadata and preview steps", () => {
    expect(bundlePublishDialogSource).toContain(
      'className="max-w-2xl max-h-[min(90vh,calc(100%-40px))] !overflow-hidden [grid-template-rows:auto_minmax(0,1fr)_auto]"',
    )
    expect(bundlePublishDialogSource.match(/className="min-h-0 space-y-4 overflow-y-auto py-2 pr-1"/g)).toHaveLength(2)
    expect(bundlePublishDialogSource).toContain(
      'className="gap-2 border-t pt-4 sm:space-x-0"',
    )
    expect(bundlePublishDialogSource).toContain(
      'className="gap-2 border-t pt-4 sm:flex-wrap sm:justify-end sm:space-x-0"',
    )
  })

  it("lets hub publish metadata fields stack before the modal gets cramped", () => {
    expect(bundlePublishDialogSource).toContain('className="grid grid-cols-1 gap-3"')
    expect(bundlePublishDialogSource).toContain('className="min-w-0 space-y-1.5"')
    expect(bundlePublishDialogSource).toContain('className="grid grid-cols-1 gap-2 sm:grid-cols-2"')
    expect(bundlePublishDialogSource).toContain('className="min-w-0 space-y-1 sm:col-span-2"')
    expect(bundlePublishDialogSource).not.toContain('className="grid grid-cols-2 gap-3"')
    expect(bundlePublishDialogSource).not.toContain('className="grid grid-cols-3 gap-2"')
  })

  it("lets import component rows wrap labels and badges instead of crushing words", () => {
    expect(bundleImportDialogSource).toContain('className="flex items-start gap-2 py-1"')
    expect(bundleImportDialogSource).toContain(
      'className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1"',
    )
    expect(bundleImportDialogSource).toContain(
      'className="min-w-0 break-words text-sm leading-snug [overflow-wrap:anywhere]"',
    )
    expect(bundleImportDialogSource).toContain('className="shrink-0 text-xs"')
    expect(bundleImportDialogSource).toContain('className="shrink-0 border-amber-300 text-xs text-amber-600"')
  })
})