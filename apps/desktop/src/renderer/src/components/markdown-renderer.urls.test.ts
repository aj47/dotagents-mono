import { beforeAll, describe, expect, it, vi } from "vitest"

vi.stubGlobal("window", { electron: { ipcRenderer: { invoke: vi.fn() } } })
vi.mock("@renderer/lib/clipboard", () => ({ copyTextToClipboard: vi.fn() }))

let markdownRenderer: typeof import("./markdown-renderer")

beforeAll(async () => {
  vi.stubGlobal("window", { electron: { ipcRenderer: { invoke: vi.fn() } } })
  markdownRenderer = await import("./markdown-renderer")
})

describe("markdown renderer URL guardrails", () => {
  it("allows only safe markdown link schemes", () => {
    expect(markdownRenderer.isAllowedMarkdownLinkUrl("https://dotagents.app/docs")).toBe(true)
    expect(markdownRenderer.isAllowedMarkdownLinkUrl("mailto:hello@dotagents.app")).toBe(true)
    expect(markdownRenderer.isAllowedMarkdownLinkUrl("#usage")).toBe(true)
    expect(markdownRenderer.isAllowedMarkdownLinkUrl("artifact://local-file?path=%2Ftmp%2Fout.html")).toBe(true)
    expect(markdownRenderer.isAllowedMarkdownLinkUrl("javascript:alert(1)")).toBe(false)
    expect(markdownRenderer.isAllowedMarkdownLinkUrl("data:text/html,<script>alert(1)</script>")).toBe(false)
  })

  it("allows http(s) and raster data image URLs, but blocks svg data URLs", () => {
    expect(markdownRenderer.isAllowedMarkdownImageUrl("https://example.com/image.png")).toBe(true)
    expect(markdownRenderer.isAllowedMarkdownImageUrl("data:image/png;base64,AAAA")).toBe(true)
    expect(markdownRenderer.isAllowedMarkdownImageUrl("data:image/jpeg;base64,BBBB")).toBe(true)
    expect(markdownRenderer.isAllowedMarkdownImageUrl("assets://conversation-image/conv_1/abcd1234abcd1234.png")).toBe(true)
    expect(markdownRenderer.isAllowedMarkdownImageUrl("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false)
    expect(markdownRenderer.isAllowedMarkdownImageUrl("assets://file?path=/tmp/secret.png")).toBe(false)
    expect(markdownRenderer.isAllowedMarkdownImageUrl("javascript:alert(1)")).toBe(false)
  })

  it("strips blocked URLs during markdown transform", () => {
    expect(markdownRenderer.markdownUrlTransform("javascript:alert(1)", "href")).toBe("")
    expect(markdownRenderer.markdownUrlTransform("data:image/svg+xml;base64,PHN2Zz4=", "src")).toBe("")
    expect(markdownRenderer.markdownUrlTransform("data:image/webp;base64,UklGRg==", "src")).toBe(
      "data:image/webp;base64,UklGRg==",
    )
  })

  it("links local artifact paths without touching code spans", () => {
    const linked = markdownRenderer.linkifyLocalArtifactPaths(
      [
        "Created /Users/ajjoobandi/.agents/tasks/overnight-agent-harness-lab/next-video-decision.html.",
        "`/Users/ajjoobandi/.agents/tasks/overnight-agent-harness-lab/task.md`",
        "[already linked](/Users/ajjoobandi/.agents/tasks/overnight-agent-harness-lab/already.html)",
      ].join("\n"),
    )

    expect(linked).toContain(
      "[/Users/ajjoobandi/.agents/tasks/overnight-agent-harness-lab/next-video-decision.html](artifact://local-file?path=%2FUsers%2Fajjoobandi%2F.agents%2Ftasks%2Fovernight-agent-harness-lab%2Fnext-video-decision.html).",
    )
    expect(linked).toContain("`/Users/ajjoobandi/.agents/tasks/overnight-agent-harness-lab/task.md`")
    expect(linked).toContain(
      "[already linked](/Users/ajjoobandi/.agents/tasks/overnight-agent-harness-lab/already.html)",
    )
  })

  it("does not rewrite conversation image asset URLs as local artifact paths", () => {
    const content =
      "![Thumbnail concept](assets://conversation-image/conv_1/fbc477c4ab9c445230f6f350761419e19bf5635ded24e27a666ba43d5863b428.png)"

    expect(markdownRenderer.linkifyLocalArtifactPaths(content)).toBe(content)
  })

  it("recognizes inline code spans that are exactly local artifact paths", () => {
    expect(
      markdownRenderer.getLocalArtifactPathFromInlineText(
        "/Users/ajjoobandi/.agents/tasks/overnight-agent-harness-lab/task.md",
      ),
    ).toBe("/Users/ajjoobandi/.agents/tasks/overnight-agent-harness-lab/task.md")
    expect(
      markdownRenderer.getLocalArtifactPathFromInlineText(
        "see /Users/ajjoobandi/.agents/tasks/overnight-agent-harness-lab/task.md",
      ),
    ).toBeNull()
  })

  describe("deriveImageDownloadFileName", () => {
    it("uses the last path segment when it already includes an extension", () => {
      expect(
        markdownRenderer.deriveImageDownloadFileName(
          "assets://conversation-image/conv_1/abcd1234.png",
        ),
      ).toBe("abcd1234.png")
      expect(
        markdownRenderer.deriveImageDownloadFileName(
          "https://example.com/path/to/cool-photo.JPG?ts=1",
        ),
      ).toBe("cool-photo.JPG")
    })

    it("decodes percent-encoded URL segments before sanitizing", () => {
      expect(
        markdownRenderer.deriveImageDownloadFileName(
          "https://example.com/Screen%20Shot%202026.png",
        ),
      ).toBe("Screen_Shot_2026.png")
    })

    it("appends an extension derived from the blob MIME type when the URL has none", () => {
      expect(
        markdownRenderer.deriveImageDownloadFileName(
          "https://example.com/image",
          undefined,
          "image/webp",
        ),
      ).toBe("image.webp")
      expect(
        markdownRenderer.deriveImageDownloadFileName(
          "https://example.com/image",
          undefined,
          "image/jpeg; charset=binary",
        ),
      ).toBe("image.jpg")
    })

    it("falls back to alt text when the URL has no usable segment", () => {
      expect(
        markdownRenderer.deriveImageDownloadFileName(
          "data:image/png;base64,AAAA",
          "Quarterly chart",
          "image/png",
        ),
      ).toBe("Quarterly_chart.png")
    })

    it("defaults to image.<ext> when no hint is available", () => {
      expect(
        markdownRenderer.deriveImageDownloadFileName("data:image/png;base64,AAAA"),
      ).toBe("image.png")
      expect(
        markdownRenderer.deriveImageDownloadFileName("not a url"),
      ).toBe("image.png")
    })

    it("strips path traversal and disallowed filesystem characters", () => {
      expect(
        markdownRenderer.deriveImageDownloadFileName(
          "https://example.com/path/..%2Fevil.png",
        ),
      ).toBe("evil.png")
      expect(
        markdownRenderer.deriveImageDownloadFileName(
          "data:image/png;base64,AAAA",
          'bad: name/with*chars?.png',
        ),
      ).toBe("bad_name_with_chars_.png")
    })
  })
})
