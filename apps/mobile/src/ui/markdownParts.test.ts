import { describe, expect, it } from 'vitest';
import { splitMarkdownContent } from '@dotagents/shared/markdown-render-parts';

describe('splitMarkdownContent', () => {
  it('extracts Codex thinking blocks from regular markdown', () => {
    expect(splitMarkdownContent('Before <think>reasoning</think> After')).toEqual([
      { type: 'markdown', content: 'Before ' },
      { type: 'think', content: 'reasoning' },
      { type: 'markdown', content: ' After' },
    ]);
  });

  it('keeps renderable videos as separate parts outside think blocks', () => {
    const parts = splitMarkdownContent('Watch [clip](https://example.com/demo.mp4) <think>not video</think>');

    expect(parts).toEqual([
      { type: 'markdown', content: 'Watch ' },
      { type: 'video', label: 'clip', url: 'https://example.com/demo.mp4' },
      { type: 'think', content: 'not video' },
    ]);
  });
});
