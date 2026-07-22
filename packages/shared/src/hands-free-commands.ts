/**
 * Hands-free voice command registry and phrase matcher.
 *
 * Shared between mobile and desktop so wake/sleep/dictation flows can
 * recognize a deliberately small vocabulary of imperative commands
 * (stop, new chat, switch agent, repeat) regardless of which surface
 * the user is on. Phrases are normalized the same way as
 * wake/sleep matching (lowercase, ASCII letters/digits, single spaces).
 */

export type VoiceCommandId =
  | 'stop'
  | 'new-session'
  | 'switch-agent'
  | 'message-agent'
  | 'new-agent'
  | 'close-agent'
  | 'repeat';

/**
 * Commands whose meaning depends on the words that follow the matched
 * phrase (e.g. "focus on calendar"). Callers should treat the match
 * `remainder` as an argument rather than ignoring it.
 */
export const PARAMETERIZED_VOICE_COMMANDS: ReadonlySet<VoiceCommandId> = new Set([
  'switch-agent',
  'message-agent',
  'new-agent',
  'close-agent',
]);

export interface VoiceCommandDefinition {
  /** Stable id used by callers to dispatch app actions. */
  id: VoiceCommandId;
  /** Short label suitable for menu announcements and confirmation TTS. */
  label: string;
  /**
   * Spoken phrases that resolve to this command. Matching is case- and
   * punctuation-insensitive. Non-parameterized commands must match the
   * entire utterance; parameterized commands may accept a trailing argument.
   * Longer aliases win over shorter ones, so
   * "stop talking" is preferred over "stop" when both apply.
   */
  aliases: readonly string[];
}

export const DEFAULT_VOICE_COMMANDS: readonly VoiceCommandDefinition[] = [
  {
    id: 'stop',
    label: 'Stop',
    aliases: [
      'stop',
      'stop talking',
    ],
  },
  {
    id: 'new-session',
    label: 'New chat',
    aliases: [
      'new chat',
    ],
  },
  {
    id: 'switch-agent',
    label: 'Switch agent',
    aliases: [
      'switch to agent',
      'switch agent',
      'switch agents',
      'switch to agents',
      'switch to',
      'focus agent',
      'focus on agent',
      'open agent',
      'go to agent',
    ],
  },
  {
    id: 'message-agent',
    label: 'Message agent',
    aliases: [
      'send a message to',
      'send message to',
      'send to agent',
      'message agent',
      'message the agent',
      'tell agent',
      'tell the agent',
    ],
  },
  {
    id: 'new-agent',
    label: 'New agent',
    aliases: [
      'start a new agent',
      'create a new agent',
      'start new agent',
      'create new agent',
      'new agent',
    ],
  },
  {
    id: 'close-agent',
    label: 'Close agent',
    aliases: [
      'close the agent',
      'close agent',
      'end the agent',
      'end agent',
      'archive the agent',
      'archive agent',
    ],
  },
  {
    id: 'repeat',
    label: 'Repeat',
    aliases: [
      'repeat',
    ],
  },
];

export interface VoiceCommandMatch {
  command: VoiceCommandId;
  label: string;
  matchedPhrase: string;
  remainder: string;
}

const PUNCTUATION_REGEX = /[^a-z0-9 ]+/gi;

function normalize(text: string | null | undefined): string {
  return (text || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(PUNCTUATION_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface IndexedPhrase {
  command: VoiceCommandDefinition;
  phrase: string;
}

function indexPhrases(commands: readonly VoiceCommandDefinition[]): IndexedPhrase[] {
  const phrases: IndexedPhrase[] = [];
  for (const command of commands) {
    for (const alias of command.aliases) {
      const phrase = normalize(alias);
      if (phrase) phrases.push({ command, phrase });
    }
  }
  // Longest phrases first so "stop talking" wins over "stop" when both
  // would match the same utterance.
  phrases.sort((a, b) => b.phrase.length - a.phrase.length);
  return phrases;
}

/**
 * Match a recognized utterance against the supplied command registry.
 * Exact phrases resolve directly. Parameterized commands also match at
 * the beginning of an utterance and return the trailing words as their
 * argument (e.g. "switch to calendar"). Requiring exact matches for the
 * other commands keeps ordinary dictation from being hijacked.
 */
export function matchVoiceCommand(
  transcript: string,
  commands: readonly VoiceCommandDefinition[] = DEFAULT_VOICE_COMMANDS,
): VoiceCommandMatch | null {
  const normalized = normalize(transcript);
  if (!normalized) return null;

  for (const { command, phrase } of indexPhrases(commands)) {
    if (normalized === phrase) {
      return {
        command: command.id,
        label: command.label,
        matchedPhrase: phrase,
        remainder: '',
      };
    }
    if (
      PARAMETERIZED_VOICE_COMMANDS.has(command.id)
      && normalized.startsWith(`${phrase} `)
    ) {
      return {
        command: command.id,
        label: command.label,
        matchedPhrase: phrase,
        remainder: normalized.slice(phrase.length + 1),
      };
    }
  }

  return null;
}

/**
 * Convenience: distinct human-readable labels for command menus.
 */
export function getVoiceCommandMenuLabels(
  commands: readonly VoiceCommandDefinition[] = DEFAULT_VOICE_COMMANDS,
): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const command of commands) {
    if (seen.has(command.label)) continue;
    seen.add(command.label);
    labels.push(command.label);
  }
  return labels;
}
