const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const agentEditSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

const loopEditSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'LoopEditScreen.tsx'),
  'utf8'
);

test('AgentEditScreen makes connection-type chips mobile-sized buttons with selected-state semantics', () => {
  assert.match(agentEditSource, /createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\)/);
  assert.match(agentEditSource, /connectionTypeOption:\s*\{[\s\S]*?\.\.\.selectionChipTouchTarget/);
  assert.match(agentEditSource, /accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(`Use \$\{ct\.label\} connection type`\)/);
  assert.match(agentEditSource, /accessibilityState=\{\{ selected: formData\.connectionType === ct\.value, disabled: isBuiltInAgent \}\}/);
});

test('LoopEditScreen makes profile chips mobile-sized buttons with selected-state semantics', () => {
  assert.match(loopEditSource, /createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\)/);
  assert.match(loopEditSource, /profileOption:\s*\{[\s\S]*?\.\.\.selectionChipTouchTarget/);
  assert.match(loopEditSource, /createButtonAccessibilityLabel\('Select no profile'\)/);
  assert.match(loopEditSource, /createButtonAccessibilityLabel\(`Use \$\{profile\.displayName\} profile`\)/);
  assert.match(loopEditSource, /accessibilityState=\{\{ selected: !formData\.profileId \}\}/);
  assert.match(loopEditSource, /accessibilityState=\{\{ selected: formData\.profileId === profile\.id \}\}/);
});

test('AgentEditScreen wraps edit-flow switches in named mobile-sized controls', () => {
  assert.match(agentEditSource, /const switchTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\)/);
  assert.match(agentEditSource, /Platform\.OS === 'web'[\s\S]*?styles\.switchTrack/);
  assert.match(agentEditSource, /<Switch[\s\S]*?accessible=\{false\}[\s\S]*?value=\{enabled\}/);
  assert.match(agentEditSource, /style=\{styles\.switchButton\}[\s\S]*?createSwitchAccessibilityLabel\('Agent enabled'\)/);
  assert.match(agentEditSource, /createSwitchAccessibilityLabel\('Auto spawn'\)/);
  assert.match(agentEditSource, /accessibilityState=\{\{ checked: formData\.enabled \}\}/);
  assert.match(agentEditSource, /accessibilityState=\{\{ checked: formData\.autoSpawn \}\}/);
});

test('LoopEditScreen wraps the enabled switch in a named mobile-sized control', () => {
  assert.match(loopEditSource, /const switchTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\)/);
  assert.match(loopEditSource, /Platform\.OS === 'web'[\s\S]*?styles\.switchTrack/);
  assert.match(loopEditSource, /<Switch[\s\S]*?accessible=\{false\}[\s\S]*?value=\{enabled\}/);
  assert.match(loopEditSource, /style=\{styles\.switchButton\}[\s\S]*?createSwitchAccessibilityLabel\('Loop enabled'\)/);
  assert.match(loopEditSource, /accessibilityState=\{\{ checked: formData\.enabled \}\}/);
});
