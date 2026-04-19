import { describe, expect, it } from 'vitest';
import {
  buildConversationVideoAssetHttpUrl,
  getVideoAssetLabel,
  isRenderableVideoUrl,
  parseConversationVideoAssetUrl,
} from './conversation-media-assets';

describe('conversation video asset utilities', () => {
  it('parses conversation video asset urls', () => {
    expect(parseConversationVideoAssetUrl('assets://conversation-video/conv_1/abcdef1234567890.mp4')).toEqual({
      conversationId: 'conv_1',
      fileName: 'abcdef1234567890.mp4',
    });
  });

  it('detects renderable video urls', () => {
    expect(isRenderableVideoUrl('assets://conversation-video/conv_1/abcdef1234567890.mp4')).toBe(true);
    expect(isRenderableVideoUrl('https://example.com/demo.webm?download=1')).toBe(true);
    expect(isRenderableVideoUrl('https://example.com/demo.png')).toBe(false);
  });

  it('builds authenticated remote asset urls from api base url', () => {
    expect(buildConversationVideoAssetHttpUrl(
      'http://localhost:3210/v1/',
      'assets://conversation-video/conv_1/abcdef1234567890.mp4',
    )).toBe('http://localhost:3210/v1/conversations/conv_1/assets/videos/abcdef1234567890.mp4');
  });

  it('uses link text before filename for labels', () => {
    expect(getVideoAssetLabel('Demo clip', 'assets://conversation-video/conv_1/abcdef1234567890.mp4')).toBe('Demo clip');
    expect(getVideoAssetLabel('', 'assets://conversation-video/conv_1/abcdef1234567890.mp4')).toBe('abcdef1234567890.mp4');
  });
});
