const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'MarkdownRenderer.tsx'),
  'utf8'
);

test('mobile markdown renderer handles authenticated image assets locally', () => {
  assert.match(source, /CONVERSATION_IMAGE_ASSET_REGEX/);
  assert.match(source, /assets:\\\/\\\/conversation-image/);
  assert.match(source, /assets\/images/);
  assert.match(source, /Authorization: `Bearer \$\{authToken\}`/);
  assert.match(source, /URL\.createObjectURL\(await response\.blob\(\)\)/);
  assert.match(source, /resizeMode="contain"/);
});

test('mobile markdown renderer keeps code block copy affordances local', () => {
  assert.match(source, /import \* as Clipboard from 'expo-clipboard'/);
  assert.match(source, /const MarkdownCodeBlock/);
  assert.match(source, /Clipboard\.setStringAsync\(codeContent\)/);
  assert.match(source, /accessibilityLabel=\{copied \? 'Code copied' : 'Copy code'\}/);
  assert.match(source, /name=\{copied \? 'checkmark' : 'copy-outline'\}/);
});
