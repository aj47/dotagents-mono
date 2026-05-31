/**
 * Hands-free voice command registry and phrase matcher.
 *
 * Shared between mobile and desktop so wake/sleep/dictation flows can
 * recognize a small, extensible vocabulary of imperative commands
 * (stop the agent, stop talking, new chat, open menu) regardless of
 * which surface the user is on. Phrases are normalized the same way as
 * wake/sleep matching (lowercase, ASCII letters/digits, single spaces).
 */

export type VoiceCommandId =
  | 'stop-agent-turn'
  | 'stop-tts'
  | 'new-session'
  | 'open-menu'
  | 'list-recent-agents'
  | 'list-old-agents'
  | 'focus-agent'
  // Multi-agent TTS playback controls.
  | 'tts-stop-all'
  | 'tts-skip'
  | 'tts-pause'
  | 'tts-resume'
  | 'tts-whats-playing'
  | 'tts-read-everything'
  | 'tts-announce-only'
  | 'tts-repeat'
  | 'tts-mute-agent'
  | 'tts-unmute-agent'
  | 'tts-solo-agent'
  | 'tts-read-agent';

/**
 * Commands whose meaning depends on the words that follow the matched
 * phrase (e.g. "focus on calendar"). Callers should treat the match
 * `remainder` as an argument rather than ignoring it.
 */
export const PARAMETERIZED_VOICE_COMMANDS: ReadonlySet<VoiceCommandId> = new Set([
  'focus-agent',
  'tts-mute-agent',
  'tts-unmute-agent',
  'tts-solo-agent',
  'tts-read-agent',
]);

export interface VoiceCommandDefinition {
  /** Stable id used by callers to dispatch app actions. */
  id: VoiceCommandId;
  /** Short label suitable for menu announcements and confirmation TTS. */
  label: string;
  /**
   * Spoken phrases that resolve to this command. Matching is case- and
   * punctuation-insensitive and matches the phrase at the start, end, or
   * entirety of the utterance. Longer aliases win over shorter ones, so
   * "stop talking" is preferred over "stop" when both apply.
   */
  aliases: readonly string[];
}

export const DEFAULT_VOICE_COMMANDS: readonly VoiceCommandDefinition[] = [
  {
    id: 'stop-tts',
    label: 'Stop talking',
    aliases: [
      'stop talking',
      'stop speaking',
      'stop the audio',
      'stop audio',
      'pause speech',
      'pause speaking',
      'stop tts',
      'be quiet',
      'quiet please',
    ],
  },
  {
    id: 'stop-agent-turn',
    label: 'Stop agent',
    aliases: [
      'stop the agent',
      'stop this turn',
      'stop this run',
      'cancel this run',
      'cancel the agent',
      'cancel agent',
      'cancel turn',
      'cancel run',
      'stop the turn',
      'stop the run',
      'stop turn',
      'stop run',
      'stop agent',
      'cancel',
      'stop',
    ],
  },
  {
    id: 'new-session',
    label: 'New agent',
    aliases: [
      'new agent',
      'start a new agent',
      'start new agent',
      'new chat',
      'new session',
      'start a new session',
      'start a new chat',
      'start new chat',
      'start new session',
      'open a new chat',
      'open new chat',
      'start a new agent session',
      'new agent session',
    ],
  },
  {
    id: 'list-recent-agents',
    label: 'Recent agents',
    aliases: [
      'list recent agents',
      'show recent agents',
      'recent agents',
      'list my agents',
      'show my agents',
      'list agents',
      'show agents',
      'my agents',
      'recent chats',
      'list recent chats',
    ],
  },
  {
    id: 'list-old-agents',
    label: 'Old agents',
    aliases: [
      'list old agents',
      'show old agents',
      'old agents',
      'list archived agents',
      'show archived agents',
      'archived agents',
      'old chats',
      'archived chats',
      'list old chats',
    ],
  },
  {
    id: 'focus-agent',
    label: 'Focus agent',
    aliases: [
      'switch to the agent',
      'switch to agent',
      'focus on the agent',
      'focus on agent',
      'focus the agent',
      'focus agent',
      'select the agent',
      'select agent',
      'switch to',
      'focus on',
      'open agent',
      'go to agent',
      'focus',
    ],
  },
  {
    id: 'open-menu',
    label: 'Open menu',
    aliases: [
      'command menu',
      'open command menu',
      'agent menu',
      'open agent menu',
      'open menu',
      'open the menu',
      'show menu',
      'show commands',
    ],
  },
  {
    id: 'tts-stop-all',
    label: 'Stop everyone',
    aliases: [
      'stop everyone',
      'stop all audio',
      'stop everything',
      'silence everyone',
      'silence all',
      'quiet everyone',
      'stop all',
    ],
  },
  {
    id: 'tts-skip',
    label: 'Skip',
    aliases: [
      'skip this',
      'skip that',
      'next one',
      'skip',
      'next',
    ],
  },
  {
    id: 'tts-pause',
    label: 'Pause playback',
    aliases: [
      'pause playback',
      'pause audio',
      'pause the audio',
      'pause',
    ],
  },
  {
    id: 'tts-resume',
    label: 'Resume playback',
    aliases: [
      'resume playback',
      'resume audio',
      'continue playback',
      'keep going',
      'resume',
      'continue',
    ],
  },
  {
    id: 'tts-whats-playing',
    label: "What's playing",
    aliases: [
      'whats playing',
      'what is playing',
      'whos talking',
      'who is talking',
      'who is speaking',
      'whats in the queue',
      'what is in the queue',
      'queue status',
    ],
  },
  {
    id: 'tts-read-everything',
    label: 'Read everything',
    aliases: [
      'read everything',
      'read all agents',
      'read the rest',
      'catch up',
      'read all',
    ],
  },
  {
    id: 'tts-announce-only',
    label: 'Announce only',
    aliases: [
      'announce only',
      'announcements only',
      'summaries only',
      'just announce',
    ],
  },
  {
    id: 'tts-repeat',
    label: 'Repeat',
    aliases: [
      'say that again',
      'repeat that',
      'come again',
      'repeat',
    ],
  },
  {
    id: 'tts-mute-agent',
    label: 'Mute agent',
    aliases: [
      'mute the agent',
      'mute agent',
      'ignore the agent',
      'ignore agent',
      'mute',
      'ignore',
    ],
  },
  {
    id: 'tts-unmute-agent',
    label: 'Unmute agent',
    aliases: [
      'unmute the agent',
      'unmute agent',
      'listen to the agent',
      'listen to',
      'unmute',
    ],
  },
  {
    id: 'tts-solo-agent',
    label: 'Only this agent',
    aliases: [
      'only listen to',
      'only the agent',
      'solo the agent',
      'just listen to',
      'solo agent',
      'only',
      'just',
      'solo',
    ],
  },
  {
    id: 'tts-read-agent',
    label: 'Read agent now',
    aliases: [
      'read me the agent',
      'read the agent',
      'play the agent',
      'read agent',
      'play agent',
      'read',
      'play',
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
 * Returns the first command whose phrase occurs as the whole utterance
 * or at the leading/trailing boundary, with the remainder of the
 * utterance preserved so callers can decide what to do with extra
 * speech (e.g. "stop and start a new chat").
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
    if (normalized.startsWith(`${phrase} `)) {
      return {
        command: command.id,
        label: command.label,
        matchedPhrase: phrase,
        remainder: normalized.slice(phrase.length + 1),
      };
    }
    if (normalized.endsWith(` ${phrase}`)) {
      return {
        command: command.id,
        label: command.label,
        matchedPhrase: phrase,
        remainder: normalized.slice(0, normalized.length - phrase.length - 1),
      };
    }
  }

  return null;
}

/**
 * Convenience: distinct human-readable labels for menu prompts ("Say
 * stop talking, stop agent, or new chat").
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
