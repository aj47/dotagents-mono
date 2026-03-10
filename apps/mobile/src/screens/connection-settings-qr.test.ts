import { describe, expect, it, vi } from 'vitest';

import { parseDotAgentsConnectionConfig, resolveQrScannerActivation } from './connection-settings-qr';

describe('parseDotAgentsConnectionConfig', () => {
  it('parses a copied desktop deep link into connection fields', () => {
    expect(parseDotAgentsConnectionConfig(
      ' dotagents://config?baseUrl=https%3A%2F%2Fexample.com%2Fv1&apiKey=test-key&model=gpt-4o-mini '
    )).toEqual({
      baseUrl: 'https://example.com/v1',
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
    });
  });

  it('returns null for non-dotagents links', () => {
    expect(parseDotAgentsConnectionConfig('https://example.com/not-a-dotagents-link')).toBeNull();
  });
});

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