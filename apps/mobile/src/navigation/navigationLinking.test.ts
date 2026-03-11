import { describe, expect, it } from 'vitest';
import { getPathFromState, getStateFromPath } from '@react-navigation/core';

import { buildNavigationLinking, ROOT_STACK_SCREEN_PATHS } from './navigationLinking';
import {
  buildLoopEditNavigationParams,
  buildMemoryEditNavigationParams,
  getLoopEditRouteContext,
  getMemoryEditRouteContext,
} from '../screens/edit-route-params';

const sampleMemory = {
  id: 'memory-123',
  title: 'Pinned note',
  content: 'Useful context',
  importance: 'high' as const,
  tags: ['pinned'],
  createdAt: 1741651200000,
  updatedAt: 1741651200000,
};

const sampleLoop = {
  id: 'loop-123',
  name: 'Daily QA',
  prompt: 'Check status',
  intervalMinutes: 15,
  enabled: true,
  profileId: 'agent-123',
  isRunning: false,
};

describe('buildNavigationLinking', () => {
  const linking = buildNavigationLinking(['http://localhost:8120']);

  it('maps the root stack screens to stable web paths', () => {
    expect(ROOT_STACK_SCREEN_PATHS).toEqual({
      Settings: '',
      ConnectionSettings: 'connection',
      Sessions: 'sessions',
      Chat: 'chat',
      AgentEdit: 'agents/edit',
      MemoryEdit: 'memories/edit',
      LoopEdit: 'loops/edit',
    });
  });

  it('preserves the provided prefixes and screen config', () => {
    expect(linking.prefixes).toEqual(['http://localhost:8120']);
    expect(linking.config).toEqual({
      screens: ROOT_STACK_SCREEN_PATHS,
    });
  });

  it('round-trips the verified Settings to Connection web path through React Navigation state', () => {
    expect(getPathFromState({ routes: [{ name: 'Settings' }] }, linking.config)).toBe('/');
    expect(getPathFromState({ routes: [{ name: 'ConnectionSettings' }] }, linking.config)).toBe('/connection');
    expect(getStateFromPath('/connection', linking.config)?.routes[0]).toMatchObject({
      name: 'ConnectionSettings',
    });
  });

  it('keeps serializable agent edit identifiers in the URL', () => {
    const path = getPathFromState({
      routes: [{ name: 'AgentEdit', params: { agentId: 'agent-123' } }],
    }, linking.config);

    expect(path).toBe('/agents/edit?agentId=agent-123');
    expect(getStateFromPath(path, linking.config)?.routes[0]).toMatchObject({
      name: 'AgentEdit',
      params: {
        agentId: 'agent-123',
      },
    });
  });

  it('omits non-serializable memory and loop objects from generated web edit URLs', () => {
    const memoryPath = getPathFromState({
      routes: [{
        name: 'MemoryEdit',
        params: buildMemoryEditNavigationParams(sampleMemory, true),
      }],
    }, linking.config);

    const loopPath = getPathFromState({
      routes: [{
        name: 'LoopEdit',
        params: buildLoopEditNavigationParams(sampleLoop, true),
      }],
    }, linking.config);

    expect(memoryPath).toBe('/memories/edit?memoryId=memory-123');
    expect(loopPath).toBe('/loops/edit?loopId=loop-123');
    expect(memoryPath).not.toContain('[object%20Object]');
    expect(loopPath).not.toContain('[object%20Object]');
    expect(getStateFromPath(memoryPath, linking.config)?.routes[0]).toMatchObject({
      name: 'MemoryEdit',
      params: {
        memoryId: 'memory-123',
      },
    });
    expect(getStateFromPath(loopPath, linking.config)?.routes[0]).toMatchObject({
      name: 'LoopEdit',
      params: {
        loopId: 'loop-123',
      },
    });
  });
});

describe('edit route param helpers', () => {
  it('keeps full memory and loop objects on native navigation, but strips them on web', () => {
    expect(buildMemoryEditNavigationParams(sampleMemory, false)).toEqual({
      memoryId: 'memory-123',
      memory: sampleMemory,
    });
    expect(buildMemoryEditNavigationParams(sampleMemory, true)).toEqual({
      memoryId: 'memory-123',
    });
    expect(buildLoopEditNavigationParams(sampleLoop, false)).toEqual({
      loopId: 'loop-123',
      loop: sampleLoop,
    });
    expect(buildLoopEditNavigationParams(sampleLoop, true)).toEqual({
      loopId: 'loop-123',
    });
  });

  it('ignores stale stringified object params so edit screens fall back to loading by id', () => {
    expect(getMemoryEditRouteContext({
      memoryId: 'memory-123',
      memory: '[object Object]',
    })).toEqual({
      memoryFromRoute: undefined,
      memoryId: 'memory-123',
      effectiveMemoryId: 'memory-123',
    });

    expect(getLoopEditRouteContext({
      loopId: 'loop-123',
      loop: '[object Object]',
    })).toEqual({
      loopFromRoute: undefined,
      loopId: 'loop-123',
      effectiveLoopId: 'loop-123',
    });
  });
});