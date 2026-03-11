export const ROOT_STACK_SCREEN_PATHS = {
  Settings: '',
  ConnectionSettings: 'connection',
  Sessions: 'sessions',
  Chat: 'chat',
  AgentEdit: 'agents/edit',
  MemoryEdit: 'memories/edit',
  LoopEdit: 'loops/edit',
} as const;

export function buildNavigationLinking(prefixes: string[]) {
  return {
    prefixes,
    config: {
      screens: ROOT_STACK_SCREEN_PATHS,
    },
  };
}