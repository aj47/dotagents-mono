import { app } from "electron"
import { execFile } from "child_process"
import { randomUUID } from "crypto"
import fs from "fs"
import path from "path"

export type ScreenRegionCapture = {
  name: string
  dataUrl: string
}

function execFileAsync(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

export async function captureSelectedScreenRegion(): Promise<ScreenRegionCapture | null> {
  if (process.platform !== "darwin") {
    throw new Error("Screenshot selection is currently only supported on macOS.")
  }

  const fileName = `dotagents-screen-selection-${randomUUID()}.png`
  const filePath = path.join(app.getPath("temp"), fileName)

  try {
    // macOS interactive region capture. The user can drag-select a rectangle;
    // Escape cancels without creating the file.
    await execFileAsync("screencapture", ["-i", "-x", filePath])

    if (!fs.existsSync(filePath)) {
      return null
    }

    const buffer = await fs.promises.readFile(filePath)
    if (buffer.length === 0) {
      return null
    }

    return {
      name: "Screen selection",
      dataUrl: `data:image/png;base64,${buffer.toString("base64")}`,
    }
  } finally {
    fs.promises.unlink(filePath).catch(() => undefined)
  }
}