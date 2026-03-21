import { describe, expect, it, vi } from "vitest"
import type { Config } from "@shared/types"

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => "/tmp/dotagents-test"),
    getAppPath: vi.fn(() => "/tmp/app"),
  },
}))

/**
 * NOTE: The config persistence logic (persistConfigToDisk, trySaveConfig) has been
 * extracted to @dotagents/core. Detailed unit tests for persistence behavior
 * (fallback on failure, dual-write, etc.) are in packages/core/src/config.persistence.test.ts.
 *
 * This test verifies that the desktop re-export layer works correctly.
 */
describe("config desktop re-exports", () => {
  it("defaults APP_ID to the packaged desktop namespace when unset", async () => {
    vi.resetModules()
    Reflect.deleteProperty(process.env, "APP_ID")

    const configModule = await import("./config")

    expect(configModule.appId).toBe("app.dotagents")
    expect(configModule.dataFolder).toContain("app.dotagents")
  })

  it("re-exports persistConfigToDisk from @dotagents/core", async () => {
    process.env.APP_ID = "dotagents-test"
    const configModule = await import("./config")

    expect(configModule.persistConfigToDisk).toBeDefined()
    expect(typeof configModule.persistConfigToDisk).toBe("function")
  })

  it("re-exports trySaveConfig from @dotagents/core", async () => {
    process.env.APP_ID = "dotagents-test"
    const configModule = await import("./config")

    expect(configModule.trySaveConfig).toBeDefined()
    expect(typeof configModule.trySaveConfig).toBe("function")
  })

  it("provides backward-compatible path constants", async () => {
    process.env.APP_ID = "dotagents-test"
    const configModule = await import("./config")

    expect(configModule.dataFolder).toBeDefined()
    expect(typeof configModule.dataFolder).toBe("string")
    expect(configModule.dataFolder).toContain("dotagents-test")

    expect(configModule.recordingsFolder).toContain("recordings")
    expect(configModule.conversationsFolder).toContain("conversations")
    expect(configModule.configPath).toContain("config.json")
  })

  it("provides configStore with get/save/reload methods", async () => {
    process.env.APP_ID = "dotagents-test"
    const { configStore } = await import("./config")

    expect(configStore).toBeDefined()
    expect(typeof configStore.get).toBe("function")
    expect(typeof configStore.save).toBe("function")
    expect(typeof configStore.reload).toBe("function")

    const config = configStore.get()
    expect(config).toBeDefined()
    expect(typeof config).toBe("object")
  })
})
