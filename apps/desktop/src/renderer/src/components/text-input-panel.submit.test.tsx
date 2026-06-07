import { afterEach, describe, expect, it, vi } from "vitest"

type EffectRecord = {
  callback?: () => void | (() => void)
  cleanup?: void | (() => void)
  deps?: any[]
  nextDeps?: any[]
  hasRun: boolean
}

function createHookRuntime() {
  const states: any[] = []
  const refs: Array<{ current: any }> = []
  const effects: EffectRecord[] = []
  let stateIndex = 0
  let refIndex = 0
  let effectIndex = 0

  const depsChanged = (prev?: any[], next?: any[]) =>
    !prev ||
    !next ||
    prev.length !== next.length ||
    prev.some((value, index) => !Object.is(value, next[index]))

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

  const useEffect = (callback: EffectRecord["callback"], deps?: any[]) => {
    const idx = effectIndex++
    const record = effects[idx] ?? { hasRun: false }
    record.callback = callback
    record.nextDeps = deps
    effects[idx] = record
  }

  const reactMock: any = {
    __esModule: true,
    createContext: (defaultValue: any) => ({ _currentValue: defaultValue }),
    useState,
    useRef,
    useContext: (context: { _currentValue: any }) => context?._currentValue,
    useEffect,
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
    refs,
    render<P,>(Component: (props: P) => any, props: P) {
      stateIndex = 0
      refIndex = 0
      effectIndex = 0
      return Component(props)
    },
    commitEffects() {
      for (const record of effects) {
        if (!record?.callback) continue
        const shouldRun = !record.hasRun || depsChanged(record.deps, record.nextDeps)
        if (!shouldRun) continue
        if (typeof record.cleanup === "function") record.cleanup()
        record.cleanup = record.callback()
        record.deps = record.nextDeps
        record.hasRun = true
      }
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
  const tipcClientMock = {
    setPanelFocusable: vi.fn(() => Promise.resolve(undefined)),
  }
  const ipcInvokeMock = vi.fn(() => Promise.resolve(undefined))

  const localStorageMock = { getItem: vi.fn(() => null) }
  vi.stubGlobal("localStorage", localStorageMock)
  vi.stubGlobal("window", {
    alert: vi.fn(),
    localStorage: localStorageMock,
    electron: {
      ipcRenderer: {
        invoke: ipcInvokeMock,
        on: vi.fn(),
        send: vi.fn(),
      },
    },
  })

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@renderer/components/ui/textarea", () => ({
    Textarea: (props: any) => {
      if (props.ref && typeof props.ref === "object") {
        props.ref.current = { focus: vi.fn() }
      }
      return { type: "Textarea", props }
    },
  }))
  vi.doMock("@renderer/components/ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ") }))
  vi.doMock("@renderer/lib/tipc-client", () => ({
    tipcClient: tipcClientMock,
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

  const mod = await import("./text-input-panel")
  return { ...mod, ipcInvokeMock, tipcClientMock }
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("TextInputPanel submit behavior", () => {
  it("only requests panel focus for the initial mount handoff", async () => {
    vi.useFakeTimers()
    const runtime = createHookRuntime()
    const { TextInputPanel, ipcInvokeMock, tipcClientMock } = await loadTextInputPanel(runtime)
    const focusRequestCount = () =>
      tipcClientMock.setPanelFocusable.mock.calls.length + ipcInvokeMock.mock.calls.length
    const props = {
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
      selectedAgentId: null,
      onSelectAgent: vi.fn(),
      initialText: "Focus once",
    }

    runtime.render(TextInputPanel, props as any)
    runtime.refs[0].current = { focus: vi.fn() }
    runtime.commitEffects()
    expect(focusRequestCount()).toBe(1)

    vi.advanceTimersByTime(200)
    expect(focusRequestCount()).toBe(3)

    runtime.render(TextInputPanel, { ...props, isProcessing: true } as any)
    runtime.commitEffects()
    expect(focusRequestCount()).toBe(3)

    runtime.render(TextInputPanel, { ...props, isProcessing: false } as any)
    runtime.commitEffects()
    vi.advanceTimersByTime(200)

    expect(focusRequestCount()).toBe(3)
  })

  it("requests panel focus once after an initially busy panel becomes editable", async () => {
    vi.useFakeTimers()
    const runtime = createHookRuntime()
    const { TextInputPanel, ipcInvokeMock, tipcClientMock } = await loadTextInputPanel(runtime)
    const focusRequestCount = () =>
      tipcClientMock.setPanelFocusable.mock.calls.length + ipcInvokeMock.mock.calls.length
    const props = {
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
      selectedAgentId: null,
      onSelectAgent: vi.fn(),
      initialText: "Focus later",
      agentProgress: { message: "Working" },
    }

    runtime.render(TextInputPanel, { ...props, isProcessing: true } as any)
    runtime.commitEffects()
    vi.advanceTimersByTime(200)
    expect(focusRequestCount()).toBe(0)

    runtime.render(TextInputPanel, { ...props, isProcessing: false } as any)
    runtime.refs[0].current = { focus: vi.fn() }
    runtime.commitEffects()
    expect(focusRequestCount()).toBe(1)

    vi.advanceTimersByTime(200)
    expect(focusRequestCount()).toBe(3)

    runtime.render(TextInputPanel, { ...props, isProcessing: true } as any)
    runtime.commitEffects()
    runtime.render(TextInputPanel, { ...props, isProcessing: false } as any)
    runtime.commitEffects()
    vi.advanceTimersByTime(200)

    expect(focusRequestCount()).toBe(3)
  })

  it("does not request floating-panel focus when hosted in the main window", async () => {
    vi.useFakeTimers()
    const runtime = createHookRuntime()
    const { TextInputPanel, ipcInvokeMock, tipcClientMock } = await loadTextInputPanel(runtime)
    const textareaFocus = vi.fn()
    const focusRequestCount = () =>
      tipcClientMock.setPanelFocusable.mock.calls.length + ipcInvokeMock.mock.calls.length
    const props = {
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
      selectedAgentId: null,
      onSelectAgent: vi.fn(),
      initialText: "Main window modal",
      host: "main",
    }

    const tree = runtime.render(TextInputPanel, props as any)
    runtime.refs[0].current = { focus: textareaFocus }
    runtime.commitEffects()
    vi.advanceTimersByTime(200)

    expect(focusRequestCount()).toBe(0)
    expect(textareaFocus).toHaveBeenCalledOnce()
    expect(tree.props.onMouseDown).toBeUndefined()
  })

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

  it("attaches clipboard images pasted into the composer", async () => {
    const runtime = createHookRuntime()
    const { TextInputPanel } = await loadTextInputPanel(runtime)
    vi.stubGlobal("FileReader", class {
      result = ""
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      readAsDataURL(file: { type: string }) {
        this.result = `data:${file.type};base64,abc`
        this.onload?.()
      }
    })
    vi.stubGlobal("Image", class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      naturalWidth = 16
      naturalHeight = 16

      set src(_value: string) {
        this.onload?.()
      }
    })
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        getContext: () => ({ clearRect: vi.fn(), drawImage: vi.fn() }),
        toDataURL: () => "data:image/jpeg;base64,abc",
      })),
    })
    const props = {
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
      selectedAgentId: null,
      onSelectAgent: vi.fn(),
      initialText: "",
    }
    const pastedFile = { name: "screenshot.png", type: "image/png", size: 1234 }
    const pasteEvent = {
      clipboardData: {
        items: [{ kind: "file", type: "image/png", getAsFile: () => pastedFile }],
        files: [],
      },
      preventDefault: vi.fn(),
    }

    let tree = runtime.render(TextInputPanel, props as any)
    const textarea = findTextarea(tree)
    await textarea.props.onPaste(pasteEvent)
    await flushPromises()

    expect(pasteEvent.preventDefault).toHaveBeenCalledOnce()

    tree = runtime.render(TextInputPanel, props as any)
    const sendButton = findNode(tree, (node) => node.type === "button" && getText(node) === "Send")
    expect(getText(tree)).toContain("1 image")
    expect(sendButton.props.disabled).toBe(false)
  })

  it("allows normal text paste to proceed when the clipboard has no image", async () => {
    const runtime = createHookRuntime()
    const { TextInputPanel } = await loadTextInputPanel(runtime)
    const pasteEvent = {
      clipboardData: { imageFiles: [] },
      preventDefault: vi.fn(),
    }

    const tree = runtime.render(TextInputPanel, {
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
      selectedAgentId: null,
      onSelectAgent: vi.fn(),
      initialText: "",
    } as any)
    const textarea = findTextarea(tree)
    await textarea.props.onPaste(pasteEvent)

    expect(pasteEvent.preventDefault).not.toHaveBeenCalled()
  })
})
