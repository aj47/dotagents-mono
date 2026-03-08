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
  return findNode(node, (candidate) => candidate.type === "Button" && textContent(candidate.props?.children).includes(label))
}

function findButtonByTitle(node: any, title: string) {
  return findNode(node, (candidate) => candidate.type === "Button" && candidate.props?.title === title)
}

function findSwitch(node: any) {
  return findNode(node, (candidate) => candidate.type === "Switch")
}

function findInputById(node: any, id: string) {
  return findNode(node, (candidate) => candidate.type === "Input" && candidate.props?.id === id)
}

function findTextareaById(node: any, id: string) {
  return findNode(node, (candidate) => candidate.type === "Textarea" && candidate.props?.id === id)
}

async function loadSettingsLoops(
  runtime: ReturnType<typeof createHookRuntime>,
  options: {
    loops?: Array<Record<string, any>>
    loopStatuses?: Array<Record<string, any>>
    saveLoopResult?: { success: boolean }
    deleteLoopResult?: { success: boolean }
    startLoopResult?: { success: boolean }
    stopLoopResult?: { success: boolean }
  } = {},
) {
  vi.resetModules()

  const saveLoop = vi.fn(async () => options.saveLoopResult ?? { success: true })
  const startLoop = vi.fn(async () => options.startLoopResult ?? { success: true })
  const stopLoop = vi.fn(async () => options.stopLoopResult ?? { success: true })
  const deleteLoop = vi.fn(async () => options.deleteLoopResult ?? { success: true })
  const success = vi.fn()
  const error = vi.fn()
  const invalidateQueries = vi.fn()
  const Null = () => null

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
      saveLoop,
      startLoop,
      stopLoop,
      deleteLoop,
      triggerLoop: vi.fn(async () => ({ success: true })),
      openLoopTaskFile: vi.fn(async () => ({ success: true })),
    },
  }))
  vi.doMock("@tanstack/react-query", () => ({
    useQuery: ({ queryKey }: any) => ({
      data: queryKey?.[0] === "loops"
        ? (options.loops ?? [])
        : queryKey?.[0] === "loop-statuses"
          ? (options.loopStatuses ?? [])
          : [],
    }),
    useQueryClient: () => ({ invalidateQueries }),
  }))
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...values: Array<string | undefined | false | null>) => values.filter(Boolean).join(" ") }))
  vi.doMock("lucide-react", () => ({ Trash2: Null, Plus: Null, Edit2: Null, Save: Null, X: Null, Play: Null, Clock: Null, FileText: Null }))
  vi.doMock("sonner", () => ({ toast: { success, error } }))

  const mod = await import("./settings-loops")
  return { Component: mod.Component, saveLoop, startLoop, stopLoop, deleteLoop, success, error, invalidateQueries }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("desktop repeat-task interval editing", () => {
  it("keeps an empty interval draft local so backspace edits do not snap back to 15", async () => {
    const runtime = createHookRuntime()
    const { Component, saveLoop } = await loadSettingsLoops(runtime)

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
    expect(saveLoop).not.toHaveBeenCalled()
  })

  it("blocks invalid interval saves with a validation error instead of silently coercing them", async () => {
    const runtime = createHookRuntime()
    const { Component, saveLoop, error } = await loadSettingsLoops(runtime)

    let tree = runtime.render(Component, {} as any)
    findButtonWithText(tree, "Add Task").props.onClick()

    tree = runtime.render(Component, {} as any)
    findInputById(tree, "name").props.onChange({ target: { value: "Daily Summary" } })
    findTextareaById(tree, "prompt").props.onChange({ target: { value: "Summarize recent activity" } })
    findInputById(tree, "interval").props.onChange({ target: { value: "" } })

    tree = runtime.render(Component, {} as any)
    await findButtonWithText(tree, "Save").props.onClick()

    expect(saveLoop).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith("Interval must be a positive whole number of minutes")
  })

  it("parses a valid interval draft to a number before saving", async () => {
    const runtime = createHookRuntime()
    const { Component, saveLoop, startLoop, success } = await loadSettingsLoops(runtime)

    let tree = runtime.render(Component, {} as any)
    findButtonWithText(tree, "Add Task").props.onClick()

    tree = runtime.render(Component, {} as any)
    findInputById(tree, "name").props.onChange({ target: { value: "Daily Summary" } })
    findTextareaById(tree, "prompt").props.onChange({ target: { value: "Summarize recent activity" } })
    findInputById(tree, "interval").props.onChange({ target: { value: "60" } })

    tree = runtime.render(Component, {} as any)
    await findButtonWithText(tree, "Save").props.onClick()

    expect(saveLoop).toHaveBeenCalledWith({
      loop: expect.objectContaining({
        name: "Daily Summary",
        prompt: "Summarize recent activity",
        intervalMinutes: 60,
        enabled: true,
        runOnStartup: false,
      }),
    })
    expect(startLoop).toHaveBeenCalledWith({ loopId: "daily-summary" })
    expect(success).toHaveBeenCalledWith("Task created")
  })

  it("keeps the editor open when the backend reports the task was not persisted", async () => {
    const runtime = createHookRuntime()
    const { Component, saveLoop, startLoop, success, error, invalidateQueries } = await loadSettingsLoops(runtime, {
      saveLoopResult: { success: false },
    })

    let tree = runtime.render(Component, {} as any)
    findButtonWithText(tree, "Add Task").props.onClick()

    tree = runtime.render(Component, {} as any)
    findInputById(tree, "name").props.onChange({ target: { value: "Daily Summary" } })
    findTextareaById(tree, "prompt").props.onChange({ target: { value: "Summarize recent activity" } })
    findInputById(tree, "interval").props.onChange({ target: { value: "60" } })

    tree = runtime.render(Component, {} as any)
    await findButtonWithText(tree, "Save").props.onClick()

    tree = runtime.render(Component, {} as any)
    expect(saveLoop).toHaveBeenCalled()
    expect(startLoop).not.toHaveBeenCalled()
    expect(success).not.toHaveBeenCalledWith("Task created")
    expect(error).toHaveBeenCalledWith("Failed to save task")
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["loops"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["loop-statuses"] })
    expect(findInputById(tree, "name").props.value).toBe("Daily Summary")
    expect(findTextareaById(tree, "prompt").props.value).toBe("Summarize recent activity")
  })

  it("reports scheduling failure after saving instead of falsely showing task creation success", async () => {
    const runtime = createHookRuntime()
    const { Component, saveLoop, startLoop, success, error } = await loadSettingsLoops(runtime, {
      startLoopResult: { success: false },
    })

    let tree = runtime.render(Component, {} as any)
    findButtonWithText(tree, "Add Task").props.onClick()

    tree = runtime.render(Component, {} as any)
    findInputById(tree, "name").props.onChange({ target: { value: "Daily Summary" } })
    findTextareaById(tree, "prompt").props.onChange({ target: { value: "Summarize recent activity" } })
    findInputById(tree, "interval").props.onChange({ target: { value: "60" } })

    tree = runtime.render(Component, {} as any)
    await findButtonWithText(tree, "Save").props.onClick()

    expect(saveLoop).toHaveBeenCalled()
    expect(startLoop).toHaveBeenCalledWith({ loopId: "daily-summary" })
    expect(success).not.toHaveBeenCalledWith("Task created")
    expect(error).toHaveBeenCalledWith("Task created, but it could not be scheduled right now.")
  })

  it("reports disable failures when an existing schedule could not be cleared", async () => {
    const runtime = createHookRuntime()
    const { Component, saveLoop, stopLoop, success, error } = await loadSettingsLoops(runtime, {
      loops: [{
        id: "daily-summary",
        name: "Daily Summary",
        prompt: "Summarize recent activity",
        intervalMinutes: 15,
        enabled: true,
        runOnStartup: false,
      }],
      loopStatuses: [{
        id: "daily-summary",
        isRunning: false,
        nextRunAt: Date.now() + 60_000,
      }],
      stopLoopResult: { success: false },
    })

    const tree = runtime.render(Component, {} as any)
    await findSwitch(tree).props.onCheckedChange(false)

    expect(saveLoop).toHaveBeenCalledWith({
      loop: expect.objectContaining({
        id: "daily-summary",
        enabled: false,
      }),
    })
    expect(stopLoop).toHaveBeenCalledWith({ loopId: "daily-summary" })
    expect(success).not.toHaveBeenCalledWith("Task disabled")
    expect(error).toHaveBeenCalledWith("Task disabled, but its previous schedule could not be cleared right now.")
  })

  it("shows an error and refreshes the list when deleting a task that is already gone", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true))

    const runtime = createHookRuntime()
    const { Component, deleteLoop, success, error, invalidateQueries } = await loadSettingsLoops(runtime, {
      loops: [{
        id: "daily-summary",
        name: "Daily Summary",
        prompt: "Summarize recent activity",
        intervalMinutes: 15,
        enabled: true,
        runOnStartup: false,
      }],
      deleteLoopResult: { success: false },
    })

    const tree = runtime.render(Component, {} as any)
    await findButtonByTitle(tree, "Delete task").props.onClick()

    expect(deleteLoop).toHaveBeenCalledWith({ loopId: "daily-summary" })
    expect(success).not.toHaveBeenCalledWith("Task deleted")
    expect(error).toHaveBeenCalledWith("This task no longer exists. Refreshed the task list.")
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["loops"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["loop-statuses"] })
  })
})