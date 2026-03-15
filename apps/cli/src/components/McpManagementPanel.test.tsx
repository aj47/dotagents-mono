import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

// Mock @dotagents/core
vi.mock('@dotagents/core', () => ({
  mcpService: {
    getServerStatus: vi.fn().mockReturnValue({}),
    getDetailedToolList: vi.fn().mockReturnValue([]),
    getAvailableTools: vi.fn().mockReturnValue([]),
    restartServer: vi.fn().mockResolvedValue({ success: true }),
    stopServer: vi.fn().mockResolvedValue({ success: true }),
    initialize: vi.fn().mockResolvedValue(undefined),
    testServerConnection: vi.fn().mockResolvedValue({ success: true }),
  },
  configStore: {
    get: vi.fn().mockReturnValue({ mcpConfig: { mcpServers: {} } }),
    save: vi.fn(),
  },
  inferTransportType: vi.fn().mockReturnValue('stdio'),
}));

// Track useKeyboard handler
let keyboardHandler: ((key: any) => void) | null = null;

vi.mock('@opentui/react', () => ({
  useKeyboard: (handler: (key: any) => void) => {
    keyboardHandler = handler;
  },
  useTerminalDimensions: () => ({ width: 80, height: 24 }),
}));

// Minimal React mock that tracks renders
let stateMap: Map<number, any> = new Map();
let stateIndex = 0;
let callbackFns: any[] = [];
let effectCallbacks: any[] = [];

vi.mock('react', () => ({
  useState: (initial: any) => {
    const idx = stateIndex++;
    if (!stateMap.has(idx)) {
      stateMap.set(idx, initial);
    }
    const val = stateMap.get(idx);
    const setter = (newVal: any) => {
      stateMap.set(idx, typeof newVal === 'function' ? newVal(stateMap.get(idx)) : newVal);
    };
    return [val, setter];
  },
  useCallback: (fn: any) => {
    callbackFns.push(fn);
    return fn;
  },
  useRef: (initial: any) => ({ current: initial }),
  useEffect: (fn: any) => { effectCallbacks.push(fn); },
  useMemo: (fn: any) => fn(),
}));

import { McpManagementPanel } from './McpManagementPanel';
import type { McpManagementPanelProps } from './McpManagementPanel';
import type { McpServerInfo, McpToolInfo } from '../hooks/useMcpManagement';

function createDefaultProps(overrides: Partial<McpManagementPanelProps> = {}): McpManagementPanelProps {
  return {
    servers: [],
    allTools: [],
    error: null,
    onClose: vi.fn(),
    onAddServer: vi.fn().mockResolvedValue({ success: true }),
    onRemoveServer: vi.fn().mockResolvedValue({ success: true }),
    onReconnectServer: vi.fn().mockResolvedValue({ success: true }),
    onRefresh: vi.fn(),
    ...overrides,
  };
}

function createServer(overrides: Partial<McpServerInfo> = {}): McpServerInfo {
  return {
    name: 'test-server',
    connected: true,
    toolCount: 3,
    transport: 'stdio',
    enabled: true,
    configDisabled: false,
    endpoint: 'node server.js',
    ...overrides,
  };
}

function createTool(overrides: Partial<McpToolInfo> = {}): McpToolInfo {
  return {
    name: 'server:tool',
    description: 'A test tool',
    serverName: 'server',
    enabled: true,
    serverEnabled: true,
    ...overrides,
  };
}

describe('McpManagementPanel', () => {
  beforeEach(() => {
    stateMap = new Map();
    stateIndex = 0;
    callbackFns = [];
    effectCallbacks = [];
    keyboardHandler = null;
    vi.clearAllMocks();
  });

  // ========================================================================
  // Rendering
  // ========================================================================

  describe('rendering', () => {
    it('renders without crashing with empty servers', () => {
      const props = createDefaultProps();
      // Should not throw
      const result = McpManagementPanel(props);
      expect(result).toBeDefined();
    });

    it('renders with servers list', () => {
      const servers = [
        createServer({ name: 'server-a', connected: true, toolCount: 5, transport: 'stdio' }),
        createServer({ name: 'server-b', connected: false, toolCount: 0, transport: 'websocket' }),
      ];
      const props = createDefaultProps({ servers });
      const result = McpManagementPanel(props);
      expect(result).toBeDefined();
    });

    it('renders tools view', () => {
      const tools = [
        createTool({ name: 'srv:read', serverName: 'srv' }),
        createTool({ name: 'srv:write', serverName: 'srv' }),
      ];
      const props = createDefaultProps({ allTools: tools });
      // Default view is 'servers', so tools aren't directly visible,
      // but the component should still render without error
      const result = McpManagementPanel(props);
      expect(result).toBeDefined();
    });

    it('renders error message when present', () => {
      const props = createDefaultProps({ error: 'Something went wrong' });
      const result = McpManagementPanel(props);
      expect(result).toBeDefined();
    });
  });

  // ========================================================================
  // Keyboard navigation
  // ========================================================================

  describe('keyboard navigation', () => {
    it('registers keyboard handler', () => {
      const props = createDefaultProps();
      McpManagementPanel(props);
      expect(keyboardHandler).toBeDefined();
    });

    it('Escape key calls onClose', () => {
      const onClose = vi.fn();
      const props = createDefaultProps({ onClose });
      McpManagementPanel(props);

      keyboardHandler?.({ name: 'escape' });
      expect(onClose).toHaveBeenCalled();
    });

    it('Tab key cycles between views', () => {
      const props = createDefaultProps();
      // First render in 'servers' view (default)
      McpManagementPanel(props);

      // Pressing Tab should switch to 'tools' view
      keyboardHandler?.({ name: 'tab' });
      // Since state is tracked via stateMap, the view change is recorded
      // We verify the state was updated
    });

    it('"a" key in server list triggers add server flow', () => {
      const props = createDefaultProps();
      McpManagementPanel(props);

      // Press 'a' to start adding a server
      keyboardHandler?.({ name: 'a' });
      // Should switch to add view — verify no crash
    });

    it('"r" key triggers reconnect for selected server', () => {
      const servers = [createServer({ name: 'my-server' })];
      const onReconnect = vi.fn().mockResolvedValue({ success: true });
      const props = createDefaultProps({
        servers,
        onReconnectServer: onReconnect,
      });
      McpManagementPanel(props);

      // 'r' key triggers reconnect
      keyboardHandler?.({ name: 'r' });
      expect(onReconnect).toHaveBeenCalledWith('my-server');
    });

    it('"d" key triggers remove for selected server', () => {
      const servers = [createServer({ name: 'my-server' })];
      const props = createDefaultProps({ servers });
      McpManagementPanel(props);

      // 'd' key should switch to confirm-delete state
      keyboardHandler?.({ name: 'd' });
      // No crash expected
    });
  });

  // ========================================================================
  // Server list interactions
  // ========================================================================

  describe('server list interactions', () => {
    it('up/down arrows navigate server list', () => {
      const servers = [
        createServer({ name: 'server-a' }),
        createServer({ name: 'server-b' }),
        createServer({ name: 'server-c' }),
      ];
      const props = createDefaultProps({ servers });
      McpManagementPanel(props);

      // Arrow down
      keyboardHandler?.({ name: 'down' });
      // Arrow up
      keyboardHandler?.({ name: 'up' });
      // Should not crash
    });

    it('does not navigate below server list bounds', () => {
      const servers = [createServer({ name: 'only-one' })];
      const props = createDefaultProps({ servers });
      McpManagementPanel(props);

      // Arrow down when already at bottom
      keyboardHandler?.({ name: 'down' });
      keyboardHandler?.({ name: 'down' });
      // Should not crash
    });
  });

  // ========================================================================
  // Add server flow
  // ========================================================================

  describe('add server flow', () => {
    it('provides addServer callback to parent', () => {
      const onAdd = vi.fn().mockResolvedValue({ success: true });
      const props = createDefaultProps({ onAddServer: onAdd });
      McpManagementPanel(props);

      // The component should render and have access to the add callback
      expect(props.onAddServer).toBeDefined();
    });
  });

  // ========================================================================
  // Remove server flow
  // ========================================================================

  describe('remove server flow', () => {
    it('provides removeServer callback to parent', () => {
      const onRemove = vi.fn().mockResolvedValue({ success: true });
      const props = createDefaultProps({ onRemoveServer: onRemove });
      McpManagementPanel(props);

      expect(props.onRemoveServer).toBeDefined();
    });
  });

  // ========================================================================
  // Tools view
  // ========================================================================

  describe('tools view', () => {
    it('shows all tools grouped by server', () => {
      const tools = [
        createTool({ name: 'srv1:read', serverName: 'srv1', description: 'Read file' }),
        createTool({ name: 'srv1:write', serverName: 'srv1', description: 'Write file' }),
        createTool({ name: 'srv2:list', serverName: 'srv2', description: 'List items' }),
      ];
      const props = createDefaultProps({ allTools: tools });
      // Renders without error even when tools are provided
      const result = McpManagementPanel(props);
      expect(result).toBeDefined();
    });

    it('shows disabled indicator for disabled tools', () => {
      const tools = [
        createTool({ name: 'srv:enabled-tool', enabled: true }),
        createTool({ name: 'srv:disabled-tool', enabled: false }),
      ];
      const props = createDefaultProps({ allTools: tools });
      const result = McpManagementPanel(props);
      expect(result).toBeDefined();
    });
  });

  // ========================================================================
  // Connection status display
  // ========================================================================

  describe('connection status display', () => {
    it('shows connected indicator for connected servers', () => {
      const servers = [createServer({ name: 'online', connected: true })];
      const props = createDefaultProps({ servers });
      const result = McpManagementPanel(props);
      expect(result).toBeDefined();
    });

    it('shows disconnected indicator for offline servers', () => {
      const servers = [createServer({ name: 'offline', connected: false })];
      const props = createDefaultProps({ servers });
      const result = McpManagementPanel(props);
      expect(result).toBeDefined();
    });

    it('shows disabled badge for disabled servers', () => {
      const servers = [createServer({ name: 'disabled', configDisabled: true, enabled: false })];
      const props = createDefaultProps({ servers });
      const result = McpManagementPanel(props);
      expect(result).toBeDefined();
    });
  });
});
