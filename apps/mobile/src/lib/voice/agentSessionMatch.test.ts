import { describe, expect, it } from 'vitest';
import { findAgentSessionMatch, scoreAgentSessionMatch } from './agentSessionMatch';

const sessions = [
  { id: '1', title: 'Calendar planner', updatedAt: 100 },
  { id: '2', title: 'Travel booking bot', updatedAt: 200 },
  { id: '3', title: 'Calendar', updatedAt: 50 },
];

describe('scoreAgentSessionMatch', () => {
  it('scores exact normalized equality as 1', () => {
    expect(scoreAgentSessionMatch('Calendar', 'calendar')).toBe(1);
  });

  it('returns 0 for empty input', () => {
    expect(scoreAgentSessionMatch('', 'calendar')).toBe(0);
    expect(scoreAgentSessionMatch('calendar', '')).toBe(0);
  });

  it('scores substring containment above the threshold', () => {
    expect(scoreAgentSessionMatch('calendar', 'calendar planner')).toBeGreaterThanOrEqual(0.55);
  });

  it('ignores punctuation and casing', () => {
    expect(scoreAgentSessionMatch('Calendar!', 'calendar')).toBe(1);
  });
});

describe('findAgentSessionMatch', () => {
  it('returns null when the spoken name is empty', () => {
    expect(findAgentSessionMatch('', sessions)).toBeNull();
  });

  it('returns null when nothing clears the confidence threshold', () => {
    expect(findAgentSessionMatch('weather forecast', sessions)).toBeNull();
  });

  it('finds an exact title match', () => {
    expect(findAgentSessionMatch('travel booking bot', sessions)?.id).toBe('2');
  });

  it('prefers the exact match over a partial containment match', () => {
    // "calendar" is exact for session 3 and a substring of session 1.
    expect(findAgentSessionMatch('calendar', sessions)?.id).toBe('3');
  });

  it('matches on partial token overlap when distinctive', () => {
    expect(findAgentSessionMatch('travel bot', sessions)?.id).toBe('2');
  });
});
