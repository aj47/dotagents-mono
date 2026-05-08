import { describe, expect, it } from "vitest"

import {
  addSetValues,
  getVisibleSelectedValues,
  removeSetValue,
  removeSetValues,
  toggleSetValue,
} from "./collection-state"

describe("collection state helpers", () => {
  it("toggles, removes, and intersects set values without mutating the input set", () => {
    const selected = new Set(["alpha", "beta"])

    expect([...toggleSetValue(selected, "beta")]).toEqual(["alpha"])
    expect([...toggleSetValue(selected, "gamma")]).toEqual(["alpha", "beta", "gamma"])
    expect([...addSetValues(selected, ["beta", "gamma"])]).toEqual(["alpha", "beta", "gamma"])
    expect([...removeSetValue(selected, "alpha")]).toEqual(["beta"])
    expect([...removeSetValues(selected, ["alpha", "missing"])]).toEqual(["beta"])
    expect(getVisibleSelectedValues(selected, new Set(["beta", "gamma"]))).toEqual(["beta"])
    expect([...selected]).toEqual(["alpha", "beta"])
  })
})
