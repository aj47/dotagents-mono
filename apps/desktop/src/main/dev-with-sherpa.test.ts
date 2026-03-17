import { describe, expect, it, vi, afterEach } from "vitest"

import {
  getDevCommand,
  getSignalExitCode,
  terminateChildProcessTree,
} from "../../scripts/dev-with-sherpa"

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

  it("falls back to child.kill on win32", () => {
    const child = { pid: 4321, kill: vi.fn(() => true) }

    const result = terminateChildProcessTree(child, "SIGINT", "win32")

    expect(result).toBe(true)
    expect(child.kill).toHaveBeenCalledWith("SIGINT")
  })

  it("maps signal exit codes consistently", () => {
    expect(getSignalExitCode("SIGINT")).toBe(130)
    expect(getSignalExitCode("SIGTERM")).toBe(143)
  })
})