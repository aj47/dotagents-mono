import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────

const mockGetAgents = vi.fn().mockReturnValue([]);
const mockSpawnAgent = vi.fn().mockResolvedValue({
  effectiveWorkingDirectory: '/test',
  reusedExistingProcess: false,
  restartedProcess: false,
});
const mockStopAgent = vi.fn().mockResolvedValue(undefined);
const mockInitialize = vi.fn().mockResolvedValue(undefined);

const mockConfigGet = vi.fn().mockReturnValue({ acpAgents: [] });
const mockConfigSave = vi.fn();

const mockGetAllDelegations = vi.fn().mockReturnValue([]);

vi.mock('@dotagents/core', () => ({
  acpService: {
    getAgents: (...args: any[]) => mockGetAgents(...args),
    spawnAgent: (...args: any[]) => mockSpawnAgent(...args),
    stopAgent: (...args: any[]) => mockStopAgent(...args),
    initialize: (...args: any[]) => mockInitialize(...args),
  },
  acpRegistry: {
    getAgent: vi.fn(),
    getAllAgents: vi.fn().mockReturnValue([]),
  },
  configStore: {
    get: (...args: any[]) => mockConfigGet(...args),
    save: (...args: any[]) => mockConfigSave(...args),
  },
  getAllDelegationsForSession: (...args: any[]) => mockGetAllDelegations(...args),
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

import { useAcp } from './useAcp';

// ── Tests ────────────────────────────────────────────────────────────

describe('useAcp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookStates = new Map();
    hookCallOrder = [];
    mockGetAgents.mockReturnValue([]);
    mockConfigGet.mockReturnValue({ acpAgents: [] });
  });

  // ── Agent listing ──

  describe('agents listing', () => {
    it('returns empty list when no agents configured', () => {
      const result = useAcp();
      expect(result.agents).toEqual([]);
    });

    it('returns agent list from acpService', () => {
      mockGetAgents.mockReturnValue([
        {
          config: {
            name: 'claude',
            displayName: 'Claude Code',
            description: 'Claude AI agent',
            connection: { type: 'stdio', command: 'claude' },
            enabled: true,
            autoSpawn: false,
          },
          status: 'stopped',
          error: undefined,
        },
        {
          config: {
            name: 'auggie',
            displayName: 'Augment',
            description: 'Auggie agent',
            connection: { type: 'remote', baseUrl: 'http://localhost:3000' },
            enabled: true,
            autoSpawn: true,
          },
          status: 'ready',
          error: undefined,
        },
      ]);

      const result = useAcp();
      expect(result.agents).toHaveLength(2);
      expect(result.agents[0]).toEqual({
        name: 'claude',
        displayName: 'Claude Code',
        description: 'Claude AI agent',
        connectionType: 'stdio',
        status: 'stopped',
        enabled: true,
        autoSpawn: false,
        error: undefined,
        allowedTools: undefined,
      });
      expect(result.agents[1].name).toBe('auggie');
      expect(result.agents[1].status).toBe('ready');
      expect(result.agents[1].connectionType).toBe('remote');
    });

    it('maps disabled agents correctly', () => {
      mockGetAgents.mockReturnValue([
        {
          config: {
            name: 'test',
            displayName: 'Test',
            connection: { type: 'stdio', command: 'test' },
            enabled: false,
          },
          status: 'stopped',
        },
      ]);

      const result = useAcp();
      expect(result.agents[0].enabled).toBe(false);
    });

    it('shows error status correctly', () => {
      mockGetAgents.mockReturnValue([
        {
          config: {
            name: 'broken',
            displayName: 'Broken',
            connection: { type: 'stdio', command: 'notfound' },
          },
          status: 'error',
          error: 'Process exited with code 1',
        },
      ]);

      const result = useAcp();
      expect(result.agents[0].status).toBe('error');
      expect(result.agents[0].error).toBe('Process exited with code 1');
    });

    it('defaults displayName to name when not provided', () => {
      mockGetAgents.mockReturnValue([
        {
          config: {
            name: 'my-agent',
            connection: { type: 'stdio', command: 'x' },
          },
          status: 'stopped',
        },
      ]);

      const result = useAcp();
      expect(result.agents[0].displayName).toBe('my-agent');
    });
  });

  // ── Start/stop ──

  describe('start/stop agents', () => {
    it('starts an agent successfully', async () => {
      const result = useAcp();
      const res = await result.startAgent('claude');

      expect(mockSpawnAgent).toHaveBeenCalledWith('claude');
      expect(res.success).toBe(true);
    });

    it('handles start failure', async () => {
      mockSpawnAgent.mockRejectedValueOnce(new Error('Spawn failed'));

      const result = useAcp();
      const res = await result.startAgent('claude');

      expect(res.success).toBe(false);
      expect(res.error).toBe('Spawn failed');
    });

    it('stops an agent successfully', async () => {
      const result = useAcp();
      const res = await result.stopAgent('claude');

      expect(mockStopAgent).toHaveBeenCalledWith('claude');
      expect(res.success).toBe(true);
    });

    it('handles stop failure', async () => {
      mockStopAgent.mockRejectedValueOnce(new Error('Stop failed'));

      const result = useAcp();
      const res = await result.stopAgent('broken');

      expect(res.success).toBe(false);
      expect(res.error).toBe('Stop failed');
    });
  });

  // ── Add agent ──

  describe('addAgent', () => {
    it('adds a stdio agent', async () => {
      mockConfigGet.mockReturnValue({ acpAgents: [] });

      const result = useAcp();
      const res = await result.addAgent({
        name: 'new-agent',
        displayName: 'New Agent',
        connection: { type: 'stdio', command: 'my-agent' },
        enabled: true,
      });

      expect(res.success).toBe(true);
      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({
          acpAgents: expect.arrayContaining([
            expect.objectContaining({ name: 'new-agent' }),
          ]),
        }),
      );
    });

    it('adds a remote agent', async () => {
      mockConfigGet.mockReturnValue({ acpAgents: [] });

      const result = useAcp();
      const res = await result.addAgent({
        name: 'remote-agent',
        displayName: 'Remote Agent',
        connection: { type: 'remote', baseUrl: 'http://localhost:5000' },
        enabled: true,
      });

      expect(res.success).toBe(true);
    });

    it('rejects empty name', async () => {
      const result = useAcp();
      const res = await result.addAgent({
        name: '  ',
        displayName: 'Test',
        connection: { type: 'stdio', command: 'test' },
        enabled: true,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('required');
    });

    it('rejects duplicate name', async () => {
      mockConfigGet.mockReturnValue({
        acpAgents: [{ name: 'existing', connection: { type: 'stdio', command: 'x' } }],
      });

      const result = useAcp();
      const res = await result.addAgent({
        name: 'existing',
        displayName: 'Existing',
        connection: { type: 'stdio', command: 'x' },
        enabled: true,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('already exists');
    });

    it('requires command for stdio agents', async () => {
      mockConfigGet.mockReturnValue({ acpAgents: [] });

      const result = useAcp();
      const res = await result.addAgent({
        name: 'no-cmd',
        displayName: 'No Command',
        connection: { type: 'stdio' },
        enabled: true,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('command');
    });

    it('requires baseUrl for remote agents', async () => {
      mockConfigGet.mockReturnValue({ acpAgents: [] });

      const result = useAcp();
      const res = await result.addAgent({
        name: 'no-url',
        displayName: 'No URL',
        connection: { type: 'remote' },
        enabled: true,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('base URL');
    });

    it('handles config save failure', async () => {
      mockConfigGet.mockReturnValue({ acpAgents: [] });
      mockConfigSave.mockImplementationOnce(() => {
        throw new Error('Disk full');
      });

      const result = useAcp();
      const res = await result.addAgent({
        name: 'test',
        displayName: 'Test',
        connection: { type: 'stdio', command: 'test' },
        enabled: true,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Disk full');
    });
  });

  // ── Remove agent ──

  describe('removeAgent', () => {
    it('removes an agent', async () => {
      mockConfigGet.mockReturnValue({
        acpAgents: [
          { name: 'to-remove', connection: { type: 'stdio', command: 'x' } },
          { name: 'keep', connection: { type: 'stdio', command: 'y' } },
        ],
      });

      const result = useAcp();
      const res = await result.removeAgent('to-remove');

      expect(res.success).toBe(true);
      expect(mockStopAgent).toHaveBeenCalledWith('to-remove');
      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({
          acpAgents: [expect.objectContaining({ name: 'keep' })],
        }),
      );
    });

    it('returns error for non-existent agent', async () => {
      mockConfigGet.mockReturnValue({ acpAgents: [] });

      const result = useAcp();
      const res = await result.removeAgent('nonexistent');

      expect(res.success).toBe(false);
      expect(res.error).toContain('not found');
    });

    it('continues removal even if stop fails', async () => {
      mockConfigGet.mockReturnValue({
        acpAgents: [{ name: 'a', connection: { type: 'stdio', command: 'x' } }],
      });
      mockStopAgent.mockRejectedValueOnce(new Error('Already stopped'));

      const result = useAcp();
      const res = await result.removeAgent('a');

      expect(res.success).toBe(true);
      expect(mockConfigSave).toHaveBeenCalled();
    });
  });

  // ── Update agent ──

  describe('updateAgent', () => {
    it('updates an existing agent', async () => {
      mockConfigGet.mockReturnValue({
        acpAgents: [
          { name: 'agent1', displayName: 'Old Name', connection: { type: 'stdio', command: 'x' } },
        ],
      });

      const result = useAcp();
      const res = await result.updateAgent('agent1', { displayName: 'New Name' });

      expect(res.success).toBe(true);
      expect(mockConfigSave).toHaveBeenCalledWith(
        expect.objectContaining({
          acpAgents: [expect.objectContaining({ displayName: 'New Name' })],
        }),
      );
    });

    it('returns error for non-existent agent', async () => {
      mockConfigGet.mockReturnValue({ acpAgents: [] });

      const result = useAcp();
      const res = await result.updateAgent('ghost', { displayName: 'Ghost' });

      expect(res.success).toBe(false);
      expect(res.error).toContain('not found');
    });

    it('handles config save failure', async () => {
      mockConfigGet.mockReturnValue({
        acpAgents: [{ name: 'a', connection: { type: 'stdio', command: 'x' } }],
      });
      mockConfigSave.mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      const result = useAcp();
      const res = await result.updateAgent('a', { displayName: 'New' });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Write error');
    });
  });

  // ── Delegations ──

  describe('getDelegations', () => {
    it('returns empty when no delegations', () => {
      const result = useAcp();
      const delegations = result.getDelegations('session-1');
      expect(delegations).toEqual([]);
    });

    it('returns delegation chain for session', () => {
      const now = Date.now();
      mockGetAllDelegations.mockReturnValue([
        {
          runId: 'run-1',
          agentName: 'claude',
          task: 'Write unit tests',
          status: 'running',
          startTime: now,
          progressMessage: 'Working...',
        },
        {
          runId: 'run-2',
          agentName: 'auggie',
          task: 'Review code',
          status: 'completed',
          startTime: now - 5000,
        },
      ]);

      const result = useAcp();
      const delegations = result.getDelegations('session-1');

      expect(delegations).toHaveLength(2);
      expect(delegations[0].agentName).toBe('claude');
      expect(delegations[0].status).toBe('running');
      expect(delegations[0].progress).toBe('Working...');
      expect(delegations[1].agentName).toBe('auggie');
      expect(delegations[1].status).toBe('completed');
    });

    it('handles errors gracefully', () => {
      mockGetAllDelegations.mockImplementation(() => {
        throw new Error('No session');
      });

      const result = useAcp();
      const delegations = result.getDelegations('bad-session');
      expect(delegations).toEqual([]);
    });
  });

  // ── Initialize / cleanup ──

  describe('initialize and cleanup', () => {
    it('initializes ACP service', async () => {
      const result = useAcp();
      await result.initialize();
      expect(mockInitialize).toHaveBeenCalled();
    });

    it('handles initialization failure gracefully', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('Init failed'));

      const result = useAcp();
      // Should not throw
      await result.initialize();
    });

    it('cleans up running agents', async () => {
      mockGetAgents.mockReturnValue([
        { config: { name: 'a1', connection: { type: 'stdio' } }, status: 'ready' },
        { config: { name: 'a2', connection: { type: 'stdio' } }, status: 'stopped' },
        { config: { name: 'a3', connection: { type: 'stdio' } }, status: 'starting' },
      ]);

      const result = useAcp();
      await result.cleanup();

      // Should stop running agents, not stopped ones
      expect(mockStopAgent).toHaveBeenCalledWith('a1');
      expect(mockStopAgent).not.toHaveBeenCalledWith('a2');
      expect(mockStopAgent).toHaveBeenCalledWith('a3');
    });
  });

  // ── Refresh ──

  describe('refresh', () => {
    it('is a callable function', () => {
      const result = useAcp();
      expect(typeof result.refresh).toBe('function');
      result.refresh(); // Should not throw
    });
  });
});
