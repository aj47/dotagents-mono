import { describe, expect, it } from 'vitest';

import {
  applyMobilePairingConfig,
  EMPTY_MANUAL_PAIRING_LINK_ERROR,
  INCOMPLETE_MANUAL_PAIRING_LINK_ERROR,
  INVALID_MANUAL_PAIRING_LINK_ERROR,
  parseMobilePairingDeepLink,
  resolveManualMobilePairingDeepLink,
} from './mobilePairing';

describe('mobile pairing deep links', () => {
  it('parses and normalizes a valid desktop pairing deep link', () => {
    expect(
      parseMobilePairingDeepLink('dotagents://config?baseUrl=127.0.0.1%3A3210&apiKey=test-key&model=gpt-4.1')
    ).toEqual({
      baseUrl: 'http://127.0.0.1:3210/v1',
      apiKey: 'test-key',
      model: 'gpt-4.1',
    });
  });

  it('rejects incomplete pairing links that omit the API key', () => {
    expect(parseMobilePairingDeepLink('dotagents://config?baseUrl=https%3A%2F%2Fexample.com%2Fv1')).toBeNull();

    expect(
      resolveManualMobilePairingDeepLink('dotagents://config?baseUrl=https%3A%2F%2Fexample.com%2Fv1')
    ).toEqual({
      ok: false,
      errorMessage: INCOMPLETE_MANUAL_PAIRING_LINK_ERROR,
    });
  });

  it('distinguishes blank manual input from malformed links', () => {
    expect(resolveManualMobilePairingDeepLink('   ')).toEqual({
      ok: false,
      errorMessage: EMPTY_MANUAL_PAIRING_LINK_ERROR,
    });

    expect(resolveManualMobilePairingDeepLink('invalid-link')).toEqual({
      ok: false,
      errorMessage: INVALID_MANUAL_PAIRING_LINK_ERROR,
    });
  });

  it('applies parsed pairing config without dropping unrelated settings', () => {
    expect(applyMobilePairingConfig({
      baseUrl: 'https://old.example/v1',
      apiKey: 'old-key',
      model: 'old-model',
      handsFree: true,
    }, {
      baseUrl: 'https://new.example/v1',
      apiKey: 'new-key',
    })).toEqual({
      baseUrl: 'https://new.example/v1',
      apiKey: 'new-key',
      model: 'old-model',
      handsFree: true,
    });
  });
});