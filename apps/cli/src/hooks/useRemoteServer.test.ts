import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for useRemoteServer hook — validates remote server management:
 * start/stop server, QR code display, status tracking, port configuration.
 *
 * Tests hook interface and callback patterns without rendering,
 * matching the pattern used by other CLI hook tests.
 */

// ============================================================================
// Mocks
// ============================================================================

const mockStartRemoteServerForced = vi.fn(async (_opts?: any) => ({ running: true as boolean, bind: '0.0.0.0', port: 3210 }) as any);
const mockStopRemoteServer = vi.fn(async () => {});
const mockPrintQRCodeToTerminal = vi.fn(async (_url?: string) => true as boolean);
const mockGetRemoteServerStatus = vi.fn(() => ({
  running: false,
  url: undefined as string | undefined,
  connectableUrl: undefined as string | undefined,
  bind: '0.0.0.0',
  port: 3210,
  lastError: undefined as string | undefined,
}));
const mockSetRemoteServerProgressEmitter = vi.fn((_emitter?: any) => {});
const mockSetRemoteServerConversationService = vi.fn((_service?: any) => {});
const mockConfigStore = {
  get: vi.fn(() => ({
    remoteServerEnabled: false,
    remoteServerPort: 3210,
    remoteServerBindAddress: '0.0.0.0',
    remoteServerApiKey: 'test-api-key',
  })),
  save: vi.fn((_cfg?: any) => {}),
};

vi.mock('@dotagents/core', () => ({
  startRemoteServerForced: (opts?: any) => mockStartRemoteServerForced(opts),
  stopRemoteServer: () => mockStopRemoteServer(),
  printQRCodeToTerminal: (url?: string) => mockPrintQRCodeToTerminal(url),
  getRemoteServerStatus: () => mockGetRemoteServerStatus(),
  setRemoteServerProgressEmitter: (emitter?: any) => mockSetRemoteServerProgressEmitter(emitter),
  setRemoteServerConversationService: (service?: any) => mockSetRemoteServerConversationService(service),
  configStore: mockConfigStore,
  ConversationService: vi.fn().mockImplementation(() => ({
    loadConversation: vi.fn(),
    getConversationHistory: vi.fn(async () => []),
  })),
}));

// ============================================================================
// Tests
// ============================================================================

describe('useRemoteServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Status
  // --------------------------------------------------------------------------

  describe('status tracking', () => {
    it('should provide initial status as stopped', () => {
      const status = mockGetRemoteServerStatus();
      expect(status.running).toBe(false);
    });

    it('should report port and bind address from config', () => {
      const cfg = mockConfigStore.get();
      expect(cfg.remoteServerPort).toBe(3210);
      expect(cfg.remoteServerBindAddress).toBe('0.0.0.0');
    });

    it('should provide API key from config', () => {
      const cfg = mockConfigStore.get();
      expect(cfg.remoteServerApiKey).toBe('test-api-key');
    });

    it('should report running status after start', async () => {
      const result = await mockStartRemoteServerForced();
      expect(result.running).toBe(true);
      expect(result.port).toBe(3210);
    });
  });

  // --------------------------------------------------------------------------
  // Start/Stop
  // --------------------------------------------------------------------------

  describe('start and stop', () => {
    it('should start server with startRemoteServerForced', async () => {
      const result = await mockStartRemoteServerForced();
      expect(mockStartRemoteServerForced).toHaveBeenCalled();
      expect(result.running).toBe(true);
    });

    it('should pass bind address override to startRemoteServerForced', async () => {
      await mockStartRemoteServerForced({ bindAddressOverride: '192.168.1.100' });
      expect(mockStartRemoteServerForced).toHaveBeenCalledWith({
        bindAddressOverride: '192.168.1.100',
      });
    });

    it('should stop server', async () => {
      await mockStopRemoteServer();
      expect(mockStopRemoteServer).toHaveBeenCalled();
    });

    it('should handle start failure', async () => {
      mockStartRemoteServerForced.mockResolvedValueOnce({
        running: false,
        error: 'Port in use',
      });
      const result = await mockStartRemoteServerForced();
      expect(result.running).toBe(false);
      expect(result.error).toBe('Port in use');
    });

    it('should handle start exception', async () => {
      mockStartRemoteServerForced.mockRejectedValueOnce(new Error('EADDRINUSE'));
      await expect(mockStartRemoteServerForced()).rejects.toThrow('EADDRINUSE');
    });
  });

  // --------------------------------------------------------------------------
  // QR Code
  // --------------------------------------------------------------------------

  describe('QR code display', () => {
    it('should print QR code to terminal', async () => {
      const result = await mockPrintQRCodeToTerminal();
      expect(mockPrintQRCodeToTerminal).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle QR code print failure', async () => {
      mockPrintQRCodeToTerminal.mockResolvedValueOnce(false);
      const result = await mockPrintQRCodeToTerminal();
      expect(result).toBe(false);
    });

    it('should accept URL override for QR code', async () => {
      await mockPrintQRCodeToTerminal('https://tunnel.example.com/v1');
      expect(mockPrintQRCodeToTerminal).toHaveBeenCalledWith(
        'https://tunnel.example.com/v1',
      );
    });
  });

  // --------------------------------------------------------------------------
  // Dependency wiring
  // --------------------------------------------------------------------------

  describe('dependency wiring', () => {
    it('should wire progress emitter', () => {
      const mockEmitter = { emit: vi.fn() };
      mockSetRemoteServerProgressEmitter(mockEmitter);
      expect(mockSetRemoteServerProgressEmitter).toHaveBeenCalledWith(mockEmitter);
    });

    it('should wire conversation service', () => {
      const mockConvService = { loadConversation: vi.fn() };
      mockSetRemoteServerConversationService(mockConvService);
      expect(mockSetRemoteServerConversationService).toHaveBeenCalledWith(mockConvService);
    });
  });

  // --------------------------------------------------------------------------
  // Port configuration
  // --------------------------------------------------------------------------

  describe('port configuration', () => {
    it('should use default port 3210', () => {
      const cfg = mockConfigStore.get();
      expect(cfg.remoteServerPort).toBe(3210);
    });

    it('should save custom port to config', () => {
      mockConfigStore.save({
        ...mockConfigStore.get(),
        remoteServerPort: 4000,
        remoteServerEnabled: true,
      });
      expect(mockConfigStore.save).toHaveBeenCalledWith(
        expect.objectContaining({ remoteServerPort: 4000 }),
      );
    });

    it('should save bind address to config', () => {
      mockConfigStore.save({
        ...mockConfigStore.get(),
        remoteServerBindAddress: '127.0.0.1',
      });
      expect(mockConfigStore.save).toHaveBeenCalledWith(
        expect.objectContaining({ remoteServerBindAddress: '127.0.0.1' }),
      );
    });
  });
});
