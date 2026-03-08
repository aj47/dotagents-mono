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