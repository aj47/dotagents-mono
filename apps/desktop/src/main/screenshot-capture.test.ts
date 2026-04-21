import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

const tempDirs: string[] = []
const originalPlatform = process.platform

async function setupScreenshotCaptureTest(fileContents?: Buffer) {
  Object.defineProperty(process, "platform", { value: "darwin" })
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "dotagents-screenshot-capture-"))
  tempDirs.push(tempDir)

  vi.doMock("electron", () => ({
    app: {
      getPath: vi.fn(() => tempDir),
    },
  }))

  vi.doMock("child_process", () => ({
    execFile: vi.fn((_command: string, args: string[], callback: (error: Error | null) => void) => {
      if (fileContents) {
        fs.writeFile(args[2], fileContents).then(() => callback(null))
        return
      }
      callback(new Error("cancelled"))
    }),
  }))

  return { tempDir }
}

afterEach(async () => {
  Object.defineProperty(process, "platform", { value: originalPlatform })
  vi.resetModules()
  vi.clearAllMocks()
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe("captureSelectedScreenRegion", () => {
  it("returns null when screencapture is cancelled before creating a file", async () => {
    await setupScreenshotCaptureTest()
    const { captureSelectedScreenRegion } = await import("./screenshot-capture")

    await expect(captureSelectedScreenRegion()).resolves.toBeNull()
  })

  it("rejects oversized captures before building a data URL", async () => {
    const { MAX_SCREENSHOT_CAPTURE_SIZE_BYTES, captureSelectedScreenRegion } = await importOversizedCapture()

    await expect(captureSelectedScreenRegion()).rejects.toThrow("Screen selection is too large")
    expect(MAX_SCREENSHOT_CAPTURE_SIZE_BYTES).toBe(8 * 1024 * 1024)
  })
})

async function importOversizedCapture() {
  vi.resetModules()
  await setupScreenshotCaptureTest(Buffer.alloc(8 * 1024 * 1024 + 1))
  return import("./screenshot-capture")
}
