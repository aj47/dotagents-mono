import { describe, it, expect } from "vitest"
import { normalizeWhatsAppId } from "./whatsapp-id.js"

describe("normalizeWhatsAppId", () => {
  it("returns an empty string for empty input", () => {
    expect(normalizeWhatsAppId("")).toBe("")
    expect(normalizeWhatsAppId(undefined)).toBe("")
    expect(normalizeWhatsAppId(null)).toBe("")
  })

  it("strips the @s.whatsapp.net suffix", () => {
    expect(normalizeWhatsAppId("61406142826@s.whatsapp.net")).toBe("61406142826")
  })

  it("strips the @lid suffix", () => {
    expect(normalizeWhatsAppId("98389177934034@lid")).toBe("98389177934034")
  })

  it("strips the @g.us group suffix", () => {
    // Group JIDs may contain a dash; the digits-only result is fine for
    // equality comparison since both sides go through the same normalizer.
    expect(normalizeWhatsAppId("123456789-987654321@g.us")).toBe("123456789987654321")
  })

  it("strips the multi-device :N tag before stripping formatting", () => {
    // Without colon-stripping the device tag would be concatenated onto the
    // phone number, which is exactly the regression that caused issue #461.
    expect(normalizeWhatsAppId("61406142826:23@s.whatsapp.net")).toBe("61406142826")
    expect(normalizeWhatsAppId("61406142826:23")).toBe("61406142826")
  })

  it("normalizes user-entered phone numbers with formatting", () => {
    expect(normalizeWhatsAppId("+61 406 142 826")).toBe("61406142826")
    expect(normalizeWhatsAppId("+1 (415) 555-1234")).toBe("14155551234")
    expect(normalizeWhatsAppId("(415) 555 1234")).toBe("4155551234")
    expect(normalizeWhatsAppId("+1-415-555-1234")).toBe("14155551234")
  })

  it("matches a formatted allowlist entry against an incoming JID", () => {
    const allowlistEntry = "+61 406 142 826"
    expect(normalizeWhatsAppId(allowlistEntry))
      .toBe(normalizeWhatsAppId("61406142826@s.whatsapp.net"))
    expect(normalizeWhatsAppId(allowlistEntry))
      .toBe(normalizeWhatsAppId("61406142826:23@s.whatsapp.net"))
    expect(normalizeWhatsAppId(allowlistEntry))
      .toBe(normalizeWhatsAppId("61406142826:5"))
  })

  it("does not match different phone numbers", () => {
    expect(normalizeWhatsAppId("+61 406 142 826"))
      .not.toBe(normalizeWhatsAppId("+61 406 142 827"))
  })
})
