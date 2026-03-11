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
  assert.match(screenSource, /const trimmedPreview = item\.preview\?\.trim\(\) \?\? '';/);
  assert.match(screenSource, /const sessionPreview = trimmedPreview\.length > 0[\s\S]*?item\.messageCount === 0[\s\S]*?'No messages yet'[\s\S]*?: null;/);
  assert.match(screenSource, /\{sessionPreview \? \([\s\S]*?<Text style=\{styles\.sessionPreview\} numberOfLines=\{1\}>[\s\S]*?\{sessionPreview\}[\s\S]*?<\/Text>[\s\S]*?\) : null\}/);
  assert.match(screenSource, /sessionItem:\s*\{[\s\S]*?paddingHorizontal:\s*spacing\.md,[\s\S]*?paddingVertical:\s*spacing\.sm \+ 2,[\s\S]*?marginBottom:\s*spacing\.sm - 2,/);
  assert.match(screenSource, /sessionHeader:\s*\{[\s\S]*?marginBottom:\s*spacing\.xs,/);
  assert.match(screenSource, /sessionPreview:\s*\{[\s\S]*?marginBottom:\s*2,/);
});

test('demotes Clear all into a secondary chats-header cluster with count context', () => {
  assert.match(screenSource, /const sessionCountLabel = `\$\{sessions\.length\} chat\$\{sessions\.length !== 1 \? 's' : ''\}`;/);
  assert.match(screenSource, /<View style=\{styles\.headerSecondaryActions\}>[\s\S]*?<Text style=\{styles\.sessionCountText\}>\{sessionCountLabel\}<\/Text>[\s\S]*?<Text style=\{styles\.clearButtonText\}>Clear all<\/Text>/);
  assert.match(screenSource, /headerSecondaryActions:\s*\{[\s\S]*?flexShrink:\s*1,[\s\S]*?marginLeft:\s*spacing\.sm,/);
  assert.match(screenSource, /clearButtonTouchTarget:\s*\{[\s\S]*?createMinimumTouchTargetStyle\([\s\S]*?horizontalPadding:\s*spacing\.sm,[\s\S]*?verticalPadding:\s*spacing\.xs,/);
});