import { describe, expect, it } from 'vitest'
import {
  buildMarkdownMediaTag,
  countMarkdownMedia,
  escapeMarkdownMediaAltText,
  getMarkdownMediaKind,
  getMarkdownMediaLabel,
  isVideoMarkdownAltText,
  replaceMarkdownMedia,
  splitContentByMarkdownVideos,
} from './message-media'

describe('message-media', () => {
  it('detects video alt text prefixes', () => {
    expect(isVideoMarkdownAltText('video: demo')).toBe(true)
    expect(isVideoMarkdownAltText('Video: demo')).toBe(true)
    expect(isVideoMarkdownAltText('demo')).toBe(false)
  })

  it('normalizes media labels and kinds', () => {
    expect(getMarkdownMediaKind('video: clip')).toBe('video')
    expect(getMarkdownMediaKind('diagram')).toBe('image')
    expect(getMarkdownMediaLabel('video: clip')).toBe('clip')
    expect(getMarkdownMediaLabel('diagram')).toBe('diagram')
  })

  it('escapes markdown alt text', () => {
    expect(escapeMarkdownMediaAltText('[demo] \\ clip')).toBe('demo  clip')
  })

  it('builds image and video markdown tags', () => {
    expect(buildMarkdownMediaTag('image', 'photo', 'https://example.com/photo.png')).toBe(
      '![photo](https://example.com/photo.png)'
    )
    expect(buildMarkdownMediaTag('video', 'clip', 'blob:http://localhost/demo')).toBe(
      '![video: clip](blob:http://localhost/demo)'
    )
  })

  it('counts image and video markdown tags', () => {
    const counts = countMarkdownMedia(
      '![photo](https://example.com/photo.png) ![video: clip](blob:http://localhost/demo)'
    )
    expect(counts).toEqual({ images: 1, videos: 1 })
  })

  it('replaces media tokens while preserving metadata', () => {
    const result = replaceMarkdownMedia(
      'Look ![photo](https://example.com/photo.png) and ![video: clip](blob:http://localhost/demo)',
      ({ kind, label }) => `[${kind}:${label}]`
    )
    expect(result).toBe('Look [image:photo] and [video:clip]')
  })

  it('splits markdown content around video tags', () => {
    const segments = splitContentByMarkdownVideos(
      'Before ![video: clip](blob:http://localhost/demo) after ![photo](https://example.com/photo.png)'
    )
    expect(segments).toEqual([
      { kind: 'markdown', content: 'Before ' },
      { kind: 'video', label: 'clip', url: 'blob:http://localhost/demo' },
      { kind: 'markdown', content: ' after ![photo](https://example.com/photo.png)' },
    ])
  })
})
