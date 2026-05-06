import { describe, expect, it } from "vitest"

import { splitMarkdownContent } from "./markdown-render-parts"

describe("markdown render parts", () => {
  it("extracts Codex thinking blocks from regular markdown", () => {
    expect(splitMarkdownContent("Before <think>reasoning</think> After")).toEqual([
      { type: "markdown", content: "Before " },
      { type: "think", content: "reasoning" },
      { type: "markdown", content: " After" },
    ])
  })

  it("keeps renderable videos as separate parts outside think blocks", () => {
    expect(splitMarkdownContent("Watch [clip](https://example.com/demo.mp4) <think>not video</think>")).toEqual([
      { type: "markdown", content: "Watch " },
      { type: "video", label: "clip", url: "https://example.com/demo.mp4" },
      { type: "think", content: "not video" },
    ])
  })

  it("does not split image markdown links into videos", () => {
    expect(splitMarkdownContent("Look ![clip](https://example.com/demo.mp4)")).toEqual([
      { type: "markdown", content: "Look ![clip](https://example.com/demo.mp4)" },
    ])
  })

  it("can treat desktop recording asset links as renderable videos when enabled", () => {
    expect(splitMarkdownContent("Watch [recording](assets://recording/demo.mp4)", {
      allowRecordingAssetUrls: true,
    })).toEqual([
      { type: "markdown", content: "Watch " },
      { type: "video", label: "recording", url: "assets://recording/demo.mp4" },
    ])
  })

  it("keeps non-video links as markdown", () => {
    expect(splitMarkdownContent("Read [docs](https://example.com/readme)")).toEqual([
      { type: "markdown", content: "Read [docs](https://example.com/readme)" },
    ])
  })
})
