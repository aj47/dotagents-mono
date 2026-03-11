import { isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
}));

import { SettingsHomeChatsCta } from './settings-home-chats-cta';

function findAllByType(node: unknown, type: string): any[] {
  const matches: any[] = [];

  const visit = (value: unknown): void => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isValidElement(value)) return;

    if (value.type === type) matches.push(value);
    visit(value.props?.children);
  };

  visit(node);
  return matches;
}

function readText(node: unknown): string {
  if (node == null) return '';
  if (Array.isArray(node)) return node.map(readText).join('');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!isValidElement(node)) return '';
  return readText(node.props?.children);
}

describe('SettingsHomeChatsCta', () => {
  it('keeps chats reachable from the disconnected settings home and preserves the offline helper copy', () => {
    const onOpenChats = vi.fn();
    const tree = SettingsHomeChatsCta({
      isConnected: false,
      onOpenChats,
      buttonStyle: null,
      buttonTextStyle: null,
      helperTextStyle: null,
    });

    const [button] = findAllByType(tree, 'TouchableOpacity');
    const textNodes = findAllByType(tree, 'Text').map(readText);

    expect(button).toBeDefined();
    expect(button.props.disabled).not.toBe(true);
    expect(button.props.accessibilityLabel).toBe('Open Chats');
    expect(button.props.accessibilityHint).toBe('Opens saved chats even while disconnected. Connect first to send new messages.');
    expect(textNodes).toContain('Open Chats');
    expect(textNodes).toContain('Review saved chats while disconnected. Connect before sending new messages.');

    button.props.onPress();

    expect(onOpenChats).toHaveBeenCalledTimes(1);
  });
});