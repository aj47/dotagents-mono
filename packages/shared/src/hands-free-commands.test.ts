import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VOICE_COMMANDS,
  getVoiceCommandMenuLabels,
  matchVoiceCommand,
} from './hands-free-commands';

describe('matchVoiceCommand', () => {
  it('returns null for empty input', () => {
    expect(matchVoiceCommand('')).toBeNull();
    expect(matchVoiceCommand('   ')).toBeNull();
  });

  it('returns null when no alias matches', () => {
    expect(matchVoiceCommand('tell me a joke')).toBeNull();
  });

  it('matches the bare stop command to stop-agent-turn', () => {
    const match = matchVoiceCommand('stop');
    expect(match?.command).toBe('stop-agent-turn');
    expect(match?.remainder).toBe('');
  });

  it('prefers the longest matching alias', () => {
    const match = matchVoiceCommand('stop talking');
    expect(match?.command).toBe('stop-tts');
    expect(match?.matchedPhrase).toBe('stop talking');
  });

  it('normalizes punctuation and casing', () => {
    expect(matchVoiceCommand('Stop, please!')?.command).toBe('stop-agent-turn');
    expect(matchVoiceCommand('New Chat.')?.command).toBe('new-session');
  });

  it('matches a phrase at the start and returns the remainder', () => {
    const match = matchVoiceCommand('new chat about my calendar');
    expect(match?.command).toBe('new-session');
    expect(match?.remainder).toBe('about my calendar');
  });

  it('matches a phrase at the end and returns the prefix as remainder', () => {
    const match = matchVoiceCommand('okay stop talking');
    expect(match?.command).toBe('stop-tts');
    expect(match?.remainder).toBe('okay');
  });

  it('resolves all default command intents', () => {
    expect(matchVoiceCommand('stop the agent')?.command).toBe('stop-agent-turn');
    expect(matchVoiceCommand('pause speech')?.command).toBe('stop-tts');
    expect(matchVoiceCommand('start a new chat')?.command).toBe('new-session');
    expect(matchVoiceCommand('open the menu')?.command).toBe('open-menu');
    expect(matchVoiceCommand('list recent agents')?.command).toBe('list-recent-agents');
    expect(matchVoiceCommand('show old agents')?.command).toBe('list-old-agents');
    expect(matchVoiceCommand('focus on calendar')?.command).toBe('focus-agent');
  });

  it('returns the spoken agent name as the remainder of a focus command', () => {
    const match = matchVoiceCommand('focus on calendar planner');
    expect(match?.command).toBe('focus-agent');
    expect(match?.remainder).toBe('calendar planner');
  });

  it('does not confuse "open agent menu" with "open agent"', () => {
    expect(matchVoiceCommand('open agent menu')?.command).toBe('open-menu');
    expect(matchVoiceCommand('open agent research bot')?.command).toBe('focus-agent');
  });

  it('respects a caller-supplied command registry', () => {
    const result = matchVoiceCommand('repeat that', [
      { id: 'open-menu', label: 'Open menu', aliases: ['repeat that'] },
    ]);
    expect(result?.command).toBe('open-menu');
    expect(matchVoiceCommand('repeat that', [])).toBeNull();
  });
});

describe('getVoiceCommandMenuLabels', () => {
  it('returns one label per default command', () => {
    expect(getVoiceCommandMenuLabels()).toEqual(
      DEFAULT_VOICE_COMMANDS.map((c) => c.label),
    );
  });

  it('de-duplicates by label when commands share a display label', () => {
    const labels = getVoiceCommandMenuLabels([
      { id: 'stop-tts', label: 'Stop talking', aliases: ['stop talking'] },
      { id: 'stop-agent-turn', label: 'Stop talking', aliases: ['stop the agent'] },
    ]);
    expect(labels).toEqual(['Stop talking']);
  });
});
