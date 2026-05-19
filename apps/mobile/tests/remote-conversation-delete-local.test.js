const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sessionListSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

const mobileClientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8'
);

const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8'
);

test('deletes linked desktop conversations before removing local mobile chat rows', () => {
  assert.match(sessionListSource, /serverConversationId = sessionStore\.sessions\.find/);
  assert.match(sessionListSource, /settingsClient && serverConversationId/);
  assert.match(sessionListSource, /await settingsClient\.deleteConversation\(serverConversationId\)/);
  assert.match(sessionListSource, /await sessionStore\.deleteSession\(session\.id\)/);
  assert.match(mobileClientSource, /async deleteConversation\(id: string\)/);
  assert.match(remoteServerSource, /fastify\.delete\("\/v1\/conversations\/:id"/);
});

test('clear all chats also clears linked desktop conversations when available', () => {
  assert.match(settingsSource, /hasDesktopConversations && settingsClient/);
  assert.match(settingsSource, /await settingsClient\.deleteAllConversations\(\)/);
  assert.match(settingsSource, /connected desktop server/);
  assert.match(mobileClientSource, /async deleteAllConversations\(\)/);
  assert.match(remoteServerSource, /fastify\.delete\("\/v1\/conversations"/);
});

test('settings agent list keeps avatars and default-first ordering without shared presentation modules', () => {
  assert.match(settingsSource, /sortAgentProfilesForSettings/);
  assert.match(settingsSource, /const sortedAgentProfiles = useMemo/);
  assert.match(settingsSource, /sortedAgentProfiles\.map\(\(profile\) =>/);
  assert.match(settingsSource, /profile\.avatarDataUrl/);
  assert.match(settingsSource, /agentListAvatar/);
  assert.match(settingsSource, /getAgentListInitial\(profile\)/);
  assert.doesNotMatch(settingsSource, /@dotagents\/shared\/app-shell/);
  assert.doesNotMatch(settingsSource, /sortAgentProfilesWithDefaultFirst/);
});
