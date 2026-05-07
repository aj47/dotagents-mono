import os from "node:os"
import path from "node:path"
import { mkdtemp, rm, readFile, writeFile, mkdir } from "node:fs/promises"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  appendCommandLogEntry,
  readCommandLog,
  getCommandLogPath,
  setCommandLogDirForTesting,
  type CommandLogEntry,
} from "./command-log-service"

let tempDir: string

function makeEntry(overrides: Partial<CommandLogEntry> = {}): CommandLogEntry {
  return {
    sessionId: "session-1",
    command: "echo hi",
    cwd: "/tmp",
    startedAt: new Date(0).toISOString(),
    durationMs: 12,
    exitCode: 0,
    timedOut: false,
    stdout: "hi\n",
    stderr: "",
    ...overrides,
  }
}

describe("command-log-service", () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "dotagents-cmdlog-"))
    setCommandLogDirForTesting(tempDir)
  })

  afterEach(async () => {
    setCommandLogDirForTesting(null)
    await rm(tempDir, { recursive: true, force: true })
  })

  it("writes one JSON line per entry and round-trips through readCommandLog", async () => {
    const path1 = await appendCommandLogEntry(makeEntry())
    const path2 = await appendCommandLogEntry(makeEntry({
      command: "ls",
      stdout: "a\nb\n",
      durationMs: 34,
    }))

    expect(path1).toBeTruthy()
    expect(path2).toBe(path1)

    const raw = await readFile(path1!, "utf8")
    const lines = raw.split("\n").filter(Boolean)
    expect(lines).toHaveLength(2)
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow()
    }

    const entries = await readCommandLog("session-1")
    expect(entries.map((e) => e.command)).toEqual(["echo hi", "ls"])
    expect(entries[1].durationMs).toBe(34)
  })

  it("isolates logs per session and sanitizes session IDs that contain path separators", async () => {
    await appendCommandLogEntry(makeEntry({ sessionId: "session-a", command: "a" }))
    await appendCommandLogEntry(makeEntry({ sessionId: "session-b", command: "b" }))
    await appendCommandLogEntry(makeEntry({ sessionId: "../escape/attempt", command: "c" }))

    const sessionA = await readCommandLog("session-a")
    const sessionB = await readCommandLog("session-b")
    const escape = await readCommandLog("../escape/attempt")

    expect(sessionA.map((e) => e.command)).toEqual(["a"])
    expect(sessionB.map((e) => e.command)).toEqual(["b"])
    expect(escape.map((e) => e.command)).toEqual(["c"])

    const escapePath = await getCommandLogPath("../escape/attempt")
    expect(escapePath).toBeTruthy()
    // Sanitization must keep the file inside the configured logs dir, no
    // matter what characters appear in the session ID.
    const resolved = path.resolve(escapePath!)
    expect(resolved.startsWith(path.resolve(tempDir) + path.sep)).toBe(true)
    expect(path.dirname(resolved)).toBe(path.resolve(tempDir))
  })

  it("returns null and skips writing when no sessionId is present", async () => {
    const result = await appendCommandLogEntry(makeEntry({ sessionId: "" }))
    expect(result).toBeNull()
  })

  it("readCommandLog skips malformed lines instead of throwing", async () => {
    await appendCommandLogEntry(makeEntry({ command: "valid" }))

    const filePath = (await getCommandLogPath("session-1"))!
    await mkdir(path.dirname(filePath), { recursive: true })
    // Append a junk line followed by another valid entry.
    await writeFile(
      filePath,
      (await readFile(filePath, "utf8")) +
        "this is not json\n" +
        JSON.stringify(makeEntry({ command: "after-junk" })) +
        "\n",
      "utf8",
    )

    const entries = await readCommandLog("session-1")
    expect(entries.map((e) => e.command)).toEqual(["valid", "after-junk"])
  })
})
