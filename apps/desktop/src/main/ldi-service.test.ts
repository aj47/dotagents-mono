import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock electron
vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => "/tmp"),
  },
}))

// Mock child_process (execFile for Linux, spawn + execFile for macOS/Windows)
const mockExecFile = vi.fn()
const mockSpawn = vi.fn()
vi.mock("child_process", () => ({
  execFile: (...args: unknown[]) => mockExecFile(...args),
  spawn: (...args: unknown[]) => mockSpawn(...args),
}))

// Mock fs/promises.access used by LdiClient.verifyScript
vi.mock("fs/promises", () => ({
  access: vi.fn().mockResolvedValue(undefined),
}))

// Mock fs used by MacOSBackend and WindowsBackend
const mockExistsSync = vi.fn(() => false)
const mockMkdirSync = vi.fn()
const mockWriteFileSync = vi.fn()
const mockReadFileSync = vi.fn(() => "")
const mockUnlinkSync = vi.fn()
const mockReaddirSync = vi.fn(() => [])
const mockOpenSync = vi.fn(() => 99)
const mockCloseSync = vi.fn()
vi.mock("fs", () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  unlinkSync: (...args: unknown[]) => mockUnlinkSync(...args),
  readdirSync: (...args: unknown[]) => mockReaddirSync(...args),
  openSync: (...args: unknown[]) => mockOpenSync(...args),
  closeSync: (...args: unknown[]) => mockCloseSync(...args),
}))

describe("LdiService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe("LinuxX11Backend", () => {
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

      const { LinuxX11Backend } = await import("@dotagents/ldi")
      const backend = new LinuxX11Backend({ scriptPath: "/usr/bin/ldi" })
      const result = await backend.start("http://localhost:5173")

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

      const { LinuxX11Backend } = await import("@dotagents/ldi")
      const backend = new LinuxX11Backend({ scriptPath: "/usr/bin/ldi" })
      const result = await backend.start("http://localhost:5173")

      expect(result.success).toBe(false)
      expect(result.error).toContain("No Chrome/Chromium browser found")
    })

    it("should pass correct args for start with options", async () => {
      mockExecFile.mockImplementation(
        (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
          cb(null, "[ldi:myslot] Launched (PID 99)", "")
        },
      )

      const { LinuxX11Backend } = await import("@dotagents/ldi")
      const backend = new LinuxX11Backend({ scriptPath: "/usr/bin/ldi" })
      await backend.start("http://example.com", {
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

      const { LinuxX11Backend } = await import("@dotagents/ldi")
      const backend = new LinuxX11Backend({ scriptPath: "/usr/bin/ldi" })
      const result = await backend.stop()

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

      const { LinuxX11Backend } = await import("@dotagents/ldi")
      const backend = new LinuxX11Backend({ scriptPath: "/usr/bin/ldi" })
      const status = await backend.status()

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

      const { LinuxX11Backend } = await import("@dotagents/ldi")
      const backend = new LinuxX11Backend({ scriptPath: "/usr/bin/ldi" })
      const status = await backend.status()

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

      const { LinuxX11Backend } = await import("@dotagents/ldi")
      const backend = new LinuxX11Backend({ scriptPath: "/usr/bin/ldi" })
      const slots = await backend.list()

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

      const { LinuxX11Backend } = await import("@dotagents/ldi")
      const backend = new LinuxX11Backend({ scriptPath: "/usr/bin/ldi" })
      const slots = await backend.list()

      expect(slots).toHaveLength(0)
    })
  })

  describe("MacOSBackend", () => {
    it("should report unsupported on non-darwin", async () => {
      const { MacOSBackend } = await import("@dotagents/ldi")
      const backend = new MacOSBackend()
      const check = await backend.checkDependencies()

      expect(check.supported).toBe(false)
      expect(check.reason).toContain("darwin")
    })

    it("should report missing browser when none found on darwin", async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, "platform", { value: "darwin" })
      mockExistsSync.mockReturnValue(false)

      const { MacOSBackend } = await import("@dotagents/ldi")
      const backend = new MacOSBackend()
      const check = await backend.checkDependencies()

      expect(check.supported).toBe(false)
      expect(check.reason).toContain("No supported browser")
      expect(check.missingDeps).toContain("chrome/chromium (no supported browser found)")

      Object.defineProperty(process, "platform", { value: originalPlatform })
    })

    it("should report supported when browser found on darwin", async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, "platform", { value: "darwin" })
      mockExistsSync.mockImplementation((p: unknown) => {
        return String(p).includes("Google Chrome")
      })

      const { MacOSBackend } = await import("@dotagents/ldi")
      const backend = new MacOSBackend()
      const check = await backend.checkDependencies()

      expect(check.supported).toBe(true)
      expect(check.platform).toBe("darwin")

      Object.defineProperty(process, "platform", { value: originalPlatform })
    })

    it("should return error when no browser for start", async () => {
      mockExistsSync.mockReturnValue(false)

      const { MacOSBackend } = await import("@dotagents/ldi")
      const backend = new MacOSBackend()
      const result = await backend.start("http://example.com")

      expect(result.success).toBe(false)
      expect(result.error).toContain("No supported browser")
    })

    it("should list empty when no slots directory", async () => {
      mockExistsSync.mockReturnValue(false)

      const { MacOSBackend } = await import("@dotagents/ldi")
      const backend = new MacOSBackend()
      const slots = await backend.list()

      expect(slots).toHaveLength(0)
    })
  })

  describe("WindowsBackend", () => {
    it("should report unsupported on non-win32", async () => {
      const { WindowsBackend } = await import("@dotagents/ldi")
      const backend = new WindowsBackend()
      const check = await backend.checkDependencies()

      expect(check.supported).toBe(false)
      expect(check.reason).toContain("win32")
    })

    it("should report missing browser when none found on win32", async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, "platform", { value: "win32" })
      mockExistsSync.mockReturnValue(false)

      const { WindowsBackend } = await import("@dotagents/ldi")
      const backend = new WindowsBackend()
      const check = await backend.checkDependencies()

      expect(check.supported).toBe(false)
      expect(check.reason).toContain("No supported browser")
      expect(check.missingDeps).toContain("chrome/chromium (no supported browser found)")

      Object.defineProperty(process, "platform", { value: originalPlatform })
    })

    it("should report supported when browser found on win32", async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, "platform", { value: "win32" })
      mockExistsSync.mockImplementation((p: unknown) => {
        return String(p).includes("chrome.exe")
      })

      const { WindowsBackend } = await import("@dotagents/ldi")
      const backend = new WindowsBackend()
      const check = await backend.checkDependencies()

      expect(check.supported).toBe(true)
      expect(check.platform).toBe("win32")

      Object.defineProperty(process, "platform", { value: originalPlatform })
    })

    it("should return error when no browser for start", async () => {
      mockExistsSync.mockReturnValue(false)

      const { WindowsBackend } = await import("@dotagents/ldi")
      const backend = new WindowsBackend()
      const result = await backend.start("http://example.com")

      expect(result.success).toBe(false)
      expect(result.error).toContain("No supported browser")
    })

    it("should list empty when no slots directory", async () => {
      mockExistsSync.mockReturnValue(false)

      const { WindowsBackend } = await import("@dotagents/ldi")
      const backend = new WindowsBackend()
      const slots = await backend.list()

      expect(slots).toHaveLength(0)
    })
  })

  describe("LdiClient facade", () => {
    it("should return graceful failure when no backend available", async () => {
      const originalPlatform = process.platform
      // Use a platform with no backend
      Object.defineProperty(process, "platform", { value: "freebsd" })

      const { LdiClient } = await import("@dotagents/ldi")
      const client = new LdiClient()

      const startResult = await client.start("http://example.com")
      expect(startResult.success).toBe(false)
      expect(startResult.error).toContain("No LDI backend")

      const stopResult = await client.stop()
      expect(stopResult.success).toBe(false)

      const status = await client.status()
      expect(status.running).toBe(false)

      const list = await client.list()
      expect(list).toHaveLength(0)

      const platform = await client.checkPlatform()
      expect(platform.supported).toBe(false)

      expect(client.backendName).toBeNull()

      Object.defineProperty(process, "platform", { value: originalPlatform })
    })

    it("should accept a custom backend", async () => {
      const mockBackend = {
        name: "mock",
        checkDependencies: vi.fn().mockResolvedValue({ supported: true, platform: "mock" }),
        start: vi.fn().mockResolvedValue({ success: true, slot: "default", pid: 1 }),
        stop: vi.fn().mockResolvedValue({ success: true, slot: "default" }),
        status: vi.fn().mockResolvedValue({ slot: "default", running: true }),
        list: vi.fn().mockResolvedValue([]),
        restart: vi.fn().mockResolvedValue({ success: true, slot: "default" }),
      }

      const { LdiClient } = await import("@dotagents/ldi")
      const client = new LdiClient({ backend: mockBackend })

      expect(client.backendName).toBe("mock")

      const result = await client.start("http://example.com")
      expect(result.success).toBe(true)
      expect(mockBackend.start).toHaveBeenCalledWith("http://example.com", undefined)
    })
  })

  describe("backend factory", () => {
    it("should create MacOSBackend on darwin", async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, "platform", { value: "darwin" })

      const { createBackend } = await import("@dotagents/ldi")
      const backend = createBackend()

      expect(backend).not.toBeNull()
      expect(backend?.name).toBe("macos")

      Object.defineProperty(process, "platform", { value: originalPlatform })
    })

    it("should create WindowsBackend on win32", async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, "platform", { value: "win32" })

      const { createBackend } = await import("@dotagents/ldi")
      const backend = createBackend()

      expect(backend).not.toBeNull()
      expect(backend?.name).toBe("windows")

      Object.defineProperty(process, "platform", { value: originalPlatform })
    })

    it("should return null on unsupported platform", async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, "platform", { value: "freebsd" })

      const { createBackend } = await import("@dotagents/ldi")
      const backend = createBackend()

      expect(backend).toBeNull()

      Object.defineProperty(process, "platform", { value: originalPlatform })
    })
  })

  describe("platform detection", () => {
    it("should report unsupported on unsupported platform", async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, "platform", { value: "freebsd" })

      const { checkPlatform } = await import("@dotagents/ldi")
      const result = await checkPlatform()

      expect(result.supported).toBe(false)
      expect(result.reason).toContain("No LDI backend")

      Object.defineProperty(process, "platform", { value: originalPlatform })
    })
  })

  describe("service singleton", () => {
    it("should initialize idempotently", async () => {
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
