import { describe, expect, it } from 'vitest';

import { shouldRenderOptionalChild } from './chat-render-guards';

describe('shouldRenderOptionalChild', () => {
  it('does not render empty or whitespace-only strings into View children', () => {
    expect(shouldRenderOptionalChild('')).toBe(false);
    expect(shouldRenderOptionalChild('   ')).toBe(false);
  });

  it('renders visible strings and truthy non-string values', () => {
    expect(shouldRenderOptionalChild('Error loading chat')).toBe(true);
    expect(shouldRenderOptionalChild({ args: 'value' })).toBe(true);
  });
});