import { afterEach, describe, expect, it, vi } from 'vitest';

type EffectRecord = {
  callback?: () => unknown;
  deps?: unknown[];
  nextDeps?: unknown[];
  hasRun?: boolean;
  cleanup?: unknown;
};

function createHookRuntime() {
  const states: unknown[] = [];
  const effects: EffectRecord[] = [];
  let stateIndex = 0;
  let effectIndex = 0;
  const Fragment = Symbol.for('react.fragment');

  const depsChanged = (prev?: unknown[], next?: unknown[]) => !prev || !next || prev.length !== next.length || prev.some((value, index) => !Object.is(value, next[index]));

  const useState = <T,>(initial: T | (() => T)) => {
    const idx = stateIndex++;
    if (states[idx] === undefined) {
      states[idx] = typeof initial === 'function' ? (initial as () => T)() : initial;
    }

    return [states[idx] as T, (update: T | ((prev: T) => T)) => {
      states[idx] = typeof update === 'function' ? (update as (prev: T) => T)(states[idx] as T) : update;
    }] as const;
  };

  const useEffect = (callback: () => unknown, deps?: unknown[]) => {
    const idx = effectIndex++;
    effects[idx] = { ...effects[idx], callback, nextDeps: deps };
  };

  const reactMock: any = {
    __esModule: true,
    default: {} as any,
    useState,
    useEffect,
    useMemo: <T,>(factory: () => T) => factory(),
    useCallback: <T extends (...args: any[]) => any>(callback: T) => callback,
    Fragment,
  };
  reactMock.default = reactMock;
  const invoke = (type: any, props: any) => {
    if (type === Fragment) return props?.children ?? null;
    return typeof type === 'function' ? type(props ?? {}) : { type, props: props ?? {} };
  };
  reactMock.createElement = (type: any, props: any, ...children: any[]) => invoke(type, {
    ...(props ?? {}),
    children: children.length <= 1 ? children[0] : children,
  });

  return {
    render<P,>(Component: (props: P) => any, props: P) {
      stateIndex = 0;
      effectIndex = 0;
      return Component(props);
    },
    commitEffects() {
      for (const record of effects) {
        if (!record?.callback) continue;
        const shouldRun = !record.hasRun || depsChanged(record.deps, record.nextDeps);
        if (!shouldRun) continue;
        if (typeof record.cleanup === 'function') record.cleanup();
        record.cleanup = record.callback();
        record.deps = record.nextDeps;
        record.hasRun = true;
      }
    },
    reactMock,
    jsxRuntimeMock: { __esModule: true, Fragment, jsx: invoke, jsxs: invoke, jsxDEV: invoke },
  };
}

function getText(node: any): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getText).join('');
  return getText(node.props?.children);
}

function findNodes(node: any, predicate: (candidate: any) => boolean): any[] {
  if (node == null || typeof node === 'boolean' || typeof node === 'string' || typeof node === 'number') return [];
  if (Array.isArray(node)) return node.flatMap(child => findNodes(child, predicate));
  const matches = predicate(node) ? [node] : [];
  return [...matches, ...findNodes(node.props?.children, predicate)];
}

function findPressableByText(tree: any, text: string) {
  return findNodes(tree, node => node?.type === 'TouchableOpacity' && getText(node).includes(text))[0];
}

async function loadEditScreens(runtime: ReturnType<typeof createHookRuntime>) {
  await vi.resetModules();

  const navigation = {
    navigate: vi.fn(),
    goBack: vi.fn(),
    setOptions: vi.fn(),
  };

  const NullComponent = (type: string) => (props: any) => ({ type, props });

  vi.doMock('react', () => runtime.reactMock);
  vi.doMock('react/jsx-runtime', () => runtime.jsxRuntimeMock);
  vi.doMock('react/jsx-dev-runtime', () => runtime.jsxRuntimeMock);
  vi.stubGlobal('React', runtime.reactMock);
  vi.doMock('react-native', () => ({
    View: NullComponent('View'),
    Text: NullComponent('Text'),
    TextInput: NullComponent('TextInput'),
    StyleSheet: { create: (styles: any) => styles },
    ScrollView: NullComponent('ScrollView'),
    TouchableOpacity: NullComponent('TouchableOpacity'),
    ActivityIndicator: NullComponent('ActivityIndicator'),
    Switch: NullComponent('Switch'),
  }));
  vi.doMock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ bottom: 0 }),
  }));
  vi.doMock('../ui/ThemeProvider', () => ({
    useTheme: () => ({
      theme: {
        colors: {
          background: '#000',
          foreground: '#fff',
          muted: '#666',
          mutedForeground: '#999',
          primary: '#08f',
          primaryForeground: '#fff',
          border: '#222',
          destructive: '#f55',
        },
      },
    }),
  }));
  vi.doMock('../ui/theme', () => ({
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    radius: { md: 10 },
  }));
  vi.doMock('../store/config', () => ({
    useConfigContext: () => ({ config: { baseUrl: '', apiKey: '' } }),
    hasConfiguredConnection: (config: { baseUrl?: string; apiKey?: string }) => Boolean(config.baseUrl?.trim() && config.apiKey?.trim()),
  }));
  vi.doMock('../lib/accessibility', () => ({
    createButtonAccessibilityLabel: (label: string) => `${label} button`,
    createMinimumTouchTargetStyle: () => ({ minWidth: 44, minHeight: 44 }),
  }));
  vi.doMock('../lib/settingsApi', () => ({
    ExtendedSettingsApiClient: class ExtendedSettingsApiClient {},
  }));
  vi.doMock('./edit-route-params', () => ({
    getMemoryEditRouteContext: () => ({ memoryFromRoute: undefined, effectiveMemoryId: undefined }),
    getLoopEditRouteContext: () => ({ loopFromRoute: undefined, effectiveLoopId: undefined }),
  }));

  const agentModule = await import('./AgentEditScreen');
  const memoryModule = await import('./MemoryEditScreen');
  const loopModule = await import('./LoopEditScreen');

  return {
    AgentEditScreen: agentModule.default,
    MemoryEditScreen: memoryModule.default,
    LoopEditScreen: loopModule.default,
    navigation,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe('disconnected edit screens', () => {
  it('turns disconnected agent edit into setup guidance before the user can draft unsavable changes', async () => {
    const runtime = createHookRuntime();
    const { AgentEditScreen, navigation } = await loadEditScreens(runtime);

    let tree = runtime.render(AgentEditScreen, { navigation, route: { params: undefined } });
    runtime.commitEffects();
    tree = runtime.render(AgentEditScreen, { navigation, route: { params: undefined } });

    expect(getText(tree)).toContain('Connection settings are required before you can create or edit agents.');

    const inputs = findNodes(tree, node => node?.type === 'TextInput');
    expect(inputs).toHaveLength(4);
    inputs.forEach(input => expect(input.props.editable).toBe(false));

    const connectionButtons = findNodes(
      tree,
      node => node?.type === 'TouchableOpacity' && String(node.props?.accessibilityLabel ?? '').includes('connection for this agent'),
    );
    expect(connectionButtons).toHaveLength(4);
    connectionButtons.forEach(button => {
      expect(button.props.disabled).toBe(true);
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    const toggles = findNodes(tree, node => node?.type === 'Switch');
    expect(toggles).toHaveLength(2);
    toggles.forEach(toggle => expect(toggle.props.disabled).toBe(true));

    const cta = findPressableByText(tree, 'Open Connection Settings');
    expect(cta).toBeTruthy();
    expect(cta.props.disabled).toBe(false);
    cta.props.onPress();

    expect(navigation.navigate).toHaveBeenCalledWith('ConnectionSettings');
  });

  it('turns disconnected memory edit into an actionable setup gate instead of an unsavable draft form', async () => {
    const runtime = createHookRuntime();
    const { MemoryEditScreen, navigation } = await loadEditScreens(runtime);

    let tree = runtime.render(MemoryEditScreen, { navigation, route: { params: undefined } });
    runtime.commitEffects();
    tree = runtime.render(MemoryEditScreen, { navigation, route: { params: undefined } });

    expect(getText(tree)).toContain('Connection settings are required before you can create or edit memories.');

    const inputs = findNodes(tree, node => node?.type === 'TextInput');
    expect(inputs).toHaveLength(3);
    inputs.forEach(input => expect(input.props.editable).toBe(false));

    const importanceButtons = findNodes(
      tree,
      node => node?.type === 'TouchableOpacity' && String(node.props?.accessibilityLabel ?? '').includes('Set memory importance to'),
    );
    expect(importanceButtons.length).toBeGreaterThan(0);
    importanceButtons.forEach(button => {
      expect(button.props.disabled).toBe(true);
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    const cta = findPressableByText(tree, 'Open Connection Settings');
    expect(cta).toBeTruthy();
    expect(cta.props.disabled).toBe(false);
    cta.props.onPress();

    expect(navigation.navigate).toHaveBeenCalledWith('ConnectionSettings');
  });

  it('turns disconnected loop edit into setup guidance before the user can draft unsavable changes', async () => {
    const runtime = createHookRuntime();
    const { LoopEditScreen, navigation } = await loadEditScreens(runtime);

    let tree = runtime.render(LoopEditScreen, { navigation, route: { params: undefined } });
    runtime.commitEffects();
    tree = runtime.render(LoopEditScreen, { navigation, route: { params: undefined } });

    expect(getText(tree)).toContain('Connection settings are required before you can create or edit loops.');

    const inputs = findNodes(tree, node => node?.type === 'TextInput');
    expect(inputs).toHaveLength(3);
    inputs.forEach(input => expect(input.props.editable).toBe(false));

    const enabledToggle = findNodes(tree, node => node?.type === 'Switch')[0];
    expect(enabledToggle.props.disabled).toBe(true);

    const defaultAgentButton = findNodes(
      tree,
      node => node?.type === 'TouchableOpacity' && String(node.props?.accessibilityLabel ?? '').includes('Use the default agent for this loop'),
    )[0];
    expect(defaultAgentButton.props.disabled).toBe(true);
    expect(defaultAgentButton.props.accessibilityState?.disabled).toBe(true);

    const cta = findPressableByText(tree, 'Open Connection Settings');
    expect(cta).toBeTruthy();
    expect(cta.props.disabled).toBe(false);
    cta.props.onPress();

    expect(navigation.navigate).toHaveBeenCalledWith('ConnectionSettings');
  });
});