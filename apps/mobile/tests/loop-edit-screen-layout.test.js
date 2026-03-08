const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const loopEditSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'LoopEditScreen.tsx'),
  'utf8'
);

test('keeps loop profile chips width-safe and touch-friendly on mobile', () => {
  assert.match(loopEditSource, /import \{ createMinimumTouchTargetStyle \} from '\.\.\/lib\/accessibility';/);
  assert.match(loopEditSource, /const profileOptionTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?horizontalPadding: spacing\.md,[\s\S]*?verticalPadding: spacing\.xs,[\s\S]*?horizontalMargin: 0,[\s\S]*?\}\);/);
  assert.match(loopEditSource, /profileOption:\s*\{[\s\S]*?\.\.\.profileOptionTouchTarget,[\s\S]*?maxWidth: '100%',[\s\S]*?alignSelf: 'flex-start'/);
});

test('allows long loop profile names to wrap without pushing chips out of bounds', () => {
  assert.match(loopEditSource, /<Text[\s\S]*?styles\.profileOptionText[\s\S]*?numberOfLines=\{2\}[\s\S]*?\{profile\.displayName\}[\s\S]*?<\/Text>/);
  assert.match(loopEditSource, /profileOptionText:\s*\{[\s\S]*?lineHeight: 18,[\s\S]*?textAlign: 'center',[\s\S]*?flexShrink: 1/);
});

test('surfaces disconnected and error states as bordered cards instead of bare inline text', () => {
  assert.match(loopEditSource, /\{error && \([\s\S]*?<View style=\{styles\.errorContainer\}>[\s\S]*?<Text style=\{styles\.errorText\}>⚠️ \{error\}<\/Text>[\s\S]*?<\/View>[\s\S]*?\)\}/);
  assert.match(loopEditSource, /\{!settingsClient && \([\s\S]*?<View style=\{styles\.helperContainer\}>[\s\S]*?<Text style=\{styles\.helperText\}>Configure Base URL and API key in Settings to save changes\.<\/Text>[\s\S]*?<\/View>[\s\S]*?\)\}/);
  assert.match(loopEditSource, /errorContainer:\s*\{[\s\S]*?borderWidth: 1,[\s\S]*?borderColor: theme\.colors\.destructive \+ '33',[\s\S]*?marginBottom: spacing\.md,/);
  assert.match(loopEditSource, /helperContainer:\s*\{[\s\S]*?backgroundColor: theme\.colors\.card,[\s\S]*?borderWidth: 1,[\s\S]*?borderColor: theme\.colors\.border,[\s\S]*?marginBottom: spacing\.md,/);
});

test('keeps the enabled switch row flexible before crowding the toggle control', () => {
  assert.match(loopEditSource, /<View style=\{styles\.switchTextGroup\}>[\s\S]*?<Text style=\{styles\.switchLabel\}>Enabled<\/Text>/);
  assert.match(loopEditSource, /switchRow:\s*\{[\s\S]*?alignItems: 'flex-start',[\s\S]*?gap: spacing\.md,[\s\S]*?minWidth: 0,/);
  assert.match(loopEditSource, /switchTextGroup:\s*\{[\s\S]*?minWidth: 0,[\s\S]*?flex: 1,[\s\S]*?flexShrink: 1,/);
  assert.match(loopEditSource, /<Switch[\s\S]*?style=\{styles\.switchControl\}/);
  assert.match(loopEditSource, /switchControl:\s*\{[\s\S]*?flexShrink: 0,[\s\S]*?alignSelf: 'flex-start'/);
});