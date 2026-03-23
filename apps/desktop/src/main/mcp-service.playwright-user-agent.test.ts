import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

let currentConfig: any
let currentProfileEnabledRuntimeTools: string[] | undefined

const originalPlaywrightMcpUserAgent = process.env.PLAYWRIGHT_MCP_USER_AGENT
const originalPlaywrightMcpConfig = process.env.PLAYWRIGHT_MCP_CONFIG

const mockConfigSave = vi.fn()
const mockSaveCurrentMcpStateToProfile = vi.fn()
const mockExecuteRuntimeTool = vi.fn(async (name: string) => ({
  content: [{ type: "text", text: `ran ${name}` }],
  isError: false,
}))

const runtimeTools = [
  { name: "mark_work_complete", description: "essential", inputSchema: {} },
]

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => "/tmp"),
    getAppPath: vi.fn(() => "/tmp/app"),
  },
  dialog: { showMessageBox: vi.fn(async () => ({ response: 0 })) },
}))
vi.mock("./config", () => ({
  dataFolder: "/tmp/dotagents-test",
  configStore: { get: () => currentConfig, save: mockConfigSave },
}))
vi.mock("./debug", () => ({
  isDebugTools: () => false,
  logTools: vi.fn(),
  logMCP: vi.fn(),
}))
vi.mock("./diagnostics", () => ({
  diagnosticsService: { logError: vi.fn(), logWarning: vi.fn(), logInfo: vi.fn() },
}))
vi.mock("./state", () => ({ state: {}, agentProcessManager: {} }))
vi.mock("./oauth-client", () => ({ OAuthClient: class {} }))
vi.mock("./oauth-storage", () => ({ oauthStorage: {} }))
vi.mock("./mcp-elicitation", () => ({
  requestElicitation: vi.fn(),
  handleElicitationComplete: vi.fn(),
  cancelAllElicitations: vi.fn(),
}))
vi.mock("./mcp-sampling", () => ({
  requestSampling: vi.fn(),
  cancelAllSamplingRequests: vi.fn(),
}))
vi.mock("./langfuse-service", () => ({
  isLangfuseEnabled: vi.fn(() => false),
  createToolSpan: vi.fn(),
  endToolSpan: vi.fn(),
  getAgentTrace: vi.fn(() => null),
}))
vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getCurrentProfile: () => ({
      id: "profile_1",
      toolConfig: { enabledRuntimeTools: currentProfileEnabledRuntimeTools },
    }),
    saveCurrentMcpStateToProfile: mockSaveCurrentMcpStateToProfile,
  },
}))
vi.mock("./runtime-tools", () => ({
  runtimeTools,
  isRuntimeTool: (name: string) => runtimeTools.some((tool) => tool.name === name),
  executeRuntimeTool: mockExecuteRuntimeTool,
}))

describe("MCPService Playwright MCP user agent", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
    vi.clearAllMocks()

    currentProfileEnabledRuntimeTools = undefined
    currentConfig = {
      mcpRequireApprovalBeforeToolCall: false,
      mcpConfig: { mcpServers: {} },
      mcpRuntimeDisabledServers: [],
      mcpDisabledTools: [],
    }

    delete process.env.PLAYWRIGHT_MCP_USER_AGENT
    delete process.env.PLAYWRIGHT_MCP_CONFIG
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()

    if (originalPlaywrightMcpUserAgent === undefined) {
      delete process.env.PLAYWRIGHT_MCP_USER_AGENT
    } else {
      process.env.PLAYWRIGHT_MCP_USER_AGENT = originalPlaywrightMcpUserAgent
    }

    if (originalPlaywrightMcpConfig === undefined) {
      delete process.env.PLAYWRIGHT_MCP_CONFIG
    } else {
      process.env.PLAYWRIGHT_MCP_CONFIG = originalPlaywrightMcpConfig
    }
  })

  it("injects a default UA for Playwright MCP launches", async () => {
    const { mcpService } = await import("./mcp-service")

    const environment = await mcpService.prepareEnvironment("browser", {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@playwright/mcp@latest", "--headless"],
      env: { EXTRA_FLAG: "1" },
    })

    expect(environment.EXTRA_FLAG).toBe("1")
    expect(environment.PLAYWRIGHT_MCP_USER_AGENT).toMatch(/^Mozilla\/5\.0 \(/)
    expect(environment.PLAYWRIGHT_MCP_USER_AGENT).toContain("Chrome/")
    expect(environment.PLAYWRIGHT_MCP_USER_AGENT).not.toContain("HeadlessChrome")
  })

  it("preserves an explicit Playwright MCP UA from server env", async () => {
    const { mcpService } = await import("./mcp-service")

    const environment = await mcpService.prepareEnvironment("playwright", {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@playwright/mcp@latest"],
      env: { PLAYWRIGHT_MCP_USER_AGENT: "Custom UA" },
    })

    expect(environment.PLAYWRIGHT_MCP_USER_AGENT).toBe("Custom UA")
  })

  it("does not inject a default UA when Playwright args already set one", async () => {
    const { mcpService } = await import("./mcp-service")

    const environment = await mcpService.prepareEnvironment("playwright", {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@playwright/mcp@latest", "--user-agent", "CLI UA"],
      env: {},
    })

    expect(environment.PLAYWRIGHT_MCP_USER_AGENT).toBeUndefined()
  })

  it("does not inject a default UA when a Playwright config file is provided", async () => {
    const { mcpService } = await import("./mcp-service")

    const environment = await mcpService.prepareEnvironment("playwright", {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@playwright/mcp@latest", "--config", "/tmp/playwright.json"],
      env: {},
    })

    expect(environment.PLAYWRIGHT_MCP_USER_AGENT).toBeUndefined()
  })
})
