const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

test('gives the empty session state an in-place primary action', () => {
  assert.match(screenSource, /<Text style=\{styles\.emptyTitle\}>No chats yet<\/Text>/);
  assert.match(screenSource, /Start your first chat so recent conversations show up here\./);
  assert.match(screenSource, /onPress=\{handleCreateSession\}[\s\S]*?createButtonAccessibilityLabel\('Start first chat'\)/);
  assert.match(screenSource, /accessibilityHint="Creates and opens your first chat\."/);
});

test('keeps the empty-state primary action wide and centered for narrow mobile layouts', () => {
  assert.match(screenSource, /emptyState:\s*\{[\s\S]*?width:\s*'100%' as const,[\s\S]*?maxWidth:\s*360,/);
  assert.match(screenSource, /emptyStateButton:\s*\{[\s\S]*?width:\s*'100%' as const,[\s\S]*?maxWidth:\s*280,/);
  assert.match(screenSource, /emptyStateButtonText:\s*\{[\s\S]*?textAlign:\s*'center',/);
});

test('shows connection guidance instead of the chat list when the mobile app is disconnected', () => {
  assert.match(screenSource, /const isConnected = connectionInfo\.state === 'connected';/);
  assert.match(screenSource, /if \(!isConnected\) \{/);
  assert.match(screenSource, /<Text style=\{styles\.disconnectedTitle\}>\{disconnectedTitle\}<\/Text>/);
  assert.match(screenSource, /<Text style=\{styles\.emptyStateButtonText\}>Scan QR Code<\/Text>/);
  assert.match(screenSource, /<Text style=\{styles\.disconnectedSecondaryButtonText\}>Connection Settings<\/Text>/);
});