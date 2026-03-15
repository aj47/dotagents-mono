import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

const mockGetServerStatus = vi.fn();
const mockGetDetailedToolList = vi.fn();
const mockGetAvailableTools = vi.fn();
const mockRestartServer = vi.fn();
const mockStopServer = vi.fn();
const mockInitialize = vi.fn();
const mockTestServerConnection = vi.fn();

const mockConfigStoreGet = vi.fn();
const mockConfigStoreSave = vi.fn();

vi.mock('@dotagents/core', () => ({
  mcpService: {
    getServerStatus: (...args: any[]) => mockGetServerStatus(...args),
    getDetailedToolList: (...args: any[]) => mockGetDetailedToolList(...args),
    getAvailableTools: (...args: any[]) => mockGetAvailableTools(...args),
    restartServer: (...args: any[]) => mockRestartServer(...args),
    stopServer: (...args: any[]) => mockStopServer(...args),
    initialize: (...args: any[]) => mockInitialize(...args),
    testServerConnection: (...args: any[]) => mockTestServerConnection(...args),
  },
  configStore: {
    get: (...args: any[]) => mockConfigStoreGet(...args),
    save: (...args: any[]) => mockConfigStoreSave(...args),
  },
  inferTransportType: (config: any) => {
    if (config.transport) return config.transport;
    if (!config.url) return 'stdio';
    const lower = config.url.toLowerCase();
    if (lower.startsWith('ws://') || lower.startsWith('wss://')) return 'websocket';
    return 'streamableHttp';
  },
}));

// Minimal React hooks mock for state tracking
let hookStates: Map<string, any> = new Map();
let hookCallOrder: string[] = [];

vi.mock('react', () => ({
  useState: (initial: any) => {
    const key = `state_${hookCallOrder.length}`;
    hookCallOrder.push(key);
    if (!hookStates.has(key)) {
      hookStates.set(key, initial);
    }
    const val = hookStates.get(key);
    const setter = (newVal: any) => {
      hookStates.set(key, typeof newVal === 'function' ? newVal(hookStates.get(key)) : newVal);
    };
    return [val, setter];
  },
  useCallback: (fn: any) => fn,
  useRef: (initial: any) => ({ current: initial }),
  useEffect: (_fn: any, _deps?: any[]) => {},
  useMemo: (fn: any) => fn(),
}));

import { useMcpManagement } from './useMcpManagement';

describe('useMcpManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookStates = new Map();
    hookCallOrder = [];

    mockGetServerStatus.mockReturnValue({});
    mockGetDetailedToolList.mockReturnValue([]);
    mockGetAvailableTools.mockReturnValue([]);
    mockConfigStoreGet.mockReturnValue({
      mcpConfig: { mcpServers: {} },
    });
  });

  // ========================================================================
  // Server listing
  // ========================================================================

  describe('server listing', () => {
    it('returns empty servers list when no servers configured', () => {
      mockGetServerStatus.mockReturnValue({});
      const result = useMcpManagement();
      expect(result.servers).toEqual([]);
    });

    it('returns servers with connection status and tool count', () => {
      mockGetServerStatus.mockReturnValue({
        'my-server': {
          connected: true,
          toolCount: 3,
          runtimeEnabled: true,
          configDisabled: false,
        },
        'offline-server': {
          connected: false,
          toolCount: 0,
          runtimeEnabled: true,
          configDisabled: false,
        },
      });
      mockConfigStoreGet.mockReturnValue({
        mcpConfig: {
          mcpServers: {
            'my-server': { command: 'node', args: ['server.js'], transport: 'stdio' },
            'offline-server': { url: 'ws://localhost:3000', transport: 'websocket' },
          },
        },
      });

      const result = useMcpManagement();
      expect(result.servers).toHaveLength(2);

      const myServer = result.servers.find((s) => s.name === 'my-server');
      expect(myServer).toBeDefined();
      expect(myServer!.connected).toBe(true);
      expect(myServer!.toolCount).toBe(3);
      expect(myServer!.transport).toBe('stdio');

      const offlineServer = result.servers.find((s) => s.name === 'offline-server');
      expect(offlineServer).toBeDefined();
      expect(offlineServer!.connected).toBe(false);
      expect(offlineServer!.toolCount).toBe(0);
      expect(offlineServer!.transport).toBe('websocket');
    });

    it('filters out built-in server from server list', () => {
      mockGetServerStatus.mockReturnValue({
        'dotagents-internal': {
          connected: true,
          toolCount: 5,
          runtimeEnabled: true,
          configDisabled: false,
        },
        'user-server': {
          connected: true,
          toolCount: 2,
          runtimeEnabled: true,
          configDisabled: false,
        },
      });
      mockConfigStoreGet.mockReturnValue({
        mcpConfig: {
          mcpServers: {
            'user-server': { command: 'node', args: ['s.js'] },
          },
        },
      });

      const result = useMcpManagement();
      // Should not include built-in server
      expect(result.servers.every((s) => s.name !== 'dotagents-internal')).toBe(true);
    });
  });

  // ========================================================================
  // Add server
  // ========================================================================

  describe('addServer', () => {
    it('adds a stdio server to config', async () => {
      mockConfigStoreGet.mockReturnValue({
        mcpConfig: { mcpServers: {} },
      });
      mockInitialize.mockResolvedValue(undefined);

      const result = useMcpManagement();
      const addResult = await result.addServer('new-server', {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@some/mcp-server'],
      });

      expect(addResult.success).toBe(true);
      expect(mockConfigStoreSave).toHaveBeenCalledWith(
        expect.objectContaining({
          mcpConfig: {
            mcpServers: {
              'new-server': expect.objectContaining({
                command: 'npx',
                args: ['-y', '@some/mcp-server'],
                transport: 'stdio',
              }),
            },
          },
        }),
      );
    });

    it('adds a websocket server to config', async () => {
      mockConfigStoreGet.mockReturnValue({
        mcpConfig: { mcpServers: {} },
      });
      mockInitialize.mockResolvedValue(undefined);

      const result = useMcpManagement();
      const addResult = await result.addServer('ws-server', {
        transport: 'websocket',
        url: 'ws://localhost:4000',
      });

      expect(addResult.success).toBe(true);
      expect(mockConfigStoreSave).toHaveBeenCalledWith(
        expect.objectContaining({
          mcpConfig: {
            mcpServers: {
              'ws-server': expect.objectContaining({
                url: 'ws://localhost:4000',
                transport: 'websocket',
              }),
            },
          },
        }),
      );
    });

    it('adds a streamable HTTP server to config', async () => {
      mockConfigStoreGet.mockReturnValue({
        mcpConfig: { mcpServers: {} },
      });
      mockInitialize.mockResolvedValue(undefined);

      const result = useMcpManagement();
      const addResult = await result.addServer('http-server', {
        transport: 'streamableHttp',
        url: 'https://api.example.com/mcp',
      });

      expect(addResult.success).toBe(true);
      expect(mockConfigStoreSave).toHaveBeenCalledWith(
        expect.objectContaining({
          mcpConfig: {
            mcpServers: {
              'http-server': expect.objectContaining({
                url: 'https://api.example.com/mcp',
                transport: 'streamableHttp',
              }),
            },
          },
        }),
      );
    });

    it('rejects empty server name', async () => {
      const result = useMcpManagement();
      const addResult = await result.addServer('', {
        transport: 'stdio',
        command: 'node',
        args: [],
      });
      expect(addResult.success).toBe(false);
      expect(addResult.error).toContain('name');
    });

    it('rejects duplicate server name', async () => {
      mockConfigStoreGet.mockReturnValue({
        mcpConfig: {
          mcpServers: {
            'existing-server': { command: 'node', args: ['s.js'] },
          },
        },
      });

      const result = useMcpManagement();
      const addResult = await result.addServer('existing-server', {
        transport: 'stdio',
        command: 'node',
        args: [],
      });
      expect(addResult.success).toBe(false);
      expect(addResult.error).toContain('already exists');
    });

    it('rejects stdio server without command', async () => {
      mockConfigStoreGet.mockReturnValue({
        mcpConfig: { mcpServers: {} },
      });

      const result = useMcpManagement();
      const addResult = await result.addServer('bad-server', {
        transport: 'stdio',
        // missing command
      });
      expect(addResult.success).toBe(false);
      expect(addResult.error).toContain('command');
    });

    it('rejects websocket server without url', async () => {
      mockConfigStoreGet.mockReturnValue({
        mcpConfig: { mcpServers: {} },
      });

      const result = useMcpManagement();
      const addResult = await result.addServer('bad-ws', {
        transport: 'websocket',
        // missing url
      });
      expect(addResult.success).toBe(false);
      expect(addResult.error).toContain('URL');
    });

    it('preserves existing servers when adding', async () => {
      mockConfigStoreGet.mockReturnValue({
        mcpConfig: {
          mcpServers: {
            'old-server': { command: 'node', args: ['old.js'] },
          },
        },
      });
      mockInitialize.mockResolvedValue(undefined);

      const result = useMcpManagement();
      await result.addServer('new-server', {
        transport: 'stdio',
        command: 'node',
        args: ['new.js'],
      });

      expect(mockConfigStoreSave).toHaveBeenCalledWith(
        expect.objectContaining({
          mcpConfig: {
            mcpServers: expect.objectContaining({
              'old-server': { command: 'node', args: ['old.js'] },
              'new-server': expect.objectContaining({
                command: 'node',
                args: ['new.js'],
              }),
            }),
          },
        }),
      );
    });
  });

  // ========================================================================
  // Remove server
  // ========================================================================

  describe('removeServer', () => {
    it('removes a server from config', async () => {
      mockConfigStoreGet.mockReturnValue({
        mcpConfig: {
          mcpServers: {
            'target-server': { command: 'node', args: ['s.js'] },
            'other-server': { url: 'ws://localhost:3000' },
          },
        },
      });
      mockStopServer.mockResolvedValue({ success: true });

      const result = useMcpManagement();
      const removeResult = await result.removeServer('target-server');

      expect(removeResult.success).toBe(true);
      expect(mockStopServer).toHaveBeenCalledWith('target-server');
      expect(mockConfigStoreSave).toHaveBeenCalledWith(
        expect.objectContaining({
          mcpConfig: {
            mcpServers: {
              'other-server': { url: 'ws://localhost:3000' },
            },
          },
        }),
      );
    });

    it('returns error when removing non-existent server', async () => {
      mockConfigStoreGet.mockReturnValue({
        mcpConfig: { mcpServers: {} },
      });

      const result = useMcpManagement();
      const removeResult = await result.removeServer('ghost-server');

      expect(removeResult.success).toBe(false);
      expect(removeResult.error).toContain('not found');
    });
  });

  // ========================================================================
  // Reconnect server
  // ========================================================================

  describe('reconnectServer', () => {
    it('reconnects a server successfully', async () => {
      mockRestartServer.mockResolvedValue({ success: true });

      const result = useMcpManagement();
      const reconnResult = await result.reconnectServer('my-server');

      expect(reconnResult.success).toBe(true);
      expect(mockRestartServer).toHaveBeenCalledWith('my-server');
    });

    it('returns error message on reconnect failure', async () => {
      mockRestartServer.mockResolvedValue({
        success: false,
        error: 'Connection timed out',
      });

      const result = useMcpManagement();
      const reconnResult = await result.reconnectServer('flaky-server');

      expect(reconnResult.success).toBe(false);
      expect(reconnResult.error).toBe('Connection timed out');
    });
  });

  // ========================================================================
  // Tool listing
  // ========================================================================

  describe('tools listing', () => {
    it('returns all tools across all servers', () => {
      mockGetDetailedToolList.mockReturnValue([
        {
          name: 'server1:read-file',
          description: 'Read a file',
          serverName: 'server1',
          enabled: true,
          serverEnabled: true,
          inputSchema: {},
        },
        {
          name: 'server2:list-issues',
          description: 'List issues',
          serverName: 'server2',
          enabled: true,
          serverEnabled: true,
          inputSchema: {},
        },
        {
          name: 'dotagents-internal:respond-to-user',
          description: 'Respond to user',
          serverName: 'dotagents-internal',
          enabled: true,
          serverEnabled: true,
          inputSchema: {},
        },
      ]);

      const result = useMcpManagement();
      expect(result.allTools).toHaveLength(3);
      expect(result.allTools[0].name).toBe('server1:read-file');
    });

    it('returns empty tools list when no tools available', () => {
      mockGetDetailedToolList.mockReturnValue([]);

      const result = useMcpManagement();
      expect(result.allTools).toEqual([]);
    });
  });

  // ========================================================================
  // Refresh
  // ========================================================================

  describe('refresh', () => {
    it('provides a refresh function', () => {
      const result = useMcpManagement();
      expect(typeof result.refresh).toBe('function');
    });
  });
});
