import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("rtk helpers", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    delete process.env.DOTAGENTS_RTK
    delete process.env.DOTAGENTS_RTK_BINARY
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("is disabled by default and leaves commands unchanged", async () => {
    const { maybeWrapWithRtk } = await import("./rtk")
    const result = await maybeWrapWithRtk("git status")
    expect(result).toEqual({ command: "git status", wrapped: false })
  })

  it("recognizes truthy values of DOTAGENTS_RTK", async () => {
    const { isRtkEnabled } = await import("./rtk")
    for (const value of ["1", "true", "TRUE", "yes", "on"]) {
      process.env.DOTAGENTS_RTK = value
      expect(isRtkEnabled()).toBe(true)
    }
    process.env.DOTAGENTS_RTK = "0"
    expect(isRtkEnabled()).toBe(false)
    delete process.env.DOTAGENTS_RTK
    expect(isRtkEnabled()).toBe(false)
  })

  it("refuses to wrap commands with shell metacharacters or pipelines", async () => {
    const { shouldWrapWithRtk } = await import("./rtk")
    expect(shouldWrapWithRtk("git status")).toBe(true)
    expect(shouldWrapWithRtk("pnpm test")).toBe(true)
    expect(shouldWrapWithRtk("cargo build --release")).toBe(true)

    expect(shouldWrapWithRtk("git status | grep modified")).toBe(false)
    expect(shouldWrapWithRtk("pnpm test && pnpm build")).toBe(false)
    expect(shouldWrapWithRtk("echo hi > out.txt")).toBe(false)
    expect(shouldWrapWithRtk("FOO=bar pnpm test")).toBe(false)
    expect(shouldWrapWithRtk("$(echo pnpm) test")).toBe(false)
    expect(shouldWrapWithRtk("")).toBe(false)
  })

  it("skips destructive and interactive commands", async () => {
    const { shouldWrapWithRtk } = await import("./rtk")
    for (const cmd of [
      "rm -rf node_modules",
      "sudo apt install foo",
      "docker ps",
      "ssh user@host",
      "vim README.md",
      "less file.log",
      "cd apps/desktop",
      "git push origin main",
      "git reset --hard HEAD",
      "rtk git status",
    ]) {
      expect(shouldWrapWithRtk(cmd), `should not wrap: ${cmd}`).toBe(false)
    }
  })

  it("uses the configured binary name when wrapping", async () => {
    process.env.DOTAGENTS_RTK = "1"
    process.env.DOTAGENTS_RTK_BINARY = "/opt/rtk/bin/rtk"

    vi.doMock("child_process", () => ({
      exec: (_cmd: string, _opts: unknown, cb: (err: Error | null) => void) => cb(null),
    }))

    const { maybeWrapWithRtk, resetRtkAvailabilityCache } = await import("./rtk")
    resetRtkAvailabilityCache()
    const result = await maybeWrapWithRtk("git status")
    expect(result).toEqual({ command: "/opt/rtk/bin/rtk git status", wrapped: true })
  })

  it("silently skips wrapping when the rtk binary is not on PATH", async () => {
    process.env.DOTAGENTS_RTK = "1"

    vi.doMock("child_process", () => ({
      exec: (_cmd: string, _opts: unknown, cb: (err: Error | null) => void) =>
        cb(new Error("not found")),
    }))

    const { maybeWrapWithRtk, resetRtkAvailabilityCache } = await import("./rtk")
    resetRtkAvailabilityCache()
    const result = await maybeWrapWithRtk("git status")
    expect(result).toEqual({ command: "git status", wrapped: false })
  })
})
