const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rendererSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'MarkdownRenderer.tsx'),
  'utf8',
);

test('markdown renderer loads conversation image assets through authenticated remote API', () => {
  assert.match(rendererSource, /parseConversationImageAssetUrl/);
  assert.match(rendererSource, /isAllowedMarkdownImageUrl/);
  assert.match(rendererSource, /getConversationImageAssetResponse\(assetRef\.conversationId, assetRef\.fileName\)/);
  assert.match(rendererSource, /buildConversationImageAssetHttpUrl\(assetBaseUrl, sourceUrl\)/);
  assert.match(rendererSource, /await client\.buildRequestHeaders\(\)/);
  assert.match(rendererSource, /rules=\{markdownRules\}/);
  assert.match(rendererSource, /<ThinkSection[\s\S]*?markdownRules=\{markdownRules\}/);
});
