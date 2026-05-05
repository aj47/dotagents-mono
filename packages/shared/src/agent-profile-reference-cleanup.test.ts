import { describe, expect, it } from 'vitest'
import {
  cleanupInvalidMcpServerReferencesInProfiles,
  cleanupInvalidSkillReferencesInProfiles,
} from './agent-profile-reference-cleanup'

describe('agent profile reference cleanup', () => {
  it('removes invalid MCP server references from profiles', () => {
    const unchanged = {
      id: 'agent-b',
      updatedAt: 1,
      toolConfig: { enabledServers: ['github'] },
    }
    const result = cleanupInvalidMcpServerReferencesInProfiles(
      [
        {
          id: 'agent-a',
          updatedAt: 1,
          toolConfig: { enabledServers: ['github', 'missing'] },
        },
        unchanged,
      ],
      ['github'],
      123,
    )

    expect(result.updatedProfileIds).toEqual(['agent-a'])
    expect(result.removedReferenceCount).toBe(1)
    expect(result.profiles[0].toolConfig?.enabledServers).toEqual(['github'])
    expect(result.profiles[0].updatedAt).toBe(123)
    expect(result.profiles[1]).toBe(unchanged)
  })

  it('removes invalid skill references from profiles', () => {
    const result = cleanupInvalidSkillReferencesInProfiles(
      [
        {
          id: 'agent-a',
          updatedAt: 1,
          skillsConfig: { enabledSkillIds: ['skill-1', 'skill-missing'] },
        },
        {
          id: 'agent-b',
          updatedAt: 1,
          skillsConfig: { enabledSkillIds: ['skill-2'] },
        },
      ],
      ['skill-1', 'skill-2'],
      456,
    )

    expect(result.updatedProfileIds).toEqual(['agent-a'])
    expect(result.removedReferenceCount).toBe(1)
    expect(result.profiles[0].skillsConfig?.enabledSkillIds).toEqual(['skill-1'])
    expect(result.profiles[0].updatedAt).toBe(456)
    expect(result.profiles[1].skillsConfig?.enabledSkillIds).toEqual(['skill-2'])
  })

  it('dedupes and sorts updated profile IDs across changed profiles', () => {
    const result = cleanupInvalidSkillReferencesInProfiles(
      [
        { id: 'z-agent', skillsConfig: { enabledSkillIds: ['missing'] } },
        { id: 'a-agent', skillsConfig: { enabledSkillIds: ['missing'] } },
        { id: 'z-agent', skillsConfig: { enabledSkillIds: ['missing'] } },
      ],
      [],
      789,
    )

    expect(result.updatedProfileIds).toEqual(['a-agent', 'z-agent'])
    expect(result.removedReferenceCount).toBe(3)
  })
})
