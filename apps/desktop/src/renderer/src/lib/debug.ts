import {
  desktopAppShellClient,
  type DesktopDebugFlags,
} from "@renderer/lib/desktop-app-shell-client"

type DebugFlags = DesktopDebugFlags

let cachedFlags: DebugFlags | null = null
let flagsFetchPromise: Promise<DebugFlags> | null = null

function getLocalDebugFlag(key: string): string | null {
  if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export async function initDebugFlags(): Promise<void> {
  if (cachedFlags) return

  try {
    cachedFlags = await desktopAppShellClient.getDebugFlags()
  } catch (error) {
    console.warn('[DEBUG] Failed to fetch debug flags from main, using fallback:', error)
    cachedFlags = {
      llm: false,
      tools: false,
      keybinds: false,
      app: false,
      ui: getLocalDebugFlag('DEBUG_UI') === 'true' || getLocalDebugFlag('DEBUG') === '*',
      all: getLocalDebugFlag('DEBUG') === '*',
    }
  }
}

function getFlags(): DebugFlags {
  if (cachedFlags) return cachedFlags

  if (!flagsFetchPromise) {
    flagsFetchPromise = initDebugFlags().then(() => cachedFlags!)
  }

  return {
    llm: false,
    tools: false,
    keybinds: false,
    app: false,
    ui: getLocalDebugFlag('DEBUG_UI') === 'true' || getLocalDebugFlag('DEBUG') === '*',
    all: getLocalDebugFlag('DEBUG') === '*',
  }
}

export function isDebugUI(): boolean {
  const flags = getFlags()
  return flags.ui || flags.all
}

function ts(): string {
  const d = new Date()
  return d.toISOString()
}


function safeStringify(value: any): string {
  try {
    return JSON.stringify(value)
  } catch {
    try {
      return String(value)
    } catch {
      return '[unserializable]'
    }
  }
}

function formatDebugArg(arg: any): string {
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}\n${arg.stack}`
  }
  if (typeof arg === 'string') return arg
  if (typeof arg === 'object' && arg !== null) {
    return safeStringify(arg)
  }
  return String(arg)
}

export function logUI(...args: any[]) {
  if (!isDebugUI()) return

  const formattedArgs = args.map(formatDebugArg)

  console.log(`[${ts()}] [DEBUG][UI]`, ...formattedArgs)
}

export function logComponentLifecycle(componentName: string, event: string, data?: any) {
  logUI(`[${componentName}] ${event}`, data)
}

export function logFocus(element: string, event: 'focus' | 'blur', data?: any) {
  logUI(`[FOCUS] ${element} ${event}`, data)
}

export function logStateChange(component: string, stateName: string, oldValue: any, newValue: any) {
  const detail = safeStringify({ from: oldValue, to: newValue })
  logUI(`[STATE] ${component}.${stateName}: ${detail}`)
}

export function logExpand(component: string, event: string, data?: any) {
  const suffix = data !== undefined ? ` ${safeStringify(data)}` : ''
  logUI(`[EXPAND] ${component} ${event}${suffix}`)
}

export function logRender(componentName: string, reason?: string, props?: any) {
  logUI(`[RENDER] ${componentName}`, reason ? `(${reason})` : '', props)
}
