import { describe, expect, it } from 'vitest';

import { isAgentProfileRole, normalizeAgentProfileRole } from './agent-profile-role';

describe('normalizeAgentProfileRole', () => {
  it('checks persisted profile roles', () => {
    expect(isAgentProfileRole('chat-agent')).toBe(true);
    expect(isAgentProfileRole('delegation-target')).toBe(true);
    expect(isAgentProfileRole('external-agent')).toBe(true);
    expect(isAgentProfileRole('user-profile')).toBe(true);
    expect(isAgentProfileRole('unknown')).toBe(false);
    expect(isAgentProfileRole(undefined)).toBe(false);
  });

  it.each([
    ['chat-agent', 'chat-agent'],
    ['delegation-target', 'delegation-target'],
    ['external-agent', 'external-agent'],
    ['user-profile', 'chat-agent'],
  ] as const)('normalizes %s to %s', (input, expected) => {
    expect(normalizeAgentProfileRole(input)).toBe(expected);
  });

  it('returns undefined for missing or unknown roles', () => {
    expect(normalizeAgentProfileRole(undefined)).toBeUndefined();
    expect(normalizeAgentProfileRole('')).toBeUndefined();
    expect(normalizeAgentProfileRole('invalid')).toBeUndefined();
  });
});
