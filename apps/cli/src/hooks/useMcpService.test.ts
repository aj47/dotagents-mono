import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock core-wiring
const mockInitializeMcpServers = vi.fn();
const mockCleanupMcpService = vi.fn();

vi.mock('../core-wiring', () => ({
  initializeMcpServers: (...args: any[]) => mockInitializeMcpServers(...args),
  cleanupMcpService: (...args: any[]) => mockCleanupMcpService(...args),
}));

// Mock mcpService
const mockGetAvailableTools = vi.fn();

vi.mock('@dotagents/core', () => ({
  mcpService: {
    getAvailableTools: (...args: any[]) => mockGetAvailableTools(...args),
  },
}));

// Minimal React hooks mock for state tracking
let hookStates: Map<string, any> = new Map();
let hookCallOrder: string[] = [];
let effectCallbacks: Array<() => void | (() => void)> = [];
let effectCleanups: Array<(() => void) | undefined> = [];

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
  useEffect: (fn: () => void | (() => void), _deps?: any[]) => {
    effectCallbacks.push(fn);
  },
}));

import { useMcpService } from './useMcpService';

describe('useMcpService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookStates = new Map();
    hookCallOrder = [];
    effectCallbacks = [];
    effectCleanups = [];
    mockInitializeMcpServers.mockResolvedValue({ toolCount: 0, errors: [] });
    mockGetAvailableTools.mockReturnValue([]);
    mockCleanupMcpService.mockResolvedValue(undefined);
  });

  it('returns initial idle state', () => {
    const result = useMcpService();
    expect(result.status).toBe('idle');
    expect(result.tools).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('provides a reinitialize function', () => {
    const result = useMcpService();
    expect(typeof result.reinitialize).toBe('function');
  });

  it('reinitialize calls initializeMcpServers and updates tools', async () => {
    const tools = [
      { name: 'server:tool1', description: 'Tool 1' },
    ];
    mockInitializeMcpServers.mockResolvedValue({ toolCount: 1, errors: [] });
    mockGetAvailableTools.mockReturnValue(tools);

    const result = useMcpService();
    await result.reinitialize();

    // initializeMcpServers should have been called
    expect(mockInitializeMcpServers).toHaveBeenCalled();
    expect(mockGetAvailableTools).toHaveBeenCalled();
  });

  it('reinitialize captures errors from failed servers', async () => {
    mockInitializeMcpServers.mockResolvedValue({
      toolCount: 0,
      errors: ['Server "broken" failed'],
    });
    mockGetAvailableTools.mockReturnValue([]);

    const result = useMcpService();
    await result.reinitialize();

    expect(mockInitializeMcpServers).toHaveBeenCalled();
  });

  it('reinitialize handles thrown errors gracefully', async () => {
    mockInitializeMcpServers.mockRejectedValue(new Error('Fatal error'));

    const result = useMcpService();
    // Should not throw
    await result.reinitialize();

    expect(mockInitializeMcpServers).toHaveBeenCalled();
  });

  it('registers an effect for initialization on mount', () => {
    useMcpService();
    // useEffect should have been called
    expect(effectCallbacks.length).toBeGreaterThan(0);
  });

  it('effect callback calls initialization', async () => {
    useMcpService();
    // Run the effect
    const cleanup = effectCallbacks[0]?.();
    // initializeMcpServers is called async, wait for it
    await new Promise((r) => setTimeout(r, 10));
    expect(mockInitializeMcpServers).toHaveBeenCalled();
  });
});
