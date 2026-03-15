import { describe, it, expect } from 'vitest';
import { parseInput, getHelpText } from './command-parser';
import type { ParsedCommand, ParsedMessage } from './command-parser';

describe('command-parser', () => {
  describe('parseInput', () => {
    it('treats plain text as a message', () => {
      const result = parseInput('hello world');
      expect(result.type).toBe('message');
      expect((result as ParsedMessage).content).toBe('hello world');
    });

    it('trims whitespace from messages', () => {
      const result = parseInput('  hello  ');
      expect(result.type).toBe('message');
      expect((result as ParsedMessage).content).toBe('hello');
    });

    it('parses /new as a command', () => {
      const result = parseInput('/new');
      expect(result.type).toBe('command');
      const cmd = result as ParsedCommand;
      expect(cmd.name).toBe('new');
      expect(cmd.args).toEqual([]);
    });

    it('parses /list as a command', () => {
      const result = parseInput('/list');
      expect(result.type).toBe('command');
      expect((result as ParsedCommand).name).toBe('list');
    });

    it('parses /conversations as a command', () => {
      const result = parseInput('/conversations');
      expect(result.type).toBe('command');
      expect((result as ParsedCommand).name).toBe('conversations');
    });

    it('parses /switch with an argument', () => {
      const result = parseInput('/switch conv_123');
      expect(result.type).toBe('command');
      const cmd = result as ParsedCommand;
      expect(cmd.name).toBe('switch');
      expect(cmd.args).toEqual(['conv_123']);
    });

    it('parses /switch with a numeric argument', () => {
      const result = parseInput('/switch 3');
      expect(result.type).toBe('command');
      const cmd = result as ParsedCommand;
      expect(cmd.name).toBe('switch');
      expect(cmd.args).toEqual(['3']);
    });

    it('parses /help as a command', () => {
      const result = parseInput('/help');
      expect(result.type).toBe('command');
      expect((result as ParsedCommand).name).toBe('help');
    });

    it('parses /quit as a command', () => {
      const result = parseInput('/quit');
      expect(result.type).toBe('command');
      expect((result as ParsedCommand).name).toBe('quit');
    });

    it('is case-insensitive for commands', () => {
      const result = parseInput('/NEW');
      expect(result.type).toBe('command');
      expect((result as ParsedCommand).name).toBe('new');
    });

    it('treats unknown slash commands as messages', () => {
      const result = parseInput('/unknown');
      expect(result.type).toBe('message');
      expect((result as ParsedMessage).content).toBe('/unknown');
    });

    it('handles extra whitespace in commands', () => {
      const result = parseInput('  /switch   conv_abc  ');
      expect(result.type).toBe('command');
      const cmd = result as ParsedCommand;
      expect(cmd.name).toBe('switch');
      expect(cmd.args).toEqual(['conv_abc']);
    });

    it('stores raw input in commands', () => {
      const result = parseInput('/switch conv_123');
      expect(result.type).toBe('command');
      expect((result as ParsedCommand).raw).toBe('/switch conv_123');
    });

    it('handles empty input as a message', () => {
      const result = parseInput('');
      expect(result.type).toBe('message');
      expect((result as ParsedMessage).content).toBe('');
    });

    it('handles / alone as a message (unknown command)', () => {
      const result = parseInput('/');
      expect(result.type).toBe('message');
    });

    it('parses /acp as a command', () => {
      const result = parseInput('/acp');
      expect(result.type).toBe('command');
      expect((result as ParsedCommand).name).toBe('acp');
    });

    it('parses /diagnostics as a command', () => {
      const result = parseInput('/diagnostics');
      expect(result.type).toBe('command');
      expect((result as ParsedCommand).name).toBe('diagnostics');
    });
  });

  describe('getHelpText', () => {
    it('returns help text containing all commands', () => {
      const help = getHelpText();
      expect(help).toContain('/new');
      expect(help).toContain('/list');
      expect(help).toContain('/conversations');
      expect(help).toContain('/switch');
      expect(help).toContain('/acp');
      expect(help).toContain('/diagnostics');
      expect(help).toContain('/help');
      expect(help).toContain('/quit');
    });
  });
});
