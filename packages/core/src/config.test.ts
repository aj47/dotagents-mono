import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { ServiceContainer, ServiceTokens } from "./service-container"
import { MockPathResolver } from "./testing/mock-path-resolver"
import { container } from "./service-container"
import * as configModule from "./config"

describe("config", () => {
  describe("path resolution uses PathResolver", () => {
    let originalPathResolver: unknown

    beforeEach(() => {
      // Save any existing PathResolver registration
      originalPathResolver = container.tryResolve(ServiceTokens.PathResolver)
      // Register a mock PathResolver
      if (container.has(ServiceTokens.PathResolver)) {
        container.replace(ServiceTokens.PathResolver, new MockPathResolver("/test/app"))
      } else {
        container.register(ServiceTokens.PathResolver, new MockPathResolver("/test/app"))
      }
    })

    afterEach(async () => {
      // Restore original PathResolver
      if (originalPathResolver) {
        await container.replace(ServiceTokens.PathResolver, originalPathResolver)
      } else if (container.has(ServiceTokens.PathResolver)) {
        await container.unregister(ServiceTokens.PathResolver)
      }
    })

    it("getDataFolder uses PathResolver.getAppDataPath", () => {
      const dataFolder = configModule.getDataFolder()
      // MockPathResolver returns /test/app/appData for getAppDataPath()
      expect(dataFolder).toContain("/test/app/appData")
    })

    it("getRecordingsFolder is under getDataFolder", () => {
      const recordings = configModule.getRecordingsFolder()
      expect(recordings).toContain("recordings")
      expect(recordings).toContain("/test/app/appData")
    })

    it("getConversationsFolder is under getDataFolder", () => {
      const conversations = configModule.getConversationsFolder()
      expect(conversations).toContain("conversations")
      expect(conversations).toContain("/test/app/appData")
    })

    it("getConfigPath is config.json under getDataFolder", () => {
      const configPath = configModule.getConfigPath()
      expect(configPath).toContain("config.json")
      expect(configPath).toContain("/test/app/appData")
    })
  })

  it("globalAgentsFolder points to ~/.agents", () => {
    const home = require("os").homedir()
    expect(configModule.globalAgentsFolder).toBe(require("path").join(home, ".agents"))
  })

  describe("ConfigStore", () => {
    it("is a class that can be instantiated after PathResolver registration", () => {
      expect(configModule.ConfigStore).toBeDefined()
      expect(typeof configModule.ConfigStore).toBe("function")
    })
  })

  describe("mcpUnlimitedIterations default (regression)", () => {
    // This setting MUST default to true. We have regressed this multiple times.
    // If this test fails, it means someone changed the default back to false.
    it("defaults to true so agents are not prematurely cut off", () => {
      // Register mock PathResolver needed by ConfigStore
      if (!container.has(ServiceTokens.PathResolver)) {
        container.register(ServiceTokens.PathResolver, new MockPathResolver("/test/app"))
      }
      const store = configModule.getConfigStore()
      const config = store.get()
      expect(config.mcpUnlimitedIterations).toBe(true)
    })
  })

  describe("mcpVerifyCompletionEnabled default (regression)", () => {
    // This setting MUST default to true. When false, the agent bypasses
    // verification and accepts any text response as complete — including
    // "thinking out loud" responses that should trigger tool calls.
    // The .agents/mcp.json file can override this, so the migration in
    // ConfigStore constructor must fix stale false values.
    it("defaults to true so agent responses are verified before delivery", () => {
      if (!container.has(ServiceTokens.PathResolver)) {
        container.register(ServiceTokens.PathResolver, new MockPathResolver("/test/app"))
      }
      const store = configModule.getConfigStore()
      const config = store.get()
      expect(config.mcpVerifyCompletionEnabled).toBe(true)
    })
  })
})
