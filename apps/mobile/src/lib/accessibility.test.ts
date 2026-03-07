import { describe, expect, it } from 'vitest';
import {
  createButtonAccessibilityLabel,
  createChatComposerAccessibilityHint,
  createExpandCollapseAccessibilityLabel,
  createMcpServerSwitchAccessibilityLabel,
  createMinimumTouchTargetStyle,
  createSwitchAccessibilityLabel,
  createTextInputAccessibilityLabel,
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

describe('createButtonAccessibilityLabel', () => {
  it('adds a button suffix for named actions', () => {
    expect(createButtonAccessibilityLabel('Send message')).toBe('Send message button');
  });

  it('trims surrounding whitespace', () => {
    expect(createButtonAccessibilityLabel('  Attach images  ')).toBe('Attach images button');
  });

  it('falls back for empty names', () => {
    expect(createButtonAccessibilityLabel('   ')).toBe('Action button');
  });
});

describe('createTextInputAccessibilityLabel', () => {
  it('adds an input suffix for named fields', () => {
    expect(createTextInputAccessibilityLabel('API key')).toBe('API key input');
  });

  it('trims surrounding whitespace', () => {
    expect(createTextInputAccessibilityLabel('  Base URL  ')).toBe('Base URL input');
  });

  it('falls back for empty names', () => {
    expect(createTextInputAccessibilityLabel('   ')).toBe('Input field');
  });
});

describe('createChatComposerAccessibilityHint', () => {
  it('returns listening-specific guidance when voice input is active', () => {
    expect(
      createChatComposerAccessibilityHint({ handsFree: true, listening: true }),
    ).toBe('Voice listening is active. Dictated text appears in this message field.');
  });

  it('returns hands-free guidance when idle', () => {
    expect(
      createChatComposerAccessibilityHint({ handsFree: true, listening: false }),
    ).toBe('Type your message or tap the mic to dictate. Hands-free mode can send dictated speech automatically.');
  });

  it('returns standard push-to-talk guidance when hands-free is off', () => {
    expect(
      createChatComposerAccessibilityHint({ handsFree: false, listening: false }),
    ).toBe('Type your message or hold the mic to dictate before sending.');
  });

  it('appends keyboard submission guidance on web', () => {
    expect(
      createChatComposerAccessibilityHint({ handsFree: false, listening: false, isWeb: true }),
    ).toBe('Type your message or hold the mic to dictate before sending. Use Shift+Enter or Ctrl/Cmd+Enter to send.');
  });
});

describe('createExpandCollapseAccessibilityLabel', () => {
  it('returns an expand label when collapsed', () => {
    expect(createExpandCollapseAccessibilityLabel('message', false)).toBe('Expand message');
  });

  it('returns a collapse label when expanded', () => {
    expect(createExpandCollapseAccessibilityLabel('tool execution details', true)).toBe('Collapse tool execution details');
  });

  it('falls back for empty target names', () => {
    expect(createExpandCollapseAccessibilityLabel('   ', false)).toBe('Expand details');
  });
});

describe('createMinimumTouchTargetStyle', () => {
  it('returns 44x44 touch targets by default', () => {
    expect(createMinimumTouchTargetStyle()).toEqual({
      minWidth: 44,
      minHeight: 44,
      paddingHorizontal: 6,
      paddingVertical: 6,
      marginHorizontal: 2,
      alignItems: 'center',
      justifyContent: 'center',
    });
  });

  it('supports custom sizing and spacing overrides', () => {
    expect(createMinimumTouchTargetStyle({
      minSize: 48,
      horizontalPadding: 4,
      verticalPadding: 5,
      horizontalMargin: 1,
    })).toEqual({
      minWidth: 48,
      minHeight: 48,
      paddingHorizontal: 4,
      paddingVertical: 5,
      marginHorizontal: 1,
      alignItems: 'center',
      justifyContent: 'center',
    });
  });

  it('respects explicit zero horizontal margin override', () => {
    expect(createMinimumTouchTargetStyle({ horizontalMargin: 0 })).toEqual({
      minWidth: 44,
      minHeight: 44,
      paddingHorizontal: 6,
      paddingVertical: 6,
      marginHorizontal: 0,
      alignItems: 'center',
      justifyContent: 'center',
    });
  });
});

