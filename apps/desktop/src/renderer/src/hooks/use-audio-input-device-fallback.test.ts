import { describe, expect, it } from "vitest"
import { getValidatedAudioInputDeviceId } from "./audio-input-device-utils"

describe("getValidatedAudioInputDeviceId", () => {
  it("clears an invalid saved microphone when at least one valid input exists", () => {
    expect(
      getValidatedAudioInputDeviceId("missing-mic", [
        { deviceId: "built-in-mic", label: "Built-in Mic", kind: "audioinput" },
      ]),
    ).toBeUndefined()
  })

  it("keeps the saved microphone when it is still available", () => {
    expect(
      getValidatedAudioInputDeviceId("built-in-mic", [
        { deviceId: "built-in-mic", label: "Built-in Mic", kind: "audioinput" },
        { deviceId: "usb-mic", label: "USB Mic", kind: "audioinput" },
      ]),
    ).toBe("built-in-mic")
  })

  it("keeps the saved microphone when there are no inputs to validate against", () => {
    expect(getValidatedAudioInputDeviceId("saved-mic", [])).toBe("saved-mic")
  })
})