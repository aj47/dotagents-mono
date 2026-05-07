import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const rendererRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const preloadRoot = path.resolve(rendererRoot, "..", "..", "preload")
const rendererUiDirectories = ["components", "contexts", "hooks", "pages", "stores"].map(
  (directory) => path.join(rendererRoot, directory),
)

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

  it("keeps renderer UI surfaces off the direct TIPC client", () => {
    const sourceFiles = rendererUiDirectories.flatMap((directory) => collectSourceFiles(directory))
    const tipcClientNamedImportPattern =
      /import\s*\{[^}]*\btipcClient\b[^}]*\}\s*from\s*["'][^"']*tipc-client["']/
    const tipcClientNamespaceImportPattern =
      /import\s+\*\s+as\s+\w+\s+from\s*["'][^"']*tipc-client["']/
    const tipcClientCallPattern = /\btipcClient\./

    const violations = sourceFiles.flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8")
      const relativePath = path.relative(rendererRoot, filePath)
      const fileViolations: string[] = []

      if (tipcClientNamedImportPattern.test(source)) {
        fileViolations.push(`${relativePath}: direct tipcClient import`)
      }
      if (tipcClientNamespaceImportPattern.test(source)) {
        fileViolations.push(`${relativePath}: tipc-client namespace import`)
      }
      if (tipcClientCallPattern.test(source)) {
        fileViolations.push(`${relativePath}: direct tipcClient call`)
      }

      return fileViolations
    })

    expect(violations).toEqual([])
  })
})
