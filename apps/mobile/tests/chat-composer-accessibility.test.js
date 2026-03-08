const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('exposes the chat composer send control as an accessible button', () => {
  assert.match(screenSource, /accessibilityRole="button"[\s\S]*?accessibilityLabel=\{createButtonAccessibilityLabel\('Send message'\)\}/);
  assert.match(screenSource, /accessibilityHint="Sends your typed text and any attached images to the selected agent\."/);
  assert.match(screenSource, /accessibilityState=\{\{ disabled: !composerHasContent \}\}/);
});

test('keeps the chat composer send control at a mobile-friendly minimum touch target', () => {
  assert.match(screenSource, /sendButton:\s*\{[\s\S]*?minHeight:\s*44,[\s\S]*?minWidth:\s*64,/);
  assert.match(screenSource, /sendButton:\s*\{[\s\S]*?alignItems:\s*'center',[\s\S]*?justifyContent:\s*'center',/);
});

test('keeps the chat composer accessory controls at a mobile-friendly touch target size', () => {
  assert.match(screenSource, /ttsToggle:\s*\{[\s\S]*?width:\s*44,[\s\S]*?height:\s*44,[\s\S]*?borderRadius:\s*22,/);
});

test('keeps the composer agent selector chip comfortably tappable on mobile', () => {
  assert.match(screenSource, /composerAgentSelectorTouchTarget = createMinimumTouchTargetStyle\([\s\S]*?horizontalMargin: 0[\s\S]*?\)/);
  assert.match(screenSource, /agentSelectorChip:\s*\{[\s\S]*?\.\.\.composerAgentSelectorTouchTarget/);
});

test('only shows the composer agent selector when the selector actually has options', () => {
  assert.match(screenSource, /const \[hasAgentSelectorOptions, setHasAgentSelectorOptions\] = useState\(false\);/);
  assert.match(screenSource, /setHasAgentSelectorOptions\(\(profilesResponse\.profiles \|\| \[\]\)\.length > 0\);/);
  assert.match(screenSource, /getAcpMainAgentOptions\(settings, agentProfilesResponse\.profiles \|\| \[\]\)\.length > 0/);
  assert.match(screenSource, /\{hasAgentSelectorOptions && \(/);
});

test('refreshes composer agent selector visibility when the chat screen regains focus', () => {
  assert.match(screenSource, /navigation\?\.addListener\?\.\('focus', \(\) => \{[\s\S]*?void refreshAgentSelectorAvailability\(\);/);
});

test('lets the composer agent selector label use available row width before truncating', () => {
  assert.match(screenSource, /agentSelectorChip:\s*\{[\s\S]*?maxWidth:\s*'100%'/);
  assert.match(screenSource, /agentSelectorChipValue:\s*\{[\s\S]*?flexShrink:\s*1,/);
});

test('exposes the edit-before-send toggle state to Expo Web accessibility APIs', () => {
  assert.match(screenSource, /accessibilityRole="switch"[\s\S]*?aria-checked=\{willCancel\}[\s\S]*?accessibilityState=\{\{ checked: willCancel \}\}/);
});