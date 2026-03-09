const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'LoopEditScreen.tsx'),
  'utf8'
);

test('explains the default-agent fallback in LoopEdit profile selection', () => {
  assert.match(screenSource, /Choose a dedicated agent for this loop, or leave it on the default agent\./);
  assert.match(screenSource, /No dedicated agent/);
  assert.match(screenSource, /Uses the default active agent when this loop runs\./);
  assert.match(screenSource, /No saved agent profiles yet\. This loop will use the default agent until you create one\./);
});

test('exposes LoopEdit profile choices as selected-state buttons', () => {
  assert.match(screenSource, /accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\('Use the default agent for this loop'\)/);
  assert.match(screenSource, /accessibilityState=\{\{ selected: !formData\.profileId, disabled: isSaveDisabled \}\}/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(`Use \$\{profile\.displayName \|\| profile\.name\} for this loop`\)/);
  assert.match(screenSource, /accessibilityState=\{\{ selected: formData\.profileId === profile\.id, disabled: isSaveDisabled \}\}/);
});

test('keeps LoopEdit profile options full-width and touch-friendly for narrow screens', () => {
  assert.match(screenSource, /profileOptions:\s*\{[\s\S]*?width:\s*'100%' as const,[\s\S]*?gap:\s*spacing\.xs/);
  assert.match(screenSource, /profileOption:\s*\{[\s\S]*?createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\),[\s\S]*?width:\s*'100%' as const,[\s\S]*?justifyContent:\s*'space-between',/);
  assert.match(screenSource, /profileOptionInfo:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0\s*\}/);
});