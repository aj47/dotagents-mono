const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

test('lets the session list action bar wrap safely under narrow widths and larger text', () => {
  assert.match(screenSource, /<View style=\{styles\.headerActions\}>[\s\S]*?\{sessionStore\.isSyncing &&/);
  assert.match(screenSource, /header:\s*\{[\s\S]*?flexWrap: 'wrap',[\s\S]*?alignItems: 'flex-start',[\s\S]*?gap: spacing\.sm,/);
  assert.match(screenSource, /headerActions:\s*\{[\s\S]*?flexWrap: 'wrap',[\s\S]*?justifyContent: 'flex-end',[\s\S]*?maxWidth: '100%',[\s\S]*?flexShrink: 1,/);
});

test('keeps session card title rows flexible before crowding timestamps', () => {
  assert.match(screenSource, /<View style=\{styles\.sessionHeader\}>[\s\S]*?<View style=\{styles\.sessionTitleRow\}>/);
  assert.match(screenSource, /sessionHeader:\s*\{[\s\S]*?flexWrap: 'wrap',[\s\S]*?alignItems: 'flex-start',[\s\S]*?minWidth: 0,/);
  assert.match(screenSource, /sessionTitleRow:\s*\{[\s\S]*?flex: 1,[\s\S]*?minWidth: 0,[\s\S]*?gap: spacing\.xs,/);
  assert.match(screenSource, /sessionDate:\s*\{[\s\S]*?alignSelf: 'flex-start',[\s\S]*?flexShrink: 0,/);
});

test('keeps stub-session affordances aligned without forcing extra title margin hacks', () => {
  assert.match(screenSource, /\{isStub && \([\s\S]*?<Text style=\{styles\.sessionStubIndicator\}>💻<\/Text>[\s\S]*?\)\}/);
  assert.match(screenSource, /sessionStubIndicator:\s*\{[\s\S]*?fontSize: 12,[\s\S]*?marginTop: 2,/);
  assert.doesNotMatch(screenSource, /sessionTitle:\s*\{[\s\S]*?marginRight: 8,/);
});