/**
 * Helpers for sending media (image/video/audio/document) through Baileys.
 * Kept module-level so they can be unit-tested without a live WhatsApp socket.
 */

import fs from "fs"
import type { SendMediaOptions, WhatsAppMediaSource } from "./types.js"

export interface LoadedMedia {
  buffer: Buffer
  mimetype?: string
}

/**
 * Load media bytes from a source descriptor.
 * Exactly one of buffer/path/url/base64 must be set.
 */
export async function loadMediaSource(
  source: WhatsAppMediaSource,
  fetchImpl: typeof fetch = fetch
): Promise<LoadedMedia> {
  const providedCount =
    (source.buffer ? 1 : 0) +
    (source.path ? 1 : 0) +
    (source.url ? 1 : 0) +
    (source.base64 ? 1 : 0)
  if (providedCount === 0) {
    throw new Error("Media source must include one of: buffer, path, url, or base64")
  }
  if (providedCount > 1) {
    throw new Error(
      "Media source must include exactly one of: buffer, path, url, or base64"
    )
  }

  if (source.buffer) {
    return { buffer: source.buffer, mimetype: source.mimetype }
  }
  if (source.base64) {
    // Tolerate accidental data: URL prefix from callers.
    const dataUrlMatch = source.base64.match(/^data:([^;]+);base64,(.+)$/)
    if (dataUrlMatch) {
      return {
        buffer: Buffer.from(dataUrlMatch[2], "base64"),
        mimetype: source.mimetype || dataUrlMatch[1],
      }
    }
    return { buffer: Buffer.from(source.base64, "base64"), mimetype: source.mimetype }
  }
  if (source.path) {
    if (!fs.existsSync(source.path)) {
      throw new Error(`Media file not found: ${source.path}`)
    }
    return { buffer: fs.readFileSync(source.path), mimetype: source.mimetype }
  }

  const response = await fetchImpl(source.url!)
  if (!response.ok) {
    throw new Error(`Failed to fetch media from URL (HTTP ${response.status})`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const headerMimetype = response.headers.get("content-type") || undefined
  return {
    buffer: Buffer.from(arrayBuffer),
    mimetype: source.mimetype || headerMimetype,
  }
}

/**
 * Build the Baileys content payload for a media message.
 * Returns a plain object compatible with Baileys' AnyMessageContent shape.
 */
export function buildMediaPayload(
  options: SendMediaOptions,
  buffer: Buffer,
  mimetype: string | undefined
): Record<string, unknown> {
  switch (options.type) {
    case "image":
      return {
        image: buffer,
        ...(options.caption ? { caption: options.caption } : {}),
        ...(mimetype ? { mimetype } : {}),
      }
    case "video":
      return {
        video: buffer,
        ...(options.caption ? { caption: options.caption } : {}),
        ...(mimetype ? { mimetype } : {}),
      }
    case "audio":
      return {
        audio: buffer,
        mimetype: mimetype || "audio/mp4",
        ...(options.ptt ? { ptt: true } : {}),
      }
    case "document":
      return {
        document: buffer,
        mimetype: mimetype || "application/octet-stream",
        ...(options.fileName ? { fileName: options.fileName } : {}),
        ...(options.caption ? { caption: options.caption } : {}),
      }
    default: {
      const exhaustive: never = options.type
      throw new Error(`Unsupported media type: ${String(exhaustive)}`)
    }
  }
}
