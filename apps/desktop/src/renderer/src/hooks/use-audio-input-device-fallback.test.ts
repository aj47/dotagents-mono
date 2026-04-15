import { describe, expect, it } from "vitest"
import {
  getValidatedAudioInputDeviceId,
  hasResolvedAudioInputDeviceLabel,
} from "./audio-input-device-utils"

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

  it("remaps to a matching label when the saved device id rotated", () => {
    expect(
      getValidatedAudioInputDeviceId(
        "old-mic-id",
        [
          { deviceId: "new-mic-id", label: "Built-in Microphone", kind: "audioinput" },
          { deviceId: "usb-mic", label: "USB Mic", kind: "audioinput" },
        ],
        "Built-in Microphone",
      ),
    ).toBe("new-mic-id")
  })

  it("does not remap when the saved label is ambiguous", () => {
    expect(
      getValidatedAudioInputDeviceId(
        "old-mic-id",
        [
          { deviceId: "mic-a", label: "USB Mic", kind: "audioinput" },
          { deviceId: "mic-b", label: "USB Mic", kind: "audioinput" },
        ],
        "USB Mic",
      ),
    ).toBeUndefined()
  })
})

describe("hasResolvedAudioInputDeviceLabel", () => {
  it("treats synthetic labels as unresolved", () => {
    expect(hasResolvedAudioInputDeviceLabel("Microphone (abcd1234)")).toBe(false)
  })

  it("treats real labels as resolved", () => {
    expect(hasResolvedAudioInputDeviceLabel("Built-in Microphone")).toBe(true)
  })
})
