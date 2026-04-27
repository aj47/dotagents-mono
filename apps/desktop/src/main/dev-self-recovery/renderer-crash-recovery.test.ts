import { EventEmitter } from "events"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { GitDevSelfRecoveryController } from "./git-recovery"
import {
  isRendererCrashRecoveryEnabled,
  resetRendererCrashRecoveryForTests,
  setupRendererCrashRecovery,
} from "./renderer-crash-recovery"

function makeWindow() {
  const webContents = new EventEmitter()
  return {
    win: { webContents } as any,
    webContents,
  }
}

function makeController(overrides: Partial<GitDevSelfRecoveryController> = {}): GitDevSelfRecoveryController {
  return {
    startCleanBaselinePolling: vi.fn(),
    stopCleanBaselinePolling: vi.fn(),
    refreshCleanBaseline: vi.fn(() => true),
    hasRecoverableChanges: vi.fn(() => true),
    maybeRecover: vi.fn(() => ({ recovered: true, backupDir: "/repo/.git/dotagents-dev-recovery/backup", statusAfter: "" })),
    ...overrides,
  }
}

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

afterEach(() => {
  resetRendererCrashRecoveryForTests()
  vi.clearAllMocks()
})

describe("renderer crash recovery", () => {
  it("attaches render-process-gone listeners when dev self-recovery is enabled", () => {
    const { win, webContents } = makeWindow()
    const controller = makeController()

    const enabled = setupRendererCrashRecovery(win, "main", {
      env: { DOTAGENTS_DEV_SELF_RECOVERY: "1" },
      isProd: false,
      repoRoot: "/repo",
      logger,
      createController: () => controller,
    })

    expect(enabled).toBe(true)
    expect(webContents.listenerCount("render-process-gone")).toBe(1)
    expect(controller.startCleanBaselinePolling).toHaveBeenCalledTimes(1)
  })

  it.each(["crashed", "oom", "launch-failed", "integrity-failure"])(
    "recovers on renderer gone reason %s when recoverable changes exist",
    (reason) => {
      const { win, webContents } = makeWindow()
      const controller = makeController()

      setupRendererCrashRecovery(win, "panel", {
        env: { DOTAGENTS_DEV_SELF_RECOVERY: "1" },
        isProd: false,
        repoRoot: "/repo",
        logger,
        createController: () => controller,
      })

      webContents.emit("render-process-gone", {}, { reason })

      expect(controller.hasRecoverableChanges).toHaveBeenCalledTimes(1)
      expect(controller.maybeRecover).toHaveBeenCalledWith({
        kind: "renderer-process-gone",
        windowId: "panel",
        reason,
      })
    },
  )

  it.each(["clean-exit", "killed", "abnormal-exit"])("ignores non-recoverable renderer gone reason %s", (reason) => {
    const { win, webContents } = makeWindow()
    const controller = makeController()

    setupRendererCrashRecovery(win, "main", {
      env: { DOTAGENTS_DEV_SELF_RECOVERY: "1" },
      isProd: false,
      repoRoot: "/repo",
      logger,
      createController: () => controller,
    })

    webContents.emit("render-process-gone", {}, { reason })

    expect(controller.hasRecoverableChanges).not.toHaveBeenCalled()
    expect(controller.maybeRecover).not.toHaveBeenCalled()
  })

  it("skips recovery when recoverable renderer crashes happen without git changes", () => {
    const { win, webContents } = makeWindow()
    const controller = makeController({ hasRecoverableChanges: vi.fn(() => false) })

    setupRendererCrashRecovery(win, "main", {
      env: { ELECTRON_RENDERER_URL: "http://localhost:5173" },
      isProd: false,
      repoRoot: "/repo",
      logger,
      createController: () => controller,
    })

    webContents.emit("render-process-gone", {}, { reason: "crashed" })

    expect(controller.hasRecoverableChanges).toHaveBeenCalledTimes(1)
    expect(controller.maybeRecover).not.toHaveBeenCalled()
  })

  it("does not attach listeners outside dev/source mode", () => {
    const { win, webContents } = makeWindow()
    const controller = makeController()

    const enabled = setupRendererCrashRecovery(win, "main", {
      env: {},
      isProd: false,
      repoRoot: "/repo",
      logger,
      createController: () => controller,
    })

    expect(enabled).toBe(false)
    expect(webContents.listenerCount("render-process-gone")).toBe(0)
    expect(controller.startCleanBaselinePolling).not.toHaveBeenCalled()
  })

  it("does not attach listeners in production mode even when env is set", () => {
    const { win, webContents } = makeWindow()
    const controller = makeController()

    const enabled = setupRendererCrashRecovery(win, "main", {
      env: { DOTAGENTS_DEV_SELF_RECOVERY: "1" },
      isProd: true,
      repoRoot: "/repo",
      logger,
      createController: () => controller,
    })

    expect(enabled).toBe(false)
    expect(webContents.listenerCount("render-process-gone")).toBe(0)
    expect(controller.startCleanBaselinePolling).not.toHaveBeenCalled()
  })

  it("enables only for the explicit recovery env flag or Electron renderer dev URL", () => {
    expect(isRendererCrashRecoveryEnabled({ env: {}, isProd: false })).toBe(false)
    expect(isRendererCrashRecoveryEnabled({ env: { DOTAGENTS_DEV_SELF_RECOVERY: "1" }, isProd: false })).toBe(true)
    expect(isRendererCrashRecoveryEnabled({ env: { ELECTRON_RENDERER_URL: "http://localhost:5173" }, isProd: false })).toBe(true)
    expect(isRendererCrashRecoveryEnabled({ env: { DOTAGENTS_DEV_SELF_RECOVERY: "1" }, isProd: true })).toBe(false)
  })
})