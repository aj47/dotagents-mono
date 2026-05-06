import { describe, expect, it } from "vitest"

import {
  formatKeyComboForDisplay,
  matchesKeyCombo,
} from "@dotagents/shared/key-utils"

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
