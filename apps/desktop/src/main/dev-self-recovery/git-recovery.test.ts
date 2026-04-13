import { spawnSync } from "child_process"
import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createGitDevSelfRecovery } from "./git-recovery"

const hasGit = spawnSync("git", ["--version"], { stdio: "ignore" }).status === 0
const testIfGit = hasGit ? it : it.skip
const silentLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

let tempDirs: string[] = []

function git(repo: string, args: string[]): string {
  const result = spawnSync("git", args, { cwd: repo, encoding: "utf8" })
  expect(result.status, result.stderr).toBe(0)
  return result.stdout
}

function writeFile(repo: string, relativePath: string, content: string): void {
  const filePath = path.join(repo, relativePath)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, "utf8")
}

function createRepo(): string {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-git-recovery-"))
  tempDirs.push(repo)
  git(repo, ["init"])
  git(repo, ["config", "user.email", "test@example.com"])
  git(repo, ["config", "user.name", "Test User"])
  writeFile(repo, "tracked.txt", "initial\n")
  git(repo, ["add", "tracked.txt"])
  git(repo, ["commit", "-m", "initial"])
  return repo
}

function status(repo: string): string {
  return git(repo, ["status", "--porcelain=v1"])
}

afterEach(() => {
  vi.clearAllMocks()
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
  tempDirs = []
})

describe("git dev self-recovery", () => {
  testIfGit("arms from a clean repo and recovers dirty tracked changes to HEAD", () => {
    const repo = createRepo()
    const controller = createGitDevSelfRecovery({ repoRoot: repo, logger: silentLogger })

    expect(controller.refreshCleanBaseline()).toBe(true)
    writeFile(repo, "tracked.txt", "dirty\n")

    expect(controller.hasRecoverableChanges()).toBe(true)
    const result = controller.maybeRecover("tracked-change")

    expect(result.recovered).toBe(true)
    if (!result.recovered) throw new Error("expected recovery to succeed")
    expect(fs.readFileSync(path.join(repo, "tracked.txt"), "utf8")).toBe("initial\n")
    expect(status(repo)).toBe("")
    expect(fs.existsSync(path.join(result.backupDir, "tracked-head.patch"))).toBe(true)
  })

  testIfGit("backs up staged and unstaged tracked changes before resetting", () => {
    const repo = createRepo()
    const controller = createGitDevSelfRecovery({ repoRoot: repo, logger: silentLogger })

    expect(controller.refreshCleanBaseline()).toBe(true)
    writeFile(repo, "tracked.txt", "staged\n")
    git(repo, ["add", "tracked.txt"])
    writeFile(repo, "tracked.txt", "unstaged\n")

    const result = controller.maybeRecover("staged-and-unstaged")

    expect(result.recovered).toBe(true)
    if (!result.recovered) throw new Error("expected recovery to succeed")
    expect(fs.readFileSync(path.join(result.backupDir, "tracked-index.patch"), "utf8")).toContain("staged")
    expect(fs.readFileSync(path.join(result.backupDir, "tracked-worktree.patch"), "utf8")).toContain("unstaged")
    expect(fs.readFileSync(path.join(repo, "tracked.txt"), "utf8")).toBe("initial\n")
    expect(status(repo)).toBe("")
  })

  testIfGit("copies untracked files into the backup and removes them with git clean -fd", () => {
    const repo = createRepo()
    const controller = createGitDevSelfRecovery({ repoRoot: repo, logger: silentLogger })

    expect(controller.refreshCleanBaseline()).toBe(true)
    writeFile(repo, "nested/new.txt", "untracked\n")

    const result = controller.maybeRecover("untracked-file")

    expect(result.recovered).toBe(true)
    if (!result.recovered) throw new Error("expected recovery to succeed")
    expect(fs.existsSync(path.join(repo, "nested/new.txt"))).toBe(false)
    expect(fs.readFileSync(path.join(result.backupDir, "untracked", "nested/new.txt"), "utf8")).toBe("untracked\n")
    expect(fs.readFileSync(path.join(result.backupDir, "untracked-files.txt"), "utf8")).toContain("nested/new.txt")
  })

  testIfGit("preserves ignored files because recovery does not use git clean -x", () => {
    const repo = createRepo()
    writeFile(repo, ".gitignore", "ignored.tmp\n")
    git(repo, ["add", ".gitignore"])
    git(repo, ["commit", "-m", "ignore ignored tmp"])

    const controller = createGitDevSelfRecovery({ repoRoot: repo, logger: silentLogger })
    expect(controller.refreshCleanBaseline()).toBe(true)
    writeFile(repo, "tracked.txt", "dirty\n")
    writeFile(repo, "ignored.tmp", "keep me\n")

    const result = controller.maybeRecover("ignored-file")

    expect(result.recovered).toBe(true)
    expect(fs.readFileSync(path.join(repo, "tracked.txt"), "utf8")).toBe("initial\n")
    expect(fs.readFileSync(path.join(repo, "ignored.tmp"), "utf8")).toBe("keep me\n")
    expect(status(repo)).toBe("")
  })

  testIfGit("aborts before reset and clean when backup creation fails", () => {
    const repo = createRepo()
    const controller = createGitDevSelfRecovery({
      repoRoot: repo,
      logger: silentLogger,
      copyFile: () => {
        throw new Error("copy failed")
      },
    })

    expect(controller.refreshCleanBaseline()).toBe(true)
    writeFile(repo, "tracked.txt", "dirty\n")
    writeFile(repo, "new.txt", "untracked\n")

    const result = controller.maybeRecover("backup-failure")

    expect(result).toMatchObject({ recovered: false, reason: "backup-failed" })
    expect(fs.readFileSync(path.join(repo, "tracked.txt"), "utf8")).toBe("dirty\n")
    expect(fs.existsSync(path.join(repo, "new.txt"))).toBe(true)
  })

  testIfGit("skips recovery when the recovery lock file already exists", () => {
    const repo = createRepo()
    const controller = createGitDevSelfRecovery({ repoRoot: repo, logger: silentLogger })

    expect(controller.refreshCleanBaseline()).toBe(true)
    writeFile(repo, "tracked.txt", "dirty\n")
    fs.mkdirSync(path.join(repo, ".git", "dotagents-dev-recovery"), { recursive: true })
    fs.writeFileSync(path.join(repo, ".git", "dotagents-dev-recovery", ".lock"), "locked")

    const result = controller.maybeRecover("locked")

    expect(result).toEqual({ recovered: false, reason: "locked" })
    expect(fs.readFileSync(path.join(repo, "tracked.txt"), "utf8")).toBe("dirty\n")
  })

  testIfGit("does not recover a dirty tree until a clean baseline has been observed", () => {
    const repo = createRepo()
    writeFile(repo, "tracked.txt", "dirty-at-start\n")
    const controller = createGitDevSelfRecovery({ repoRoot: repo, logger: silentLogger })

    expect(controller.refreshCleanBaseline()).toBe(false)
    expect(controller.hasRecoverableChanges()).toBe(false)
    expect(controller.maybeRecover("dirty-at-start")).toEqual({ recovered: false, reason: "unarmed" })
    expect(fs.readFileSync(path.join(repo, "tracked.txt"), "utf8")).toBe("dirty-at-start\n")
  })
})