import { describe, expect, it } from 'vitest';

import {
  getInitialSplitSessionIds,
  reconcileSplitPaneSelection,
  replaceSplitPaneSelection,
  resolveSplitOrientation,
} from './split-chat-utils';

describe('split-chat-utils', () => {
  it('prefers the current session when choosing initial panes', () => {
    expect(getInitialSplitSessionIds(['s1', 's2', 's3'], 's2')).toEqual({
      primary: 's2',
      secondary: 's1',
    });
  });

  it('swaps panes instead of duplicating the same session in both panes', () => {
    expect(replaceSplitPaneSelection({ primary: 's1', secondary: 's2' }, 'primary', 's2')).toEqual({
      primary: 's2',
      secondary: 's1',
    });
  });

  it('reconciles missing selections against the available sessions', () => {
    expect(reconcileSplitPaneSelection({ primary: 'missing', secondary: null }, ['s1', 's2'], 's2')).toEqual({
      primary: 's2',
      secondary: 's1',
    });
  });

  it('chooses a side-by-side layout automatically on wide screens', () => {
    expect(resolveSplitOrientation('auto', 1200, 800)).toBe('vertical');
  });

  it('chooses a stacked layout automatically on narrow screens', () => {
    expect(resolveSplitOrientation('auto', 430, 932)).toBe('horizontal');
  });
})