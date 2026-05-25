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

  it("is enabled by default; falsy values disable it", async () => {
    const { isRtkEnabled } = await import("./rtk")
    expect(isRtkEnabled()).toBe(true)
    for (const value of ["0", "false", "FALSE", "no", "off", ""]) {
      process.env.DOTAGENTS_RTK = value
      expect(isRtkEnabled(), `value ${JSON.stringify(value)} should disable`).toBe(false)
    }
    for (const value of ["1", "true", "yes", "on", "anything-else"]) {
      process.env.DOTAGENTS_RTK = value
      expect(isRtkEnabled(), `value ${JSON.stringify(value)} should enable`).toBe(true)
    }
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

  it("resolves the bundled binary path inside the app resources", async () => {
    const { getRtkBinary } = await import("./rtk")
    const resolved = getRtkBinary()
    expect(resolved.replace(/\\/g, "/")).toContain("resources/bin/rtk")
  })

  it("honours DOTAGENTS_RTK_BINARY override", async () => {
    process.env.DOTAGENTS_RTK_BINARY = "/opt/rtk/bin/rtk"
    const { getRtkBinary } = await import("./rtk")
    expect(getRtkBinary()).toBe("/opt/rtk/bin/rtk")
  })

  it("uses the configured binary when wrapping and the file exists", async () => {
    process.env.DOTAGENTS_RTK_BINARY = "/opt/rtk/bin/rtk"

    vi.doMock("fs", async () => {
      const actual = await vi.importActual<typeof import("fs")>("fs")
      return { ...actual, existsSync: (p: string) => p === "/opt/rtk/bin/rtk" }
    })

    const { maybeWrapWithRtk, resetRtkAvailabilityCache } = await import("./rtk")
    resetRtkAvailabilityCache()
    const result = await maybeWrapWithRtk("git status")
    expect(result).toEqual({ command: "/opt/rtk/bin/rtk git status", wrapped: true })
  })

  it("silently skips wrapping when the bundled binary is missing and PATH lookup fails", async () => {
    process.env.DOTAGENTS_RTK_BINARY = "rtk"

    vi.doMock("fs", async () => {
      const actual = await vi.importActual<typeof import("fs")>("fs")
      return { ...actual, existsSync: () => false }
    })
    vi.doMock("child_process", () => ({
      exec: (_cmd: string, _opts: unknown, cb: (err: Error | null) => void) =>
        cb(new Error("not found")),
    }))

    const { maybeWrapWithRtk, resetRtkAvailabilityCache } = await import("./rtk")
    resetRtkAvailabilityCache()
    const result = await maybeWrapWithRtk("git status")
    expect(result).toEqual({ command: "git status", wrapped: false })
  })

  it("skips wrapping when DOTAGENTS_RTK is explicitly disabled", async () => {
    process.env.DOTAGENTS_RTK = "0"
    const { maybeWrapWithRtk } = await import("./rtk")
    const result = await maybeWrapWithRtk("git status")
    expect(result).toEqual({ command: "git status", wrapped: false })
  })
})
