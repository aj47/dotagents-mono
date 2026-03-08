import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SessionProfileSnapshot } from "../../shared/types"

const {
  mockProcessTranscriptWithAgentMode,
  mockEmitAgentProgress,
  mockGetByName,
  mockCreateSessionSnapshotFromProfile,
} = vi.hoisted(() => ({
  mockProcessTranscriptWithAgentMode: vi.fn(),
  mockEmitAgentProgress: vi.fn().mockResolvedValue(undefined),
  mockGetByName: vi.fn((_: string) => undefined as any),
  mockCreateSessionSnapshotFromProfile: vi.fn(),
}))

vi.mock('uuid', () => ({
  v4: () => 'mock-uuid-value',
}))

vi.mock('../llm', () => ({
  processTranscriptWithAgentMode: mockProcessTranscriptWithAgentMode,
}))

vi.mock('../mcp-service', () => ({
  mcpService: {
    getAvailableTools: vi.fn(() => []),
    getAvailableToolsForProfile: vi.fn(() => []),
  },
}))

vi.mock('../state', () => ({
  agentSessionStateManager: {
    getSessionRunId: vi.fn(() => 'parent-run-id'),
    createSession: vi.fn(),
    getSessionProfileSnapshot: vi.fn(() => undefined),
    shouldStopSession: vi.fn(() => false),
    executeToolCall: vi.fn(),
    cleanupSession: vi.fn(),
    stopSession: vi.fn(),
  },
}))

vi.mock('../agent-session-tracker', () => ({
  agentSessionTracker: {
    getSessionProfileSnapshot: vi.fn(() => undefined),
  },
}))

vi.mock('../emit-agent-progress', () => ({
  emitAgentProgress: mockEmitAgentProgress,
}))

vi.mock('../skills-service', () => ({
  skillsService: {
    getEnabledSkillsInstructionsForProfile: vi.fn(() => undefined),
  },
}))

vi.mock('../agent-profile-service', () => ({
  agentProfileService: {
    getByName: mockGetByName,
    getConversation: vi.fn(() => []),
    setConversation: vi.fn(),
  },
  createSessionSnapshotFromProfile: mockCreateSessionSnapshotFromProfile,
}))

vi.mock('../config', () => ({
  configStore: {
    get: vi.fn(() => ({})),
  },
}))

import { runInternalSubSession } from './internal-agent'

describe('runInternalSubSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetByName.mockReturnValue(undefined)
    mockCreateSessionSnapshotFromProfile.mockImplementation((profile: { id: string; displayName: string }) => ({
      profileId: profile.id,
      profileName: profile.displayName,
      guidelines: '',
    }))
  })

  it('disables delegation guidance for named specialist sub-sessions', async () => {
    mockGetByName.mockReturnValue({
      id: 'web-browser',
      name: 'Web Browser',
      displayName: 'Web Browser',
      enabled: true,
      connection: { type: 'internal' },
      skillsConfig: undefined,
    })

    mockProcessTranscriptWithAgentMode.mockResolvedValue({
      success: true,
      content: 'done',
    })

    const result = await runInternalSubSession({
      task: 'research this topic',
      parentSessionId: 'parent-session-id',
      personaName: 'Web Browser',
      subSessionId: 'subsession_test_specialist_prompt',
    })

    expect(result.success).toBe(true)
    expect(mockCreateSessionSnapshotFromProfile).toHaveBeenCalled()
    expect(mockProcessTranscriptWithAgentMode).toHaveBeenCalledWith(
      'research this topic',
      [],
      expect.any(Function),
      10,
      undefined,
      undefined,
      'subsession_test_specialist_prompt',
      expect.any(Function),
      expect.objectContaining({
        profileId: 'web-browser',
        disableDelegation: true,
      }),
    )
  })
})