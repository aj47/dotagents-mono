import {
  getPathFromState as getReactNavigationPathFromState,
  getStateFromPath as getReactNavigationStateFromPath,
} from '@react-navigation/core';

export const ROOT_STACK_SCREEN_PATHS = {
  Settings: '',
  ConnectionSettings: 'connection',
  Sessions: 'sessions',
  Chat: 'chat',
  AgentEdit: 'agents/edit',
  MemoryEdit: 'memories/edit',
  LoopEdit: 'loops/edit',
} as const;

const CHAT_TRANSIENT_WEB_PARAMS = new Set(['initialMessage']);

function stripTransientChatParamsFromState(state: any): any {
  if (!state?.routes || !Array.isArray(state.routes)) {
    return state;
  }

  return {
    ...state,
    routes: state.routes.map((route: any) => {
      const nextRoute = route?.state
        ? { ...route, state: stripTransientChatParamsFromState(route.state) }
        : route;

      if (nextRoute?.name !== 'Chat' || !nextRoute.params) {
        return nextRoute;
      }

      const nextParams = Object.fromEntries(
        Object.entries(nextRoute.params).filter(([key]) => !CHAT_TRANSIENT_WEB_PARAMS.has(key)),
      );

      if (Object.keys(nextParams).length === 0) {
        const { params: _params, ...routeWithoutParams } = nextRoute;
        return routeWithoutParams;
      }

      return {
        ...nextRoute,
        params: nextParams,
      };
    }),
  };
}

export function buildNavigationLinking(prefixes: string[]) {
  return {
    prefixes,
    config: {
      screens: ROOT_STACK_SCREEN_PATHS,
    },
    getPathFromState(state: Parameters<typeof getReactNavigationPathFromState>[0], config: Parameters<typeof getReactNavigationPathFromState>[1]) {
      return getReactNavigationPathFromState(stripTransientChatParamsFromState(state), config);
    },
    getStateFromPath(path: string, config: Parameters<typeof getReactNavigationStateFromPath>[1]) {
      return stripTransientChatParamsFromState(getReactNavigationStateFromPath(path, config));
    },
  };
}