const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'LoopEditScreen.tsx'),
  'utf8'
);

test('preserves an existing loop interval when hidden interval text is invalid while editing', () => {
  assert.match(screenSource, /const DEFAULT_INTERVAL_MINUTES = 60;/);
  assert.match(screenSource, /existingLoopIntervalMinutes, setExistingLoopIntervalMinutes/);
  assert.match(screenSource, /setExistingLoopIntervalMinutes\(loop\.intervalMinutes\);/);
  assert.match(
    screenSource,
    /const savedIntervalMinutes = hasValidInterval\s*\? intervalMinutes\s*: isEditing && existingLoopIntervalMinutes !== null\s*\? existingLoopIntervalMinutes\s*: DEFAULT_INTERVAL_MINUTES;/
  );
  assert.doesNotMatch(screenSource, /const savedIntervalMinutes = hasValidInterval \? intervalMinutes : 60;/);
});
