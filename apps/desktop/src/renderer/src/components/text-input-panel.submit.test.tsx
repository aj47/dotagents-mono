import { afterEach, describe, expect, it, vi } from "vitest"

function createHookRuntime() {
  const states: any[] = []
  const refs: Array<{ current: any }> = []
  let stateIndex = 0
  let refIndex = 0

  const useState = <T,>(initial: T | (() => T)) => {
    const idx = stateIndex++
    if (states[idx] === undefined) states[idx] = typeof initial === "function" ? (initial as () => T)() : initial
    return [states[idx] as T, (update: T | ((prev: T) => T)) => {
      states[idx] = typeof update === "function" ? (update as (prev: T) => T)(states[idx]) : update
    }] as const
  }

  const useRef = <T,>(initial: T) => {
    const idx = refIndex++
    refs[idx] ??= { current: initial }
    return refs[idx] as { current: T }
  }

  const reactMock: any = {
    __esModule: true,
    createContext: (defaultValue: any) => ({ _currentValue: defaultValue }),
    useState,
    useRef,
    useContext: (context: { _currentValue: any }) => context?._currentValue,
    useEffect: () => undefined,
    useImperativeHandle: (ref: { current: any } | null, create: () => any) => {
      if (ref) ref.current = create()
    },
    forwardRef: (render: (props: any, ref: any) => any) => (props: any) => render(props, null),
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
      refIndex = 0
      return Component(props)
    },
    reactMock,
    jsxRuntimeMock: { __esModule: true, Fragment, jsx: invoke, jsxs: invoke, jsxDEV: invoke },
  }
}

function getText(node: any): string {
  if (node == null) return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getText).join("")
  return getText(node.props?.children)
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

function findTextarea(node: any) {
  return findNode(node, (candidate) => candidate.type === "Textarea" || candidate.type === "textarea")
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

async function loadTextInputPanel(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()
  const Null = () => null

  vi.stubGlobal("window", {
    electron: {
      ipcRenderer: {
        invoke: vi.fn(),
        on: vi.fn(),
        send: vi.fn(),
      },
    },
  })

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@renderer/components/ui/textarea", () => ({ Textarea: (props: any) => ({ type: "Textarea", props }) }))
  vi.doMock("@renderer/components/ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ") }))
  vi.doMock("@renderer/lib/tipc-client", () => ({
    tipcClient: {
      setPanelFocusable: vi.fn(async () => undefined),
    },
  }))
  vi.doMock("./agent-processing-view", () => ({ AgentProcessingView: Null }))
  const themeContextMock = { useTheme: () => ({ isDark: false }) }
  vi.doMock("@renderer/contexts/theme-context", () => themeContextMock)
  vi.doMock("../contexts/theme-context", () => themeContextMock)
  vi.doMock("./predefined-prompts-menu", () => ({ PredefinedPromptsMenu: Null }))
  vi.doMock("./slash-command-menu", () => ({
    SlashCommandMenu: Null,
    useSlashCommands: () => ({
      isSlashMenuOpen: false,
      slashQuery: "",
      handleSlashSelect: vi.fn(),
      closeSlashMenu: vi.fn(),
      handleSlashKeyDown: vi.fn(() => false),
      menuRef: { current: null },
    }),
  }))
  vi.doMock("./agent-selector", () => ({ AgentSelector: Null }))
  vi.doMock("lucide-react", () => {
    const Icon = () => null
    return { ImagePlus: Icon, X: Icon }
  })
  vi.doMock("@renderer/lib/message-image-utils", () => ({
    buildMessageWithImages: (text: string) => text.trim(),
    MAX_IMAGE_ATTACHMENTS: 4,
    readImageAttachments: vi.fn(),
  }))

  return import("./text-input-panel")
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("TextInputPanel submit behavior", () => {
  it("keeps the draft when the async submit handler declines the submission", async () => {
    const runtime = createHookRuntime()
    const { TextInputPanel } = await loadTextInputPanel(runtime)
    const onSubmit = vi.fn(async () => false)

    let tree = runtime.render(TextInputPanel, {
      onSubmit,
      onCancel: vi.fn(),
      selectedAgentId: null,
      onSelectAgent: vi.fn(),
      initialText: "Keep me",
    } as any)

    const sendButton = findNode(tree, (node) => node.type === "button" && getText(node) === "Send")
    sendButton.props.onClick()
    await flushPromises()

    tree = runtime.render(TextInputPanel, {
      onSubmit,
      onCancel: vi.fn(),
      selectedAgentId: null,
      onSelectAgent: vi.fn(),
      initialText: "Keep me",
    } as any)

    const textarea = findTextarea(tree)
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(textarea.props.value).toBe("Keep me")
    expect(textarea.props.autoFocus).toBe(true)
  })

  it("disables the composer and suppresses duplicate sends while a submit is in flight", async () => {
    const runtime = createHookRuntime()
    const { TextInputPanel } = await loadTextInputPanel(runtime)
    const pendingSubmit = deferred<boolean>()
    const onSubmit = vi.fn(() => pendingSubmit.promise)
    const props = {
      onSubmit,
      onCancel: vi.fn(),
      selectedAgentId: null,
      onSelectAgent: vi.fn(),
      initialText: "Send once",
    }

    let tree = runtime.render(TextInputPanel, props as any)
    const firstSendButton = findNode(tree, (node) => node.type === "button" && getText(node) === "Send")
    firstSendButton.props.onClick()
    await flushPromises()

    tree = runtime.render(TextInputPanel, props as any)
    const busySendButton = findNode(tree, (node) => node.type === "button" && getText(node) === "Send")
    const textarea = findTextarea(tree)
    expect(busySendButton.props.disabled).toBe(true)
    expect(textarea.props.disabled).toBe(true)

    busySendButton.props.onClick()
    await flushPromises()
    expect(onSubmit).toHaveBeenCalledTimes(1)

    pendingSubmit.resolve(true)
    await flushPromises()

    tree = runtime.render(TextInputPanel, props as any)
    const clearedTextarea = findTextarea(tree)
    expect(clearedTextarea.props.value).toBe("")
  })

  it("keeps the draft and clears busy state when the async submit handler rejects", async () => {
    const runtime = createHookRuntime()
    const { TextInputPanel } = await loadTextInputPanel(runtime)
    const error = new Error("submit failed")
    const onSubmit = vi.fn(async () => {
      throw error
    })
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const props = {
      onSubmit,
      onCancel: vi.fn(),
      selectedAgentId: null,
      onSelectAgent: vi.fn(),
      initialText: "Retry me",
    }

    let tree = runtime.render(TextInputPanel, props as any)
    const sendButton = findNode(tree, (node) => node.type === "button" && getText(node) === "Send")
    sendButton.props.onClick()
    await flushPromises()

    tree = runtime.render(TextInputPanel, props as any)
    const textarea = findTextarea(tree)
    const retrySendButton = findNode(tree, (node) => node.type === "button" && getText(node) === "Send")

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(textarea.props.value).toBe("Retry me")
    expect(textarea.props.disabled).toBe(false)
    expect(retrySendButton.props.disabled).toBe(false)
    expect(consoleError).toHaveBeenCalledWith("Failed to submit text input panel message:", error)
  })
})