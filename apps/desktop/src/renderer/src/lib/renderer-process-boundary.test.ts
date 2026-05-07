import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const rendererRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const preloadRoot = path.resolve(rendererRoot, "..", "..", "preload")

function collectSourceFiles(root: string): string[] {
  const entries = readdirSync(root)
  const files: string[] = []

  for (const entry of entries) {
    const filePath = path.join(root, entry)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(filePath))
      continue
    }

    if (/\.(ts|tsx)$/.test(entry) && !entry.includes(".test.")) {
      files.push(filePath)
    }
  }

  return files
}

describe("renderer process boundary", () => {
  it("keeps raw Electron IPC access isolated to the renderer TIPC bridge", () => {
    const sourceFiles = [
      ...collectSourceFiles(rendererRoot),
      ...collectSourceFiles(preloadRoot),
    ]
    const rawIpcCallPattern = /window\.electron\.ipcRenderer\.(invoke|send|on|removeAllListeners)\b/
    const rawElectronApiPattern = /window\.electronAPI\b|exposeInMainWorld\("electronAPI"/
    const allowedRawIpcFiles = new Set([
      path.join(rendererRoot, "lib", "tipc-client.ts"),
    ])

    const violations = sourceFiles.flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8")
      const relativePath = path.relative(path.resolve(rendererRoot, "..", ".."), filePath)
      const fileViolations: string[] = []

      if (rawIpcCallPattern.test(source) && !allowedRawIpcFiles.has(filePath)) {
        fileViolations.push(`${relativePath}: raw ipcRenderer usage`)
      }
      if (rawElectronApiPattern.test(source)) {
        fileViolations.push(`${relativePath}: legacy electronAPI bridge usage`)
      }

      return fileViolations
    })

    expect(violations).toEqual([])
  })
})
