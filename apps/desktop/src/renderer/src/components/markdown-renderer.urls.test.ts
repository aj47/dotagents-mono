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
})