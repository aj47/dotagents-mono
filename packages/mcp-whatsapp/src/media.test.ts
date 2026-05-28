import { describe, it, expect } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"
import { buildMediaPayload, loadMediaSource } from "./media.js"

describe("buildMediaPayload", () => {
  const buf = Buffer.from("hello")

  it("builds an image payload with caption and mimetype", () => {
    const payload = buildMediaPayload(
      { to: "x", type: "image", source: { buffer: buf }, caption: "hi" },
      buf,
      "image/png"
    )
    expect(payload).toEqual({ image: buf, caption: "hi", mimetype: "image/png" })
  })

  it("omits caption when not provided", () => {
    const payload = buildMediaPayload(
      { to: "x", type: "image", source: { buffer: buf } },
      buf,
      "image/jpeg"
    )
    expect(payload).toEqual({ image: buf, mimetype: "image/jpeg" })
  })

  it("builds a video payload", () => {
    const payload = buildMediaPayload(
      { to: "x", type: "video", source: { buffer: buf }, caption: "clip" },
      buf,
      "video/mp4"
    )
    expect(payload).toEqual({ video: buf, caption: "clip", mimetype: "video/mp4" })
  })

  it("builds an audio payload with default mimetype and ptt flag", () => {
    const payload = buildMediaPayload(
      { to: "x", type: "audio", source: { buffer: buf }, ptt: true },
      buf,
      undefined
    )
    expect(payload).toEqual({ audio: buf, mimetype: "audio/mp4", ptt: true })
  })

  it("builds a document payload with filename", () => {
    const payload = buildMediaPayload(
      {
        to: "x",
        type: "document",
        source: { buffer: buf },
        fileName: "report.pdf",
        caption: "Q1 results",
      },
      buf,
      "application/pdf"
    )
    expect(payload).toEqual({
      document: buf,
      mimetype: "application/pdf",
      fileName: "report.pdf",
      caption: "Q1 results",
    })
  })

  it("defaults document mimetype when none is provided", () => {
    const payload = buildMediaPayload(
      { to: "x", type: "document", source: { buffer: buf } },
      buf,
      undefined
    )
    expect(payload).toEqual({
      document: buf,
      mimetype: "application/octet-stream",
    })
  })
})

describe("loadMediaSource", () => {
  it("rejects when no source field is provided", async () => {
    await expect(loadMediaSource({})).rejects.toThrow(
      "Media source must include one of: buffer, path, url, or base64"
    )
  })

  it("rejects when multiple source fields are provided", async () => {
    await expect(
      loadMediaSource({ buffer: Buffer.from("a"), base64: "YQ==" })
    ).rejects.toThrow("exactly one of")
  })

  it("returns the provided buffer unchanged", async () => {
    const buffer = Buffer.from([1, 2, 3])
    const result = await loadMediaSource({ buffer, mimetype: "image/png" })
    expect(result.buffer).toBe(buffer)
    expect(result.mimetype).toBe("image/png")
  })

  it("decodes raw base64", async () => {
    const result = await loadMediaSource({ base64: "aGVsbG8=", mimetype: "image/png" })
    expect(result.buffer.toString("utf-8")).toBe("hello")
    expect(result.mimetype).toBe("image/png")
  })

  it("tolerates data: URL base64 and infers mimetype", async () => {
    const result = await loadMediaSource({ base64: "data:image/jpeg;base64,aGVsbG8=" })
    expect(result.buffer.toString("utf-8")).toBe("hello")
    expect(result.mimetype).toBe("image/jpeg")
  })

  it("prefers the caller-provided mimetype over an inferred one", async () => {
    const result = await loadMediaSource({
      base64: "data:image/jpeg;base64,aGVsbG8=",
      mimetype: "image/png",
    })
    expect(result.mimetype).toBe("image/png")
  })

  it("reads a file from disk", async () => {
    const tmp = path.join(os.tmpdir(), `whatsapp-media-${Date.now()}.bin`)
    fs.writeFileSync(tmp, "filedata")
    try {
      const result = await loadMediaSource({ path: tmp, mimetype: "application/octet-stream" })
      expect(result.buffer.toString("utf-8")).toBe("filedata")
      expect(result.mimetype).toBe("application/octet-stream")
    } finally {
      fs.unlinkSync(tmp)
    }
  })

  it("throws a clear error when the file is missing", async () => {
    const tmp = path.join(os.tmpdir(), `whatsapp-media-missing-${Date.now()}.bin`)
    await expect(loadMediaSource({ path: tmp })).rejects.toThrow("Media file not found")
  })

  it("fetches media from a URL with a mocked fetch implementation", async () => {
    const fakeFetch = (async () =>
      new Response(Buffer.from("urldata"), {
        status: 200,
        headers: { "content-type": "image/webp" },
      })) as unknown as typeof fetch

    const result = await loadMediaSource({ url: "https://example.com/x" }, fakeFetch)
    expect(result.buffer.toString("utf-8")).toBe("urldata")
    expect(result.mimetype).toBe("image/webp")
  })

  it("surfaces HTTP errors from URL fetches", async () => {
    const fakeFetch = (async () =>
      new Response("not found", { status: 404 })) as unknown as typeof fetch

    await expect(
      loadMediaSource({ url: "https://example.com/x" }, fakeFetch)
    ).rejects.toThrow("HTTP 404")
  })
})
