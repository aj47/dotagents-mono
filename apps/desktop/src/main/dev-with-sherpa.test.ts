import * as path from "path"
import { pathToFileURL } from "url"
import { describe, expect, it, vi, afterEach } from "vitest"

import {
  buildDevEnvironment,
  getDevCommand,
  getSharedWatchCommand,
  getSignalExitCode,
  isDirectExecution,
  terminateChildProcessTree,
} from "../../scripts/dev-with-sherpa"
import { shouldRecoverFromChildClose } from "./dev-self-recovery/git-recovery"

describe("dev-with-sherpa launcher helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("builds the desktop dev command through pnpm exec", () => {
    const result = getDevCommand(["--debug-app"])

    expect(result.command === "pnpm" || result.command === "pnpm.cmd").toBe(true)
    expect(result.args).toEqual([
      "exec",
      "electron-vite",
      "dev",
      "--watch",
      "--",
      "--debug-app",
    ])
  })

  it("builds the shared watch command through pnpm filter", () => {
    const result = getSharedWatchCommand()

    expect(result.command === "pnpm" || result.command === "pnpm.cmd").toBe(true)
    expect(result.args).toEqual(["--filter", "@dotagents/shared", "dev"])
    expect(result.cwd).toContain("dotagents-mono")
  })

  it("builds the always-on dev self-recovery environment", () => {
    const env = buildDevEnvironment({ PATH: "/usr/bin" }, [])

    expect(env.PATH).toBe("/usr/bin")
    expect(env.DOTAGENTS_DEV_SELF_RECOVERY).toBe("1")
    expect(env.DOTAGENTS_DEV_SELF_RECOVERY_REPO_ROOT).toContain("dotagents-mono")
  })

  it("preserves existing env while adding debug launch args", () => {
    const env = buildDevEnvironment({ ELECTRON_EXTRA_LAUNCH_ARGS: "--foo" }, ["--debug-app"])

    expect(env.REMOTE_DEBUGGING_PORT).toBe("9333")
    expect(env.ELECTRON_EXTRA_LAUNCH_ARGS).toBe("--foo --inspect=9339")
  })

  it("only recovers from nonzero child exits without shutdown or signal-only exits", () => {
    expect(shouldRecoverFromChildClose({ code: 1, signal: null, shutdownSignal: null })).toBe(true)
    expect(shouldRecoverFromChildClose({ code: 0, signal: null, shutdownSignal: null })).toBe(false)
    expect(shouldRecoverFromChildClose({ code: null, signal: "SIGTERM", shutdownSignal: null })).toBe(false)
    expect(shouldRecoverFromChildClose({ code: 1, signal: null, shutdownSignal: "SIGINT" })).toBe(false)
  })

  it("detects direct execution when argv[1] is a relative script path", () => {
    const cwd = path.join("/repo", "apps", "desktop")
    const metaUrl = pathToFileURL(path.join(cwd, "scripts", "dev-with-sherpa.ts")).href

    expect(isDirectExecution(["node", "scripts/dev-with-sherpa.ts"], metaUrl, cwd)).toBe(true)
  })

  it("detects direct execution when a wrapper passes the script path later in argv", () => {
    const cwd = path.join("/repo", "apps", "desktop")
    const metaUrl = pathToFileURL(path.join(cwd, "scripts", "dev-with-sherpa.ts")).href

    expect(
      isDirectExecution(
        ["node", path.join(cwd, "node_modules", ".bin", "tsx"), "scripts/dev-with-sherpa.ts"],
        metaUrl,
        cwd,
      ),
    ).toBe(true)
  })

  it("tolerates wrapper or compiled entries that preserve the script basename", () => {
    const cwd = path.join("/repo", "apps", "desktop")
    const metaUrl = pathToFileURL(path.join(cwd, "scripts", "dev-with-sherpa.ts")).href

    expect(
      isDirectExecution(["node", path.join(cwd, "dist", "dev-with-sherpa.js")], metaUrl, cwd),
    ).toBe(true)
  })

  it("ignores malformed argv entries instead of throwing", () => {
    const cwd = path.join("/repo", "apps", "desktop")
    const metaUrl = pathToFileURL(path.join(cwd, "scripts", "dev-with-sherpa.ts")).href

    expect(isDirectExecution(["node", "file://%zz"], metaUrl, cwd)).toBe(false)
  })

  it("kills the whole unix child process group", () => {
    const killSpy = vi.spyOn(process, "kill").mockImplementation(() => true)
    const child = { pid: 4321, kill: vi.fn(() => true) }

    const result = terminateChildProcessTree(child, "SIGTERM", "darwin")

    expect(result).toBe(true)
    expect(killSpy).toHaveBeenCalledWith(-4321, "SIGTERM")
    expect(child.kill).not.toHaveBeenCalled()
  })

  it("returns false when the unix child process group is already gone", () => {
    vi.spyOn(process, "kill").mockImplementation(() => {
      const error = new Error("missing") as NodeJS.ErrnoException
      error.code = "ESRCH"
      throw error
    })

    const child = { pid: 4321, kill: vi.fn(() => true) }

    expect(terminateChildProcessTree(child, "SIGTERM", "darwin")).toBe(false)
    expect(child.kill).not.toHaveBeenCalled()
  })

  it("uses taskkill to terminate the full win32 child process tree", () => {
    const child = { pid: 4321, kill: vi.fn(() => true) }
    const terminateWindowsProcessTree = vi.fn(() => ({ status: 0 }))

    const result = terminateChildProcessTree(
      child,
      "SIGINT",
      "win32",
      terminateWindowsProcessTree,
    )

    expect(result).toBe(true)
    expect(terminateWindowsProcessTree).toHaveBeenCalledWith(4321)
    expect(child.kill).not.toHaveBeenCalled()
  })

  it("falls back to child.kill on win32 when taskkill is unavailable", () => {
    const child = { pid: 4321, kill: vi.fn(() => true) }
    const terminateWindowsProcessTree = vi.fn(() => {
      const error = new Error("missing taskkill") as NodeJS.ErrnoException
      error.code = "ENOENT"

      return { status: null, error }
    })

    const result = terminateChildProcessTree(
      child,
      "SIGTERM",
      "win32",
      terminateWindowsProcessTree,
    )

    expect(result).toBe(true)
    expect(terminateWindowsProcessTree).toHaveBeenCalledWith(4321)
    expect(child.kill).toHaveBeenCalledWith("SIGTERM")
  })

  it("returns false on win32 when taskkill fails for another reason", () => {
    const child = { pid: 4321, kill: vi.fn(() => true) }
    const terminateWindowsProcessTree = vi.fn(() => ({ status: 1 }))

    const result = terminateChildProcessTree(
      child,
      "SIGTERM",
      "win32",
      terminateWindowsProcessTree,
    )

    expect(result).toBe(false)
    expect(terminateWindowsProcessTree).toHaveBeenCalledWith(4321)
    expect(child.kill).not.toHaveBeenCalled()
  })

  it("maps signal exit codes consistently", () => {
    expect(getSignalExitCode("SIGINT")).toBe(130)
    expect(getSignalExitCode("SIGTERM")).toBe(143)
  })
})