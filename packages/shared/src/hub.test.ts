import { describe, expect, it } from "vitest"

import {
  buildHubBundleArtifactUrl,
  buildHubBundleInstallUrl,
  buildHubBundlePublicMetadata,
  buildHubPublishArtifactFileName,
  buildHubPublishBundleExportRequest,
  buildHubPublishPayloadFromBundle,
  buildHubPublishSubmission,
  getHubDraftArtifactUrl,
  getHubDraftCatalogId,
  getHubBundleJsonSizeBytes,
  normalizeHubPublishArtifactUrl,
  normalizeHubPublishCatalogId,
  slugifyHubCatalogId,
  type HubPublishPayload,
} from "./hub"
import type { DotAgentsBundle } from "./bundle-api"

describe("hub helpers", () => {
  it("normalizes Hub catalog ids and derived URLs", () => {
    expect(slugifyHubCatalogId("  My Agent Setup!  ")).toBe("my-agent-setup")
    expect(slugifyHubCatalogId("")).toBe("bundle")
    expect(buildHubBundleArtifactUrl("my-agent")).toBe("https://hub.dotagentsprotocol.com/bundles/my-agent.dotagents")
    expect(buildHubBundleInstallUrl("https://example.com/my-agent.dotagents")).toBe(
      "dotagents://install?bundle=https%3A%2F%2Fexample.com%2Fmy-agent.dotagents",
    )
    expect(getHubDraftCatalogId({ name: "My Bundle", catalogId: " Custom ID " })).toBe("custom-id")
    expect(getHubDraftArtifactUrl({ name: "My Bundle" })).toBe(
      "https://hub.dotagentsprotocol.com/bundles/my-bundle.dotagents",
    )
    expect(getHubDraftArtifactUrl({
      name: "My Bundle",
      artifactUrl: " https://cdn.example.com/bundles/my-bundle.dotagents ",
    })).toBe("https://cdn.example.com/bundles/my-bundle.dotagents")
    expect(normalizeHubPublishCatalogId(" Custom ID ", "My Bundle")).toBe("custom-id")
    expect(normalizeHubPublishCatalogId(undefined, "My Bundle")).toBe("my-bundle")
    expect(normalizeHubPublishArtifactUrl(undefined, "my-bundle")).toBe(
      "https://hub.dotagentsprotocol.com/bundles/my-bundle.dotagents",
    )
    expect(normalizeHubPublishArtifactUrl(" https://cdn.example.com/bundle.dotagents ", "my-bundle")).toBe(
      "https://cdn.example.com/bundle.dotagents",
    )
    expect(buildHubPublishArtifactFileName(" My/Bundle!? ", "fallback-id")).toBe("MyBundle.dotagents")
    expect(() => normalizeHubPublishArtifactUrl("file:///tmp/bad.dotagents", "my-bundle")).toThrow(/artifactUrl/)
  })

  it("builds publish metadata and submission envelopes from shared drafts", () => {
    expect(buildHubBundlePublicMetadata({
      summary: "  Useful agents  ",
      authorName: " AJ ",
      authorHandle: " aj ",
      authorUrl: " https://example.com/aj ",
      tags: " coding, agents, , productivity ",
    })).toEqual({
      summary: "Useful agents",
      author: {
        displayName: "AJ",
        handle: "aj",
        url: "https://example.com/aj",
      },
      tags: ["coding", "agents", "productivity"],
    })

    const payload: HubPublishPayload = {
      catalogItem: {
        id: "my-agent",
        name: "My Agent",
        summary: "Useful agents",
        author: { displayName: "AJ" },
        tags: ["agents"],
        bundleVersion: 1,
        componentCounts: {
          agentProfiles: 1,
          mcpServers: 0,
          skills: 1,
          repeatTasks: 0,
          knowledgeNotes: 0,
        },
        artifact: {
          url: "https://example.com/my-agent.dotagents",
          fileName: "my-agent.dotagents",
          sizeBytes: 1024,
        },
        publishedAt: "2026-05-06T00:00:00.000Z",
        updatedAt: "2026-05-06T00:00:00.000Z",
      },
      bundleJson: "{}",
      installUrl: "dotagents://install?bundle=test",
    }

    expect(buildHubPublishSubmission(payload)).toEqual({
      source: "dotagents-desktop",
      version: 1,
      payload,
    })

    expect(buildHubPublishBundleExportRequest({
      name: "My Bundle",
      description: "Publish description",
      catalogId: "custom-id",
      artifactUrl: "https://cdn.example.com/custom.dotagents",
      agentProfileIds: ["agent-1"],
      publicMetadata: {
        summary: "Useful agents",
        author: { displayName: "AJ" },
        tags: ["agents"],
      },
      components: {
        skills: false,
        repeatTasks: true,
      },
    })).toEqual({
      catalogId: "custom-id",
      artifactUrl: "https://cdn.example.com/custom.dotagents",
      exportRequest: {
        name: "My Bundle",
        description: "Publish description",
        agentProfileIds: ["agent-1"],
        publicMetadata: {
          summary: "Useful agents",
          author: { displayName: "AJ" },
          tags: ["agents"],
        },
        components: {
          agentProfiles: true,
          mcpServers: true,
          skills: false,
          repeatTasks: true,
          knowledgeNotes: false,
        },
      },
    })
  })

  it("builds publish payloads from bundles", () => {
    expect(getHubBundleJsonSizeBytes("é")).toBe(2)

    const bundle: DotAgentsBundle = {
      manifest: {
        version: 1,
        name: "My Bundle",
        description: "Useful bundle",
        createdAt: "2026-05-06T00:00:00.000Z",
        exportedFrom: "dotagents-desktop",
        publicMetadata: {
          summary: "Useful agents",
          author: { displayName: "AJ" },
          tags: ["agents"],
          compatibility: {
            minDesktopVersion: "0.0.1",
          },
        },
        components: {
          agentProfiles: 1,
          mcpServers: 0,
          skills: 1,
          repeatTasks: 0,
          knowledgeNotes: 0,
        },
      },
      agentProfiles: [],
      mcpServers: [],
      skills: [],
      repeatTasks: [],
      knowledgeNotes: [],
    }

    expect(buildHubPublishPayloadFromBundle(bundle, {
      catalogId: " Custom ID ",
      artifactUrl: " https://cdn.example.com/custom.dotagents ",
      now: () => new Date("2026-05-06T12:00:00.000Z"),
      bundleJson: "{\"bundle\":true}",
      getBundleSizeBytes: (bundleJson) => bundleJson.length,
    })).toEqual({
      catalogItem: {
        id: "custom-id",
        name: "My Bundle",
        summary: "Useful agents",
        description: "Useful bundle",
        author: { displayName: "AJ" },
        tags: ["agents"],
        bundleVersion: 1,
        publishedAt: "2026-05-06T12:00:00.000Z",
        updatedAt: "2026-05-06T12:00:00.000Z",
        componentCounts: {
          agentProfiles: 1,
          mcpServers: 0,
          skills: 1,
          repeatTasks: 0,
          knowledgeNotes: 0,
        },
        artifact: {
          url: "https://cdn.example.com/custom.dotagents",
          fileName: "My Bundle.dotagents",
          sizeBytes: 15,
        },
        compatibility: {
          minDesktopVersion: "0.0.1",
        },
      },
      bundleJson: "{\"bundle\":true}",
      installUrl: "dotagents://install?bundle=https%3A%2F%2Fcdn.example.com%2Fcustom.dotagents",
    })

    expect(() => buildHubPublishPayloadFromBundle({
      ...bundle,
      manifest: {
        ...bundle.manifest,
        publicMetadata: undefined,
      },
    })).toThrow(/summary/)
  })
})
