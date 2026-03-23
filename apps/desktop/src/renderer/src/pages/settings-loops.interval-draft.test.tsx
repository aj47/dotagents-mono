import { afterEach, describe, expect, it, vi } from "vitest"
import { fileURLToPath } from "node:url"

type StateSetter<T> = (update: T | ((prev: T) => T)) => void

function createHookRuntime() {
  const states: any[] = []
  let stateIndex = 0

  const useState = <T,>(initial: T | (() => T)) => {
    const idx = stateIndex++
    if (states[idx] === undefined)
      states[idx] =
        typeof initial === "function" ? (initial as () => T)() : initial
    return [
      states[idx] as T,
      ((update: T | ((prev: T) => T)) => {
        states[idx] =
          typeof update === "function"
            ? (update as (prev: T) => T)(states[idx])
            : update
      }) as StateSetter<T>,
    ] as const
  }

  const reactMock: any = {
    __esModule: true,
    default: {} as any,
    useState,
    useCallback: (fn: any) => fn,
    forwardRef: (render: any) => (props: any) => render(props, null),
  }
  reactMock.default = reactMock

  const Fragment = Symbol.for("react.fragment")
  const invoke = (type: any, props: any) => {
    if (type === Fragment) return props?.children ?? null
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {} }
  }

  return {
    render<P>(Component: (props: P) => any, props: P) {
      stateIndex = 0
      return Component(props)
    },
    reactMock,
    jsxRuntimeMock: {
      __esModule: true,
      Fragment,
      jsx: invoke,
      jsxs: invoke,
      jsxDEV: invoke,
    },
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
  if (node && typeof node === "object")
    return textContent(node.props?.children, results)
  return results.join("")
}

function findButtonWithText(node: any, label: string) {
  return findNode(
    node,
    (candidate) =>
      candidate.type === "Button" &&
      textContent(candidate.props?.children).includes(label),
  )
}

function findButtonByTitle(node: any, title: string) {
  return findNode(
    node,
    (candidate) =>
      candidate.type === "Button" && candidate.props?.title === title,
  )
}

function findInputById(node: any, id: string) {
  return findNode(
    node,
    (candidate) => candidate.type === "Input" && candidate.props?.id === id,
  )
}

function findTextareaById(node: any, id: string) {
  return findNode(
    node,
    (candidate) => candidate.type === "Textarea" && candidate.props?.id === id,
  )
}

function findSelectByTestId(node: any, testId: string) {
  return findNode(
    node,
    (candidate) =>
      candidate.type === "Select" &&
      findNode(
        candidate.props?.children,
        (child) =>
          child.type === "SelectTrigger" &&
          child.props?.["data-testid"] === testId,
      ),
  )
}

async function loadSettingsLoops(
  runtime: ReturnType<typeof createHookRuntime>,
  options: { agentProfiles?: any[]; loops?: any[]; loopStatuses?: any[] } = {},
) {
  vi.resetModules()

  const saveLoop = vi.fn(async () => undefined)
  const startLoop = vi.fn(async () => undefined)
  const stopLoop = vi.fn(async () => undefined)
  const success = vi.fn()
  const error = vi.fn()
  const invalidateQueries = vi.fn()
  const Null = () => null
  const buttonMock = { Button: (props: any) => ({ type: "Button", props }) }
  const inputMock = { Input: (props: any) => ({ type: "Input", props }) }
  const labelMock = { Label: (props: any) => ({ type: "Label", props }) }
  const selectMock = {
    Select: (props: any) => ({ type: "Select", props }),
    SelectContent: (props: any) => ({ type: "SelectContent", props }),
    SelectItem: (props: any) => ({ type: "SelectItem", props }),
    SelectTrigger: (props: any) => ({ type: "SelectTrigger", props }),
    SelectValue: (props: any) => ({ type: "SelectValue", props }),
  }
  const switchMock = { Switch: (props: any) => ({ type: "Switch", props }) }
  const textareaMock = {
    Textarea: (props: any) => ({ type: "Textarea", props }),
  }
  const cardMock = {
    Card: (props: any) => ({ type: "Card", props }),
    CardContent: (props: any) => ({ type: "CardContent", props }),
    CardDescription: (props: any) => ({ type: "CardDescription", props }),
    CardHeader: (props: any) => ({ type: "CardHeader", props }),
    CardTitle: (props: any) => ({ type: "CardTitle", props }),
  }
  const badgeMock = { Badge: (props: any) => ({ type: "Badge", props }) }
  const tipcClientMock = {
    tipcClient: {
      getLoops: vi.fn(async () => options.loops || []),
      getLoopStatuses: vi.fn(async () => options.loopStatuses || []),
      getAgentProfiles: vi.fn(async () => options.agentProfiles || []),
      saveLoop,
      startLoop,
      stopLoop,
      deleteLoop: vi.fn(async () => undefined),
      triggerLoop: vi.fn(async () => ({ success: true })),
      openLoopTaskFile: vi.fn(async () => ({ success: true })),
    },
  }
  const buttonModulePath = fileURLToPath(
    new URL("../components/ui/button.tsx", import.meta.url),
  )
  const inputModulePath = fileURLToPath(
    new URL("../components/ui/input.tsx", import.meta.url),
  )
  const labelModulePath = fileURLToPath(
    new URL("../components/ui/label.tsx", import.meta.url),
  )
  const selectModulePath = fileURLToPath(
    new URL("../components/ui/select.tsx", import.meta.url),
  )
  const switchModulePath = fileURLToPath(
    new URL("../components/ui/switch.tsx", import.meta.url),
  )
  const textareaModulePath = fileURLToPath(
    new URL("../components/ui/textarea.tsx", import.meta.url),
  )
  const cardModulePath = fileURLToPath(
    new URL("../components/ui/card.tsx", import.meta.url),
  )
  const badgeModulePath = fileURLToPath(
    new URL("../components/ui/badge.tsx", import.meta.url),
  )
  const tipcClientModulePath = fileURLToPath(
    new URL("../lib/tipc-client.ts", import.meta.url),
  )

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@renderer/components/ui/button", () => buttonMock)
  vi.doMock(buttonModulePath, () => buttonMock)
  vi.doMock("@renderer/components/ui/input", () => inputMock)
  vi.doMock(inputModulePath, () => inputMock)
  vi.doMock("@renderer/components/ui/label", () => labelMock)
  vi.doMock(labelModulePath, () => labelMock)
  vi.doMock("@renderer/components/ui/select", () => selectMock)
  vi.doMock(selectModulePath, () => selectMock)
  vi.doMock("@renderer/components/ui/switch", () => switchMock)
  vi.doMock(switchModulePath, () => switchMock)
  vi.doMock("@renderer/components/ui/textarea", () => textareaMock)
  vi.doMock(textareaModulePath, () => textareaMock)
  vi.doMock("@renderer/components/ui/card", () => cardMock)
  vi.doMock(cardModulePath, () => cardMock)
  vi.doMock("@renderer/components/ui/badge", () => badgeMock)
  vi.doMock(badgeModulePath, () => badgeMock)
  vi.doMock("@renderer/lib/tipc-client", () => tipcClientMock)
  vi.doMock(tipcClientModulePath, () => tipcClientMock)
  vi.doMock("@tanstack/react-query", () => ({
    useQuery: ({ queryKey }: any) => ({
      data:
        queryKey?.[0] === "loops"
          ? options.loops || []
          : queryKey?.[0] === "loop-statuses"
            ? options.loopStatuses || []
            : queryKey?.[0] === "loop-agent-profiles"
              ? options.agentProfiles || []
              : [],
    }),
    useQueryClient: () => ({ invalidateQueries }),
  }))
  vi.doMock("@renderer/lib/utils", () => ({
    cn: (...values: Array<string | undefined | false | null>) =>
      values.filter(Boolean).join(" "),
  }))
  vi.doMock("lucide-react", () => ({
    Trash2: Null,
    Plus: Null,
    Edit2: Null,
    Save: Null,
    X: Null,
    Play: Null,
    Clock: Null,
    FileText: Null,
  }))
  vi.doMock("sonner", () => ({ toast: { success, error } }))

  const mod = await import("./settings-loops")
  return { Component: mod.Component, saveLoop, startLoop, success, error }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

const encodeProfileSelectValue = (profileId: string) => `profile:${profileId}`

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
    findInputById(tree, "name").props.onChange({
      target: { value: "Daily Summary" },
    })
    tree = runtime.render(Component, {} as any)
    findTextareaById(tree, "prompt").props.onChange({
      target: { value: "Summarize recent activity" },
    })
    tree = runtime.render(Component, {} as any)
    findInputById(tree, "interval").props.onChange({ target: { value: "" } })

    tree = runtime.render(Component, {} as any)
    await findButtonWithText(tree, "Save").props.onClick()

    expect(saveLoop).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith(
      "Interval must be a positive whole number of minutes",
    )
  })

  it("parses a valid interval draft to a number before saving", async () => {
    const runtime = createHookRuntime()
    const { Component, saveLoop, startLoop, success } =
      await loadSettingsLoops(runtime)

    let tree = runtime.render(Component, {} as any)
    findButtonWithText(tree, "Add Task").props.onClick()

    tree = runtime.render(Component, {} as any)
    findInputById(tree, "name").props.onChange({
      target: { value: "Daily Summary" },
    })
    tree = runtime.render(Component, {} as any)
    findTextareaById(tree, "prompt").props.onChange({
      target: { value: "Summarize recent activity" },
    })
    tree = runtime.render(Component, {} as any)
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

  it("persists a dedicated agent profile selection when saving", async () => {
    const runtime = createHookRuntime()
    const { Component, saveLoop } = await loadSettingsLoops(runtime, {
      agentProfiles: [
        {
          id: "budget-monitor",
          name: "budget-monitor",
          displayName: "Budget Monitor",
          enabled: true,
        },
      ],
    })

    let tree = runtime.render(Component, {} as any)
    findButtonWithText(tree, "Add Task").props.onClick()

    tree = runtime.render(Component, {} as any)
    findInputById(tree, "name").props.onChange({
      target: { value: "Langfuse Monitor" },
    })
    tree = runtime.render(Component, {} as any)
    findTextareaById(tree, "prompt").props.onChange({
      target: { value: "Review recent Langfuse failures" },
    })
    tree = runtime.render(Component, {} as any)
    findInputById(tree, "interval").props.onChange({ target: { value: "120" } })

    tree = runtime.render(Component, {} as any)
    const select = findSelectByTestId(tree, "loop-profile-select-trigger")
    select.props.onValueChange(encodeProfileSelectValue("budget-monitor"))

    tree = runtime.render(Component, {} as any)
    await findButtonWithText(tree, "Save").props.onClick()

    expect(saveLoop).toHaveBeenCalledWith({
      loop: expect.objectContaining({
        name: "Langfuse Monitor",
        prompt: "Review recent Langfuse failures",
        intervalMinutes: 120,
        profileId: "budget-monitor",
      }),
    })
  })

  it("shows a disabled agent selection clearly when editing an existing loop", async () => {
    const runtime = createHookRuntime()
    const { Component } = await loadSettingsLoops(runtime, {
      loops: [
        {
          id: "disabled-agent-loop",
          name: "Disabled Agent Loop",
          prompt: "Review recent Langfuse failures",
          intervalMinutes: 15,
          enabled: true,
          profileId: "budget-monitor",
        },
      ],
      agentProfiles: [
        {
          id: "budget-monitor",
          name: "budget-monitor",
          displayName: "Budget Monitor",
          enabled: false,
        },
      ],
    })

    let tree = runtime.render(Component, {} as any)
    findButtonByTitle(tree, "Edit task").props.onClick()

    tree = runtime.render(Component, {} as any)
    const select = findSelectByTestId(tree, "loop-profile-select-trigger")
    expect(select.props.value).toBe(encodeProfileSelectValue("budget-monitor"))

    const content = textContent(tree)
    expect(content).toContain("Budget Monitor (disabled)")
    expect(content).toContain(
      "This task still references Budget Monitor, but that agent is currently disabled.",
    )
    expect(content).not.toContain("Use the default active agent")
  })

  it("preserves and explains missing agent selections when saving an existing loop", async () => {
    const runtime = createHookRuntime()
    const { Component, saveLoop } = await loadSettingsLoops(runtime, {
      loops: [
        {
          id: "missing-agent-loop",
          name: "Missing Agent Loop",
          prompt: "Summarize recent activity",
          intervalMinutes: 30,
          enabled: true,
          profileId: "ghost-agent",
        },
      ],
      agentProfiles: [],
    })

    let tree = runtime.render(Component, {} as any)
    findButtonByTitle(tree, "Edit task").props.onClick()

    tree = runtime.render(Component, {} as any)
    const select = findSelectByTestId(tree, "loop-profile-select-trigger")
    expect(select.props.value).toBe(encodeProfileSelectValue("ghost-agent"))

    const content = textContent(tree)
    expect(content).toContain("Missing agent (ghost-agent)")
    expect(content).toContain(
      'This task still references agent "ghost-agent", but it is no longer available.',
    )

    await findButtonWithText(tree, "Save").props.onClick()

    expect(saveLoop).toHaveBeenCalledWith({
      loop: expect.objectContaining({
        id: "missing-agent-loop",
        profileId: "ghost-agent",
      }),
    })
  })
})
