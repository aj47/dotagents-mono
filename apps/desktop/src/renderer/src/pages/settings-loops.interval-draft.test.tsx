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
    useCallback: (fn: any) => fn,
    useMemo: (factory: () => unknown) => factory(),
    useRef: <T,>(initial: T) => ({ current: initial }),
    useEffect: () => undefined,
    useLayoutEffect: () => undefined,
    forwardRef: (render: any) => render,
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

function findButtonWithText(node: any, label: string) {
  return findNode(
    node,
    (candidate) =>
      typeof candidate?.props?.onClick === "function" &&
      textContent(candidate.props?.children).includes(label),
  )
}

function findInputById(node: any, id: string) {
  return findNode(
    node,
    (candidate) =>
      candidate?.props?.id === id &&
      typeof candidate.props?.onChange === "function",
  )
}

function findTextareaById(node: any, id: string) {
  return findNode(
    node,
    (candidate) =>
      candidate?.props?.id === id &&
      typeof candidate.props?.onChange === "function",
  )
}

async function loadSettingsLoops(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()

  const ipcInvoke = vi.fn(async () => undefined)
  const success = vi.fn()
  const error = vi.fn()
  const invalidateQueries = vi.fn()
  const Null = () => null

  vi.stubGlobal("window", {
    electron: {
      ipcRenderer: {
        invoke: ipcInvoke,
        on: vi.fn(),
        send: vi.fn(),
      },
    },
  })
  vi.stubGlobal("document", { activeElement: null })
  vi.stubGlobal("localStorage", {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })

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
  vi.doMock("@tanstack/react-query", () => ({
    useQuery: ({ queryKey }: any) => ({ data: queryKey?.[0] === "loop-summaries" ? [] : [] }),
    useQueryClient: () => ({ invalidateQueries }),
  }))
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...values: Array<string | undefined | false | null>) => values.filter(Boolean).join(" ") }))
  vi.doMock("lucide-react", () => ({ Trash2: Null, Plus: Null, Edit2: Null, Save: Null, X: Null, Play: Null, Clock: Null, FileText: Null }))
  vi.doMock("sonner", () => ({ toast: { success, error } }))

  const mod = await import("./settings-loops")
  return { Component: mod.Component, ipcInvoke, success, error }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("desktop repeat-task interval editing", () => {
  it("keeps an empty interval draft local so backspace edits do not snap back to 15", async () => {
    const runtime = createHookRuntime()
    const { Component, ipcInvoke } = await loadSettingsLoops(runtime)

    let tree = runtime.render(Component, {} as any)
    findButtonWithText(tree, "Add Task").props.onClick()

    tree = runtime.render(Component, {} as any)
    let intervalInput = findInputById(tree, "interval")
    expect(intervalInput.props.value).toBe("15")

    intervalInput.props.onChange({ target: { value: "" } })
    tree = runtime.render(Component, {} as any)
    intervalInput = findInputById(tree, "interval")
    expect(intervalInput.props.value).toBe("")

    intervalInput.props.onChange({ target: { value: "5" } })
    tree = runtime.render(Component, {} as any)
    intervalInput = findInputById(tree, "interval")
    expect(intervalInput.props.value).toBe("5")
    expect(ipcInvoke).not.toHaveBeenCalled()
  })

  it("blocks invalid interval saves with a validation error instead of silently coercing them", async () => {
    const runtime = createHookRuntime()
    const { Component, ipcInvoke, error } = await loadSettingsLoops(runtime)

    let tree = runtime.render(Component, {} as any)
    findButtonWithText(tree, "Add Task").props.onClick()

    tree = runtime.render(Component, {} as any)
    findInputById(tree, "name").props.onChange({ target: { value: "Daily Summary" } })

    tree = runtime.render(Component, {} as any)
    findTextareaById(tree, "prompt").props.onChange({ target: { value: "Summarize recent activity" } })

    tree = runtime.render(Component, {} as any)
    findInputById(tree, "interval").props.onChange({ target: { value: "" } })

    tree = runtime.render(Component, {} as any)
    await findButtonWithText(tree, "Save").props.onClick()

    expect(ipcInvoke).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith("Interval must be a positive whole number of minutes")
  })

  it("parses a valid interval draft to a number before saving", async () => {
    const runtime = createHookRuntime()
    const { Component, ipcInvoke, success } = await loadSettingsLoops(runtime)

    let tree = runtime.render(Component, {} as any)
    findButtonWithText(tree, "Add Task").props.onClick()

    tree = runtime.render(Component, {} as any)
    findInputById(tree, "name").props.onChange({ target: { value: "Daily Summary" } })

    tree = runtime.render(Component, {} as any)
    findTextareaById(tree, "prompt").props.onChange({ target: { value: "Summarize recent activity" } })

    tree = runtime.render(Component, {} as any)
    findInputById(tree, "interval").props.onChange({ target: { value: "60" } })

    tree = runtime.render(Component, {} as any)
    await findButtonWithText(tree, "Save").props.onClick()

    expect(ipcInvoke).toHaveBeenNthCalledWith(1, "saveLoop", {
      loop: expect.objectContaining({
        name: "Daily Summary",
        prompt: "Summarize recent activity",
        intervalMinutes: 60,
        enabled: true,
        runOnStartup: false,
      }),
    })
    expect(ipcInvoke).toHaveBeenNthCalledWith(2, "startLoop", {
      loopId: "daily-summary",
    })
    expect(success).toHaveBeenCalledWith("Task created")
  })
})
