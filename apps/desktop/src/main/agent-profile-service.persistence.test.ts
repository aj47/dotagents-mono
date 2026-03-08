import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AgentProfile } from "@shared/types"

const mockLoadAgentProfilesLayer = vi.fn()
const mockWriteAllAgentsProfileFiles = vi.fn()
const mockDeleteAgentProfileFiles = vi.fn()
const mockWriteAgentsPrompts = vi.fn()
const mockLogApp = vi.fn()

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => "/tmp/dotagents-agent-profile-service-test"),
  },
}))

vi.mock("./config", () => ({
  configStore: { get: () => ({ mcpConfig: { mcpServers: {} } }) },
  globalAgentsFolder: "/tmp/dotagents-agent-profile-service-test/.agents",
  resolveWorkspaceAgentsFolder: () => null,
}))

vi.mock("./debug", () => ({ logApp: mockLogApp }))
vi.mock("./builtin-tool-definitions", () => ({ getBuiltinToolNames: () => [] }))
vi.mock("./acp/acp-registry", () => ({ acpRegistry: {} }))
vi.mock("./system-prompts-default", () => ({ DEFAULT_SYSTEM_PROMPT: "Default system prompt" }))

vi.mock("./agents-files/modular-config", () => ({
  getAgentsLayerPaths: vi.fn((agentsDir: string) => ({ agentsDir })),
  writeAgentsPrompts: (...args: unknown[]) => mockWriteAgentsPrompts(...args),
  loadAgentsPrompts: vi.fn(() => ({ systemPrompt: null, agentsGuidelines: null })),
}))

vi.mock("./agents-files/agent-profiles", () => ({
  loadAgentProfilesLayer: (...args: unknown[]) => mockLoadAgentProfilesLayer(...args),
  writeAgentsProfileFiles: vi.fn(),
  writeAllAgentsProfileFiles: (...args: unknown[]) => mockWriteAllAgentsProfileFiles(...args),
  deleteAgentProfileFiles: (...args: unknown[]) => mockDeleteAgentProfileFiles(...args),
}))

function createProfile(id: string, displayName: string): AgentProfile {
  return {
    id,
    name: displayName,
    displayName,
    description: `${displayName} description`,
    enabled: true,
    connection: { type: "internal" },
    createdAt: 1,
    updatedAt: 1,
  }
}

async function loadService(profiles: AgentProfile[] = [createProfile("agent-1", "Agent One")]) {
  vi.resetModules()
  mockLogApp.mockReset()
  mockWriteAgentsPrompts.mockReset()
  mockWriteAllAgentsProfileFiles.mockReset()
  mockDeleteAgentProfileFiles.mockReset()
  mockLoadAgentProfilesLayer.mockReset()

  mockLoadAgentProfilesLayer.mockImplementation(() => ({ profiles: structuredClone(profiles) }))
  mockWriteAllAgentsProfileFiles.mockImplementation(() => {})

  const { agentProfileService } = await import("./agent-profile-service")
  return agentProfileService
}

describe("agent-profile-service persistence rollback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("restores in-memory state when create persistence fails", async () => {
    const service = await loadService()

    mockWriteAllAgentsProfileFiles.mockImplementationOnce(() => {
      throw new Error("ENOSPC: no space left on device")
    })

    expect(() =>
      service.create({
        name: "Agent Two",
        displayName: "Agent Two",
        enabled: true,
        connection: { type: "internal" },
      }),
    ).toThrow(/ENOSPC: no space left on device/)

    expect(service.getAll().map(profile => profile.displayName)).toEqual(["Agent One"])
  })

  it("restores the previous profile when update persistence fails", async () => {
    const service = await loadService([createProfile("agent-1", "Original Agent")])

    mockWriteAllAgentsProfileFiles.mockImplementationOnce(() => {
      throw new Error("EROFS: read-only file system")
    })

    expect(() => service.update("agent-1", { displayName: "Updated Agent" })).toThrow(/EROFS: read-only file system/)

    expect(service.getById("agent-1")?.displayName).toBe("Original Agent")
    expect(service.getById("agent-1")?.updatedAt).toBe(1)
  })

  it("keeps the profile available when delete persistence fails", async () => {
    const service = await loadService([createProfile("agent-1", "Agent One")])

    mockWriteAllAgentsProfileFiles.mockImplementationOnce(() => {
      throw new Error("EACCES: permission denied")
    })

    expect(() => service.delete("agent-1")).toThrow(/EACCES: permission denied/)

    expect(service.getById("agent-1")?.displayName).toBe("Agent One")
    expect(mockDeleteAgentProfileFiles).not.toHaveBeenCalled()
  })
})