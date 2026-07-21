import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VOICE_COMMANDS,
  PARAMETERIZED_VOICE_COMMANDS,
  getVoiceCommandMenuLabels,
  matchVoiceCommand,
} from './hands-free-commands';

describe('matchVoiceCommand', () => {
  it('returns null for empty or ordinary dictation', () => {
    expect(matchVoiceCommand('')).toBeNull();
    expect(matchVoiceCommand('tell me a joke')).toBeNull();
    expect(matchVoiceCommand('continue reading the plan')).toBeNull();
    expect(matchVoiceCommand('focus on the calendar problem')).toBeNull();
    expect(matchVoiceCommand('play the next video')).toBeNull();
  });

  it('recognizes the compact command set', () => {
    expect(matchVoiceCommand('Stop.')?.command).toBe('stop');
    expect(matchVoiceCommand('stop talking')?.command).toBe('stop');
    expect(matchVoiceCommand('New Chat.')?.command).toBe('new-session');
    expect(matchVoiceCommand('repeat')?.command).toBe('repeat');
  });

  it('opens agent discovery when switch agent has no target', () => {
    const match = matchVoiceCommand('switch agent');
    expect(match?.command).toBe('switch-agent');
    expect(match?.remainder).toBe('');
  });

  it('returns an agent name for the switch fast path', () => {
    const match = matchVoiceCommand('switch to calendar planner');
    expect(match?.command).toBe('switch-agent');
    expect(match?.remainder).toBe('calendar planner');
  });

  it('marks switch agent as the only parameterized command', () => {
    expect([...PARAMETERIZED_VOICE_COMMANDS]).toEqual(['switch-agent']);
  });

  it('requires non-parameterized commands to be complete phrases', () => {
    expect(matchVoiceCommand('stop okay I think we need to revise the plan')).toBeNull();
    expect(matchVoiceCommand('I think we should stop')).toBeNull();
    expect(matchVoiceCommand('new chat about the launch plan')).toBeNull();
  });

  it('respects a caller-supplied command registry', () => {
    const result = matchVoiceCommand('repeat that', [
      { id: 'repeat', label: 'Repeat', aliases: ['repeat that'] },
    ]);
    expect(result?.command).toBe('repeat');
    expect(matchVoiceCommand('repeat that', [])).toBeNull();
  });
});

describe('getVoiceCommandMenuLabels', () => {
  it('returns the four user-facing commands', () => {
    expect(getVoiceCommandMenuLabels()).toEqual([
      'Stop',
      'New chat',
      'Switch agent',
      'Repeat',
    ]);
    expect(getVoiceCommandMenuLabels()).toEqual(
      DEFAULT_VOICE_COMMANDS.map((command) => command.label),
    );
  });
});
