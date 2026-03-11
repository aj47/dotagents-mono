const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sessionListSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('sessions screen redirects new chats and pending stub resumes to connection settings when unconfigured', () => {
  assert.match(sessionListSource, /const canStartChat = hasConfiguredConnection\(config\);/);
  assert.match(sessionListSource, /if \(!canStartChat\) \{[\s\S]*?showConnectionSettingsPrompt\(\);[\s\S]*?return;[\s\S]*?\}/);
  assert.match(sessionListSource, /if \(pendingUserOnlyText\) \{[\s\S]*?if \(!canStartChat\) \{[\s\S]*?showConnectionSettingsPrompt\(\);[\s\S]*?return;[\s\S]*?\}/);
});

test('sessions rapid fire explains missing connection setup instead of silently failing', () => {
  assert.match(sessionListSource, /rfSetTransientStatus\('needsConnection', 4000\)/);
  assert.match(sessionListSource, /Add your API key in Connection settings before using Rapid Fire\./);
});

test('chat screen blocks sends and queued sends until connection settings are configured', () => {
  assert.match(chatScreenSource, /if \(!hasConfiguredConnection\(config\)\) \{[\s\S]*?setDebugInfo\(`Error: \$\{CHAT_CONNECTION_SETTINGS_REQUIRED_MESSAGE\}`\);[\s\S]*?showConnectionSettingsPrompt\(\);[\s\S]*?return;[\s\S]*?\}/);
  assert.match(chatScreenSource, /messageQueue\.markFailed\(currentConversationId, queuedMsg\.id, CHAT_CONNECTION_SETTINGS_REQUIRED_MESSAGE\)/);
  assert.match(chatScreenSource, /navigation\.navigate\('ConnectionSettings'\)/);
});