const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'LoopEditScreen.tsx'),
  'utf8'
);

test('preserves an existing loop interval when hidden interval text is invalid while editing', () => {
  assert.match(screenSource, /DEFAULT_REPEAT_TASK_INTERVAL_MINUTES/);
  assert.match(screenSource, /existingLoopIntervalMinutes, setExistingLoopIntervalMinutes/);
  assert.match(screenSource, /setExistingLoopIntervalMinutes\(loop\.intervalMinutes\);/);
  assert.match(
    screenSource,
    /resolveRepeatTaskIntervalMinutesDraft\(formData\.intervalMinutes, \{[\s\S]*?existingIntervalMinutes: isEditing \? existingLoopIntervalMinutes : null,[\s\S]*?fallbackIntervalMinutes: DEFAULT_REPEAT_TASK_INTERVAL_MINUTES,[\s\S]*?\}\)/
  );
  assert.match(screenSource, /intervalMinutes: intervalResolution\.intervalMinutes/);
  assert.doesNotMatch(screenSource, /const savedIntervalMinutes = hasValidInterval \? intervalMinutes : 60;/);
});
