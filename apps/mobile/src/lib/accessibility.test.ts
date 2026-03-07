import { describe, expect, it } from 'vitest';
import {
  createMcpServerSwitchAccessibilityLabel,
  createSwitchAccessibilityLabel,
} from './accessibility';

describe('createSwitchAccessibilityLabel', () => {
  it('adds a toggle suffix for named settings', () => {
    expect(createSwitchAccessibilityLabel('Text-to-Speech')).toBe('Text-to-Speech toggle');
  });

  it('trims surrounding whitespace', () => {
    expect(createSwitchAccessibilityLabel('  Hands-free Voice Mode  ')).toBe('Hands-free Voice Mode toggle');
  });

  it('falls back for empty names', () => {
    expect(createSwitchAccessibilityLabel('   ')).toBe('Setting toggle');
  });
});

describe('createMcpServerSwitchAccessibilityLabel', () => {
  it('creates a stable server toggle label', () => {
    expect(createMcpServerSwitchAccessibilityLabel('github')).toBe('Enable github MCP server');
  });

  it('falls back when server name is blank', () => {
    expect(createMcpServerSwitchAccessibilityLabel('')).toBe('Enable MCP server');
  });
});

