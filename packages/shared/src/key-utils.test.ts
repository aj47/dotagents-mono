import { describe, expect, it } from 'vitest'

import {
  DEFAULT_TEXT_INPUT_ENABLED,
  DEFAULT_TEXT_INPUT_SHORTCUT,
  formatKeyComboForDisplay,
  getAgentShortcutDisplay,
  getDictationShortcutDisplay,
  getEffectiveShortcut,
  getTextInputShortcutDisplay,
  matchesKeyCombo,
} from './key-utils'

describe('matchesKeyCombo', () => {
  it('matches normalized aliases for event keys and stored shortcuts', () => {
    expect(
      matchesKeyCombo(
        { key: 'ArrowUp' },
        { ctrl: true, shift: false, alt: false, meta: false },
        ' Control - Up ',
      ),
    ).toBe(true)
  })

  it('matches space shortcuts from either event or config aliases', () => {
    expect(
      matchesKeyCombo(
        { key: ' ' },
        { ctrl: true, shift: false, alt: false, meta: false },
        'control-spacebar',
      ),
    ).toBe(true)
  })
})

describe('formatKeyComboForDisplay', () => {
  it('renders normalized special keys with friendly labels', () => {
    expect(formatKeyComboForDisplay('control-spacebar')).toBe('Ctrl + Space')
  })

  it('normalizes aliases and meta shortcuts for display', () => {
    expect(formatKeyComboForDisplay('cmd-return')).toBe(
      `${process.platform === 'darwin' ? 'Cmd' : 'Meta'} + Enter`,
    )
  })

  it('renders arrow aliases', () => {
    expect(formatKeyComboForDisplay('control-arrowleft')).toBe('Ctrl + \u2190')
  })
})

describe('shortcut display helpers', () => {
  it('exports shared text input defaults', () => {
    expect(DEFAULT_TEXT_INPUT_ENABLED).toBe(true)
    expect(DEFAULT_TEXT_INPUT_SHORTCUT).toBe('ctrl-t')
  })

  it('resolves custom shortcuts only when selected', () => {
    expect(getEffectiveShortcut('custom', 'ctrl-k')).toBe('ctrl-k')
    expect(getEffectiveShortcut('ctrl-t', 'ctrl-k')).toBe('ctrl-t')
  })

  it('formats agent, text input, and dictation shortcut defaults and customs', () => {
    expect(getAgentShortcutDisplay('toggle-ctrl-alt')).toBe('Press Ctrl+Alt')
    expect(getAgentShortcutDisplay('custom', 'ctrl-space')).toBe('Ctrl + Space')
    expect(getTextInputShortcutDisplay('ctrl-shift-t')).toBe('Ctrl+Shift+T')
    expect(getTextInputShortcutDisplay('custom', 'alt-return')).toBe('Alt + Enter')
    expect(getDictationShortcutDisplay('ctrl-slash')).toBe('Ctrl+/')
    expect(getDictationShortcutDisplay('custom', 'control-spacebar')).toBe('Ctrl + Space')
  })
})
