import { describe, expect, it, vi } from 'vitest';
import { arrayBufferToBase64, getMentraPhotoCallbackUrl } from './mentraNetworking';

describe('Mentra networking', () => {
  it('builds reachable authenticated photo callback URLs', () => {
    expect(getMentraPhotoCallbackUrl('http://192.168.1.5:3210/v1/', 'photo_1'))
      .toBe('http://192.168.1.5:3210/v1/mentra/photos/photo_1');
    expect(() => getMentraPhotoCallbackUrl('http://localhost:3210/v1', 'photo_1'))
      .toThrow('not reachable');
    expect(() => getMentraPhotoCallbackUrl('http://127.0.0.1:3210/v1', 'photo_1'))
      .toThrow('not reachable');
  });

  it('encodes ArrayBuffers without depending on Node Buffer', () => {
    vi.stubGlobal('btoa', (value: string) => Buffer.from(value, 'binary').toString('base64'));
    expect(arrayBufferToBase64(Uint8Array.from([0, 1, 2, 255]).buffer)).toBe('AAEC/w==');
    vi.unstubAllGlobals();
  });
});
