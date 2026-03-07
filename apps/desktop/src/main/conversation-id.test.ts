import { describe, expect, it } from "vitest"
import {
  assertSafeConversationId,
  getConversationIdValidationError,
  sanitizeConversationId,
  validateAndSanitizeConversationId,
} from "./conversation-id"

describe("conversation-id", () => {
  it("accepts conversation IDs used by external integrations", () => {
    expect(getConversationIdValidationError("whatsapp_61406142826@s.whatsapp.net")).toBeNull()
    expect(validateAndSanitizeConversationId("whatsapp_61406142826@s.whatsapp.net")).toBe(
      "whatsapp_61406142826@s.whatsapp.net",
    )
  })

  it("sanitizes unsupported characters for storage", () => {
    expect(sanitizeConversationId("team chat:42")).toBe("team_chat_42")
    expect(validateAndSanitizeConversationId("team chat:42")).toBe("team_chat_42")
  })

  it("rejects invalid characters when validating an established conversation ID", () => {
    expect(getConversationIdValidationError("team:chat")).toBe("Invalid conversation ID format")
    expect(() => assertSafeConversationId("team:chat")).toThrow("Invalid conversation ID format")
  })

  it("rejects empty, path-like, and null-byte IDs", () => {
    expect(getConversationIdValidationError("")).toBe("Invalid conversation ID: empty value not allowed")
    expect(getConversationIdValidationError("../secrets")).toBe(
      "Invalid conversation ID: path traversal characters not allowed",
    )
    expect(() => validateAndSanitizeConversationId("chat\0id")).toThrow(
      "Invalid conversation ID: null bytes not allowed",
    )
  })

  it("rejects reserved or Windows-unsafe storage names", () => {
    expect(getConversationIdValidationError("index")).toBe("Invalid conversation ID: reserved name")
    expect(getConversationIdValidationError("CON.txt")).toBe("Invalid conversation ID: reserved name")
    expect(() => assertSafeConversationId("metadata")).toThrow("Invalid conversation ID: reserved name")
  })

  it("rejects trailing dots and spaces that break on Windows filesystems", () => {
    expect(getConversationIdValidationError("conversation.")).toBe(
      "Invalid conversation ID: trailing dots or spaces not allowed",
    )
    expect(() => assertSafeConversationId("conversation ")).toThrow(
      "Invalid conversation ID: trailing dots or spaces not allowed",
    )
    expect(validateAndSanitizeConversationId("conversation ")).toBe("conversation_")
  })
})