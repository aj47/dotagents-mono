import { describe, expect, it } from "vitest"

import {
  formatKeyComboForDisplay,
  getMainWindowNewChatShortcutDisplay,
  getSettingsHotkeyDisplay,
  getToggleVoiceDictationShortcutDisplay,
  getVoiceScreenshotShortcutDisplay,
  matchesKeyCombo,
} from "./key-utils"

describe("matchesKeyCombo", () => {
  it("matches normalized aliases for event keys and stored shortcuts", () => {
    expect(
      matchesKeyCombo(
        { key: "ArrowUp" },
        { ctrl: true, shift: false, alt: false, meta: false },
        " Control - Up ",
      ),
    ).toBe(true)
  })

  it("matches space shortcuts from either event or config aliases", () => {
    expect(
      matchesKeyCombo(
        { key: " " },
        { ctrl: true, shift: false, alt: false, meta: false },
        "control-spacebar",
      ),
    ).toBe(true)
  })
})

describe("formatKeyComboForDisplay", () => {
  it("renders normalized special keys with friendly labels", () => {
    expect(formatKeyComboForDisplay("control-spacebar")).toBe("Ctrl + Space")
  })

  it("normalizes aliases and meta shortcuts for display", () => {
    expect(formatKeyComboForDisplay("cmd-return")).toBe(
      `${process.platform === "darwin" ? "Cmd" : "Meta"} + Enter`,
    )
  })
})

describe("getVoiceScreenshotShortcutDisplay", () => {
  it("returns the built-in shortcut label by default", () => {
    expect(getVoiceScreenshotShortcutDisplay(undefined)).toBe("Ctrl+Shift+X")
    expect(getVoiceScreenshotShortcutDisplay("ctrl-shift-x")).toBe("Ctrl+Shift+X")
  })

  it("formats a custom shortcut when one is configured", () => {
    expect(getVoiceScreenshotShortcutDisplay("custom", "alt-shift-s")).toBe("Shift + Alt + S")
  })

  it("falls back to the built-in label when custom mode has no shortcut yet", () => {
    expect(getVoiceScreenshotShortcutDisplay("custom")).toBe("Ctrl+Shift+X")
  })
})

describe("main-window shortcut displays", () => {
  it("uses platform-specific new chat labels", () => {
    expect(getMainWindowNewChatShortcutDisplay(true)).toBe("Cmd+N")
    expect(getMainWindowNewChatShortcutDisplay(false)).toBe("Ctrl+N")
  })
})

describe("getSettingsHotkeyDisplay", () => {
  it("returns built-in show-main-window shortcut labels", () => {
    expect(getSettingsHotkeyDisplay(undefined)).toBe("Ctrl+Shift+S")
    expect(getSettingsHotkeyDisplay("ctrl-comma")).toBe("Ctrl+,")
    expect(getSettingsHotkeyDisplay("ctrl-shift-comma")).toBe("Ctrl+Shift+,")
  })

  it("formats a custom show-main-window shortcut", () => {
    expect(getSettingsHotkeyDisplay("custom", "alt-space")).toBe("Alt + Space")
  })
})

describe("getToggleVoiceDictationShortcutDisplay", () => {
  it("returns function-key labels for built-in toggle dictation shortcuts", () => {
    expect(getToggleVoiceDictationShortcutDisplay(undefined)).toBe("Fn")
    expect(getToggleVoiceDictationShortcutDisplay("f8")).toBe("F8")
  })

  it("formats a custom toggle dictation shortcut", () => {
    expect(getToggleVoiceDictationShortcutDisplay("custom", "ctrl-shift-f")).toBe(
      "Ctrl + Shift + F",
    )
  })
})
