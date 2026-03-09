const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

function extractBetween(startMarker, endMarker) {
  const start = settingsSource.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);

  const end = endMarker ? settingsSource.indexOf(endMarker, start) : -1;
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);

  return settingsSource.slice(start, end);
}

test('avoids decorative emoji chrome in the mobile remote provider selection subsection', () => {
  const providerSection = extractBetween(
    '<CollapsibleSection id="providerSelection" title="Provider Selection">',
    '<CollapsibleSection id="profileModel" title="Profile & Model">'
  );

  assert.doesNotMatch(providerSection, /🎤|📝|🤖|🔊/);
  assert.doesNotMatch(providerSection, /Select which AI provider to use for each feature\./);
  assert.match(providerSection, />Voice Transcription \(STT\)</);
  assert.match(providerSection, />Transcript Post-Processing</);
  assert.match(providerSection, />Agent\/MCP Tools</);
  assert.match(providerSection, />Text-to-Speech \(TTS\)</);
});

test('keeps profile/model actions text-first and explicitly labeled', () => {
  const profileModelSection = extractBetween(
    '<CollapsibleSection id="profileModel" title="Profile & Model">',
    '<CollapsibleSection id="streamerMode" title="Streamer Mode">'
  );

  assert.doesNotMatch(profileModelSection, /📥 Import|📤 Export|📋 List|✏️ Custom|🔄|⏳/);
  assert.match(profileModelSection, /\{isImportingProfile \? 'Importing\.\.\.' : 'Import'\}/);
  assert.match(profileModelSection, /\{isExportingProfile \? 'Exporting\.\.\.' : 'Export'\}/);
  assert.match(profileModelSection, /\{useCustomModel \? 'List' : 'Custom'\}/);
  assert.match(profileModelSection, /\{isLoadingModels \? 'Refreshing…' : 'Refresh'\}/);
  assert.match(profileModelSection, /accessibilityLabel=\{useCustomModel \? 'Show model list' : 'Enter custom model name'\}/);
  assert.match(profileModelSection, /accessibilityLabel="Refresh available models"/);
});