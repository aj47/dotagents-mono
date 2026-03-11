const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

test('gives the empty session state an in-place primary action', () => {
  assert.match(screenSource, /showConnectionRequiredEmptyState \? 'Connection required' : 'No chats yet'/);
  assert.match(screenSource, /Start your first chat so recent conversations show up here\./);
  assert.match(screenSource, /onPress=\{showConnectionRequiredEmptyState \? openConnectionSettings : handleCreateSession\}[\s\S]*?createButtonAccessibilityLabel\(showConnectionRequiredEmptyState \? 'Open connection settings' : 'Start first chat'\)/);
  assert.match(screenSource, /accessibilityHint=\{showConnectionRequiredEmptyState[\s\S]*?'Creates and opens your first chat\.'/);
});

test('replaces the empty chat state with setup guidance when connection settings are missing', () => {
  assert.match(screenSource, /const showConnectionRequiredEmptyState = !canStartChat && sessions\.length === 0;/);
  assert.match(screenSource, /showConnectionRequiredEmptyState \? 'Connection required' : 'No chats yet'/);
  assert.match(screenSource, /showConnectionRequiredEmptyState[\s\S]*?CHAT_CONNECTION_SETTINGS_REQUIRED_MESSAGE[\s\S]*?'Start your first chat so recent conversations show up here\.'/);
  assert.match(screenSource, /Open connection settings/);
  assert.match(screenSource, /Opens connection settings so you can finish setup before starting a chat\./);
});

test('keeps the empty-state primary action wide and centered for narrow mobile layouts', () => {
  assert.match(screenSource, /emptyState:\s*\{[\s\S]*?width:\s*'100%' as const,[\s\S]*?maxWidth:\s*360,/);
  assert.match(screenSource, /emptyStateButton:\s*\{[\s\S]*?width:\s*'100%' as const,[\s\S]*?maxWidth:\s*280,/);
  assert.match(screenSource, /emptyStateButtonText:\s*\{[\s\S]*?textAlign:\s*'center',/);
});