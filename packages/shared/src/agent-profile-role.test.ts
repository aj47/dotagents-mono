import { describe, expect, it } from 'vitest';

import { normalizeAgentProfileRole } from './agent-profile-role';

describe('normalizeAgentProfileRole', () => {
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
