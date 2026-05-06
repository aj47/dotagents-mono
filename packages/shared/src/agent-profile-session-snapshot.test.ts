import { describe, expect, it } from 'vitest'
import {
  createSessionSnapshotFromProfile,
  refreshSessionSnapshotSkillsFromProfile,
  toolConfigToMcpServerConfig,
  type AgentProfileSessionSnapshotLike,
} from './agent-profile-session-snapshot'

describe('agent profile session snapshot helpers', () => {
  it('converts profile tool config into MCP server config', () => {
    expect(toolConfigToMcpServerConfig({
      enabledServers: ['github'],
      disabledServers: ['filesystem'],
      disabledTools: ['danger'],
      enabledRuntimeTools: ['respond_to_user'],
      allServersDisabledByDefault: true,
    })).toEqual({
      enabledServers: ['github'],
      disabledServers: ['filesystem'],
      disabledTools: ['danger'],
      enabledRuntimeTools: ['respond_to_user'],
      allServersDisabledByDefault: true,
    })
    expect(toolConfigToMcpServerConfig(undefined)).toBeUndefined()
  })

  it('creates session snapshots from agent profiles', () => {
    expect(createSessionSnapshotFromProfile(
      {
        id: 'agent-1',
        displayName: 'Agent One',
        guidelines: 'Be concise',
        systemPrompt: 'System',
        toolConfig: { enabledServers: ['github'] },
        modelConfig: { agentProviderId: 'openai' },
        properties: { tone: 'direct' },
        skillsConfig: { enabledSkillIds: ['skill-1'] },
      },
      'Skill instructions',
    )).toEqual({
      profileId: 'agent-1',
      profileName: 'Agent One',
      guidelines: 'Be concise',
      systemPrompt: 'System',
      mcpServerConfig: { enabledServers: ['github'] },
      modelConfig: { agentProviderId: 'openai' },
      agentProperties: { tone: 'direct' },
      skillsConfig: { enabledSkillIds: ['skill-1'] },
      skillsInstructions: 'Skill instructions',
    })
  })

  it('refreshes only matching snapshot skill access and invalidates rendered instructions', () => {
    const snapshot: AgentProfileSessionSnapshotLike = {
      profileId: 'agent-1',
      profileName: 'Agent One',
      guidelines: 'Old',
      skillsConfig: { enabledSkillIds: ['old'] },
      skillsInstructions: 'old rendered instructions',
    }

    expect(refreshSessionSnapshotSkillsFromProfile(snapshot, {
      id: 'agent-2',
      displayName: 'Agent Two',
      skillsConfig: { enabledSkillIds: ['new'] },
    })).toBe(snapshot)

    expect(refreshSessionSnapshotSkillsFromProfile(snapshot, {
      id: 'agent-1',
      displayName: 'Agent One',
      skillsConfig: { enabledSkillIds: ['new'] },
    })).toEqual({
      profileId: 'agent-1',
      profileName: 'Agent One',
      guidelines: 'Old',
      skillsConfig: { enabledSkillIds: ['new'] },
      skillsInstructions: undefined,
    })
  })
})
