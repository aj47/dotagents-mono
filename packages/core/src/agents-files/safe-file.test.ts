import { describe, it, expect } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"
import { safeReadJsonFileSync, safeWriteFileSync, safeWriteJsonFileSync } from "./safe-file"

describe("safe-file", () => {
  it("writes atomically and creates backups on overwrite", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-safe-file-"))
    const filePath = path.join(dir, "settings.json")
    const backupDir = path.join(dir, "backups")

    safeWriteFileSync(filePath, "one", { backupDir, maxBackups: 5 })
    expect(fs.readFileSync(filePath, "utf8")).toBe("one")

    safeWriteFileSync(filePath, "two", { backupDir, maxBackups: 5 })
    expect(fs.readFileSync(filePath, "utf8")).toBe("two")

    const backups = fs.readdirSync(backupDir).filter((f) => f.endsWith(".bak"))
    expect(backups.length).toBe(1)
    expect(fs.readFileSync(path.join(backupDir, backups[0]), "utf8")).toBe("one")
  })

  it("rotates backups", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-safe-file-"))
    const filePath = path.join(dir, "settings.json")
    const backupDir = path.join(dir, "backups")

    safeWriteFileSync(filePath, "v1", { backupDir, maxBackups: 1 })
    safeWriteFileSync(filePath, "v2", { backupDir, maxBackups: 1 })
    safeWriteFileSync(filePath, "v3", { backupDir, maxBackups: 1 })

    const backups = fs.readdirSync(backupDir).filter((f) => f.endsWith(".bak"))
    expect(backups.length).toBe(1)
  })

  it("skips write when skipIfUnchanged is set and content already matches", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-safe-file-"))
    const filePath = path.join(dir, "settings.json")
    const backupDir = path.join(dir, "backups")

    safeWriteFileSync(filePath, "same", { backupDir, maxBackups: 5 })
    const mtimeBefore = fs.statSync(filePath).mtimeMs

    // Ensure enough time has passed for mtime resolution on all filesystems.
    const waitUntil = Date.now() + 20
    while (Date.now() < waitUntil) { /* spin */ }

    safeWriteFileSync(filePath, "same", { backupDir, maxBackups: 5, skipIfUnchanged: true })
    const mtimeAfter = fs.statSync(filePath).mtimeMs
    expect(mtimeAfter).toBe(mtimeBefore)

    // No backup should have been rotated for a no-op write.
    const backups = fs.existsSync(backupDir)
      ? fs.readdirSync(backupDir).filter((f) => f.endsWith(".bak"))
      : []
    expect(backups.length).toBe(0)
  })

  it("still writes when skipIfUnchanged is set but content differs", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-safe-file-"))
    const filePath = path.join(dir, "settings.json")
    const backupDir = path.join(dir, "backups")

    safeWriteFileSync(filePath, "one", { backupDir, maxBackups: 5 })
    safeWriteFileSync(filePath, "two", { backupDir, maxBackups: 5, skipIfUnchanged: true })

    expect(fs.readFileSync(filePath, "utf8")).toBe("two")
    const backups = fs.readdirSync(backupDir).filter((f) => f.endsWith(".bak"))
    expect(backups.length).toBe(1)
  })

  it("does not overwrite a user-edited file when in-memory value matches the edit", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-safe-file-"))
    const filePath = path.join(dir, "system-prompt.md")
    const backupDir = path.join(dir, "backups")

    // App writes the initial value.
    safeWriteFileSync(filePath, "user edits this", { backupDir, maxBackups: 5 })

    // Simulate the user editing the file via another editor (same bytes,
    // different mtime) — this is the regression scenario for the .agents
    // overwrite bug. A subsequent save from an in-memory value that already
    // matches must be a no-op.
    const mtimeBefore = fs.statSync(filePath).mtimeMs
    const waitUntil = Date.now() + 20
    while (Date.now() < waitUntil) { /* spin */ }
    safeWriteFileSync(filePath, "user edits this", {
      backupDir,
      maxBackups: 5,
      skipIfUnchanged: true,
    })

    expect(fs.statSync(filePath).mtimeMs).toBe(mtimeBefore)
  })

  it("recovers corrupted JSON from latest backup", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-safe-file-"))
    const filePath = path.join(dir, "data.json")
    const backupDir = path.join(dir, "backups")

    safeWriteJsonFileSync(filePath, { a: 1 }, { backupDir, maxBackups: 5 })
    safeWriteJsonFileSync(filePath, { a: 2 }, { backupDir, maxBackups: 5 })
    fs.writeFileSync(filePath, "{not json", "utf8")

    const recovered = safeReadJsonFileSync<{ a: number }>(filePath, { backupDir, defaultValue: { a: 0 } })
    expect(recovered).toEqual({ a: 1 })

    // File should be restored to valid JSON too
    expect(JSON.parse(fs.readFileSync(filePath, "utf8"))).toEqual({ a: 1 })
  })
})
