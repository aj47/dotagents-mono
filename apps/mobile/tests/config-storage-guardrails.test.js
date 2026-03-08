const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'store', 'config.ts'),
  'utf8'
);

test('mobile config sanitizes malformed stored values before exposing them to screens', () => {
  assert.match(source, /function sanitizeStoredConfig\(cfg: unknown\): AppConfig/);
  assert.match(source, /cfg && typeof cfg === 'object' && !Array\.isArray\(cfg\)/);
  assert.match(source, /typeof candidate\.handsFree === 'boolean' \? candidate\.handsFree : DEFAULTS\.handsFree/);
  assert.match(source, /typeof candidate\.ttsEnabled === 'boolean' \? candidate\.ttsEnabled : DEFAULTS\.ttsEnabled/);
  assert.match(source, /typeof candidate\.messageQueueEnabled === 'boolean'/);
  assert.match(source, /typeof candidate\.ttsRate === 'number' && Number\.isFinite\(candidate\.ttsRate\)/);
  assert.match(source, /typeof candidate\.ttsPitch === 'number' && Number\.isFinite\(candidate\.ttsPitch\)/);
  assert.match(source, /typeof candidate\.baseUrl === 'string' && candidate\.baseUrl\.trim\(\)\.length > 0/);
});

test('mobile config rewrites sanitized data and clears corrupt JSON instead of silently retrying bad storage forever', () => {
  assert.match(source, /if \(JSON\.stringify\(parsed\) !== JSON\.stringify\(sanitized\)\) \{/);
  assert.match(source, /Stored config was invalid or outdated; rewriting sanitized values/);
  assert.match(source, /await AsyncStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(sanitized\)\);/);
  assert.match(source, /Failed to parse stored config; resetting to defaults/);
  assert.match(source, /await AsyncStorage\.removeItem\(STORAGE_KEY\);/);
});

test('mobile config clamps persisted TTS settings to safe ranges used by the UI', () => {
  assert.match(source, /function clampNumber\(value: number, min: number, max: number\): number/);
  assert.match(source, /ttsRate: clampNumber\([\s\S]*0\.1,[\s\S]*10,[\s\S]*\)/);
  assert.match(source, /ttsPitch: clampNumber\([\s\S]*0\.5,[\s\S]*2\.0,[\s\S]*\)/);
});