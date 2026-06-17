import { describe, expect, it, vi } from 'vitest';

import { parseConnectionQrCode, resolveQrScannerActivation } from './connection-settings-qr';

describe('resolveQrScannerActivation', () => {
  it('returns a visible browser guidance error when camera permission is denied', async () => {
    const requestPermission = vi.fn().mockResolvedValue({ granted: false, canAskAgain: true });

    await expect(resolveQrScannerActivation({
      hasPermission: false,
      isWeb: true,
      requestPermission,
    })).resolves.toBe('Camera access is required to scan a QR code. Allow camera access in your browser and try scanning again.');
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('returns blocked-browser guidance when permission can no longer be requested', async () => {
    const requestPermission = vi.fn().mockResolvedValue({ granted: false, canAskAgain: false });

    await expect(resolveQrScannerActivation({
      hasPermission: false,
      isWeb: true,
      requestPermission,
    })).resolves.toBe('Camera access is blocked in this browser. Allow camera access in your browser site settings and try scanning again.');
  });

  it('opens the scanner immediately when permission is already granted', async () => {
    const requestPermission = vi.fn();

    await expect(resolveQrScannerActivation({
      hasPermission: true,
      isWeb: true,
      requestPermission,
    })).resolves.toBeNull();
    expect(requestPermission).not.toHaveBeenCalled();
  });
});

describe('parseConnectionQrCode', () => {
  it('preserves an explicit HTTP Tailscale IP base URL', () => {
    const qrValue = `dotagents://config?baseUrl=${encodeURIComponent('http://100.122.255.96:3210/v1')}&apiKey=secret`;

    expect(parseConnectionQrCode(qrValue)).toEqual({
      baseUrl: 'http://100.122.255.96:3210/v1',
      apiKey: 'secret',
      model: undefined,
    });
  });

  it('parses config as a path target', () => {
    expect(parseConnectionQrCode('dotagents:/config?baseUrl=http%3A%2F%2F100.122.255.96%3A3210%2Fv1&apiKey=secret')).toEqual({
      baseUrl: 'http://100.122.255.96:3210/v1',
      apiKey: 'secret',
      model: undefined,
    });
  });

  it('rejects unrelated QR codes', () => {
    expect(parseConnectionQrCode('https://example.com')).toBeNull();
  });
});
