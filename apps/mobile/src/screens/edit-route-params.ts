import type { Loop, Memory } from '../lib/settingsApi';

type RouteParams = Record<string, unknown> | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getStringParam(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function isMemoryRouteParam(value: unknown): value is Memory {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.content === 'string'
    && typeof value.importance === 'string'
    && Array.isArray(value.tags);
}

function isLoopRouteParam(value: unknown): value is Loop {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.prompt === 'string'
    && typeof value.intervalMinutes === 'number'
    && typeof value.enabled === 'boolean';
}

export function buildMemoryEditNavigationParams(memory?: Memory, isWeb: boolean = false) {
  if (!memory) {
    return {};
  }

  return isWeb
    ? { memoryId: memory.id }
    : { memoryId: memory.id, memory };
}

export function buildLoopEditNavigationParams(loop?: Loop, isWeb: boolean = false) {
  if (!loop) {
    return {};
  }

  return isWeb
    ? { loopId: loop.id }
    : { loopId: loop.id, loop };
}

export function getMemoryEditRouteContext(params: RouteParams) {
  const memoryFromRoute = isMemoryRouteParam(params?.memory) ? params.memory : undefined;
  const memoryId = getStringParam(params?.memoryId);

  return {
    memoryFromRoute,
    memoryId,
    effectiveMemoryId: memoryId ?? memoryFromRoute?.id,
  };
}

export function getLoopEditRouteContext(params: RouteParams) {
  const loopFromRoute = isLoopRouteParam(params?.loop) ? params.loop : undefined;
  const loopId = getStringParam(params?.loopId);

  return {
    loopFromRoute,
    loopId,
    effectiveLoopId: loopId ?? loopFromRoute?.id,
  };
}