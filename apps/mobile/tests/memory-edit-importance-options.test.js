const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'MemoryEditScreen.tsx'),
  'utf8'
);

test('explains how memory importance affects retrieval priority', () => {
  assert.match(screenSource, /Higher-priority memories are surfaced first when the agent loads context\./);
  assert.match(screenSource, /Background context the agent can use when space allows\./);
  assert.match(screenSource, /Must-not-miss context that should stay at the front of retrieval\./);
});

test('exposes MemoryEdit importance choices as selected-state buttons', () => {
  assert.match(screenSource, /accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(`Set memory importance to \$\{option\.label\}`\)/);
  assert.match(screenSource, /accessibilityState=\{\{ selected: isSelected, disabled: isFormDisabled \}\}/);
  assert.match(screenSource, /\{isSelected && <Text style=\{styles\.importanceOptionCheckmark\}>✓<\/Text>\}/);
});

test('keeps MemoryEdit importance options full-width and touch-friendly for narrow screens', () => {
  assert.match(screenSource, /importanceOptions:\s*\{[\s\S]*?width:\s*'100%' as const,[\s\S]*?gap:\s*spacing\.xs/);
  assert.match(screenSource, /importanceOption:\s*\{[\s\S]*?createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\),[\s\S]*?width:\s*'100%' as const,[\s\S]*?justifyContent:\s*'space-between',/);
  assert.match(screenSource, /importanceOptionInfo:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0\s*\}/);
});