const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

test('avoids redundant desktop emoji chrome in stub session rows', () => {
  assert.doesNotMatch(screenSource, /💻/);
  assert.match(screenSource, /\{isStub \? ' · from desktop' : ''\}/);
});

test('keeps the session title row shrinkable for narrow mobile widths', () => {
  assert.match(screenSource, /sessionTitleRow:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,[\s\S]*?marginRight:\s*8,/);
  assert.match(screenSource, /sessionTitle:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,/);
});

test('keeps session rows compact by clamping previews and trimming vertical chrome', () => {
  assert.match(screenSource, /<Text style=\{styles\.sessionPreview\} numberOfLines=\{1\}>/);
  assert.match(screenSource, /sessionItem:\s*\{[\s\S]*?paddingHorizontal:\s*spacing\.md,[\s\S]*?paddingVertical:\s*spacing\.sm \+ 2,[\s\S]*?marginBottom:\s*spacing\.sm - 2,/);
  assert.match(screenSource, /sessionHeader:\s*\{[\s\S]*?marginBottom:\s*spacing\.xs,/);
  assert.match(screenSource, /sessionPreview:\s*\{[\s\S]*?marginBottom:\s*2,/);
});