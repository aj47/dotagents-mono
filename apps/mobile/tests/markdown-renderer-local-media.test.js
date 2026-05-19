const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'MarkdownRenderer.tsx'),
  'utf8'
);
const videoAttachmentSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'VideoAttachmentCard.tsx'),
  'utf8'
);
const settingsApiSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8'
);
const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8'
);

test('mobile markdown renderer handles authenticated image assets locally', () => {
  assert.match(source, /CONVERSATION_IMAGE_ASSET_REGEX/);
  assert.match(source, /assets:\\\/\\\/conversation-image/);
  assert.match(source, /assets\/images/);
  assert.match(source, /new SettingsApiClient\(assetBaseUrl, authToken\)/);
  assert.match(source, /client\.getConversationImageAssetResponse\(assetRef\.conversationId, assetRef\.fileName\)/);
  assert.match(source, /client\.buildRequestHeaders\(\)/);
  assert.match(source, /URL\.createObjectURL\(await response\.blob\(\)\)/);
  assert.match(source, /resizeMode="contain"/);
  assert.match(settingsApiSource, /async buildRequestHeaders/);
  assert.match(settingsApiSource, /getConversationImageAssetResponse\(conversationId: string, fileName: string\)/);
  assert.match(remoteServerSource, /\/v1\/conversations\/:id\/assets\/images\/:fileName/);
  assert.match(remoteServerSource, /getConversationImageAssetPath\(conversationId, fileName\)/);
});

test('mobile markdown renderer keeps code block copy affordances local', () => {
  assert.match(source, /import \* as Clipboard from 'expo-clipboard'/);
  assert.match(source, /const MarkdownCodeBlock/);
  assert.match(source, /Clipboard\.setStringAsync\(codeContent\)/);
  assert.match(source, /accessibilityLabel=\{copied \? 'Code copied' : 'Copy code'\}/);
  assert.match(source, /name=\{copied \? 'checkmark' : 'copy-outline'\}/);
});

test('mobile video attachment cards fetch protected conversation assets through the settings client', () => {
  assert.match(videoAttachmentSource, /parseConversationVideoAssetUrl/);
  assert.match(videoAttachmentSource, /new SettingsApiClient\(assetBaseUrl, authToken\)/);
  assert.match(videoAttachmentSource, /assetApiClient\.getConversationVideoAssetResponse/);
  assert.match(videoAttachmentSource, /assetApiClient\.buildRequestHeaders\(\)/);
  assert.match(settingsApiSource, /getConversationVideoAssetResponse\(conversationId: string, fileName: string\)/);
});
