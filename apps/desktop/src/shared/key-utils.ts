export interface ParsedKeyCombo {
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

function serializeParsedKeyCombo(parsed: ParsedKeyCombo): string {
  const parts: string[] = []

  if (parsed.ctrl) parts.push("ctrl")
  if (parsed.shift) parts.push("shift")
  if (parsed.alt) parts.push("alt")
  if (parsed.meta) parts.push("meta")
  if (parsed.key) parts.push(parsed.key)

  return parts.join("-")
}

export function parseKeyCombo(combo: string): ParsedKeyCombo {
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

export function validateKeyCombo(combo: string): {
  valid: boolean
  error?: string
} {
  if (!combo.trim()) {
    return { valid: false, error: "Key combination cannot be empty" }
  }

  const parsed = parseKeyCombo(combo)

  const hasModifier = parsed.ctrl || parsed.shift || parsed.alt || parsed.meta
  const isFunctionKey = parsed.key && (parsed.key.match(/^f\d+$/) || parsed.key === "fn")

  if (!hasModifier && !isFunctionKey) {
    return {
      valid: false,
      error:
        "Key combination must include at least one modifier key (Ctrl, Shift, Alt, Meta) or be a function key",
    }
  }

  if (!parsed.key) {
    return { valid: false, error: "Key combination must include a main key" }
  }

  const dangerousCombos = [
    "ctrl-alt-delete", // System shortcut
    "alt-f4", // Close window
    "ctrl-w", // Close tab
    "ctrl-q", // Quit application
  ]

  if (dangerousCombos.includes(serializeParsedKeyCombo(parsed))) {
    return {
      valid: false,
      error: "This key combination is reserved by the system",
    }
  }

  return { valid: true }
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

/**
 * Get the display string for the agent mode (MCP tools) shortcut.
 * This provides a centralized mapping to ensure consistency across UI components
 * that display the currently active shortcut (e.g., sessions page hints, onboarding).
 * Note: Settings dropdown labels use hardcoded strings since they show all available options.
 */
export function getMcpToolsShortcutDisplay(
  shortcut: "hold-ctrl-alt" | "toggle-ctrl-alt" | "ctrl-alt-slash" | "custom" | undefined,
  customShortcut?: string,
  customMode: "hold" | "toggle" = "hold",
): string {
  switch (shortcut) {
    case "hold-ctrl-alt":
      return "Hold Ctrl+Alt"
    case "toggle-ctrl-alt":
      return "Press Ctrl+Alt"
    case "ctrl-alt-slash":
      return "Press Ctrl+Alt+/"
    case "custom":
      if (customShortcut) {
        const formattedShortcut = formatKeyComboForDisplay(customShortcut)
        return customMode === "toggle"
          ? `Press ${formattedShortcut}`
          : `Hold ${formattedShortcut}`
      }
      return "Set custom shortcut"
    default:
      return "Hold Ctrl+Alt"
  }
}

/**
 * Get the display string for the text input shortcut.
 * This provides a centralized mapping to ensure consistency across UI components.
 */
export function getTextInputShortcutDisplay(
  shortcut: "ctrl-t" | "ctrl-shift-t" | "alt-t" | "custom" | undefined,
  customShortcut?: string,
): string {
  switch (shortcut) {
    case "ctrl-t":
      return "Ctrl+T"
    case "ctrl-shift-t":
      return "Ctrl+Shift+T"
    case "alt-t":
      return "Alt+T"
    case "custom":
      if (customShortcut) {
        return formatKeyComboForDisplay(customShortcut)
      }
      return "Set custom shortcut"
    default:
      return "Ctrl+T"
  }
}

/**
 * Get the display string for the show-main-window shortcut.
 * This keeps settings copy aligned with the actual configured shortcut.
 */
export function getSettingsHotkeyDisplay(
  shortcut: "ctrl-shift-s" | "ctrl-comma" | "ctrl-shift-comma" | "custom" | undefined,
  customShortcut?: string,
): string {
  switch (shortcut) {
    case "ctrl-shift-s":
      return "Ctrl+Shift+S"
    case "ctrl-comma":
      return "Ctrl+,"
    case "ctrl-shift-comma":
      return "Ctrl+Shift+,"
    case "custom":
      if (customShortcut) {
        return formatKeyComboForDisplay(customShortcut)
      }
      return "Set custom shortcut"
    default:
      return "Ctrl+Shift+S"
  }
}

/**
 * Get the display string for the toggle voice dictation shortcut.
 * This keeps settings copy aligned with the actual configured shortcut.
 */
export function getToggleVoiceDictationShortcutDisplay(
  shortcut:
    | "fn"
    | "f1"
    | "f2"
    | "f3"
    | "f4"
    | "f5"
    | "f6"
    | "f7"
    | "f8"
    | "f9"
    | "f10"
    | "f11"
    | "f12"
    | "custom"
    | undefined,
  customShortcut?: string,
): string {
  switch (shortcut) {
    case "fn":
      return "Fn"
    case "f1":
      return "F1"
    case "f2":
      return "F2"
    case "f3":
      return "F3"
    case "f4":
      return "F4"
    case "f5":
      return "F5"
    case "f6":
      return "F6"
    case "f7":
      return "F7"
    case "f8":
      return "F8"
    case "f9":
      return "F9"
    case "f10":
      return "F10"
    case "f11":
      return "F11"
    case "f12":
      return "F12"
    case "custom":
      if (customShortcut) {
        return formatKeyComboForDisplay(customShortcut)
      }
      return "Set custom shortcut"
    default:
      return "Fn"
  }
}

/**
 * Get the display string for the emergency kill switch shortcut.
 * This keeps settings copy aligned with the actual configured shortcut.
 */
export function getAgentKillSwitchShortcutDisplay(
  shortcut: "ctrl-shift-escape" | "ctrl-alt-q" | "ctrl-shift-q" | "custom" | undefined,
  customShortcut?: string,
): string {
  switch (shortcut) {
    case "ctrl-shift-escape":
      return "Ctrl+Shift+Escape"
    case "ctrl-alt-q":
      return "Ctrl+Alt+Q"
    case "ctrl-shift-q":
      return "Ctrl+Shift+Q"
    case "custom":
      if (customShortcut) {
        return formatKeyComboForDisplay(customShortcut)
      }
      return "Set custom shortcut"
    default:
      return "Ctrl+Shift+Escape"
  }
}

/**
 * Get the display string for the dictation (recording) shortcut.
 * This provides a centralized mapping to ensure consistency across UI components.
 */
export function getDictationShortcutDisplay(
  shortcut: "hold-ctrl" | "ctrl-slash" | "custom" | undefined,
  customShortcut?: string,
): string {
  switch (shortcut) {
    case "hold-ctrl":
      return "Hold Ctrl"
    case "ctrl-slash":
      return "Ctrl+/"
    case "custom":
      if (customShortcut) {
        return formatKeyComboForDisplay(customShortcut)
      }
      return "Hold Ctrl"
    default:
      return "Hold Ctrl"
  }
}
