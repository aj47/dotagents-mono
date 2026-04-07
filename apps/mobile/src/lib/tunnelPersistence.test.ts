import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAsyncStorage } = vi.hoisted(() => ({
  mockAsyncStorage: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: mockAsyncStorage,
}));

import {
  clearTunnelMetadata,
  loadTunnelMetadata,
  saveTunnelMetadata,
  TunnelMetadata,
} from './tunnelPersistence';

describe('tunnelPersistence', () => {
  const metadata: TunnelMetadata = {
    baseUrl: 'https://example.com',
    apiKey: 'test-api-key',
    lastConnectedAt: 123456789,
    sessionId: 'session-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores metadata in async storage when secure storage is unavailable', async () => {
    mockAsyncStorage.setItem.mockResolvedValue(undefined);

    await saveTunnelMetadata(metadata);

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      'dotagents_tunnel_metadata_v1',
      JSON.stringify(metadata),
    );
  });

  it('loads legacy metadata with apiKey from async storage', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(metadata));

    const loaded = await loadTunnelMetadata();

    expect(loaded).toEqual(metadata);
  });

  it('clears persisted tunnel metadata', async () => {
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);

    await clearTunnelMetadata();

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('dotagents_tunnel_metadata_v1');
  });
});
