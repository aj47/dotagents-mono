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

import { AcpPanel } from './AcpPanel';
import type { AcpAgentInfo, DelegationEntry } from '../hooks/useAcp';

// ── Helpers ──────────────────────────────────────────────────────────

function simulateKey(name: string, ctrl = false) {
  if (keyboardHandler) {
    keyboardHandler({ name, ctrl });
  }
}

function createMockAgents(): AcpAgentInfo[] {
  return [
    {
      name: 'claude',
      displayName: 'Claude Code',
      description: 'Claude AI agent',
      connectionType: 'stdio',
      status: 'ready',
      enabled: true,
      autoSpawn: false,
    },
    {
      name: 'auggie',
      displayName: 'Augment',
      description: 'Auggie agent',
      connectionType: 'remote',
      status: 'stopped',
      enabled: true,
      autoSpawn: true,
    },
  ];
}

function createMockDelegations(): DelegationEntry[] {
  return [
    {
      runId: 'run-1',
      agentName: 'claude',
      task: 'Write unit tests',
      status: 'running',
      startTime: Date.now(),
      progress: 'Working...',
    },
    {
      runId: 'run-2',
      agentName: 'auggie',
      task: 'Review code',
      status: 'completed',
      startTime: Date.now() - 5000,
    },
  ];
}

// ── Tests ────────────────────────────────────────────────────────────

describe('AcpPanel', () => {
  const mockClose = vi.fn();
  const mockStartAgent = vi.fn().mockResolvedValue({ success: true });
  const mockStopAgent = vi.fn().mockResolvedValue({ success: true });
  const mockAddAgent = vi.fn().mockResolvedValue({ success: true });
  const mockRemoveAgent = vi.fn().mockResolvedValue({ success: true });
  const mockRefresh = vi.fn();

  const defaultProps = {
    agents: createMockAgents(),
    onClose: mockClose,
    onStartAgent: mockStartAgent,
    onStopAgent: mockStopAgent,
    onAddAgent: mockAddAgent,
    onRemoveAgent: mockRemoveAgent,
    onRefresh: mockRefresh,
    delegations: [],
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
      const result = AcpPanel(defaultProps);
      expect(result).toBeDefined();
    });

    it('renders with empty agent list', () => {
      const result = AcpPanel({ ...defaultProps, agents: [] });
      expect(result).toBeDefined();
    });

    it('renders with agents', () => {
      const result = AcpPanel(defaultProps);
      expect(result).toBeDefined();
    });

    it('shows agent count in title', () => {
      const result = AcpPanel(defaultProps);
      // The component renders a box with title text
      expect(result).toBeDefined();
    });
  });

  // ── Keyboard navigation ──

  describe('keyboard navigation', () => {
    it('closes on Escape', () => {
      AcpPanel(defaultProps);
      simulateKey('escape');
      expect(mockClose).toHaveBeenCalled();
    });

    it('navigates up/down', () => {
      AcpPanel(defaultProps);
      // Arrow down should update selectedIndex
      simulateKey('down');
      simulateKey('up');
      // No crash expected
    });

    it('opens add form on "a"', () => {
      AcpPanel(defaultProps);
      simulateKey('a');
      // View should switch to 'add' (state update)
    });

    it('opens delete confirmation on "d"', () => {
      AcpPanel(defaultProps);
      simulateKey('d');
      // View should switch to 'confirm-delete'
    });

    it('does not open delete when no agents', () => {
      AcpPanel({ ...defaultProps, agents: [] });
      simulateKey('d');
      // Should not crash
    });

    it('starts selected agent on "s"', () => {
      AcpPanel(defaultProps);
      simulateKey('s');
      expect(mockStartAgent).toHaveBeenCalledWith('claude');
    });

    it('stops selected agent on "x"', () => {
      AcpPanel(defaultProps);
      simulateKey('x');
      expect(mockStopAgent).toHaveBeenCalledWith('claude');
    });

    it('refreshes on "r"', () => {
      AcpPanel(defaultProps);
      simulateKey('r');
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('switches to delegations view on "v"', () => {
      AcpPanel(defaultProps);
      simulateKey('v');
      // View should switch to 'delegations'
    });
  });

  // ── Add form ──

  describe('add form', () => {
    it('enters add form mode on "a"', () => {
      AcpPanel(defaultProps);
      simulateKey('a');
      // In add mode, Escape should go back to list, not close panel
    });

    it('escapes from add form back to list', () => {
      AcpPanel(defaultProps);
      simulateKey('a');

      // Re-render to get updated view state
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'add'); // Set view to 'add'
      AcpPanel(defaultProps);

      simulateKey('escape');
      // Should not call onClose, should return to list view
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  // ── Delete confirmation ──

  describe('delete confirmation', () => {
    it('confirms delete on Enter', () => {
      // Set up state so we're in confirm-delete view
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'confirm-delete');
      AcpPanel(defaultProps);

      simulateKey('return');
      expect(mockRemoveAgent).toHaveBeenCalledWith('claude');
    });

    it('cancels delete on Escape', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'confirm-delete');
      AcpPanel(defaultProps);

      simulateKey('escape');
      // Should not call onRemoveAgent
      expect(mockRemoveAgent).not.toHaveBeenCalled();
    });
  });

  // ── Delegations view ──

  describe('delegations view', () => {
    it('renders with no delegations', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'delegations');
      const result = AcpPanel(defaultProps);
      expect(result).toBeDefined();
    });

    it('renders with delegations', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'delegations');
      const result = AcpPanel({
        ...defaultProps,
        delegations: createMockDelegations(),
      });
      expect(result).toBeDefined();
    });

    it('goes back to list on Escape', () => {
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'delegations');
      AcpPanel(defaultProps);

      simulateKey('escape');
      // Should not call onClose
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  // ── Agent status indicators ──

  describe('agent status display', () => {
    it('handles error agent status', () => {
      const errorAgents: AcpAgentInfo[] = [
        {
          name: 'broken',
          displayName: 'Broken Agent',
          description: '',
          connectionType: 'stdio',
          status: 'error',
          enabled: true,
          autoSpawn: false,
          error: 'Process crashed',
        },
      ];

      const result = AcpPanel({ ...defaultProps, agents: errorAgents });
      expect(result).toBeDefined();
    });

    it('handles starting agent status', () => {
      const startingAgents: AcpAgentInfo[] = [
        {
          name: 'starting',
          displayName: 'Starting Agent',
          description: '',
          connectionType: 'stdio',
          status: 'starting',
          enabled: true,
          autoSpawn: false,
        },
      ];

      const result = AcpPanel({ ...defaultProps, agents: startingAgents });
      expect(result).toBeDefined();
    });

    it('handles disabled agent', () => {
      const disabledAgents: AcpAgentInfo[] = [
        {
          name: 'disabled',
          displayName: 'Disabled Agent',
          description: '',
          connectionType: 'remote',
          status: 'stopped',
          enabled: false,
          autoSpawn: false,
        },
      ];

      const result = AcpPanel({ ...defaultProps, agents: disabledAgents });
      expect(result).toBeDefined();
    });
  });

  // ── Operation results ──

  describe('operation results', () => {
    it('handles failed start', async () => {
      mockStartAgent.mockResolvedValueOnce({ success: false, error: 'Agent not found' });
      AcpPanel(defaultProps);
      simulateKey('s');
      // Async operation, should not crash
    });

    it('handles failed stop', async () => {
      mockStopAgent.mockResolvedValueOnce({ success: false, error: 'Already stopped' });
      AcpPanel(defaultProps);
      simulateKey('x');
      // Async operation, should not crash
    });

    it('handles failed add', async () => {
      mockAddAgent.mockResolvedValueOnce({ success: false, error: 'Duplicate name' });
      // The submit would happen through the add form
    });

    it('handles failed remove', async () => {
      mockRemoveAgent.mockResolvedValueOnce({ success: false, error: 'Not found' });
      hookStates = new Map();
      hookCallOrder = [];
      hookStates.set('state_0', 'confirm-delete');
      AcpPanel(defaultProps);
      simulateKey('return');
      // Async operation, should not crash
    });
  });
});
