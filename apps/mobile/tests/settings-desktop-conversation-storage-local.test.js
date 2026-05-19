const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8',
);
const apiTypesSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'api-types.ts'),
  'utf8',
);
const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8',
);

test('mobile settings restores desktop conversation storage controls locally', () => {
  assert.match(settingsSource, /Desktop History/);
  assert.match(settingsSource, /Auto-Save Desktop Chats/);
  assert.match(settingsSource, /Keep Recent Chats/);
  assert.match(settingsSource, /handleRemoteSettingToggle\('conversationsEnabled', v\)/);
  assert.match(settingsSource, /handleRemoteSettingToggle\('autoSaveConversations', v\)/);
  assert.match(settingsSource, /parseMaxConversationsToKeepDraft/);
  assert.match(settingsSource, /handleRemoteSettingUpdate\('maxConversationsToKeep', parsedValue\)/);
});

test('desktop remote settings exposes conversation storage fields without shared route registry', () => {
  assert.match(apiTypesSource, /conversationsEnabled\?: boolean/);
  assert.match(apiTypesSource, /maxConversationsToKeep\?: number/);
  assert.match(apiTypesSource, /autoSaveConversations\?: boolean/);
  assert.match(remoteServerSource, /conversationsEnabled: cfg\.conversationsEnabled \?\? true/);
  assert.match(remoteServerSource, /maxConversationsToKeep: cfg\.maxConversationsToKeep \?\? 1000/);
  assert.match(remoteServerSource, /autoSaveConversations: cfg\.autoSaveConversations \?\? true/);
  assert.match(remoteServerSource, /updates\.maxConversationsToKeep = Math\.floor\(body\.maxConversationsToKeep\)/);
  assert.doesNotMatch(remoteServerSource, /registerDesktopRemoteServerRoutes/);
});
