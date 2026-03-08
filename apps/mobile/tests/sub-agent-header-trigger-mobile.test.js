const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

const sessionListScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

for (const [screenName, source] of [
  ['ChatScreen', chatScreenSource],
  ['SessionListScreen', sessionListScreenSource],
]) {
  test(`${screenName} gives the header agent selector a minimum mobile touch target`, () => {
    assert.match(source, /headerAgentSelectorTouchTarget = createMinimumTouchTargetStyle\([\s\S]*?horizontalMargin: 0[\s\S]*?\)/);
    assert.match(source, /headerAgentSelectorTrigger:\s*\{[\s\S]*?\.\.\.headerAgentSelectorTouchTarget/);
  });

  test(`${screenName} keeps the header agent label legible on narrow screens`, () => {
    assert.match(source, /style=\{styles\.headerAgentSelectorBadge\}/);
    assert.match(source, /style=\{styles\.headerAgentSelectorBadgeText\} numberOfLines=\{1\}/);
    assert.match(source, /maxWidth: 180/);
  });
}