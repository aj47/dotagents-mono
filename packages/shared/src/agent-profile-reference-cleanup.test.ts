import { describe, expect, it } from 'vitest'
import {
  cleanupInvalidMcpServerReferencesInProfileLayers,
  cleanupInvalidMcpServerReferencesInProfiles,
  cleanupInvalidSkillReferencesInProfileLayers,
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

  it('cleans invalid MCP server references across profile layers', () => {
    const layers = [
      {
        name: 'global',
        profiles: [{ id: 'global-agent', toolConfig: { enabledServers: ['github', 'missing'] } }],
      },
      {
        name: 'workspace',
        profiles: [{ id: 'workspace-agent', toolConfig: { enabledServers: ['exa'] } }],
      },
    ]
    const writes: Array<{ layer: string; profileId: string; enabledServers?: string[] }> = []

    const result = cleanupInvalidMcpServerReferencesInProfileLayers(
      layers,
      ['github', 'exa'],
      {
        loadProfiles: (layer) => layer.profiles,
        writeProfile: (layer, profile) => {
          writes.push({
            layer: layer.name,
            profileId: profile.id,
            enabledServers: profile.toolConfig?.enabledServers,
          })
        },
      },
      321,
    )

    expect(result).toEqual({
      updatedProfileIds: ['global-agent'],
      removedReferenceCount: 1,
    })
    expect(writes).toEqual([
      {
        layer: 'global',
        profileId: 'global-agent',
        enabledServers: ['github'],
      },
    ])
  })

  it('cleans invalid skill references across profile layers with one-shot iterables', () => {
    function* validSkillIds() {
      yield 'shared-skill'
      yield 'workspace-skill'
    }

    const layers = [
      {
        name: 'global',
        profiles: [{ id: 'shared-agent', skillsConfig: { enabledSkillIds: ['shared-skill', 'missing'] } }],
      },
      {
        name: 'workspace',
        profiles: [{ id: 'workspace-agent', skillsConfig: { enabledSkillIds: ['workspace-skill', 'missing'] } }],
      },
    ]
    const writes: Array<{ layer: string; profileId: string; enabledSkillIds?: string[] }> = []

    const result = cleanupInvalidSkillReferencesInProfileLayers(
      layers,
      validSkillIds(),
      {
        loadProfiles: (layer) => layer.profiles,
        writeProfile: (layer, profile) => {
          writes.push({
            layer: layer.name,
            profileId: profile.id,
            enabledSkillIds: profile.skillsConfig?.enabledSkillIds,
          })
        },
      },
      654,
    )

    expect(result).toEqual({
      updatedProfileIds: ['shared-agent', 'workspace-agent'],
      removedReferenceCount: 2,
    })
    expect(writes).toEqual([
      {
        layer: 'global',
        profileId: 'shared-agent',
        enabledSkillIds: ['shared-skill'],
      },
      {
        layer: 'workspace',
        profileId: 'workspace-agent',
        enabledSkillIds: ['workspace-skill'],
      },
    ])
  })
})
