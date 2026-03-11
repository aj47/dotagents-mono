import { describe, expect, it, vi } from 'vitest';

import {
  CONNECTION_BASE_URL_HELPER_TEXT,
  DEFAULT_OPENAI_BASE_URL,
  resolveConnectionBaseUrlForSave,
} from './connection-settings-copy';
import { getQrScannerWebSheetContent, resolveQrScannerActivation } from './connection-settings-qr';

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

  it('shows an explicit browser guidance sheet before web camera permission is requested', () => {
    expect(getQrScannerWebSheetContent({
      permission: null,
      hasRequestedPermission: false,
    })).toEqual({
      title: 'Allow camera access to scan',
      message: 'On web, your browser may show a camera prompt after you continue. If nothing appears, check the address bar or site settings. You can still enter the API key and base URL manually below.',
      actionLabel: 'Allow camera access',
    });
  });

  it('keeps browser guidance visible after a denied permission attempt that can still be retried', () => {
    expect(getQrScannerWebSheetContent({
      permission: { granted: false, canAskAgain: true },
      hasRequestedPermission: true,
    })).toEqual({
      title: 'Allow camera access to keep scanning',
      message: 'Camera access is required to scan a QR code. If no browser prompt appeared, check the address bar or browser site settings, then try again. You can still enter the API key and base URL manually below.',
      actionLabel: 'Try camera access again',
    });
  });

  it('shows a blocked-browser state without a retry button when camera access is blocked', () => {
    expect(getQrScannerWebSheetContent({
      permission: { granted: false, canAskAgain: false },
      hasRequestedPermission: true,
    })).toEqual({
      title: 'Camera blocked in this browser',
      message: 'Camera access is blocked in this browser. Allow camera access in your browser site settings and reopen the scanner. You can still enter the API key and base URL manually below.',
      actionLabel: null,
    });
  });
});

describe('connection settings manual setup copy', () => {
  it('keeps the OpenAI helper text explicit for the manual path', () => {
    expect(CONNECTION_BASE_URL_HELPER_TEXT).toBe(
      'Leave Base URL empty to use OpenAI by default, or enter another OpenAI-compatible server URL.'
    );
  });

  it('falls back to the OpenAI base URL only when saving an empty draft URL', () => {
    expect(resolveConnectionBaseUrlForSave('')).toBe(DEFAULT_OPENAI_BASE_URL);
    expect(resolveConnectionBaseUrlForSave('   ')).toBe(DEFAULT_OPENAI_BASE_URL);
    expect(resolveConnectionBaseUrlForSave(' https://example.com/v1/ ')).toBe('https://example.com/v1/');
  });
});