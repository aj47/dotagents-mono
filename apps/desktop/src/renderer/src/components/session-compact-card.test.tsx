import { afterEach, describe, expect, it, vi } from "vitest"
import type { AgentProgressUpdate } from "@shared/types"

const createProgress = (): AgentProgressUpdate => ({
  sessionId: "session-1",
  conversationId: "conversation-1",
  currentIteration: 1,
  maxIterations: 1,
  isComplete: false,
  steps: [],
  conversationHistory: [],
})

function createHookRuntime() {
  const reactMock: any = {
    __esModule: true,
    memo: (component: any) => ({ type: component }),
    useMemo: (factory: () => unknown) => factory(),
    useCallback: <T extends (...args: any[]) => any>(callback: T) => callback,
    Children: {
      toArray: (children: any) => Array.isArray(children) ? children : children == null ? [] : [children],
    },
  }
  reactMock.default = reactMock

  const Fragment = Symbol.for("react.fragment")
  const invoke = (type: any, props: any) => {
    if (type === Fragment) return props?.children ?? null
    return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {} }
  }

  return {
    reactMock,
    jsxRuntimeMock: { __esModule: true, Fragment, jsx: invoke, jsxs: invoke, jsxDEV: invoke },
  }
}

function findNode(node: any, predicate: (node: any) => boolean): any {
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

async function loadSessionCompactCard() {
  const runtime = createHookRuntime()

  vi.resetModules()
  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ") }))
  vi.doMock("./ui/loading-spinner", () => ({ LoadingSpinner: () => ({ type: "LoadingSpinner", props: {} }) }))
  vi.doMock("lucide-react", () => {
    const Icon = (props: any) => ({ type: "Icon", props })
    return { Shield: Icon, Check: Icon, XCircle: Icon, Moon: Icon, Square: Icon, Maximize2: Icon }
  })
  vi.doMock("@dotagents/shared", () => ({ normalizeAgentConversationState: () => "running" }))
  vi.doMock("dayjs", () => ({ default: () => ({ diff: () => 0, format: () => "now" }) }))

  return import("./session-compact-card")
}

describe("SessionCompactCard", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it("stops propagation when clicking the nested expand button", async () => {
    const { SessionCompactCard } = await loadSessionCompactCard()
    const onClick = vi.fn()
    const stopPropagation = vi.fn()
    const element = (SessionCompactCard as unknown as { type: (props: any) => any }).type({
      progress: createProgress(),
      sessionId: "session-1",
      onClick,
    })

    const expandButton = findNode(element, (node) => node?.type === "button" && node?.props?.title === "Expand")
    expect(expandButton).toBeTruthy()

    expandButton?.props.onClick({ stopPropagation })

    expect(stopPropagation).toHaveBeenCalledOnce()
    expect(onClick).toHaveBeenCalledOnce()
  })
})
