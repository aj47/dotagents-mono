/**
 * Fuzzy matcher for the hands-free "focus agent" voice command.
 *
 * The user speaks something like "focus on calendar bot"; the command
 * matcher strips the "focus on" prefix and hands us the remainder
 * ("calendar bot"). We score that against the titles of the user's chat
 * sessions (surfaced as "agents" in the voice UX) and only return a match
 * when we are confident enough to act without asking — otherwise the
 * caller falls back to showing the list so the user can pick visually.
 */

export interface AgentSessionCandidate {
  id: string;
  title: string;
  /** Higher = more recent; used to break ties between equal text scores. */
  updatedAt?: number;
}

export interface AgentSessionMatch<T extends AgentSessionCandidate> {
  session: T;
  score: number;
}

function normalize(text: string | null | undefined): string {
  return (text || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9 ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return text ? text.split(' ').filter(Boolean) : [];
}

/**
 * Score how well a spoken name matches a session title in the range 0..1.
 * Exact normalized equality is 1, substring containment is high, and
 * partial token overlap scales with the fraction of shared words.
 */
export function scoreAgentSessionMatch(spokenName: string, title: string): number {
  const query = normalize(spokenName);
  const target = normalize(title);
  if (!query || !target) return 0;
  if (query === target) return 1;

  if (target.includes(query)) {
    // "calendar" inside "calendar planner" — strong, scaled by coverage.
    return 0.6 + 0.3 * (query.length / target.length);
  }
  if (query.includes(target)) {
    return 0.6 + 0.3 * (target.length / query.length);
  }

  const queryTokens = tokenize(query);
  const targetTokens = new Set(tokenize(target));
  if (queryTokens.length === 0) return 0;
  const shared = queryTokens.filter((token) => targetTokens.has(token)).length;
  if (shared === 0) return 0;
  return 0.55 * (shared / queryTokens.length);
}

/**
 * Pick the best-matching session for a spoken name. Returns null when no
 * candidate clears the confidence threshold so the caller can fall back to
 * showing the list rather than focusing the wrong agent.
 */
export function findAgentSessionMatch<T extends AgentSessionCandidate>(
  spokenName: string,
  sessions: readonly T[],
  minScore = 0.55,
): T | null {
  if (!normalize(spokenName)) return null;
  let best: AgentSessionMatch<T> | null = null;
  for (const session of sessions) {
    const score = scoreAgentSessionMatch(spokenName, session.title);
    if (score <= 0) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && (session.updatedAt ?? 0) > (best.session.updatedAt ?? 0))
    ) {
      best = { session, score };
    }
  }
  return best && best.score >= minScore ? best.session : null;
}
