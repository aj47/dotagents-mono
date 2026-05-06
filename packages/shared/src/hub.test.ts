import { describe, expect, it } from "vitest"

import {
  buildHubBundleArtifactUrl,
  buildHubBundleInstallUrl,
  buildHubBundlePublicMetadata,
  buildHubPublishSubmission,
  getHubDraftArtifactUrl,
  getHubDraftCatalogId,
  slugifyHubCatalogId,
  type HubPublishPayload,
} from "./hub"

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
  })
})
