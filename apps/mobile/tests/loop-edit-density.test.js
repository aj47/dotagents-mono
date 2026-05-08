const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'LoopEditScreen.tsx'),
  'utf8'
);

test('keeps mobile loop edit errors text-first without decorative warning emoji', () => {
  assert.doesNotMatch(screenSource, /⚠️/);
  assert.match(screenSource, /\{error && <Text style=\{styles\.errorText\}>\{error\}<\/Text>\}/);
});

test('preserves the inline settings helper when loop editing is unavailable', () => {
  assert.match(
    screenSource,
    /Configure Base URL and API key in Settings to save changes\./
  );
});

test('uses shared repeat task schedule draft edit helpers', () => {
  assert.match(screenSource, /updateRepeatTaskScheduleTimeAt\(formData\.scheduleTimes, idx, v\)/);
  assert.match(screenSource, /removeRepeatTaskScheduleTimeAt\(formData\.scheduleTimes, idx\)/);
  assert.match(screenSource, /addRepeatTaskScheduleTime\(formData\.scheduleTimes\)/);
  assert.match(
    screenSource,
    /toggleRepeatTaskScheduleDayOfWeek\(formData\.scheduleDaysOfWeek, dayIdx\)/,
  );
  assert.doesNotMatch(screenSource, /const next = \[\.\.\.formData\.scheduleTimes\]/);
  assert.doesNotMatch(screenSource, /formData\.scheduleTimes\.filter\(\(_, i\) => i !== idx\)/);
  assert.doesNotMatch(screenSource, /formData\.scheduleDaysOfWeek\.filter\(d => d !== dayIdx\)/);
});
