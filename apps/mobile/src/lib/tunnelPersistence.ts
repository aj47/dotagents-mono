import AsyncStorage from '@react-native-async-storage/async-storage';

const TUNNEL_METADATA_KEY = 'dotagents_tunnel_metadata_v1';
const TUNNEL_API_KEY_SECURE_KEY = 'dotagents_tunnel_api_key_v1';

/**
 * Tunnel metadata for connection persistence.
 * Stores information needed to resume or reconnect to a tunnel.
 */
export interface TunnelMetadata {
  /** The base URL of the tunnel endpoint */
  baseUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Timestamp of last successful connection */
  lastConnectedAt: number;
  /** Optional session ID for resumption */
  sessionId?: string;
  /** Optional resume token from server */
  resumeToken?: string;
  /** Whether this was a Cloudflare tunnel (vs local network) */
  isCloudflareTunnel?: boolean;
}

type StoredTunnelMetadata = Omit<TunnelMetadata, 'apiKey'> & {
  apiKey?: string;
};

interface SecureStoreLike {
  isAvailableAsync: () => Promise<boolean>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  deleteItemAsync: (key: string) => Promise<void>;
}

function getSecureStore(): SecureStoreLike | null {
  try {
    // Keep SecureStore optional so mobile web/dev environments without the module
    // still work without crashing.
    const optionalRequire = Function('return require')() as (moduleName: string) => unknown;
    return optionalRequire('expo-secure-store') as SecureStoreLike;
  } catch {
    return null;
  }
}

async function saveApiKey(apiKey: string): Promise<boolean> {
  const secureStore = getSecureStore();
  if (!secureStore) {
    return false;
  }

  try {
    const isSecureStoreAvailable = await secureStore.isAvailableAsync();
    if (!isSecureStoreAvailable) {
      return false;
    }

    await secureStore.setItemAsync(TUNNEL_API_KEY_SECURE_KEY, apiKey);
    return true;
  } catch (error) {
    console.warn('[TunnelPersistence] Failed to save API key to secure storage, falling back to AsyncStorage:', error);
    return false;
  }
}

async function loadApiKey(): Promise<string | null> {
  const secureStore = getSecureStore();
  if (!secureStore) {
    return null;
  }

  try {
    const isSecureStoreAvailable = await secureStore.isAvailableAsync();
    if (!isSecureStoreAvailable) {
      return null;
    }

    return await secureStore.getItemAsync(TUNNEL_API_KEY_SECURE_KEY);
  } catch (error) {
    console.warn('[TunnelPersistence] Failed to load API key from secure storage:', error);
    return null;
  }
}

async function clearApiKey(): Promise<void> {
  const secureStore = getSecureStore();
  if (!secureStore) {
    return;
  }

  try {
    const isSecureStoreAvailable = await secureStore.isAvailableAsync();
    if (!isSecureStoreAvailable) {
      return;
    }

    await secureStore.deleteItemAsync(TUNNEL_API_KEY_SECURE_KEY);
  } catch (error) {
    console.warn('[TunnelPersistence] Failed to clear API key from secure storage:', error);
  }
}

/**
 * Save tunnel metadata for later reconnection.
 *
 * TODO: Security enhancement - Consider storing the apiKey in secure storage
 * (expo-secure-store for iOS Keychain/Android Keystore) instead of AsyncStorage
 * for production deployments where the API key grants sensitive access.
 */
export async function saveTunnelMetadata(metadata: TunnelMetadata): Promise<void> {
  try {
    const savedInSecureStore = await saveApiKey(metadata.apiKey);
    const metadataForStorage: StoredTunnelMetadata = savedInSecureStore
      ? {
          ...metadata,
          apiKey: undefined,
        }
      : metadata;

    await AsyncStorage.setItem(TUNNEL_METADATA_KEY, JSON.stringify(metadataForStorage));
    console.log('[TunnelPersistence] Saved tunnel metadata:', {
      baseUrl: metadata.baseUrl,
      hasApiKey: !!metadata.apiKey,
      hasSessionId: !!metadata.sessionId,
      hasResumeToken: !!metadata.resumeToken,
      apiKeyStorage: savedInSecureStore ? 'secure-store' : 'async-storage',
    });
  } catch (error) {
    console.error('[TunnelPersistence] Failed to save tunnel metadata:', error);
  }
}

/**
 * Load previously saved tunnel metadata.
 * Returns null if no metadata exists or if it's invalid.
 */
export async function loadTunnelMetadata(): Promise<TunnelMetadata | null> {
  try {
    const stored = await AsyncStorage.getItem(TUNNEL_METADATA_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as StoredTunnelMetadata;
    const secureStoreApiKey = await loadApiKey();
    const apiKey = secureStoreApiKey ?? parsed.apiKey;

    // Validate required fields exist and have correct types
    if (
      typeof parsed.baseUrl !== 'string' ||
      typeof apiKey !== 'string' ||
      typeof parsed.lastConnectedAt !== 'number'
    ) {
      console.warn('[TunnelPersistence] Invalid stored metadata: missing required fields or incorrect types');
      return null;
    }

    return {
      ...parsed,
      apiKey,
    };
  } catch (error) {
    console.error('[TunnelPersistence] Failed to load tunnel metadata:', error);
    return null;
  }
}

/**
 * Update specific fields in the tunnel metadata.
 * Preserves existing fields that are not specified.
 */
export async function updateTunnelMetadata(
  updates: Partial<TunnelMetadata>
): Promise<TunnelMetadata | null> {
  const existing = await loadTunnelMetadata();
  if (!existing) {
    console.warn('[TunnelPersistence] Cannot update: no existing metadata');
    return null;
  }

  const updated: TunnelMetadata = {
    ...existing,
    ...updates,
  };

  await saveTunnelMetadata(updated);
  return updated;
}

/**
 * Clear tunnel metadata (for logout or reset scenarios).
 */
export async function clearTunnelMetadata(): Promise<void> {
  try {
    await Promise.all([AsyncStorage.removeItem(TUNNEL_METADATA_KEY), clearApiKey()]);
    console.log('[TunnelPersistence] Cleared tunnel metadata');
  } catch (error) {
    console.error('[TunnelPersistence] Failed to clear tunnel metadata:', error);
  }
}

/**
 * Check if we have valid tunnel metadata for reconnection.
 */
export async function hasTunnelMetadata(): Promise<boolean> {
  const metadata = await loadTunnelMetadata();
  return metadata !== null;
}

/**
 * Check if the stored tunnel metadata is recent enough to attempt reconnection.
 * @param maxAgeMs Maximum age in milliseconds (default: 24 hours)
 */
export async function isTunnelMetadataFresh(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<boolean> {
  const metadata = await loadTunnelMetadata();
  if (!metadata) {
    return false;
  }

  const age = Date.now() - metadata.lastConnectedAt;
  return age < maxAgeMs;
}
