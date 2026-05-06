import { describe, expect, it } from "vitest"
import {
  createButtonAccessibilityLabel,
  createChatComposerAccessibilityHint,
  createExpandCollapseAccessibilityLabel,
  createMcpServerSwitchAccessibilityLabel,
  createMicControlAccessibilityHint,
  createMicControlAccessibilityLabel,
  createMinimumTouchTargetStyle,
  createSwitchAccessibilityLabel,
  createTextInputAccessibilityLabel,
  createVoiceInputLiveRegionAnnouncement,
} from "./accessibility-utils"

describe("accessibility utils", () => {
  it("builds stable labels for controls", () => {
    expect(createSwitchAccessibilityLabel("Text-to-Speech")).toBe("Text-to-Speech toggle")
    expect(createSwitchAccessibilityLabel("   ")).toBe("Setting toggle")
    expect(createMcpServerSwitchAccessibilityLabel("github")).toBe("Enable github MCP server")
    expect(createMcpServerSwitchAccessibilityLabel("")).toBe("Enable MCP server")
    expect(createButtonAccessibilityLabel("Send message")).toBe("Send message button")
    expect(createTextInputAccessibilityLabel("API key")).toBe("API key input")
    expect(createMicControlAccessibilityLabel()).toBe("Voice input microphone button")
  })

  it("builds voice microphone hints for push-to-talk and hands-free modes", () => {
    expect(createMicControlAccessibilityHint({ handsFree: false, listening: false, willCancel: false }))
      .toBe("Press and hold to dictate your message. Release to send.")
    expect(createMicControlAccessibilityHint({ handsFree: false, listening: true, willCancel: true }))
      .toBe("Voice input is active. Release to insert dictated text for editing.")
    expect(createMicControlAccessibilityHint({ handsFree: true, listening: true, willCancel: true }))
      .toBe("Voice input is active. Double tap to stop recording.")
  })

  it("builds chat composer hints with optional web shortcut guidance", () => {
    expect(createChatComposerAccessibilityHint({ handsFree: true, listening: true }))
      .toBe("Voice listening is active. Dictated text appears in this message field.")
    expect(createChatComposerAccessibilityHint({ handsFree: false, listening: false, isWeb: true }))
      .toBe("Type your message or hold the mic to dictate before sending. Use Shift+Enter or Ctrl/Cmd+Enter to send.")
  })

  it("builds expand and collapse labels", () => {
    expect(createExpandCollapseAccessibilityLabel("message", false)).toBe("Expand message")
    expect(createExpandCollapseAccessibilityLabel("tool execution details", true)).toBe("Collapse tool execution details")
    expect(createExpandCollapseAccessibilityLabel("   ", false)).toBe("Expand details")
  })

  it("builds platform-neutral touch target styles", () => {
    expect(createMinimumTouchTargetStyle()).toEqual({
      minWidth: 44,
      minHeight: 44,
      paddingHorizontal: 6,
      paddingVertical: 6,
      marginHorizontal: 2,
      alignItems: "center",
      justifyContent: "center",
    })
    expect(createMinimumTouchTargetStyle({ horizontalMargin: 0 })).toEqual({
      minWidth: 44,
      minHeight: 44,
      paddingHorizontal: 6,
      paddingVertical: 6,
      marginHorizontal: 0,
      alignItems: "center",
      justifyContent: "center",
    })
  })

  it("builds live-region announcements for voice input", () => {
    expect(createVoiceInputLiveRegionAnnouncement({
      listening: true,
      handsFree: false,
      willCancel: false,
    })).toBe("Voice listening active. Release to send your message.")
    expect(createVoiceInputLiveRegionAnnouncement({
      listening: false,
      handsFree: false,
      willCancel: false,
      sttPreview: "a".repeat(220),
    })).toBe(`Voice input captured. Transcript: ${"a".repeat(137)}...`)
    expect(createVoiceInputLiveRegionAnnouncement({
      listening: false,
      handsFree: false,
      willCancel: false,
    })).toBe("Voice input ready.")
  })
})
