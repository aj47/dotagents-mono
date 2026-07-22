import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it } from "vitest"
import {
  MENTRA_PHOTO_MAX_BYTES,
  MentraPhotoStore,
  isSupportedMentraPhotoMimeType,
  isValidMentraPhotoRequestId,
} from "./mentra-photo-store"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => (
    fs.promises.rm(directory, { recursive: true, force: true })
  )))
})

async function createStore(ttlMs = 1_000): Promise<MentraPhotoStore> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "dotagents-mentra-test-"))
  temporaryDirectories.push(directory)
  return new MentraPhotoStore(directory, ttlMs)
}

describe("MentraPhotoStore", () => {
  it("stores, reads, and deletes an authenticated-upload candidate", async () => {
    const store = await createStore()
    const photo = await store.save("request_123", "image/jpeg", Buffer.from([1, 2, 3]))

    expect(photo.size).toBe(3)
    expect((await store.get("request_123"))?.mimeType).toBe("image/jpeg")
    await store.delete("request_123")
    expect(await store.get("request_123")).toBeNull()
  })

  it("expires stale photos", async () => {
    const store = await createStore(0)
    await store.save("stale", "image/png", Buffer.from([1]))
    await new Promise((resolve) => setTimeout(resolve, 2))
    expect(await store.get("stale")).toBeNull()
  })

  it("rejects traversal IDs and unsupported media", () => {
    expect(isValidMentraPhotoRequestId("../photo")).toBe(false)
    expect(isValidMentraPhotoRequestId("safe-photo_1")).toBe(true)
    expect(isSupportedMentraPhotoMimeType("image/svg+xml")).toBe(false)
  })

  it("rejects empty and oversized photos", async () => {
    const store = await createStore()
    await expect(store.save("empty", "image/jpeg", Buffer.alloc(0)))
      .rejects.toThrow("empty")
    await expect(store.save("oversized", "image/jpeg", Buffer.alloc(MENTRA_PHOTO_MAX_BYTES + 1)))
      .rejects.toThrow("exceeds")
  })
})
