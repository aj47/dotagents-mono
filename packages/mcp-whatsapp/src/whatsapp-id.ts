/**
 * Normalize a WhatsApp identifier (JID, phone number, or LID) into a plain
 * digit-only string suitable for equality matching against an allowlist entry.
 *
 * Handles the formats WhatsApp/Baileys can produce, plus the formats users
 * tend to type into the allowlist input:
 *   - `61406142826@s.whatsapp.net`     (phone JID)
 *   - `61406142826:23@s.whatsapp.net`  (multi-device JID with device suffix)
 *   - `98389177934034@lid`             (privacy LID)
 *   - `+61 406 142 826`                (user-entered phone with formatting)
 *
 * Order of operations matters here:
 *   1. Strip the `@suffix` (any JID suffix, e.g. @s.whatsapp.net, @lid, @g.us).
 *   2. Strip the `:device` suffix (the multi-device tag Baileys appends, e.g.
 *      `61406142826:23`). If we ran the digit filter before this, the device
 *      number would be concatenated onto the phone number and the entry would
 *      no longer match the allowlist.
 *   3. Strip every remaining non-digit character (formatting like `+`, spaces,
 *      parentheses, dashes that users include when they type a phone number).
 */
export function normalizeWhatsAppId(value: string | undefined | null): string {
  if (!value) return ""
  const beforeAt = value.split("@")[0] ?? ""
  const beforeColon = beforeAt.split(":")[0] ?? ""
  return beforeColon.replace(/[^0-9]/g, "")
}
