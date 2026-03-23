import { afterEach, describe, expect, it, vi } from "vitest"

type StateSetter<T> = (update: T | ((prev: T) => T)) => void

function createHookRuntime() {
  const states: any[] = []
  let stateIndex = 0

  const useState = <T,>(initial: T | (() => T)) => {
    const idx = stateIndex++
    if (states[idx] === undefined) states[idx] = typeof initial === "function" ? (initial as () => T)() : initial
    return [states[idx] as T, ((update: T | ((prev: T) => T)) => {
      states[idx] = typeof update === "function" ? (update as (prev: T) => T)(states[idx]) : update
    }) as StateSetter<T>] as const
  }

  const reactMock: any = {
    __esModule: true,
    default: {} as any,
    useState,
    useRef: <T,>(initial: T) => ({ current: initial }),
    forwardRef: (render: any) => {
      const Forwarded = (props: any) => render(props, null)
      Forwarded.displayName = render.displayName || render.name || "ForwardRef"
      return Forwarded
    },
  }
  reactMock.default = reactMock

  const Fragment = Symbol.for("react.fragment")
  const invoke = (type: any, props: any) => {
    if (type === Fragment) return props?.children ?? null
    return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {} }
  }

  return {
    render<P,>(Component: (props: P) => any, props: P) {
      stateIndex = 0
      return Component(props)
    },
    reactMock,
    jsxRuntimeMock: { __esModule: true, Fragment, jsx: invoke, jsxs: invoke, jsxDEV: invoke },
  }
}

function findNode(node: any, predicate: (candidate: any) => boolean): any {
  if (node == null) return null
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findNode(child, predicate)
      if (match) return match
    }
    return null
  }
  if (typeof node === "object") {
    if (predicate(node)) return node
    return findNode(node.props?.children, predicate)
  }
  return null
}

function textContent(node: any, results: string[] = []): string {
  if (typeof node === "string") {
    results.push(node)
    return results.join("")
  }
  if (Array.isArray(node)) {
    for (const child of node) textContent(child, results)
    return results.join("")
  }
  if (node && typeof node === "object") return textContent(node.props?.children, results)
  return results.join("")
}

afterEach(() => {
  Reflect.deleteProperty(globalThis as any, "window")
  Reflect.deleteProperty(globalThis as any, "localStorage")
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("desktop repeat-task failure state UI", () => {
  it("renders auto-paused warning details for loops that hit the circuit breaker", async () => {
    const runtime = createHookRuntime()
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    ;(globalThis as any).window = {
      electron: {
        ipcRenderer: {
          invoke: vi.fn(),
        },
      },
      localStorage: localStorageMock,
    }
    ;(globalThis as any).localStorage = localStorageMock

    vi.doMock("react", () => runtime.reactMock)
    vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
    vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
    vi.doMock("@renderer/components/ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
    vi.doMock("@renderer/components/ui/input", () => ({ Input: (props: any) => ({ type: "Input", props }) }))
    vi.doMock("@renderer/components/ui/label", () => ({ Label: (props: any) => ({ type: "Label", props }) }))
    vi.doMock("@renderer/components/ui/switch", () => ({ Switch: (props: any) => ({ type: "Switch", props }) }))
    vi.doMock("@renderer/components/ui/textarea", () => ({ Textarea: (props: any) => ({ type: "Textarea", props }) }))
    vi.doMock("@renderer/components/ui/card", () => ({
      Card: (props: any) => ({ type: "Card", props }),
      CardContent: (props: any) => ({ type: "CardContent", props }),
      CardDescription: (props: any) => ({ type: "CardDescription", props }),
      CardHeader: (props: any) => ({ type: "CardHeader", props }),
      CardTitle: (props: any) => ({ type: "CardTitle", props }),
    }))
    vi.doMock("@renderer/components/ui/badge", () => ({ Badge: (props: any) => ({ type: "Badge", props }) }))
    vi.doMock("@renderer/lib/tipc-client", () => ({
      tipcClient: {
        getLoops: vi.fn(async () => []),
        getLoopStatuses: vi.fn(async () => []),
        saveLoop: vi.fn(async () => ({ success: true })),
        startLoop: vi.fn(async () => ({ success: true })),
        stopLoop: vi.fn(async () => ({ success: true })),
        deleteLoop: vi.fn(async () => ({ success: true })),
        triggerLoop: vi.fn(async () => ({ success: true })),
        openLoopTaskFile: vi.fn(async () => ({ success: true })),
      },
    }))
    vi.doMock("@tanstack/react-query", () => ({
      useQuery: ({ queryKey }: any) => ({
        data: queryKey?.[0] === "loops"
          ? [{
            id: "burning-loop",
            name: "Burning Loop",
            prompt: "Trigger the failure path",
            intervalMinutes: 60,
            enabled: false,
            consecutiveFailures: 3,
            lastFailureAt: 1774242000000,
            lastError: 'Configured ACP main agent "missing-loop-agent" not found.',
            autoPausedAt: 1774242060000,
          }]
          : [],
      }),
      useQueryClient: () => ({ invalidateQueries: vi.fn() }),
    }))
    vi.doMock("@renderer/lib/utils", () => ({ cn: (...values: Array<string | undefined | false | null>) => values.filter(Boolean).join(" ") }))
    vi.doMock("lucide-react", () => ({
      Trash2: () => null,
      Plus: () => null,
      Edit2: () => null,
      Save: () => null,
      X: () => null,
      Play: () => null,
      Clock: () => null,
      FileText: () => null,
    }))
    vi.doMock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

    const { Component } = await import("./settings-loops")
    const tree = runtime.render(Component, {} as any)
    const renderedText = textContent(tree)

    expect(renderedText).toContain("Auto-paused")
    expect(renderedText).toContain("Auto-paused after 3 consecutive failures")
    expect(renderedText).toContain('Last error: Configured ACP main agent "missing-loop-agent" not found.')
    expect(renderedText).toContain("Last failure:")
  })
})
