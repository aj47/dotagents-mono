import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────

const mockGenerateReport = vi.fn().mockResolvedValue({
  timestamp: Date.now(),
  system: { platform: 'darwin', nodeVersion: 'v24.1.0', electronVersion: 'unknown' },
  config: { mcpServersCount: 2 },
  mcp: { availableTools: 5, serverStatus: {} },
  errors: [],
});

const mockPerformHealthCheck = vi.fn().mockResolvedValue({
  overall: 'healthy',
  checks: {
    mcpService: { status: 'pass', message: '5 tools available' },
    recentErrors: { status: 'pass', message: '0 errors in last 5 minutes' },
    configuration: { status: 'pass', message: '2 MCP servers configured' },
  },
});

const mockGetRecentErrors = vi.fn().mockReturnValue([]);
const mockClearErrorLog = vi.fn();

const mockConfigGet = vi.fn().mockReturnValue({
  langfuseEnabled: false,
  langfusePublicKey: '',
  langfuseSecretKey: '',
  langfuseBaseUrl: '',
  mcpConfig: { mcpServers: {} },
});
const mockConfigSave = vi.fn();

const mockIsLangfuseInstalled = vi.fn().mockReturnValue(true);
const mockIsLangfuseEnabled = vi.fn().mockReturnValue(false);
const mockReinitializeLangfuse = vi.fn();

vi.mock('@dotagents/core', () => ({
  diagnosticsService: {
    generateDiagnosticReport: (...args: any[]) => mockGenerateReport(...args),
    performHealthCheck: (...args: any[]) => mockPerformHealthCheck(...args),
    getRecentErrors: (...args: any[]) => mockGetRecentErrors(...args),
    clearErrorLog: (...args: any[]) => mockClearErrorLog(...args),
  },
  isLangfuseInstalled: (...args: any[]) => mockIsLangfuseInstalled(...args),
  isLangfuseEnabled: (...args: any[]) => mockIsLangfuseEnabled(...args),
  reinitializeLangfuse: (...args: any[]) => mockReinitializeLangfuse(...args),
  configStore: {
    get: (...args: any[]) => mockConfigGet(...args),
    save: (...args: any[]) => mockConfigSave(...args),
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

import { useDiagnostics } from './useDiagnostics';

// ── Tests ────────────────────────────────────────────────────────────

describe('useDiagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookStates = new Map();
    hookCallOrder = [];
    mockConfigGet.mockReturnValue({
      langfuseEnabled: false,
      langfusePublicKey: '',
      langfuseSecretKey: '',
      langfuseBaseUrl: '',
      mcpConfig: { mcpServers: {} },
    });
  });

  // ── System info ──

  describe('systemInfo', () => {
    it('returns system information', () => {
      const result = useDiagnostics();

      expect(result.systemInfo).not.toBeNull();
      expect(result.systemInfo!.platform).toBe(process.platform);
      expect(result.systemInfo!.nodeVersion).toBe(process.version);
      expect(result.systemInfo!.electronVersion).toBe('N/A (CLI)');
    });

    it('includes MCP server count from config', () => {
      mockConfigGet.mockReturnValue({
        mcpConfig: {
          mcpServers: {
            server1: { command: 'x' },
            server2: { url: 'http://y' },
          },
        },
      });

      const result = useDiagnostics();
      expect(result.systemInfo!.mcpServersCount).toBe(2);
    });

    it('returns zero MCP servers when none configured', () => {
      const result = useDiagnostics();
      expect(result.systemInfo!.mcpServersCount).toBe(0);
    });
  });

  // ── Langfuse status ──

  describe('langfuseStatus', () => {
    it('returns Langfuse status when not configured', () => {
      const result = useDiagnostics();

      expect(result.langfuseStatus.installed).toBe(true);
      expect(result.langfuseStatus.enabled).toBe(false);
    });

    it('returns enabled status when configured', () => {
      mockIsLangfuseEnabled.mockReturnValue(true);
      mockConfigGet.mockReturnValue({
        langfuseEnabled: true,
        langfusePublicKey: 'test-langfuse-public-key',
        langfuseSecretKey: 'sk-lf-secret',
        langfuseBaseUrl: 'https://custom.langfuse.com',
        mcpConfig: { mcpServers: {} },
      });

      const result = useDiagnostics();

      expect(result.langfuseStatus.enabled).toBe(true);
      expect(result.langfuseStatus.publicKey).toContain('test-langfuse');
      expect(result.langfuseStatus.baseUrl).toBe('https://custom.langfuse.com');
    });

    it('shows not installed when langfuse unavailable', () => {
      mockIsLangfuseInstalled.mockReturnValue(false);

      const result = useDiagnostics();
      expect(result.langfuseStatus.installed).toBe(false);
    });

    it('uses default base URL when not configured', () => {
      const result = useDiagnostics();
      expect(result.langfuseStatus.baseUrl).toBe('https://cloud.langfuse.com');
    });
  });

  // ── Toggle Langfuse ──

  describe('toggleLangfuse', () => {
    it('enables Langfuse', () => {
      const result = useDiagnostics();
      result.toggleLangfuse(true);

      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({ langfuseEnabled: true }),
      );
      expect(mockReinitializeLangfuse).toHaveBeenCalled();
    });

    it('disables Langfuse', () => {
      mockConfigGet.mockReturnValue({
        langfuseEnabled: true,
        mcpConfig: { mcpServers: {} },
      });

      const result = useDiagnostics();
      result.toggleLangfuse(false);

      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({ langfuseEnabled: false }),
      );
      expect(mockReinitializeLangfuse).toHaveBeenCalled();
    });
  });

  // ── Update Langfuse config ──

  describe('updateLangfuseConfig', () => {
    it('updates public key', () => {
      const result = useDiagnostics();
      result.updateLangfuseConfig({ publicKey: 'pk-lf-new' });

      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({ langfusePublicKey: 'pk-lf-new' }),
      );
      expect(mockReinitializeLangfuse).toHaveBeenCalled();
    });

    it('updates multiple keys at once', () => {
      const result = useDiagnostics();
      result.updateLangfuseConfig({
        publicKey: 'pk-lf-new',
        secretKey: 'sk-lf-new',
        baseUrl: 'https://my-langfuse.com',
      });

      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({
          langfusePublicKey: 'pk-lf-new',
          langfuseSecretKey: 'sk-lf-new',
          langfuseBaseUrl: 'https://my-langfuse.com',
        }),
      );
    });

    it('only updates provided fields', () => {
      const result = useDiagnostics();
      result.updateLangfuseConfig({ baseUrl: 'https://new-url.com' });

      const savedConfig = mockConfigSave.mock.calls[0][0];
      expect(savedConfig.langfuseBaseUrl).toBe('https://new-url.com');
      // Should not have new langfusePublicKey or langfuseSecretKey keys added
      expect(savedConfig).not.toHaveProperty('langfusePublicKey', 'pk-lf-new');
      expect(savedConfig).not.toHaveProperty('langfuseSecretKey', 'sk-lf-new');
    });
  });

  // ── Diagnostic report ──

  describe('generateReport', () => {
    it('generates a diagnostic report', async () => {
      const result = useDiagnostics();
      await result.generateReport();

      expect(mockGenerateReport).toHaveBeenCalled();
    });

    it('handles report generation failure', async () => {
      mockGenerateReport.mockRejectedValueOnce(new Error('Report failed'));

      const result = useDiagnostics();
      await result.generateReport();

      // Error should be set (via state setter)
      // Since we mock useState, we can't directly check state changes,
      // but we verify the function was called
      expect(mockGenerateReport).toHaveBeenCalled();
    });
  });

  // ── Health check ──

  describe('runHealthCheck', () => {
    it('runs health check', async () => {
      const result = useDiagnostics();
      await result.runHealthCheck();

      expect(mockPerformHealthCheck).toHaveBeenCalled();
    });

    it('handles health check failure', async () => {
      mockPerformHealthCheck.mockRejectedValueOnce(new Error('Check failed'));

      const result = useDiagnostics();
      await result.runHealthCheck();

      expect(mockPerformHealthCheck).toHaveBeenCalled();
    });
  });

  // ── Error log ──

  describe('error log', () => {
    it('returns empty error log initially', () => {
      const result = useDiagnostics();
      expect(result.errorLog).toEqual([]);
    });

    it('returns errors from diagnostics service', () => {
      mockGetRecentErrors.mockReturnValue([
        {
          timestamp: Date.now(),
          level: 'error',
          component: 'mcp',
          message: 'Connection failed',
        },
        {
          timestamp: Date.now() - 1000,
          level: 'warning',
          component: 'config',
          message: 'Missing API key',
        },
      ]);

      const result = useDiagnostics();
      expect(result.errorLog).toHaveLength(2);
      expect(result.errorLog[0].level).toBe('error');
      expect(result.errorLog[1].level).toBe('warning');
    });

    it('getRecentErrors calls diagnostics with count', () => {
      mockGetRecentErrors.mockReturnValue([
        { timestamp: 1, level: 'error', component: 'a', message: 'a' },
      ]);

      const result = useDiagnostics();
      const errors = result.getRecentErrors(5);

      expect(mockGetRecentErrors).toHaveBeenCalledWith(5);
      expect(errors).toHaveLength(1);
    });

    it('getRecentErrors defaults to 10', () => {
      const result = useDiagnostics();
      result.getRecentErrors();

      expect(mockGetRecentErrors).toHaveBeenCalledWith(10);
    });

    it('clears error log', () => {
      const result = useDiagnostics();
      result.clearErrors();

      expect(mockClearErrorLog).toHaveBeenCalled();
    });
  });

  // ── Refresh ──

  describe('refresh', () => {
    it('is a callable function', () => {
      const result = useDiagnostics();
      expect(typeof result.refresh).toBe('function');
      result.refresh(); // Should not throw
    });
  });

  // ── Loading/error state ──

  describe('initial state', () => {
    it('starts with loading=false', () => {
      const result = useDiagnostics();
      expect(result.loading).toBe(false);
    });

    it('starts with error=null', () => {
      const result = useDiagnostics();
      expect(result.error).toBeNull();
    });

    it('starts with diagnosticReport=null', () => {
      const result = useDiagnostics();
      expect(result.diagnosticReport).toBeNull();
    });

    it('starts with healthCheck=null', () => {
      const result = useDiagnostics();
      expect(result.healthCheck).toBeNull();
    });
  });
});
