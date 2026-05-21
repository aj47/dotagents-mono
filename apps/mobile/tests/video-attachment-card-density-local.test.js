const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'VideoAttachmentCard.tsx'),
  'utf8',
);

test('mobile video attachment cards stay compact without shared presentation imports', () => {
  assert.match(source, /const VIDEO_ATTACHMENT_HEIGHT = 180/);
  assert.match(source, /borderRadius: radius\.md/);
  assert.match(source, /backgroundColor: theme\.colors\.card/);
  assert.match(source, /minHeight: 34/);
  assert.match(source, /height: VIDEO_ATTACHMENT_HEIGHT/);
  assert.match(source, /\{loading \? 'Loading\.\.\.' : 'Play'\}/);
  assert.doesNotMatch(source, /@dotagents\/shared\/session-presentation/);
  assert.doesNotMatch(source, /Loads only when you tap play/);
  assert.doesNotMatch(source, /height:\s*220/);
  assert.doesNotMatch(source, /rgba\(255,255,255,0\.04\)|rgba\(0,0,0,0\.03\)/);
});

test('mobile video attachment cards still fetch protected assets through the settings client', () => {
  assert.match(source, /new SettingsApiClient\(assetBaseUrl, authToken\)/);
  assert.match(source, /getConversationVideoAssetResponse\(/);
  assert.match(source, /buildRequestHeaders\(\)/);
  assert.match(source, /File\.downloadFileAsync\(resolvedUri, destination,/);
});
