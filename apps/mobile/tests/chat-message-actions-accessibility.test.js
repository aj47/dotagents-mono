const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('keeps collapsed message disclosure affordances inside a touch-friendly pressable row', () => {
  assert.match(screenSource, /const hasToolExecutionSummary = toolCallCount > 0 \|\| toolResultCount > 0;/);
  assert.match(screenSource, /shouldCollapse && \(!hasToolExecutionSummary \|\| isExpanded\) && \(/);
  assert.match(screenSource, /!isExpanded && !hasToolExecutionSummary && m\.content \? \([\s\S]*?<Text style=\{styles\.collapsedMessagePreview\} numberOfLines=\{1\}>/);
  assert.match(screenSource, /messageHeader:\s*\{[\s\S]*?\.\.\.messageActionTouchTarget/);
  assert.match(screenSource, /collapsedMessagePreview:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,/);
});

test('keeps message-level tool and read-aloud actions at a mobile-friendly minimum touch target', () => {
  assert.match(screenSource, /const messageActionTouchTarget = createMinimumTouchTargetStyle\([\s\S]*?horizontalMargin: 0[\s\S]*?\);/);
  assert.match(screenSource, /toolCallCompactRow:\s*\{[\s\S]*?\.\.\.messageActionTouchTarget/);
  assert.match(screenSource, /toolCallHeader:\s*\{[\s\S]*?\.\.\.messageActionTouchTarget/);
  assert.match(screenSource, /speakButton:\s*\{[\s\S]*?\.\.\.messageActionTouchTarget/);
});