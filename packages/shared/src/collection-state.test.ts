import { describe, expect, it } from "vitest"

import {
  addSetValue,
  addSetValues,
  getVisibleSelectedValues,
  removeSetValue,
  removeSetValues,
  setSetValuePresence,
  toggleSetValue,
} from "./collection-state"

describe("collection state helpers", () => {
  it("toggles, removes, and intersects set values without mutating the input set", () => {
    const selected = new Set(["alpha", "beta"])

    expect([...toggleSetValue(selected, "beta")]).toEqual(["alpha"])
    expect([...toggleSetValue(selected, "gamma")]).toEqual(["alpha", "beta", "gamma"])
    expect([...addSetValue(selected, "gamma")]).toEqual(["alpha", "beta", "gamma"])
    expect([...addSetValues(selected, ["beta", "gamma"])]).toEqual(["alpha", "beta", "gamma"])
    expect([...removeSetValue(selected, "alpha")]).toEqual(["beta"])
    expect([...removeSetValues(selected, ["alpha", "missing"])]).toEqual(["beta"])
    expect([...setSetValuePresence(selected, "gamma", true)]).toEqual(["alpha", "beta", "gamma"])
    expect([...setSetValuePresence(selected, "alpha", false)]).toEqual(["beta"])
    expect(getVisibleSelectedValues(selected, new Set(["beta", "gamma"]))).toEqual(["beta"])
    expect([...selected]).toEqual(["alpha", "beta"])
  })
})
