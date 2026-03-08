const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

test('uses touch-friendly connection type chips on mobile', () => {
  assert.match(screenSource, /import \{ createMinimumTouchTargetStyle \} from '\.\.\/lib\/accessibility';/);
  assert.match(screenSource, /const connectionTypeTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize: 44,[\s\S]*?horizontalPadding: spacing\.md,[\s\S]*?verticalPadding: spacing\.xs,[\s\S]*?horizontalMargin: 0,[\s\S]*?\}\);/);
  assert.match(screenSource, /connectionTypeOption:\s*\{[\s\S]*?\.\.\.connectionTypeTouchTarget,[\s\S]*?maxWidth: '100%',[\s\S]*?alignSelf: 'flex-start'/);
});

test('lets connection type labels wrap safely under larger text', () => {
  assert.match(screenSource, /<Text[\s\S]*?styles\.connectionTypeText[\s\S]*?numberOfLines=\{2\}[\s\S]*?\{ct\.label\}[\s\S]*?<\/Text>/);
  assert.match(screenSource, /connectionTypeText:\s*\{[\s\S]*?lineHeight: 18,[\s\S]*?textAlign: 'center',[\s\S]*?flexShrink: 1/);
});

test('keeps switch labels flexible before crowding the toggle control', () => {
  assert.match(screenSource, /<View style=\{styles\.switchTextGroup\}>[\s\S]*?<Text style=\{styles\.switchLabel\}>Enabled<\/Text>/);
  assert.match(screenSource, /<View style=\{styles\.switchTextGroup\}>[\s\S]*?<Text style=\{styles\.switchLabel\}>Auto Spawn<\/Text>[\s\S]*?<Text style=\{styles\.switchHelperText\}>Start agent automatically on app launch<\/Text>/);
  assert.match(screenSource, /switchRow:\s*\{[\s\S]*?alignItems: 'flex-start',[\s\S]*?gap: spacing\.md,[\s\S]*?minWidth: 0,/);
  assert.match(screenSource, /switchTextGroup:\s*\{[\s\S]*?minWidth: 0,[\s\S]*?flex: 1,[\s\S]*?flexShrink: 1,/);
  assert.match(screenSource, /<Switch[\s\S]*?style=\{styles\.switchControl\}/);
  assert.match(screenSource, /switchControl:\s*\{[\s\S]*?flexShrink: 0,[\s\S]*?alignSelf: 'flex-start'/);
});