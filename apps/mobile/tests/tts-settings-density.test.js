const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ttsSettingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'TTSSettings.tsx'),
  'utf8'
);

function extractBetween(startMarker, endMarker) {
  const start = ttsSettingsSource.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);

  const end = ttsSettingsSource.indexOf(endMarker, start);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);

  return ttsSettingsSource.slice(start, end);
}

test('keeps mobile TTS settings actions compact and explicitly labeled', () => {
  assert.doesNotMatch(ttsSettingsSource, /🔊 Test Voice/);
  assert.match(ttsSettingsSource, /<Text style=\{styles\.testButtonText\}>Test voice<\/Text>/);

  assert.doesNotMatch(ttsSettingsSource, />✕<\/Text>/);
  assert.match(ttsSettingsSource, /accessibilityLabel="Close voice picker"/);
  assert.match(ttsSettingsSource, /<Ionicons name="close" size=\{18\}/);
  assert.match(ttsSettingsSource, /modalCloseButton:\s*\{[\s\S]*?width:\s*32,[\s\S]*?height:\s*32,[\s\S]*?backgroundColor:\s*theme\.colors\.muted,/);
  assert.doesNotMatch(ttsSettingsSource, /modalCloseText/);
});

test('keeps the mobile TTS voice picker header flex-safe on narrow widths', () => {
  const modalHeaderStyles = extractBetween('modalHeader: {', 'modalTitle: {');
  assert.match(modalHeaderStyles, /flexDirection:\s*'row'/);
  assert.match(modalHeaderStyles, /justifyContent:\s*'space-between'/);
  assert.match(modalHeaderStyles, /alignItems:\s*'center'/);
  assert.match(modalHeaderStyles, /gap:\s*spacing\.sm/);

  const modalTitleStyles = extractBetween('modalTitle: {', 'modalCloseButton: {');
  assert.match(modalTitleStyles, /flex:\s*1/);
  assert.match(modalTitleStyles, /flexShrink:\s*1/);
  assert.match(modalTitleStyles, /paddingRight:\s*spacing\.xs/);
});
