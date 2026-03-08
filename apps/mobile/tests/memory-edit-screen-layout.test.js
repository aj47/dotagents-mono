const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'MemoryEditScreen.tsx'),
  'utf8'
);

test('uses touch-friendly importance chips on mobile', () => {
  assert.match(screenSource, /import \{ createMinimumTouchTargetStyle \} from '\.\.\/lib\/accessibility';/);
  assert.match(screenSource, /const importanceOptionTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize: 44,[\s\S]*?horizontalPadding: spacing\.md,[\s\S]*?verticalPadding: spacing\.xs,[\s\S]*?horizontalMargin: 0,[\s\S]*?\}\);/);
  assert.match(screenSource, /option:\s*\{[\s\S]*?\.\.\.importanceOptionTouchTarget,[\s\S]*?maxWidth: '100%',[\s\S]*?alignSelf: 'flex-start'/);
});

test('lets importance labels wrap safely under larger text', () => {
  assert.match(screenSource, /<Text[\s\S]*?styles\.optionText[\s\S]*?numberOfLines=\{2\}[\s\S]*?\{option\.label\}[\s\S]*?<\/Text>/);
  assert.match(screenSource, /optionText:\s*\{[\s\S]*?lineHeight: 18,[\s\S]*?textAlign: 'center',[\s\S]*?flexShrink: 1/);
});

test('surfaces helper and error states as bordered cards instead of bare inline text', () => {
  assert.match(screenSource, /\{error && \([\s\S]*?<View style=\{styles\.errorContainer\}>[\s\S]*?<Text style=\{styles\.errorText\}>⚠️ \{error\}<\/Text>[\s\S]*?<\/View>[\s\S]*?\)\}/);
  assert.match(screenSource, /\{!settingsClient && \([\s\S]*?<View style=\{styles\.helperContainer\}>[\s\S]*?<Text style=\{styles\.helperText\}>Configure Base URL and API key in Settings to save changes\.<\/Text>[\s\S]*?<\/View>[\s\S]*?\)\}/);
  assert.match(screenSource, /errorContainer:\s*\{[\s\S]*?borderWidth: 1,[\s\S]*?borderColor: theme\.colors\.destructive \+ '33',[\s\S]*?marginBottom: spacing\.md,/);
  assert.match(screenSource, /helperContainer:\s*\{[\s\S]*?backgroundColor: theme\.colors\.card,[\s\S]*?borderWidth: 1,[\s\S]*?borderColor: theme\.colors\.border,[\s\S]*?marginBottom: spacing\.md,/);
});