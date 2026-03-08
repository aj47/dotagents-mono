const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('tracks loop fetch failures separately from the empty state', () => {
  assert.match(settingsSource, /const \[loopsError, setLoopsError\] = useState<string \| null>\(null\);/);
  assert.match(settingsSource, /setIsLoadingLoops\(true\);\s*setLoopsError\(null\);\s*try \{/);
  assert.match(settingsSource, /catch \(error: any\) \{[\s\S]*?setLoopsError\(error\.message \|\| 'Failed to load agent loops'\);/);
});

test('shows inline retry feedback for loop loading and refresh states', () => {
  assert.match(settingsSource, /isLoadingLoops && loops\.length === 0 \? \([\s\S]*?Loading agent loops\.\.\./);
  assert.match(settingsSource, /loopsError && \([\s\S]*?Retry loading agent loops[\s\S]*?Retry loading/);
  assert.match(settingsSource, /isLoadingLoops && loops\.length > 0 && \([\s\S]*?Refreshing agent loops\.\.\./);
  assert.match(settingsSource, /loops\.length === 0 && !loopsError \? \([\s\S]*?No agent loops configured/);
});