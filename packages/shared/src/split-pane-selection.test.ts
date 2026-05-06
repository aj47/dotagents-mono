import { describe, expect, it } from "vitest"

import {
  getInitialSplitSessionIds,
  reconcileSplitPaneSelection,
  replaceSplitPaneSelection,
  resolveSplitOrientation,
} from "./split-pane-selection"

describe("split pane selection", () => {
  it("prefers the current session when choosing initial panes", () => {
    expect(getInitialSplitSessionIds(["s1", "s2", "s3"], "s2")).toEqual({
      primary: "s2",
      secondary: "s1",
    })
  })

  it("dedupes and skips empty session ids when choosing initial panes", () => {
    expect(getInitialSplitSessionIds(["", "s1", "s1", "s2"])).toEqual({
      primary: "s1",
      secondary: "s2",
    })
  })

  it("swaps panes instead of duplicating the same session in both panes", () => {
    expect(replaceSplitPaneSelection({ primary: "s1", secondary: "s2" }, "primary", "s2")).toEqual({
      primary: "s2",
      secondary: "s1",
    })
  })

  it("clears a pane when the replacement is empty", () => {
    expect(replaceSplitPaneSelection({ primary: "s1", secondary: "s2" }, "secondary", null)).toEqual({
      primary: "s1",
      secondary: null,
    })
  })

  it("reconciles missing selections against the available sessions", () => {
    expect(reconcileSplitPaneSelection({ primary: "missing", secondary: null }, ["s1", "s2"], "s2")).toEqual({
      primary: "s2",
      secondary: "s1",
    })
  })

  it("keeps panes unique while reconciling duplicate selections", () => {
    expect(reconcileSplitPaneSelection({ primary: "s1", secondary: "s1" }, ["s1", "s2"])).toEqual({
      primary: "s1",
      secondary: "s2",
    })
  })

  it("chooses explicit layout preferences without auto detection", () => {
    expect(resolveSplitOrientation("horizontal", 1200, 800)).toBe("horizontal")
    expect(resolveSplitOrientation("vertical", 430, 932)).toBe("vertical")
  })

  it("chooses a side-by-side layout automatically on wide screens", () => {
    expect(resolveSplitOrientation("auto", 1200, 800)).toBe("vertical")
  })

  it("chooses a stacked layout automatically on narrow screens", () => {
    expect(resolveSplitOrientation("auto", 430, 932)).toBe("horizontal")
  })
})
