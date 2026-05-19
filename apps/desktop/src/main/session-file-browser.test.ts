import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it } from "vitest"

import {
  createTrackedSessionFileEntry,
  deleteTrackedSessionFileEntry,
  getTrackedSessionFileRoots,
  listTrackedSessionFiles,
  moveTrackedSessionFileEntry,
  readTrackedSessionFilePreview,
  recordSessionFileActivity,
  resetTrackedSessionFileActivityForTests,
} from "./session-file-browser"

function createTempWorkspace(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-session-files-"))
}

describe("session-file-browser", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    resetTrackedSessionFileActivityForTests()
    while (tempDirs.length > 0) {
      fs.rmSync(tempDirs.pop()!, { recursive: true, force: true })
    }
  })

  it("derives workspace roots from execute_command cwd metadata", () => {
    const repoRoot = createTempWorkspace()
    tempDirs.push(repoRoot)
    fs.writeFileSync(path.join(repoRoot, "pnpm-lock.yaml"), "lockfile", "utf8")
    fs.mkdirSync(path.join(repoRoot, "apps", "desktop"), { recursive: true })

    recordSessionFileActivity({
      sessionId: "session-1",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: false,
      conversationHistory: [{
        role: "tool",
        content: "",
        timestamp: Date.now(),
        toolResults: [{
          success: true,
          content: JSON.stringify({ cwd: path.join(repoRoot, "apps", "desktop"), stdout: "ok" }),
        }],
      }],
    })

    const realRepoRoot = fs.realpathSync(repoRoot)
    expect(getTrackedSessionFileRoots("session-1")).toEqual([
      { path: realRepoRoot, label: path.basename(realRepoRoot) },
    ])
  })

  it("lists visible files while filtering noisy directories", () => {
    const repoRoot = createTempWorkspace()
    tempDirs.push(repoRoot)
    fs.writeFileSync(path.join(repoRoot, "package.json"), "{}", "utf8")
    fs.mkdirSync(path.join(repoRoot, "src"), { recursive: true })
    fs.mkdirSync(path.join(repoRoot, "node_modules"), { recursive: true })
    fs.mkdirSync(path.join(repoRoot, ".git"), { recursive: true })
    fs.writeFileSync(path.join(repoRoot, "README.md"), "# Hello", "utf8")

    recordSessionFileActivity({
      sessionId: "session-2",
      currentIteration: 1,
      maxIterations: 1,
      steps: [{
        id: "tool-1",
        type: "tool_result",
        title: "Tool result",
        status: "completed",
        timestamp: Date.now(),
        toolResult: { success: true, content: JSON.stringify({ cwd: repoRoot }) },
      }],
      isComplete: false,
    })

    const listing = listTrackedSessionFiles({ sessionId: "session-2", rootPath: repoRoot, directoryPath: repoRoot })
    const entries = listing.entries
    expect(listing.truncated).toBe(false)
    expect(entries.map((entry) => entry.name)).toEqual(["src", "README.md", "package.json"])
  })

  it("caps large directory listings to keep File View responsive", () => {
    const repoRoot = createTempWorkspace()
    tempDirs.push(repoRoot)
    fs.writeFileSync(path.join(repoRoot, "package.json"), "{}", "utf8")

    for (let index = 0; index < 505; index += 1) {
      fs.writeFileSync(path.join(repoRoot, `file-${String(index).padStart(3, "0")}.txt`), "ok", "utf8")
    }

    recordSessionFileActivity({
      sessionId: "session-large-listing",
      currentIteration: 1,
      maxIterations: 1,
      steps: [{
        id: "tool-1",
        type: "tool_result",
        title: "Tool result",
        status: "completed",
        timestamp: Date.now(),
        toolResult: { success: true, content: JSON.stringify({ cwd: repoRoot }) },
      }],
      isComplete: false,
    })

    const listing = listTrackedSessionFiles({
      sessionId: "session-large-listing",
      rootPath: repoRoot,
      directoryPath: repoRoot,
    })

    expect(listing.entries).toHaveLength(listing.limit)
    expect(listing.totalEntries).toBe(506)
    expect(listing.truncated).toBe(true)
  })

  it("supports create, move, delete, and preview within tracked roots", () => {
    const repoRoot = createTempWorkspace()
    tempDirs.push(repoRoot)
    fs.writeFileSync(path.join(repoRoot, "package.json"), "{}", "utf8")

    recordSessionFileActivity({
      sessionId: "session-3",
      currentIteration: 1,
      maxIterations: 1,
      steps: [{
        id: "tool-1",
        type: "tool_result",
        title: "Tool result",
        status: "completed",
        timestamp: Date.now(),
        toolResult: { success: true, content: JSON.stringify({ cwd: repoRoot }) },
      }],
      isComplete: false,
    })

    const created = createTrackedSessionFileEntry({
      sessionId: "session-3",
      rootPath: repoRoot,
      targetPath: path.join(repoRoot, "notes", "todo.md"),
      kind: "file",
      content: "# Todo\n",
    })
    expect(created.relativePath).toBe("notes/todo.md")

    const moved = moveTrackedSessionFileEntry({
      sessionId: "session-3",
      rootPath: repoRoot,
      sourcePath: created.path,
      targetPath: path.join(repoRoot, "notes", "done.md"),
    })
    expect(moved.relativePath).toBe("notes/done.md")

    const preview = readTrackedSessionFilePreview({
      sessionId: "session-3",
      rootPath: repoRoot,
      filePath: moved.path,
    })
    expect(preview.kind).toBe("markdown")
    expect(preview.content).toContain("# Todo")

    deleteTrackedSessionFileEntry({
      sessionId: "session-3",
      rootPath: repoRoot,
      targetPath: moved.path,
    })
    expect(fs.existsSync(moved.path)).toBe(false)
  })

  it("rejects paths that escape the tracked workspace", () => {
    const repoRoot = createTempWorkspace()
    const outsideRoot = createTempWorkspace()
    tempDirs.push(repoRoot, outsideRoot)
    fs.writeFileSync(path.join(repoRoot, "package.json"), "{}", "utf8")

    recordSessionFileActivity({
      sessionId: "session-4",
      currentIteration: 1,
      maxIterations: 1,
      steps: [{
        id: "tool-1",
        type: "tool_result",
        title: "Tool result",
        status: "completed",
        timestamp: Date.now(),
        toolResult: { success: true, content: JSON.stringify({ cwd: repoRoot }) },
      }],
      isComplete: false,
    })

    expect(() => listTrackedSessionFiles({
      sessionId: "session-4",
      rootPath: repoRoot,
      directoryPath: outsideRoot,
    })).toThrow("outside the selected workspace")
  })
})
