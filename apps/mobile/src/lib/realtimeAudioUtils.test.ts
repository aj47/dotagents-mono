import { describe, expect, it } from 'vitest';
import { base64ToUint8Array, concatenateUint8Arrays, createPcm16WavFile } from './realtimeAudioUtils';

describe('realtimeAudioUtils', () => {
  it('decodes base64 audio chunks', () => {
    expect(Array.from(base64ToUint8Array('AQIDBA=='))).toEqual([1, 2, 3, 4]);
  });

  it('concatenates audio chunks in order', () => {
    const combined = concatenateUint8Arrays([
      new Uint8Array([1, 2]),
      new Uint8Array([3]),
      new Uint8Array([4, 5]),
    ]);
    expect(Array.from(combined)).toEqual([1, 2, 3, 4, 5]);
  });

  it('wraps pcm16 data in a wav header', () => {
    const wav = createPcm16WavFile(new Uint8Array([1, 0, 2, 0]), { sampleRate: 24000, channels: 1 });
    const ascii = (start: number, length: number) => String.fromCharCode(...wav.slice(start, start + length));

    expect(ascii(0, 4)).toBe('RIFF');
    expect(ascii(8, 4)).toBe('WAVE');
    expect(ascii(36, 4)).toBe('data');
    expect(wav[24]).toBe(0xc0);
    expect(wav[25]).toBe(0x5d);
    expect(wav.slice(44)).toEqual(new Uint8Array([1, 0, 2, 0]));
  });
});