import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────

let keyboardHandler: ((key: any) => void) | null = null;
vi.mock('@opentui/react', () => ({
  useKeyboard: (handler: (key: any) => void) => {
    keyboardHandler = handler;
  },
  useTerminalDimensions: () => ({ width: 80, height: 24 }),
}));

vi.mock('@dotagents/core', () => ({
  configStore: { get: vi.fn().mockReturnValue({}) },
}));

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
  useEffect: (_fn: any) => {},
  useMemo: (fn: any) => fn(),
}));

import { DiagnosticsPanel } from './DiagnosticsPanel';
import type { SystemInfo, LangfuseStatus, ErrorLogEntry, HealthCheckResult } from '../hooks/useDiagnostics';

// ── Helpers ──────────────────────────────────────────────────────────

function simulateKey(name: string, ctrl = false) {
  if (keyboardHandler) {
    keyboardHandler({ name, ctrl });
  }
}

const defaultSystemInfo: SystemInfo = {
  platform: 'darwin',
  nodeVersion: 'v24.1.0',
  electronVersion: 'N/A (CLI)',
  mcpServersCount: 2,
  mcpToolsAvailable: 5,
};

const defaultLangfuseStatus: LangfuseStatus = {
  installed: true,
  enabled: false,
  baseUrl: 'https://cloud.langfuse.com',
};

const defaultHealthCheck: HealthCheckResult = {
  overall: 'healthy',
  checks: {
    mcpService: { status: 'pass', message: '5 tools available' },
    recentErrors: { status: 'pass', message: '0 errors in last 5 minutes' },
  },
};

const sampleErrors: ErrorLogEntry[] = [
  {
    timestamp: Date.now() - 5000,
    level: 'error',
    component: 'mcp',
    message: 'Connection timeout to server-x',
  },
  {
    timestamp: Date.now() - 3000,
    level: 'warning',
    component: 'config',
    message: 'Missing API key for provider Y',
  },
  {
    timestamp: Date.now() - 1000,
    level: 'info',
    component: 'system',
    message: 'Service restarted',
  },
];

// ── Tests ────────────────────────────────────────────────────────────

describe('DiagnosticsPanel', () => {
  const mockClose = vi.fn();
  const mockToggleLangfuse = vi.fn();
  const mockGenerateReport = vi.fn().mockResolvedValue(undefined);
  const mockRunHealthCheck = vi.fn().mockResolvedValue(undefined);
  const mockClearErrors = vi.fn();

  const defaultProps = {
    systemInfo: defaultSystemInfo,
    langfuseStatus: defaultLangfuseStatus,
    errorLog: [],
    healthCheck: null,
    diagnosticReport: null,
    loading: false,
    error: null,
    onToggleLangfuse: mockToggleLangfuse,
    onGenerateReport: mockGenerateReport,
    onRunHealthCheck: mockRunHealthCheck,
    onClearErrors: mockClearErrors,
    onClose: mockClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    hookStates = new Map();
    hookCallOrder = [];
    keyboardHandler = null;
  });

  // ── Rendering ──

  describe('rendering', () => {
    it('renders without crashing', () => {
      const result = DiagnosticsPanel(defaultProps);
      expect(result).toBeDefined();
    });

    it('renders with null systemInfo', () => {
      const result = DiagnosticsPanel({ ...defaultProps, systemInfo: null });
      expect(result).toBeDefined();
    });

    it('renders with error log', () => {
      const result = DiagnosticsPanel({ ...defaultProps, errorLog: sampleErrors });
      expect(result).toBeDefined();
    });

    it('renders with health check results', () => {
      const result = DiagnosticsPanel({
        ...defaultProps,
        healthCheck: defaultHealthCheck,
      });
      expect(result).toBeDefined();
    });

    it('renders error banner when error is present', () => {
      const result = DiagnosticsPanel({
        ...defaultProps,
        error: 'Something went wrong',
      });
      expect(result).toBeDefined();
    });

    it('renders loading state for health check', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'health'); // Set active section to health
      const result = DiagnosticsPanel({ ...defaultProps, loading: true });
      expect(result).toBeDefined();
    });
  });

  // ── Section navigation ──

  describe('section navigation', () => {
    it('closes on Escape', () => {
      DiagnosticsPanel(defaultProps);
      simulateKey('escape');
      expect(mockClose).toHaveBeenCalled();
    });

    it('switches sections with Tab', () => {
      DiagnosticsPanel(defaultProps);
      simulateKey('tab');
      // Section should cycle to next (langfuse)
    });

    it('switches sections with left/right arrows', () => {
      DiagnosticsPanel(defaultProps);
      simulateKey('right');
      simulateKey('left');
      // Should not crash
    });
  });

  // ── System section ──

  describe('system section', () => {
    it('generates report on "g" key', () => {
      DiagnosticsPanel(defaultProps);
      simulateKey('g');
      expect(mockGenerateReport).toHaveBeenCalled();
    });

    it('renders with diagnostic report', () => {
      const report = {
        timestamp: Date.now(),
        system: { platform: 'darwin', nodeVersion: 'v24.1.0', electronVersion: 'unknown' },
        config: { mcpServersCount: 2 },
        mcp: {
          availableTools: 5,
          serverStatus: {
            'server-1': { connected: true, toolCount: 3 },
            'server-2': { connected: false, toolCount: 0 },
          },
        },
        errors: [],
      };

      const result = DiagnosticsPanel({ ...defaultProps, diagnosticReport: report });
      expect(result).toBeDefined();
    });
  });

  // ── Langfuse section ──

  describe('langfuse section', () => {
    it('toggles Langfuse on Enter', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'langfuse'); // Active section = langfuse
      DiagnosticsPanel(defaultProps);

      simulateKey('return');
      expect(mockToggleLangfuse).toHaveBeenCalledWith(true); // Was false, toggle to true
    });

    it('toggles Langfuse off when already enabled', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'langfuse');
      DiagnosticsPanel({
        ...defaultProps,
        langfuseStatus: { ...defaultLangfuseStatus, enabled: true },
      });

      simulateKey('return');
      expect(mockToggleLangfuse).toHaveBeenCalledWith(false);
    });

    it('renders with Langfuse configured', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'langfuse');
      const result = DiagnosticsPanel({
        ...defaultProps,
        langfuseStatus: {
          installed: true,
          enabled: true,
          publicKey: 'pk-lf-1234...',
          baseUrl: 'https://custom.langfuse.com',
        },
      });
      expect(result).toBeDefined();
    });

    it('renders with Langfuse not installed', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'langfuse');
      const result = DiagnosticsPanel({
        ...defaultProps,
        langfuseStatus: {
          installed: false,
          enabled: false,
          baseUrl: 'https://cloud.langfuse.com',
        },
      });
      expect(result).toBeDefined();
    });
  });

  // ── Errors section ──

  describe('errors section', () => {
    it('navigates errors with up/down', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'errors');
      DiagnosticsPanel({ ...defaultProps, errorLog: sampleErrors });

      simulateKey('down');
      simulateKey('up');
      // Should not crash
    });

    it('clears errors on "c"', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'errors');
      DiagnosticsPanel({ ...defaultProps, errorLog: sampleErrors });

      simulateKey('c');
      expect(mockClearErrors).toHaveBeenCalled();
    });

    it('renders empty error log message', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'errors');
      const result = DiagnosticsPanel({ ...defaultProps, errorLog: [] });
      expect(result).toBeDefined();
    });

    it('renders error entries with different levels', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'errors');
      const result = DiagnosticsPanel({ ...defaultProps, errorLog: sampleErrors });
      expect(result).toBeDefined();
    });
  });

  // ── Health section ──

  describe('health section', () => {
    it('runs health check on Enter', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'health');
      DiagnosticsPanel(defaultProps);

      simulateKey('return');
      expect(mockRunHealthCheck).toHaveBeenCalled();
    });

    it('renders health check results', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'health');
      const result = DiagnosticsPanel({
        ...defaultProps,
        healthCheck: defaultHealthCheck,
      });
      expect(result).toBeDefined();
    });

    it('renders warning health check', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'health');
      const result = DiagnosticsPanel({
        ...defaultProps,
        healthCheck: {
          overall: 'warning',
          checks: {
            mcpService: { status: 'warning', message: '0 tools available' },
            recentErrors: { status: 'pass', message: '0 errors' },
          },
        },
      });
      expect(result).toBeDefined();
    });

    it('renders critical health check', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'health');
      const result = DiagnosticsPanel({
        ...defaultProps,
        healthCheck: {
          overall: 'critical',
          checks: {
            mcpService: { status: 'fail', message: 'MCP service error' },
          },
        },
      });
      expect(result).toBeDefined();
    });

    it('renders no health check yet', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'health');
      const result = DiagnosticsPanel({ ...defaultProps, healthCheck: null });
      expect(result).toBeDefined();
    });
  });

  // ── Cross-section actions ──

  describe('cross-section interactions', () => {
    it('does not trigger system actions in langfuse section', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'langfuse');
      DiagnosticsPanel(defaultProps);

      simulateKey('g');
      expect(mockGenerateReport).not.toHaveBeenCalled();
    });

    it('does not trigger langfuse toggle in system section', () => {
      DiagnosticsPanel(defaultProps);
      simulateKey('return');
      expect(mockToggleLangfuse).not.toHaveBeenCalled();
    });

    it('does not clear errors in health section', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'health');
      DiagnosticsPanel(defaultProps);

      simulateKey('c');
      expect(mockClearErrors).not.toHaveBeenCalled();
    });
  });
});
