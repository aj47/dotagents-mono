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
  assert.match(sessionListSource, /const rfHintText = !canStartChat\s*\? CHAT_CONNECTION_SETTINGS_REQUIRED_MESSAGE/);
  assert.match(sessionListSource, /disabled=\{!canStartChat\}/);
  assert.match(sessionListSource, /rfSetTransientStatus\('needsConnection', 4000\)/);
  assert.match(sessionListSource, /Add your API key in Connection settings before using Rapid Fire\./);
});

test('sessions screen turns disconnected chat entry points into setup actions before the user taps a broken flow', () => {
  assert.match(sessionListSource, /const openConnectionSettings = useCallback\(\(\) => \{[\s\S]*?navigation\.navigate\('ConnectionSettings'\);[\s\S]*?\}, \[navigation\]\);/);
  assert.match(sessionListSource, /onPress=\{canStartChat \? handleCreateSession : openConnectionSettings\}/);
  assert.match(sessionListSource, /\{canStartChat \? '\+ New Chat' : 'Open Connection'\}/);
  assert.match(sessionListSource, /showConnectionRequiredEmptyState \? 'Open connection settings' : 'Start first chat'/);
});

test('chat screen blocks sends and queued sends until connection settings are configured', () => {
  assert.match(chatScreenSource, /if \(!hasConfiguredConnection\(config\)\) \{[\s\S]*?setDebugInfo\(`Error: \$\{CHAT_CONNECTION_SETTINGS_REQUIRED_MESSAGE\}`\);[\s\S]*?showConnectionSettingsPrompt\(\);[\s\S]*?return;[\s\S]*?\}/);
  assert.match(chatScreenSource, /messageQueue\.markFailed\(currentConversationId, queuedMsg\.id, CHAT_CONNECTION_SETTINGS_REQUIRED_MESSAGE\)/);
  assert.match(chatScreenSource, /navigation\.navigate\('ConnectionSettings'\)/);
});

test('chat screen shows setup guidance and disables composer controls before disconnected users can lose a draft', () => {
  assert.match(chatScreenSource, /const canComposeChat = hasConfiguredConnection\(config\);/);
  assert.match(chatScreenSource, /\{!canComposeChat && \([\s\S]*?CHAT_CONNECTION_SETTINGS_REQUIRED_MESSAGE[\s\S]*?onPress=\{openConnectionSettings\}[\s\S]*?Open Connection Settings[\s\S]*?\)\}/);
  assert.match(chatScreenSource, /editable=\{canComposeChat\}/);
  assert.match(chatScreenSource, /accessibilityLabel="Attach images"[\s\S]*?disabled=\{!canComposeChat\}/);
  assert.match(chatScreenSource, /disabled=\{!canSubmitComposer\}[\s\S]*?accessibilityLabel=\{createButtonAccessibilityLabel\('Send message'\)\}/);
  assert.match(chatScreenSource, /<Pressable[\s\S]*?disabled=\{!canComposeChat\}[\s\S]*?accessibilityLabel=\{createMicControlAccessibilityLabel\(\)\}/);
});

test('chat screen waits for hydrated sessions, avoids disconnected phantom sessions, and still auto-creates for direct configured /chat visits', () => {
  assert.match(chatScreenSource, /if \(!sessionStore\.ready\) \{\s*return;\s*\}/);
  assert.match(chatScreenSource, /if \(currentSessionId !== null && lastLoadedSessionIdRef\.current === currentSessionId && !shouldAttemptStubLoad\) \{\s*return;\s*\}/);
  assert.match(chatScreenSource, /shouldAutoCreateChatSession\(\{[\s\S]*?canComposeChat,[\s\S]*?currentSessionId,[\s\S]*?deletingSessionCount:\s*sessionStore\.deletingSessionIds\.size,[\s\S]*?\}\)/);
  assert.match(chatScreenSource, /currentSession = sessionStore\.createNewSession\(\);/);
});

test('chat screen disables the header new-chat action while disconnected so it cannot create phantom sessions', () => {
  assert.match(chatScreenSource, /const canStartManualNewChat = shouldAllowManualChatSessionCreation\(\{ canComposeChat \}\);/);
  assert.match(chatScreenSource, /if \(!canStartManualNewChat\) \{\s*return;\s*\}/);
  assert.match(chatScreenSource, /<TouchableOpacity[\s\S]*?onPress=\{handleNewChat\}[\s\S]*?disabled=\{!canStartManualNewChat\}[\s\S]*?accessibilityState=\{\{ disabled: !canStartManualNewChat \}\}/);
});