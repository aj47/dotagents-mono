import {
  buildHubBundleDownloadUrls,
  buildHubCatalogRawBundleUrl,
  normalizeHubCatalogResponse,
} from "./hub-catalog"

describe("hub-catalog", () => {
  it("normalizes legacy memories counts into knowledge notes", () => {
    const result = normalizeHubCatalogResponse({
      version: 1,
      updatedAt: "2026-03-07T00:00:00.000Z",
      items: [
        {
          id: "content-creator",
          name: "Content Creator",
          summary: "Writing and social bundle",
          author: { displayName: "TechFriend AJ" },
          tags: ["content", "starter", ""],
          bundleVersion: 1,
          componentCounts: {
            agentProfiles: 2,
            mcpServers: 1,
            skills: 1,
            repeatTasks: 2,
            memories: 3,
          },
          artifact: {
            url: "https://hub.dotagentsprotocol.com/bundles/content-creator.dotagents",
            fileName: "content-creator.dotagents",
            sizeBytes: 5931,
          },
          publishedAt: "2026-03-07T00:00:00.000Z",
          updatedAt: "2026-03-07T00:00:00.000Z",
        },
        {
          id: "",
          name: "Broken",
          summary: "Should be ignored",
        },
      ],
    })

    expect(result.updatedAt).toBe("2026-03-07T00:00:00.000Z")
    expect(result.items).toHaveLength(1)
    expect(result.items[0].componentCounts).toEqual({
      agentProfiles: 2,
      mcpServers: 1,
      skills: 1,
      repeatTasks: 2,
      knowledgeNotes: 3,
    })
    expect(result.items[0].tags).toEqual(["content", "starter"])
  })

  it("prefers the raw GitHub artifact when the catalog points at the Hub website", () => {
    const fileName = "personal-assistant.dotagents"

    expect(buildHubBundleDownloadUrls({
      artifactUrl: "https://hub.dotagentsprotocol.com/bundles/personal-assistant.dotagents",
      fileName,
      catalogId: "personal-assistant",
    })).toEqual([
      buildHubCatalogRawBundleUrl(fileName),
      "https://hub.dotagentsprotocol.com/bundles/personal-assistant.dotagents",
    ])
  })

  it("falls back to the raw artifact only once when the artifact already points to GitHub", () => {
    const rawUrl = buildHubCatalogRawBundleUrl("research-analyst.dotagents")

    expect(buildHubBundleDownloadUrls({
      artifactUrl: rawUrl,
      fileName: "research-analyst.dotagents",
      catalogId: "research-analyst",
    })).toEqual([rawUrl])
  })
})
