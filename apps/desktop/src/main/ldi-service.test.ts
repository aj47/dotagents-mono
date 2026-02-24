import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock electron
vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => "/tmp"),
  },
}))

// Mock child_process.execFile used by LdiClient
const mockExecFile = vi.fn()
vi.mock("child_process", () => ({
  execFile: (...args: unknown[]) => mockExecFile(...args),
}))

// Mock fs/promises.access used by LdiClient.verifyScript
vi.mock("fs/promises", () => ({
  access: vi.fn().mockResolvedValue(undefined),
}))

describe("LdiService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe("LdiClient", () => {
    it("should parse a successful start result", async () => {
      mockExecFile.mockImplementation(
        (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
          cb(
            null,
            [
              "[ldi:default] Browser:    google-chrome",
              "[ldi:default] URL:        http://localhost:5173",
              "[ldi:default] Resolution: 1920x1080",
              "[ldi:default] Launched (PID 12345)",
              "[ldi:default] Window found: 0x04800003",
              "[ldi:default] Desktop backdrop active (window 0x04800003)",
            ].join("\n"),
            "",
          )
        },
      )

      const { LdiClient } = await import("@dotagents/ldi")
      const client = new LdiClient({ scriptPath: "/usr/bin/ldi" })
      const result = await client.start("http://localhost:5173")

      expect(result.success).toBe(true)
      expect(result.slot).toBe("default")
      expect(result.pid).toBe(12345)
      expect(result.windowId).toBe("0x04800003")
    })

    it("should parse a failed start result", async () => {
      mockExecFile.mockImplementation(
        (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
          cb(new Error("exit code 1"), "", "ERROR: No Chrome/Chromium browser found.")
        },
      )

      const { LdiClient } = await import("@dotagents/ldi")
      const client = new LdiClient({ scriptPath: "/usr/bin/ldi" })
      const result = await client.start("http://localhost:5173")

      expect(result.success).toBe(false)
      expect(result.error).toContain("No Chrome/Chromium browser found")
    })

    it("should pass correct args for start with options", async () => {
      mockExecFile.mockImplementation(
        (cmd: string, args: string[], _opts: unknown, cb: Function) => {
          cb(null, "[ldi:myslot] Launched (PID 99)", "")
        },
      )

      const { LdiClient } = await import("@dotagents/ldi")
      const client = new LdiClient({ scriptPath: "/usr/bin/ldi" })
      await client.start("http://example.com", {
        slot: "myslot",
        settle: 2,
        browser: "chromium",
      })

      expect(mockExecFile).toHaveBeenCalledWith(
        "/usr/bin/ldi",
        ["start", "http://example.com", "--slot", "myslot", "--settle", "2", "--browser", "chromium"],
        expect.any(Object),
        expect.any(Function),
      )
    })

    it("should parse stop result", async () => {
      mockExecFile.mockImplementation(
        (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
          cb(null, "[ldi:default] Stopped", "")
        },
      )

      const { LdiClient } = await import("@dotagents/ldi")
      const client = new LdiClient({ scriptPath: "/usr/bin/ldi" })
      const result = await client.stop()

      expect(result.success).toBe(true)
      expect(result.slot).toBe("default")
    })

    it("should parse status for a running slot", async () => {
      mockExecFile.mockImplementation(
        (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
          cb(
            null,
            [
              "[ldi:default] Running (PID 12345)",
              "[ldi:default] URL: http://localhost:5173",
              "[ldi:default] Window: 0x04800003",
            ].join("\n"),
            "",
          )
        },
      )

      const { LdiClient } = await import("@dotagents/ldi")
      const client = new LdiClient({ scriptPath: "/usr/bin/ldi" })
      const status = await client.status()

      expect(status.running).toBe(true)
      expect(status.pid).toBe(12345)
      expect(status.url).toBe("http://localhost:5173")
      expect(status.windowId).toBe("0x04800003")
    })

    it("should handle status for a stopped slot", async () => {
      mockExecFile.mockImplementation(
        (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
          cb(new Error("exit code 1"), "[ldi:default] Not running", "")
        },
      )

      const { LdiClient } = await import("@dotagents/ldi")
      const client = new LdiClient({ scriptPath: "/usr/bin/ldi" })
      const status = await client.status()

      expect(status.running).toBe(false)
      expect(status.slot).toBe("default")
    })

    it("should parse slot list", async () => {
      mockExecFile.mockImplementation(
        (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
          cb(
            null,
            [
              "  default         running    http://localhost:5173",
              "  shader          stopped    https://shadertoy.com/embed/XsXXDn",
            ].join("\n"),
            "",
          )
        },
      )

      const { LdiClient } = await import("@dotagents/ldi")
      const client = new LdiClient({ scriptPath: "/usr/bin/ldi" })
      const slots = await client.list()

      expect(slots).toHaveLength(2)
      expect(slots[0]).toEqual({
        slot: "default",
        status: "running",
        url: "http://localhost:5173",
      })
      expect(slots[1]).toEqual({
        slot: "shader",
        status: "stopped",
        url: "https://shadertoy.com/embed/XsXXDn",
      })
    })

    it("should handle empty slot list", async () => {
      mockExecFile.mockImplementation(
        (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
          cb(null, "No slots found", "")
        },
      )

      const { LdiClient } = await import("@dotagents/ldi")
      const client = new LdiClient({ scriptPath: "/usr/bin/ldi" })
      const slots = await client.list()

      expect(slots).toHaveLength(0)
    })
  })

  describe("platform detection", () => {
    it("should report unsupported on non-linux", async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, "platform", { value: "darwin" })

      const { checkPlatform } = await import("@dotagents/ldi")
      const result = await checkPlatform()

      expect(result.supported).toBe(false)
      expect(result.reason).toContain("Linux")

      Object.defineProperty(process, "platform", { value: originalPlatform })
    })
  })

  describe("service singleton", () => {
    it("should initialize idempotently", async () => {
      // Mock platform check (execFile for `which` calls)
      let callCount = 0
      mockExecFile.mockImplementation(
        (_cmd: string, _args: string[], _opts: unknown, cb?: Function) => {
          callCount++
          // which calls: simulate all deps found
          if (typeof _opts === "function") {
            _opts(null, "/usr/bin/mock", "")
          } else if (cb) {
            cb(null, "/usr/bin/mock", "")
          }
        },
      )

      const { ldiService } = await import("./ldi-service")

      await ldiService.initialize()
      const firstCount = callCount
      await ldiService.initialize()

      // Second initialize should not make additional exec calls
      expect(callCount).toBe(firstCount)
    })

    it("should return not-supported before initialization", async () => {
      const { ldiService } = await import("./ldi-service")
      const check = ldiService.isSupported()

      expect(check.supported).toBe(false)
      expect(check.reason).toContain("not yet initialized")
    })
  })
})
