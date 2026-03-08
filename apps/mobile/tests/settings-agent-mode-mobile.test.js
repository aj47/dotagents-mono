const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('uses mobile-sized selectable chips for main agent mode', () => {
  assert.match(settingsSource, /agentSettingsOption:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget[\s\S]*?minWidth:\s*84[\s\S]*?maxWidth:\s*'100%'/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Use \$\{mode\.toUpperCase\(\)\} main agent mode`\)/);
  assert.match(settingsSource, /accessibilityHint=\{[\s\S]*?Routes new chats through a selected ACP agent as the main agent\.[\s\S]*?Uses the configured API model directly as the main agent for new chats\./);
  assert.match(settingsSource, /accessibilityState=\{\{ selected: remoteSettings\.mainAgentMode === mode \}\}/);
  assert.match(settingsSource, /numberOfLines=\{1\}[\s\S]*?ellipsizeMode="tail"[\s\S]*?\{mode\.toUpperCase\(\)\}/);
});

test('gives ACP main-agent chips explicit selection semantics and narrow-screen truncation', () => {
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Use \$\{agent\.displayName \|\| agent\.name\} as ACP main agent`\)/);
  assert.match(settingsSource, /accessibilityHint="Routes main-agent requests through this ACP agent\."/);
  assert.match(settingsSource, /accessibilityState=\{\{ selected: remoteSettings\.mainAgentName === agent\.name \}\}/);
  assert.match(settingsSource, /agentSettingsOptionText:\s*\{[\s\S]*?maxWidth:\s*'100%'[\s\S]*?flexShrink:\s*1[\s\S]*?textAlign:\s*'center'/);
  assert.match(settingsSource, /numberOfLines=\{1\}[\s\S]*?ellipsizeMode="tail"[\s\S]*?\{agent\.displayName \|\| agent\.name\}/);
});