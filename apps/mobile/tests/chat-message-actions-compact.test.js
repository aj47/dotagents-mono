const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8',
);

test('keeps copy and branch controls compact and inline with chat messages', () => {
  assert.match(screenSource, /const shouldShowInlineMessageActions =[\s\S]*?\(shouldShowExpandedContent \|\| shouldShowCollapsedTextPreview\);/);
  assert.match(screenSource, /<View style=\{styles\.messageContentRow\}>[\s\S]*?<View style=\{styles\.messageContentBody\}>[\s\S]*?<MarkdownRenderer/);
  assert.match(screenSource, /const turnDurationBadge = turnDurationText \? \(/);
  assert.match(screenSource, /<View style=\{styles\.messageInlineActions\}>[\s\S]*?\{turnDurationBadge\}[\s\S]*?\{messageActionControls\}[\s\S]*?<\/View>/);
  assert.match(screenSource, /hitSlop=\{8\}/);
  assert.match(screenSource, /name="git-branch-outline"/);
  assert.match(screenSource, /const turnDurationText = turnDuration[\s\S]*?formatTurnDuration\(turnDuration\.durationMs\)/);
  assert.match(screenSource, /`Agent time \$\{turnDurationText\}\$\{turnDuration\?\.isLive \? ' live' : ''\}`/);
  assert.doesNotMatch(screenSource, /\{turnDurationLabel\}/);
  assert.doesNotMatch(screenSource, /\{copiedMessageIndex === i \? 'Copied' : 'Copy'\}/);
  assert.doesNotMatch(screenSource, /\{branchingMessageIndex === i \? 'Branching\.\.\.' : 'Branch'\}/);
});
