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

  test(`${screenName} only makes the header agent control interactive when switchable options exist`, () => {
    assert.match(source, /const \[hasAgentSelectorOptions, setHasAgentSelectorOptions\] = useState\(false\);/);
    assert.match(source, /hasAgentSelectorOptions \? \(/);
    assert.match(source, /accessibilityLabel=\{`Current agent: \$\{currentAgentLabel\}\. Tap to change\.`\}/);
    assert.match(source, /accessibilityLabel=\{`Current agent: \$\{currentAgentLabel\}\. No switchable agents are available right now\.`\}/);
    assert.match(source, /\{`\$\{currentAgentLabel\} ▼`\}/);
  });

  test(`${screenName} refreshes header selector availability when the screen regains focus`, () => {
    assert.match(source, /navigation\?\.addListener\?\.\('focus', \(\) => \{[\s\S]*?void refreshAgentSelectorAvailability\(\);/);
  });
}
