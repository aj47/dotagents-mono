import { describe, expect, it, vi } from 'vitest';

import { resolveQrScannerActivation } from './connection-settings-qr';

describe('resolveQrScannerActivation', () => {
  it('returns a visible browser guidance error when camera permission is denied', async () => {
    const requestPermission = vi.fn().mockResolvedValue({ granted: false, canAskAgain: true });

    await expect(resolveQrScannerActivation({
      hasPermission: false,
      isWeb: true,
      requestPermission,
    })).resolves.toEqual({
      errorMessage: 'Camera access is required to scan a QR code. Allow camera access in your browser and try scanning again.',
      shouldShowScanner: false,
    });
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('returns blocked-browser guidance when permission can no longer be requested', async () => {
    const requestPermission = vi.fn().mockResolvedValue({ granted: false, canAskAgain: false });

    await expect(resolveQrScannerActivation({
      hasPermission: false,
      isWeb: true,
      requestPermission,
    })).resolves.toEqual({
      errorMessage: 'Camera access is blocked in this browser. Allow camera access in your browser site settings and try scanning again.',
      shouldShowScanner: false,
    });
  });

  it('opens the scanner immediately when permission is already granted', async () => {
    const requestPermission = vi.fn();

    await expect(resolveQrScannerActivation({
      hasPermission: true,
      isWeb: true,
      requestPermission,
    })).resolves.toEqual({
      errorMessage: null,
      shouldShowScanner: true,
    });
    expect(requestPermission).not.toHaveBeenCalled();
  });
});