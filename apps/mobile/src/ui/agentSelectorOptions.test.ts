import { describe, expect, it } from 'vitest';
import { buildSelectorProfiles } from './agentSelectorOptions';

describe('buildSelectorProfiles', () => {
  it('uses enabled agent profiles for the mobile selector in API mode', () => {
    const result = buildSelectorProfiles(
      { mainAgentMode: 'api' } as any,
      [
        { id: 'main', name: 'main-agent', displayName: 'Main Agent', enabled: true, connectionType: 'internal', role: 'chat-agent' },
        { id: 'sub', name: 'augustus', displayName: 'Augustus', description: 'Delegated helper', enabled: true, connectionType: 'internal', role: 'delegation-target' },
        { id: 'off', name: 'disabled', displayName: 'Disabled', enabled: false, connectionType: 'internal', role: 'delegation-target' },
      ] as any
    );

    expect(result.selectorMode).toBe('profile');
    expect(result.profiles.map((profile) => profile.id)).toEqual(['main', 'sub']);
    expect(result.profiles.map((profile) => profile.name)).toEqual(['Main Agent', 'Augustus']);
  });

  it('uses acpx-capable agent profiles when acpx mode is enabled', () => {
    const result = buildSelectorProfiles(
      {
        mainAgentMode: 'acpx',
        acpxAgents: [{ name: 'legacy-agent', displayName: 'Legacy Agent' }],
      } as any,
      [
        { id: 'acpx-1', name: 'augustus', displayName: 'Augustus', enabled: true, connectionType: 'acpx' },
        { id: 'stdio-1', name: 'stdio-helper', displayName: 'STDIO Helper', enabled: true, connectionType: 'stdio' },
        { id: 'internal-1', name: 'helper', displayName: 'Helper', enabled: true, connectionType: 'internal' },
      ] as any
    );

    expect(result.selectorMode).toBe('acpx');
    expect(result.profiles.map((profile) => profile.selectionValue)).toEqual(['augustus', 'stdio-helper', 'legacy-agent']);
    expect(result.profiles.map((profile) => profile.name)).toEqual(['Augustus', 'STDIO Helper', 'Legacy Agent']);
  });
});
