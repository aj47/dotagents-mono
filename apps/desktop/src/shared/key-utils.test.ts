import { describe, expect, it } from "vitest"

import {
  formatKeyComboForDisplay,
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
