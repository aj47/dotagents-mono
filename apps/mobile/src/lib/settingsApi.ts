/**
 * Settings API client for communicating with the desktop app's remote server.
 *
 * The generic API client lives in @dotagents/shared. Mobile keeps this wrapper
 * to attach the stable device ID used by operator audit and allowlist checks.
 */

import {
  DOTAGENTS_DEVICE_ID_HEADER,
  ExtendedSettingsApiClient as SharedExtendedSettingsApiClient,
  SettingsApiClient as SharedSettingsApiClient,
  type SettingsApiClientOptions,
} from '@dotagents/shared/settings-api-client';
import { getDeviceIdentity } from './deviceIdentity';

let stableDeviceIdPromise: Promise<string | undefined> | null = null;

async function getStableDeviceId(): Promise<string | undefined> {
  if (!stableDeviceIdPromise) {
    stableDeviceIdPromise = getDeviceIdentity()
      .then((identity) => identity.deviceId)
      .catch((error) => {
        stableDeviceIdPromise = null;
        console.warn('[SettingsApiClient] Failed to load stable device identity:', error);
        return undefined;
      });
  }

  return stableDeviceIdPromise;
}

function withMobileDeviceIdentity(options: SettingsApiClientOptions = {}): SettingsApiClientOptions {
  return {
    ...options,
    deviceIdHeaderName: options.deviceIdHeaderName ?? DOTAGENTS_DEVICE_ID_HEADER,
    getDeviceId: options.getDeviceId ?? getStableDeviceId,
  };
}

export class SettingsApiClient extends SharedSettingsApiClient {
  constructor(baseUrl: string, apiKey: string, options: SettingsApiClientOptions = {}) {
    super(baseUrl, apiKey, withMobileDeviceIdentity(options));
  }
}

export class ExtendedSettingsApiClient extends SharedExtendedSettingsApiClient {
  constructor(baseUrl: string, apiKey: string, options: SettingsApiClientOptions = {}) {
    super(baseUrl, apiKey, withMobileDeviceIdentity(options));
  }
}

// Factory function to create a client from app config
export function createSettingsApiClient(baseUrl: string, apiKey: string): SettingsApiClient {
  return new SettingsApiClient(baseUrl, apiKey);
}

// Factory function to create an extended client with push notification support
export function createExtendedSettingsApiClient(baseUrl: string, apiKey: string): ExtendedSettingsApiClient {
  return new ExtendedSettingsApiClient(baseUrl, apiKey);
}
