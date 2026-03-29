interface ParsedKeyCombo {
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
  key: string
}

function normalizeKeyComboToken(token: string): string {
  if (token === " ") {
    return "space"
  }

  const normalized = token.trim().toLowerCase()

  switch (normalized) {
    case "control":
      return "ctrl"
    case "option":
      return "alt"
    case "cmd":
    case "command":
    case "windows":
    case "win":
    case "super":
      return "meta"
    case "esc":
      return "escape"
    case "return":
      return "enter"
    case "space":
    case "spacebar":
      return "space"
    case "del":
      return "delete"
    case "pgup":
      return "pageup"
    case "pgdn":
      return "pagedown"
    case "arrowup":
      return "up"
    case "arrowdown":
      return "down"
    case "arrowleft":
      return "left"
    case "arrowright":
      return "right"
    default:
      return normalized
  }
}

function parseKeyCombo(combo: string): ParsedKeyCombo {
  if (!combo) {
    return { ctrl: false, shift: false, alt: false, meta: false, key: "" }
  }

  const parts = combo.split("-").map(normalizeKeyComboToken).filter(Boolean)
  const result: ParsedKeyCombo = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: "",
  }

  for (const part of parts) {
    switch (part) {
      case "ctrl":
        result.ctrl = true
        break
      case "shift":
        result.shift = true
        break
      case "alt":
        result.alt = true
        break
      case "meta":
        result.meta = true
        break
      default:
        result.key = part
        break
    }
  }

  return result
}

export function matchesKeyCombo(
  event: { key: string },
  modifiers: { ctrl: boolean; shift: boolean; alt: boolean; meta?: boolean },
  combo: string,
): boolean {
  if (!combo) return false

  const parsed = parseKeyCombo(combo)

  if (parsed.ctrl !== modifiers.ctrl) return false
  if (parsed.shift !== modifiers.shift) return false
  if (parsed.alt !== modifiers.alt) return false
  if (parsed.meta !== (modifiers.meta || false)) return false

  if (!parsed.key) return false

  let eventKey = event.key.toLowerCase()

  if (eventKey.startsWith("key")) {
    eventKey = eventKey.substring(3).toLowerCase()
  }

  const keyMappings: Record<string, string> = {
    slash: "/",
    comma: ",",
    space: "space",
    fn: "fn",
    function: "fn",
  }

  const normalizedEventKey = normalizeKeyComboToken(keyMappings[eventKey] || eventKey)
  const normalizedComboKey = normalizeKeyComboToken(keyMappings[parsed.key] || parsed.key)

  return normalizedEventKey === normalizedComboKey
}

export function formatKeyComboForDisplay(combo: string): string {
  if (!combo) return ""

  const parsed = parseKeyCombo(combo)
  const parts: string[] = []

  if (parsed.ctrl) parts.push("Ctrl")
  if (parsed.shift) parts.push("Shift")
  if (parsed.alt) parts.push("Alt")
  if (parsed.meta) parts.push(process.platform === "darwin" ? "Cmd" : "Meta")

  if (parsed.key) {
    let displayKey = parsed.key

    const displayMappings: Record<string, string> = {
      space: "Space",
      "/": "/",
      escape: "Esc",
      enter: "Enter",
      tab: "Tab",
      backspace: "Backspace",
      delete: "Delete",
      up: "↑",
      down: "↓",
      left: "←",
      right: "→",
      home: "Home",
      end: "End",
      pageup: "Page Up",
      pagedown: "Page Down",
      insert: "Insert",
      fn: "Fn",
      f1: "F1",
      f2: "F2",
      f3: "F3",
      f4: "F4",
      f5: "F5",
      f6: "F6",
      f7: "F7",
      f8: "F8",
      f9: "F9",
      f10: "F10",
      f11: "F11",
      f12: "F12",
    }

    displayKey = displayMappings[parsed.key] || parsed.key.toUpperCase()
    parts.push(displayKey)
  }

  return parts.join(" + ")
}

export function getEffectiveShortcut(
  shortcutType: string | undefined,
  customShortcut: string | undefined,
): string | undefined {
  if (shortcutType === "custom") {
    return customShortcut
  }
  return shortcutType
}

function getShortcutDisplayWithCustom<T extends string>(
  shortcut: T | undefined,
  customShortcut: string | undefined,
  fallback: string,
  defaults: Record<Exclude<T, "custom">, string>,
): string {
  if (shortcut === "custom") {
    if (customShortcut) {
      return formatKeyComboForDisplay(customShortcut)
    }
    return fallback
  }

  return shortcut && shortcut in defaults ? defaults[shortcut as Exclude<T, "custom">] : fallback
}

/**
 * Get the display string for the agent mode (MCP tools) shortcut.
 * This provides a centralized mapping to ensure consistency across UI components
 * that display the currently active shortcut (e.g., sessions page hints, onboarding).
 * Note: Settings dropdown labels use hardcoded strings since they show all available options.
 */
export function getMcpToolsShortcutDisplay(
  shortcut: "hold-ctrl-alt" | "toggle-ctrl-alt" | "ctrl-alt-slash" | "custom" | undefined,
  customShortcut?: string,
): string {
  return getShortcutDisplayWithCustom(
    shortcut,
    customShortcut,
    "Hold Ctrl+Alt",
    {
      "hold-ctrl-alt": "Hold Ctrl+Alt",
      "toggle-ctrl-alt": "Press Ctrl+Alt",
      "ctrl-alt-slash": "Ctrl+Alt+/",
    },
  )
}

/**
 * Get the display string for the text input shortcut.
 * This provides a centralized mapping to ensure consistency across UI components.
 */
export function getTextInputShortcutDisplay(
  shortcut: "ctrl-t" | "ctrl-shift-t" | "alt-t" | "custom" | undefined,
  customShortcut?: string,
): string {
  return getShortcutDisplayWithCustom(
    shortcut,
    customShortcut,
    "Ctrl+T",
    {
      "ctrl-t": "Ctrl+T",
      "ctrl-shift-t": "Ctrl+Shift+T",
      "alt-t": "Alt+T",
    },
  )
}

/**
 * Get the display string for the dictation (recording) shortcut.
 * This provides a centralized mapping to ensure consistency across UI components.
 */
export function getDictationShortcutDisplay(
  shortcut: "hold-ctrl" | "ctrl-slash" | "custom" | undefined,
  customShortcut?: string,
): string {
  return getShortcutDisplayWithCustom(
    shortcut,
    customShortcut,
    "Hold Ctrl",
    {
      "hold-ctrl": "Hold Ctrl",
      "ctrl-slash": "Ctrl+/",
    },
  )
}
