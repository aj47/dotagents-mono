import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsWhatsappSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-whatsapp.tsx'),
  'utf8',
)

const connectionGroup = settingsWhatsappSource.match(
  /<ControlGroup title="Connection">[\s\S]*?<\/ControlGroup>/,
)?.[0] ?? ''

const allowedSendersControl = settingsWhatsappSource.match(
  /<Control[\s\S]*?label=\{<ControlLabel label="Allowed Senders"[\s\S]*?<\/Control>/,
)?.[0] ?? ''

const autoReplyControl = settingsWhatsappSource.match(
  /<Control[\s\S]*?label=\{<ControlLabel label="Auto-Reply"[\s\S]*?<\/Control>/,
)?.[0] ?? ''

test('desktop WhatsApp connection group removes redundant QR helper chrome while keeping the real pairing affordances', () => {
  assert.ok(connectionGroup, 'expected to find the WhatsApp connection group')
  assert.doesNotMatch(connectionGroup, /endDescription="Connect your WhatsApp account by scanning the QR code"/)
  assert.match(connectionGroup, /Open WhatsApp on your phone → Settings → Linked Devices → Scan this QR code/)
  assert.match(connectionGroup, /Connect with QR Code/)
})

test('desktop WhatsApp allowlist and auto-reply states stay text-first without decorative status glyphs', () => {
  assert.ok(allowedSendersControl, 'expected to find the WhatsApp allowed senders control')
  assert.ok(autoReplyControl, 'expected to find the WhatsApp auto-reply control')
  assert.doesNotMatch(allowedSendersControl, /ℹ️|💡|⚠️/)
  assert.match(allowedSendersControl, /What are LIDs and how do I find them\?/) 
  assert.match(allowedSendersControl, /No allowlist set - all incoming messages will be accepted/)
  assert.doesNotMatch(autoReplyControl, /✓|⚠️/)
  assert.match(autoReplyControl, /Auto-reply enabled - incoming messages will be processed and replied to/)
  assert.match(autoReplyControl, /Auto-reply is enabled but Remote Server or API key is missing/)
})