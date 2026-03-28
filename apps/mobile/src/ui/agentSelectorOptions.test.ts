import { describe, expect, it } from 'vitest';
import { buildSelectorProfiles } from './agentSelectorOptions';

describe('buildSelectorProfiles', () => {
  it('uses enabled agent profiles for the mobile selector in API mode', () => {
    const result = buildSelectorProfiles(
      { mainAgentMode: 'api' } as any,
      [
        { id: 'main', name: 'main-agent', displayName: 'Main Agent', enabled: true, connectionType: 'internal', role: 'user-profile' },
        { id: 'sub', name: 'augustus', displayName: 'Augustus', description: 'Delegated helper', enabled: true, connectionType: 'internal', role: 'delegation-target' },
        { id: 'off', name: 'disabled', displayName: 'Disabled', enabled: false, connectionType: 'internal', role: 'delegation-target' },
      ] as any
    );

    expect(result.selectorMode).toBe('profile');
    expect(result.profiles.map((profile) => profile.id)).toEqual(['main', 'sub']);
    expect(result.profiles.map((profile) => profile.name)).toEqual(['Main Agent', 'Augustus']);
  });

  it('uses shared display-name and summary fallbacks for selector profiles', () => {
    const result = buildSelectorProfiles(
      { mainAgentMode: 'api' } as any,
      [
        { id: 'main', name: 'main-agent', displayName: '   ', guidelines: 'Core helper', enabled: true, connectionType: 'internal', role: 'user-profile' },
      ] as any
    );

    expect(result.selectorMode).toBe('profile');
    expect(result.profiles).toEqual([
      expect.objectContaining({
        id: 'main',
        name: 'main-agent',
        description: 'Core helper',
        guidelines: 'Core helper',
      }),
    ]);
  });

  it('uses ACP-capable agent profiles when ACP mode is enabled', () => {
    const result = buildSelectorProfiles(
      {
        mainAgentMode: 'acp',
        acpAgents: [{ name: 'legacy-agent', displayName: 'Legacy Agent' }],
      } as any,
      [
        { id: 'stdio-1', name: 'augustus', displayName: 'Augustus', enabled: true, connectionType: 'stdio' },
        { id: 'internal-1', name: 'helper', displayName: 'Helper', enabled: true, connectionType: 'internal' },
      ] as any
    );

    expect(result.selectorMode).toBe('acp');
    expect(result.profiles.map((profile) => profile.selectionValue)).toEqual(['augustus', 'legacy-agent']);
    expect(result.profiles.map((profile) => profile.name)).toEqual(['Augustus', 'Legacy Agent']);
  });
});
