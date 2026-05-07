import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-bundle-client.ts", import.meta.url), "utf8")
const importDialogSource = readFileSync(new URL("../components/bundle-import-dialog.tsx", import.meta.url), "utf8")
const exportDialogSource = readFileSync(new URL("../components/bundle-export-dialog.tsx", import.meta.url), "utf8")
const publishDialogSource = readFileSync(new URL("../components/bundle-publish-dialog.tsx", import.meta.url), "utf8")
const settingsSkillsSource = readFileSync(new URL("../pages/settings-skills.tsx", import.meta.url), "utf8")

describe("desktop bundle renderer client", () => {
  it("centralizes desktop bundle IPC channels behind shared bundle and hub types", () => {
    expect(clientSource).toContain("ExportableBundleItems")
    expect(clientSource).toContain("ExportBundleRequest")
    expect(clientSource).toContain("BundleImportResult")
    expect(clientSource).toContain("HubPublishPayload")
    expect(clientSource).toContain("tipcClient.getBundleExportableItems()")
    expect(clientSource).toContain("tipcClient.exportBundle(request)")
    expect(clientSource).toContain("tipcClient.generatePublishPayload(request)")
    expect(clientSource).toContain("tipcClient.saveHubPublishPayloadFile(request)")
    expect(clientSource).toContain("tipcClient.previewBundle()")
    expect(clientSource).toContain("tipcClient.previewBundleWithConflicts({ filePath })")
    expect(clientSource).toContain("tipcClient.importBundle(request)")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps bundle UI surfaces off direct bundle IPC channels", () => {
    const bundleUiSource = [
      importDialogSource,
      exportDialogSource,
      publishDialogSource,
      settingsSkillsSource,
    ].join("\n")

    expect(bundleUiSource).toContain("desktopBundleClient.getExportableItems()")
    expect(bundleUiSource).toContain("desktopBundleClient.exportBundle(")
    expect(bundleUiSource).toContain("desktopBundleClient.generatePublishPayload(")
    expect(bundleUiSource).toContain("desktopBundleClient.saveHubPublishPayloadFile(")
    expect(bundleUiSource).toContain("desktopBundleClient.previewBundleFromDialog()")
    expect(bundleUiSource).toContain("desktopBundleClient.previewBundleWithConflicts(filePath)")
    expect(bundleUiSource).toContain("desktopBundleClient.importBundleFromFile({")
    expect(bundleUiSource).not.toContain("tipcClient.getBundleExportableItems(")
    expect(bundleUiSource).not.toContain("tipcClient.exportBundle(")
    expect(bundleUiSource).not.toContain("tipcClient.generatePublishPayload(")
    expect(bundleUiSource).not.toContain("tipcClient.saveHubPublishPayloadFile(")
    expect(bundleUiSource).not.toContain("tipcClient.previewBundle(")
    expect(bundleUiSource).not.toContain("tipcClient.previewBundleWithConflicts(")
    expect(bundleUiSource).not.toContain("tipcClient.importBundle(")
  })
})
