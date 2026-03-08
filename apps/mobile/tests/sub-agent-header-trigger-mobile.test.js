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
    assert.match(source, /style=\{styles\.headerAgentSelectorBadgeText\} numberOfLines=\{1\} ellipsizeMode="tail"/);
    assert.match(source, /headerAgentSelectorBadgeText:\s*\{[\s\S]*?flexShrink: 1/);
    assert.match(source, /maxWidth: 180/);
  });

  test(`${screenName} only makes the header agent control interactive when switchable options exist`, () => {
    assert.match(source, /const \[hasAgentSelectorOptions, setHasAgentSelectorOptions\] = useState\(false\);/);
    assert.match(source, /hasAgentSelectorOptions \? \(/);
    assert.match(source, /accessibilityLabel=\{`Current agent: \$\{currentAgentLabel\}\. Tap to change\.`\}/);
    assert.match(source, /accessibilityLabel=\{`Current agent: \$\{currentAgentLabel\}\. No switchable agents are available right now\.`\}/);
    assert.match(source, /\{currentAgentLabel\}/);
    assert.match(source, /style=\{styles\.headerAgentSelectorBadgeChevron\}[\s\S]*?>\s*▼\s*<\/Text>/);
    assert.doesNotMatch(source, /\{`\$\{currentAgentLabel\} ▼`\}/);
  });

  test(`${screenName} styles the no-options header badge as passive status instead of an active selector`, () => {
    assert.match(source, /style=\{\[styles\.headerAgentSelectorBadge, styles\.headerAgentSelectorBadgeStatic\]\}/);
    assert.match(source, /style=\{\[styles\.headerAgentSelectorBadgeText, styles\.headerAgentSelectorBadgeTextStatic\]\}[\s\S]*?numberOfLines=\{1\}[\s\S]*?ellipsizeMode="tail"/);
    assert.match(source, /headerAgentSelectorBadgeStatic:\s*\{[\s\S]*?backgroundColor: theme\.colors\.muted/);
    assert.match(source, /headerAgentSelectorBadgeTextStatic:\s*\{[\s\S]*?color: theme\.colors\.mutedForeground/);
  });

  test(`${screenName} refreshes header selector availability when the screen regains focus`, () => {
    assert.match(source, /navigation\?\.addListener\?\.\('focus', \(\) => \{[\s\S]*?void refreshAgentSelectorAvailability\(\);/);
  });
}

test('Chat and Chats headers use the same fallback agent label when switching is unavailable', () => {
  assert.match(chatScreenSource, /const currentAgentLabel = currentProfile\?\.name \|\| 'Default Agent';/);
  assert.match(sessionListScreenSource, /const currentAgentLabel = currentProfile\?\.name \|\| 'Default Agent';/);
});
