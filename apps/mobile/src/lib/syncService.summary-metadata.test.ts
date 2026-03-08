import { describe, expect, it } from 'vitest';
import { getSummaryCountLabel, getSummaryMetadata } from '@dotagents/shared';
import { fromServerMessage, toServerMessage } from './syncService';

describe('summary metadata helpers', () => {
  it('normalizes meaningful summary metadata', () => {
    expect(getSummaryMetadata({ isSummary: true, summarizedMessageCount: 6.9 })).toEqual({
      isSummary: true,
      summarizedMessageCount: 6,
    });
  });

  it('omits empty or invalid summary counts', () => {
    expect(getSummaryMetadata({ isSummary: false, summarizedMessageCount: 0 })).toEqual({});
    expect(getSummaryCountLabel()).toBe('Represents earlier messages outside the active window');
  });

  it('formats singular and plural count labels', () => {
    expect(getSummaryCountLabel(1)).toBe('Represents 1 earlier message');
    expect(getSummaryCountLabel(12)).toBe('Represents 12 earlier messages');
  });
});

describe('syncService summary metadata', () => {
  it('preserves summary metadata when converting server messages to mobile messages', () => {
    const mapped = fromServerMessage({
      role: 'assistant',
      content: 'Earlier context summary',
      isSummary: true,
      summarizedMessageCount: 24,
    }, 0);

    expect(mapped).toMatchObject({
      role: 'assistant',
      content: 'Earlier context summary',
      isSummary: true,
      summarizedMessageCount: 24,
    });
  });

  it('preserves summary metadata when converting mobile messages to server messages', () => {
    const mapped = toServerMessage({
      id: 'local-summary',
      role: 'assistant',
      content: 'Earlier context summary',
      timestamp: 123,
      isSummary: true,
      summarizedMessageCount: 24,
    });

    expect(mapped).toMatchObject({
      role: 'assistant',
      content: 'Earlier context summary',
      timestamp: 123,
      isSummary: true,
      summarizedMessageCount: 24,
    });
  });
});