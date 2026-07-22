import { findAgentSessionMatch, type AgentSessionCandidate } from './agentSessionMatch';

export type AgentSessionVoiceCandidate = AgentSessionCandidate & {
  isArchived?: boolean;
};

export type AgentSessionReference<T extends AgentSessionVoiceCandidate = AgentSessionVoiceCandidate> = {
  session: T;
  remainder: string;
};

const VOICE_PUNCTUATION = /[^a-z0-9 ]+/gi;

export function normalizeAgentSessionVoiceText(text: string | null | undefined): string {
  return (text || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(VOICE_PUNCTUATION, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getRecentActiveAgentSessions<T extends AgentSessionVoiceCandidate>(
  sessions: readonly T[],
  limit = 5,
): T[] {
  return sessions
    .filter((session) => !session.isArchived)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .slice(0, limit);
}

function cleanAgentMessageRemainder(remainder: string): string {
  return remainder
    .replace(/^(?:that|about|to say|saying)\s+/i, '')
    .trim();
}

const SPOKEN_ORDINALS: Record<string, number> = {
  first: 1,
  one: 1,
  second: 2,
  two: 2,
  third: 3,
  three: 3,
  fourth: 4,
  four: 4,
  fifth: 5,
  five: 5,
  sixth: 6,
  six: 6,
  seventh: 7,
  seven: 7,
  eighth: 8,
  eight: 8,
  ninth: 9,
  nine: 9,
  tenth: 10,
  ten: 10,
};

function resolveSpokenAgentOrdinal(text: string): number | null {
  const match = text.match(
    /^(?:(?:can|could|would) you\s+)?(?:(?:do|choose|pick|select|switch to|open|use)\s+)?(?:the\s+)?(?:number\s+)?(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|one|two|three|four|five|six|seven|eight|nine|ten|\d+(?:st|nd|rd|th)?)(?:\s+one)?(?:\s+(?:(?:that\s+you)|you)\s+(?:listed|mentioned|showed|said))?$/,
  );
  if (!match) return null;

  const token = match[1];
  if (/^\d/.test(token)) {
    const numericValue = Number.parseInt(token, 10);
    return Number.isFinite(numericValue) ? numericValue : null;
  }
  return SPOKEN_ORDINALS[token] ?? null;
}

/**
 * Resolve a spoken agent title at the beginning of a command remainder.
 * Matching the known title prefix lets us separate "send to Calendar that..."
 * into a target and message without guessing where the title ends.
 */
export function resolveAgentSessionReference<T extends AgentSessionVoiceCandidate>(
  spokenText: string,
  sessions: readonly T[],
): AgentSessionReference<T> | null {
  const normalizedText = normalizeAgentSessionVoiceText(spokenText);
  if (!normalizedText) return null;

  const activeSessions = sessions.filter((session) => !session.isArchived);
  const spokenOrdinal = resolveSpokenAgentOrdinal(normalizedText);
  if (spokenOrdinal !== null) {
    const session = activeSessions[spokenOrdinal - 1];
    if (session) return { session, remainder: '' };
  }

  const titleMatches = [...activeSessions]
    .map((session) => ({ session, title: normalizeAgentSessionVoiceText(session.title) }))
    .filter(({ title }) => title.length > 0)
    .sort((a, b) => b.title.length - a.title.length);

  for (const { session, title } of titleMatches) {
    if (normalizedText === title) {
      return { session, remainder: '' };
    }
    if (normalizedText.startsWith(`${title} `)) {
      return {
        session,
        remainder: cleanAgentMessageRemainder(normalizedText.slice(title.length).trim()),
      };
    }
  }

  const fuzzyMatch = findAgentSessionMatch(normalizedText, activeSessions);
  return fuzzyMatch ? { session: fuzzyMatch, remainder: '' } : null;
}

export function normalizeAgentSessionMessage(text: string): string {
  return cleanAgentMessageRemainder(normalizeAgentSessionVoiceText(text));
}
