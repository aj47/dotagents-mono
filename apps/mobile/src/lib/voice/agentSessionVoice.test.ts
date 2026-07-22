import { describe, expect, it } from 'vitest';
import {
  getRecentActiveAgentSessions,
  normalizeAgentSessionMessage,
  resolveAgentSessionReference,
} from './agentSessionVoice';

const sessions = [
  { id: 'old', title: 'Old agent', updatedAt: 10, isArchived: false },
  { id: 'calendar', title: 'Calendar planner', updatedAt: 30, isArchived: false },
  { id: 'archived', title: 'Archived planner', updatedAt: 40, isArchived: true },
];

describe('getRecentActiveAgentSessions', () => {
  it('returns active sessions in recent-first order', () => {
    expect(getRecentActiveAgentSessions(sessions).map((session) => session.id)).toEqual([
      'calendar',
      'old',
    ]);
  });
});

describe('resolveAgentSessionReference', () => {
  it('separates a known title from a message', () => {
    expect(resolveAgentSessionReference('calendar planner about the launch', sessions)).toEqual({
      session: sessions[1],
      remainder: 'the launch',
    });
  });

  it('does not resolve archived sessions', () => {
    expect(resolveAgentSessionReference('archived planner', sessions)).toBeNull();
  });

  it('supports fuzzy focus references', () => {
    expect(resolveAgentSessionReference('calendar', sessions)?.session.id).toBe('calendar');
  });
});

describe('normalizeAgentSessionMessage', () => {
  it('removes natural-language message lead-ins', () => {
    expect(normalizeAgentSessionMessage('that we should review the launch')).toBe(
      'we should review the launch',
    );
  });
});
