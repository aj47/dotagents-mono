import os from "node:os"
import path from "node:path"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockGetSkill = vi.fn()
const mockGetSkills = vi.fn()
const mockRefreshFromDisk = vi.fn()
const mockGetSession = vi.fn()
const mockLoadConversation = vi.fn()

vi.mock("./mcp-service", () => ({
  mcpService: { getAvailableTools: vi.fn(() => []) },
}))

vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: { getActiveSessions: vi.fn(() => []), getSession: mockGetSession } }))
vi.mock("./state", () => ({ agentSessionStateManager: { getSessionRunId: vi.fn(() => 1) }, toolApprovalManager: {} }))
vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({ appendSessionUserResponse: vi.fn() }))
vi.mock("./conversation-service", () => ({ conversationService: { loadConversation: mockLoadConversation } }))
vi.mock("./context-budget", () => ({ readMoreContext: vi.fn() }))
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: vi.fn() }))
vi.mock("./acpx/acpx-session-state", () => ({
  getAppSessionForAcpSession: vi.fn(() => undefined),
  getRootAppSessionForAcpSession: vi.fn(() => undefined),
  setAcpSessionTitleOverride: vi.fn(),
}))
vi.mock("./skills-service", () => ({
  skillsService: {
    getSkill: mockGetSkill,
    getSkills: mockGetSkills,
    refreshFromDisk: mockRefreshFromDisk,
    upgradeGitHubSkillToLocal: vi.fn(),
  },
}))

function getHomePrefix(targetPath: string): string | null {
  const match = targetPath.match(/^(\/Users\/[^/]+|\/home\/[^/]+)/)
  return match ? match[0] : null
}

function buildTypoWorkspacePath(targetPath: string): string | null {
  const homePrefix = getHomePrefix(targetPath)
  if (!homePrefix) {
    return null
  }

  const username = homePrefix.split("/").pop()
  if (!username) {
    return null
  }

  const typoUsername = username.endsWith("x") ? `${username}z` : `${username}x`
  return `${homePrefix.slice(0, -username.length)}${typoUsername}${targetPath.slice(homePrefix.length)}`
}

const canRunPathNormalizationTest = process.platform !== "win32"
  && Boolean(getHomePrefix(process.cwd()) || getHomePrefix(os.homedir()))

const pathNormalizationTest = canRunPathNormalizationTest ? it : it.skip

let temporaryWorkspacePath: string | null = null

async function getPathNormalizationWorkspacePath(): Promise<string> {
  const currentWorkspacePath = process.cwd()
  if (getHomePrefix(currentWorkspacePath)) {
    return currentWorkspacePath
  }

  const homeDirectory = os.homedir()
  temporaryWorkspacePath = await mkdtemp(path.join(homeDirectory, "dotagents-runtime-tools-"))
  await writeFile(path.join(temporaryWorkspacePath, "SKILL.md"), "")
  return temporaryWorkspacePath
}

describe("runtime-tools execute_command", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockGetSkill.mockReturnValue(undefined)
    mockGetSkills.mockReturnValue([{ id: "agent-skill-creation" }, { id: "frontend-design" }])
    mockRefreshFromDisk.mockReturnValue([{ id: "agent-skill-creation" }, { id: "frontend-design" }])
    mockGetSession.mockReturnValue(undefined)
    mockLoadConversation.mockResolvedValue(null)
  })

  afterEach(async () => {
    if (temporaryWorkspacePath) {
      await rm(temporaryWorkspacePath, { recursive: true, force: true })
      temporaryWorkspacePath = null
    }
  })

  it("falls back to the default workspace when skillId is not an exact loaded skill id", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("execute_command", {
      command: "pwd && ls -la",
      skillId: "aj47/dotagents-mono",
    })

    expect(result?.isError).toBe(false)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload).toEqual(expect.objectContaining({
      success: true,
      ignoredInvalidSkillId: "aj47/dotagents-mono",
      retrySuggestion: expect.stringContaining("without skillId"),
      availableSkillIds: ["agent-skill-creation", "frontend-design"],
    }))
    expect(payload.cwd).toBe(process.cwd())
    expect(String(payload.stdout)).toContain("apps")
    expect(payload.guidance).toContain("Never use repo names")
  })

  pathNormalizationTest("normalizes obvious workspace path typos inside commands", async () => {
    const actualWorkspacePath = await getPathNormalizationWorkspacePath()
    const typoWorkspacePath = buildTypoWorkspacePath(actualWorkspacePath)

    expect(typoWorkspacePath).toBeTruthy()

    if (actualWorkspacePath !== process.cwd()) {
      mockGetSkill.mockReturnValue({
        id: "path-normalization-test-skill",
        name: "path-normalization-test-skill",
        filePath: path.join(actualWorkspacePath, "SKILL.md"),
      })
    }

    const { executeRuntimeTool } = await import("./runtime-tools")
    const command = `cd \"${typoWorkspacePath}\" && pwd`
    const result = await executeRuntimeTool("execute_command", {
      command,
      ...(actualWorkspacePath !== process.cwd() ? { skillId: "path-normalization-test-skill" } : {}),
    })

    expect(result?.isError).toBe(false)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload.normalizedPaths).toEqual([
      {
        from: typoWorkspacePath,
        to: actualWorkspacePath,
      },
    ])
    expect(payload.originalCommand).toBe(command)
    expect(String(payload.stdout)).toContain(path.basename(actualWorkspacePath))
  })

  it("rejects npm commands when the workspace lockfile indicates pnpm", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("execute_command", {
      command: "cd apps/desktop && npm test -- --runInBand src/main/system-prompts.test.ts",
    })

    expect(result?.isError).toBe(true)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload).toEqual(expect.objectContaining({
      success: false,
      detectedPackageManager: "pnpm",
      offendingToken: "npm",
      retrySuggestion: expect.stringContaining("pnpm"),
    }))
    expect(String(payload.packageManagerLockfile)).toContain("pnpm-lock.yaml")
  })

  it("blocks package-manager validation commands for context-gathering prompts", async () => {
    mockGetSession.mockReturnValue({ id: "session-1", conversationId: "conv-1" })
    mockLoadConversation.mockResolvedValue({
      id: "conv-1",
      title: "Context question",
      createdAt: 0,
      updatedAt: 0,
      messages: [{ id: "msg-1", role: "user", content: "Gather as much context as possible to give a good answer to the question 'what's next'", timestamp: 0 }],
    })

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool(
      "execute_command",
      { command: "pnpm --filter @dotagents/desktop exec vitest run src/main/system-prompts.test.ts" },
      "session-1",
    )

    expect(result?.isError).toBe(true)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload).toEqual(expect.objectContaining({
      success: false,
      blockedCommandCategory: "package-manager-validation",
      latestUserRequestExcerpt: expect.stringContaining("Gather as much context"),
      retrySuggestion: expect.stringContaining("read-only inspection commands"),
    }))
    expect(payload.error).toContain("planning/context question")
  })
})

