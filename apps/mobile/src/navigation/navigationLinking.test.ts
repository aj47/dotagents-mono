import { describe, expect, it } from 'vitest';

import { buildNavigationLinking, ROOT_STACK_SCREEN_PATHS } from './navigationLinking';

describe('buildNavigationLinking', () => {
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
    const linking = buildNavigationLinking(['http://localhost:8120']);

    expect(linking.prefixes).toEqual(['http://localhost:8120']);
    expect(linking.config).toEqual({
      screens: ROOT_STACK_SCREEN_PATHS,
    });
  });
});