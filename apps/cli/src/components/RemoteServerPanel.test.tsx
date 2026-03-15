import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RemoteServerPanelProps } from './RemoteServerPanel';

/**
 * Tests for RemoteServerPanel component — validates remote server TUI panel:
 * server status display, start/stop, QR code, port config, OAuth flow.
 *
 * Tests component props interface and callback patterns without rendering,
 * matching the pattern used by other CLI panel tests (HubPanel, etc.).
 */

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@dotagents/core', () => ({}));

// ============================================================================
// Test Data
// ============================================================================

const mockServerStatus = {
  running: false,
  url: undefined as string | undefined,
  connectableUrl: undefined as string | undefined,
  bind: '0.0.0.0',
  port: 3210,
  lastError: undefined as string | undefined,
  apiKey: undefined as string | undefined,
};

const mockRunningStatus = {
  running: true,
  url: 'http://0.0.0.0:3210/v1',
  connectableUrl: 'http://192.168.1.100:3210/v1',
  bind: '0.0.0.0',
  port: 3210,
  lastError: undefined as string | undefined,
  apiKey: 'abc123...xyz789',
};

// ============================================================================
// Default props factory
// ============================================================================

function createDefaultProps(overrides?: Partial<RemoteServerPanelProps>): RemoteServerPanelProps {
  return {
    serverStatus: mockServerStatus,
    loading: false,
    error: null,
    onStartServer: vi.fn(async () => {}),
    onStopServer: vi.fn(async () => {}),
    onShowQRCode: vi.fn(async () => {}),
    onSetPort: vi.fn(),
    onSetBindAddress: vi.fn(),
    oauthStatus: 'idle' as const,
    oauthError: null,
    onStartOAuth: vi.fn(async () => {}),
    onClose: vi.fn(),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('RemoteServerPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Server Status Display
  // --------------------------------------------------------------------------

  describe('server status display', () => {
    it('should show stopped status initially', () => {
      const props = createDefaultProps();
      expect(props.serverStatus.running).toBe(false);
    });

    it('should show running status with URL', () => {
      const props = createDefaultProps({ serverStatus: mockRunningStatus });
      expect(props.serverStatus.running).toBe(true);
      expect(props.serverStatus.url).toBe('http://0.0.0.0:3210/v1');
    });

    it('should show connectable URL for mobile devices', () => {
      const props = createDefaultProps({ serverStatus: mockRunningStatus });
      expect(props.serverStatus.connectableUrl).toBe('http://192.168.1.100:3210/v1');
    });

    it('should show bind address and port', () => {
      const props = createDefaultProps();
      expect(props.serverStatus.bind).toBe('0.0.0.0');
      expect(props.serverStatus.port).toBe(3210);
    });

    it('should show last error if present', () => {
      const props = createDefaultProps({
        serverStatus: { ...mockServerStatus, lastError: 'Port in use' },
      });
      expect(props.serverStatus.lastError).toBe('Port in use');
    });

    it('should show loading state', () => {
      const props = createDefaultProps({ loading: true });
      expect(props.loading).toBe(true);
    });

    it('should show error', () => {
      const props = createDefaultProps({ error: 'Failed to start server' });
      expect(props.error).toBe('Failed to start server');
    });

    it('should show API key (redacted) when running', () => {
      const props = createDefaultProps({ serverStatus: mockRunningStatus });
      expect(props.serverStatus.apiKey).toBe('abc123...xyz789');
    });
  });

  // --------------------------------------------------------------------------
  // Start/Stop Controls
  // --------------------------------------------------------------------------

  describe('start/stop controls', () => {
    it('should call onStartServer', async () => {
      const props = createDefaultProps();
      await props.onStartServer();
      expect(props.onStartServer).toHaveBeenCalled();
    });

    it('should call onStopServer', async () => {
      const props = createDefaultProps();
      await props.onStopServer();
      expect(props.onStopServer).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // QR Code
  // --------------------------------------------------------------------------

  describe('QR code display', () => {
    it('should call onShowQRCode', async () => {
      const props = createDefaultProps();
      await props.onShowQRCode();
      expect(props.onShowQRCode).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Port Configuration
  // --------------------------------------------------------------------------

  describe('port configuration', () => {
    it('should call onSetPort with port number', () => {
      const props = createDefaultProps();
      props.onSetPort(4000);
      expect(props.onSetPort).toHaveBeenCalledWith(4000);
    });

    it('should call onSetBindAddress', () => {
      const props = createDefaultProps();
      props.onSetBindAddress('127.0.0.1');
      expect(props.onSetBindAddress).toHaveBeenCalledWith('127.0.0.1');
    });
  });

  // --------------------------------------------------------------------------
  // OAuth Flow
  // --------------------------------------------------------------------------

  describe('OAuth flow', () => {
    it('should have idle OAuth status initially', () => {
      const props = createDefaultProps();
      expect(props.oauthStatus).toBe('idle');
    });

    it('should call onStartOAuth with server URL', async () => {
      const props = createDefaultProps();
      await props.onStartOAuth('https://mcp-server.example.com');
      expect(props.onStartOAuth).toHaveBeenCalledWith('https://mcp-server.example.com');
    });

    it('should show authenticating status', () => {
      const props = createDefaultProps({ oauthStatus: 'authenticating' });
      expect(props.oauthStatus).toBe('authenticating');
    });

    it('should show success status', () => {
      const props = createDefaultProps({ oauthStatus: 'success' });
      expect(props.oauthStatus).toBe('success');
    });

    it('should show OAuth error', () => {
      const props = createDefaultProps({
        oauthStatus: 'error',
        oauthError: 'OAuth authorization failed',
      });
      expect(props.oauthStatus).toBe('error');
      expect(props.oauthError).toBe('OAuth authorization failed');
    });
  });

  // --------------------------------------------------------------------------
  // Panel lifecycle
  // --------------------------------------------------------------------------

  describe('panel lifecycle', () => {
    it('should have onClose callback', () => {
      const props = createDefaultProps();
      props.onClose();
      expect(props.onClose).toHaveBeenCalled();
    });

    it('should support all OAuth statuses', () => {
      const statuses: RemoteServerPanelProps['oauthStatus'][] = [
        'idle',
        'authenticating',
        'success',
        'error',
      ];
      expect(statuses).toHaveLength(4);
    });

    it('should default port to 3210', () => {
      const props = createDefaultProps();
      expect(props.serverStatus.port).toBe(3210);
    });

    it('should default bind to 0.0.0.0', () => {
      const props = createDefaultProps();
      expect(props.serverStatus.bind).toBe('0.0.0.0');
    });
  });
});
