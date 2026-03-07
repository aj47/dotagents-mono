import { describe, expect, it } from "vitest"

import {
  isAllowedMarkdownImageUrl,
  isAllowedMarkdownLinkUrl,
  markdownUrlTransform,
} from "./markdown-renderer"

describe("markdown renderer URL guardrails", () => {
  it("allows only safe markdown link schemes", () => {
    expect(isAllowedMarkdownLinkUrl("https://dotagents.app/docs")).toBe(true)
    expect(isAllowedMarkdownLinkUrl("mailto:hello@dotagents.app")).toBe(true)
    expect(isAllowedMarkdownLinkUrl("#usage")).toBe(true)
    expect(isAllowedMarkdownLinkUrl("javascript:alert(1)")).toBe(false)
    expect(isAllowedMarkdownLinkUrl("data:text/html,<script>alert(1)</script>")).toBe(false)
  })

  it("allows http(s) and raster data image URLs, but blocks svg data URLs", () => {
    expect(isAllowedMarkdownImageUrl("https://example.com/image.png")).toBe(true)
    expect(isAllowedMarkdownImageUrl("data:image/png;base64,AAAA")).toBe(true)
    expect(isAllowedMarkdownImageUrl("data:image/jpeg;base64,BBBB")).toBe(true)
    expect(isAllowedMarkdownImageUrl("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false)
    expect(isAllowedMarkdownImageUrl("javascript:alert(1)")).toBe(false)
  })

  it("strips blocked URLs during markdown transform", () => {
    expect(markdownUrlTransform("javascript:alert(1)", "href")).toBe("")
    expect(markdownUrlTransform("data:image/svg+xml;base64,PHN2Zz4=", "src")).toBe("")
    expect(markdownUrlTransform("data:image/webp;base64,UklGRg==", "src")).toBe(
      "data:image/webp;base64,UklGRg==",
    )
  })
})