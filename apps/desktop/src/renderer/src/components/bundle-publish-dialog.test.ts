import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const dialogSource = readFileSync(new URL("./bundle-publish-dialog.tsx", import.meta.url), "utf8")

describe("bundle publish dialog shared helpers", () => {
  it("keeps Hub publish metadata and component defaults in shared code", () => {
    expect(dialogSource).toContain("DEFAULT_BUNDLE_PUBLISH_COMPONENT_SELECTION")
    expect(dialogSource).toContain("buildHubBundlePublicMetadata")
    expect(dialogSource).toContain("buildHubPublishSubmission")
    expect(dialogSource).toContain("getHubDraftArtifactUrl")
    expect(dialogSource).toContain("getHubDraftCatalogId")
    expect(dialogSource).not.toContain("const DEFAULT_PUBLISH_COMPONENTS")
    expect(dialogSource).not.toContain("function buildMeta")
    expect(dialogSource).not.toContain("function getDraftCatalogId")
    expect(dialogSource).not.toContain("function getDraftArtifactUrl")
  })
})
