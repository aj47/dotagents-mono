import { beforeEach, describe, expect, it, vi } from "vitest"

const { toastError } = vi.hoisted(() => ({
  toastError: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
  },
}))

import { getSettingsSaveErrorMessage, reportConfigSaveError } from "./config-save-error"

describe("config-save-error", () => {
  beforeEach(() => {
    toastError.mockReset()
  })

  it("maps permission errors to a friendly message", () => {
    expect(getSettingsSaveErrorMessage(new Error("EACCES: permission denied"))).toBe(
      "Couldn't save your settings because DotAgents doesn't have permission to write its config files.",
    )
  })

  it("maps disk-full errors to a friendly message", () => {
    expect(getSettingsSaveErrorMessage(new Error("ENOSPC: no space left on device"))).toBe(
      "Couldn't save your settings because your disk is full. Free up some space and try again.",
    )
  })

  it("maps read-only config locations to a friendly message", () => {
    expect(getSettingsSaveErrorMessage(new Error("EROFS: read-only file system"))).toBe(
      "Couldn't save your settings because the config location is read-only.",
    )
  })

  it("keeps useful details while stripping the internal prefix", () => {
    expect(
      getSettingsSaveErrorMessage(
        new Error(
          "Failed to save settings to disk. Could not write the legacy config file (Temporary I/O failure)",
        ),
      ),
    ).toBe(
      "Couldn't save your settings. Could not write the legacy config file (Temporary I/O failure)",
    )
  })

  it("unwraps nested backend-shaped error payloads", () => {
    expect(
      getSettingsSaveErrorMessage({ error: { message: "Failed to save settings to disk. Could not write .agents file" } }),
    ).toBe("Couldn't save your settings. Could not write .agents file")
  })

  it("uses nested causes when the top-level error message is empty", () => {
    const error = new Error("", { cause: new Error("EACCES: permission denied") })

    expect(getSettingsSaveErrorMessage(error)).toBe(
      "Couldn't save your settings because DotAgents doesn't have permission to write its config files.",
    )
  })

  it("uses nested causes when the top-level message is only a generic wrapper", () => {
    const error = new Error("Failed to save settings to disk.", {
      cause: new Error("ENOSPC: no space left on device"),
    })

    expect(getSettingsSaveErrorMessage(error)).toBe(
      "Couldn't save your settings because your disk is full. Free up some space and try again.",
    )
  })

  it("unwraps aggregate-style nested errors when the wrapper message is generic", () => {
    const error = new AggregateError(
      [new Error("EROFS: read-only file system")],
      "Failed to save settings to disk.",
    )

    expect(getSettingsSaveErrorMessage(error)).toBe(
      "Couldn't save your settings because the config location is read-only.",
    )
  })

  it("reports config save failures through the shared toast helper", () => {
    const error = new Error("ENOSPC: no space left on device")
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    reportConfigSaveError(error)

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to save config:", error)
    expect(toastError).toHaveBeenCalledWith(
      "Couldn't save your settings because your disk is full. Free up some space and try again.",
    )
  })
})