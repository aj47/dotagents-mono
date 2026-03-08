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
  assert.match(screenSource, /const \[isAcpMainAgentMode, setIsAcpMainAgentMode\] = useState\(false\);/);
  assert.match(screenSource, /const currentProfileRepresentsAcpMainAgent = currentProfile\?\.guidelines === 'ACP main agent';/);
  assert.match(screenSource, /setIsAcpMainAgentMode\(settings\.mainAgentMode === 'acp'\);/);
  assert.match(screenSource, /const hasAlternativeAgentSelectorOption = useCallback\(\(optionIds: string\[\]\) => \{[\s\S]*?if \(optionIds\.length === 0\) return false;[\s\S]*?if \(!currentAgentId\) return true;[\s\S]*?optionIds\.some\(\(optionId\) => optionId !== currentAgentId\);[\s\S]*?\}, \[currentAgentId\]\);/);
  assert.match(screenSource, /hasAlternativeAgentSelectorOption\(\(profilesResponse\.profiles \|\| \[\]\)\.map\(\(profile\) => profile\.id\)\)/);
  assert.match(screenSource, /getAcpMainAgentOptions\(settings, agentProfilesResponse\.profiles \|\| \[\]\)[\s\S]*?\.map\(\(option\) => toMainAgentProfile\(option\)\.id\)[\s\S]*?hasAlternativeAgentSelectorOption\(mainAgentOptionIds\)/);
  assert.match(screenSource, /\{hasAgentSelectorOptions && \(/);
});

test('falls back to the current selection mode if agent-selector availability refresh fails', () => {
  assert.match(screenSource, /const currentProfileRepresentsAcpMainAgent = currentProfile\?\.guidelines === 'ACP main agent';/);
  assert.match(screenSource, /catch \(error\) \{[\s\S]*?setIsAcpMainAgentMode\(currentProfileRepresentsAcpMainAgent\);[\s\S]*?setHasAgentSelectorOptions\(false\);[\s\S]*?\}/);
});

test('uses main-agent terminology in the composer selector when ACP mode is active', () => {
  assert.match(screenSource, /const currentAgentLabel = currentProfile\?\.name \|\| \(isAcpMainAgentMode \? 'Main Agent' : 'Default Profile'\);/);
  assert.match(screenSource, /const currentAgentAccessibilityPrefix = isAcpMainAgentMode \? 'Current main agent' : 'Current profile';/);
  assert.match(screenSource, /const agentSelectionAccessibilityHint = isAcpMainAgentMode[\s\S]*?'Opens main agent selection menu'[\s\S]*?'Opens profile selection menu';/);
  assert.match(screenSource, /const composerAgentChipLabel = isAcpMainAgentMode \? '🤖 Main Agent' : '🤖 Profile';/);
  assert.match(screenSource, /accessibilityLabel=\{`\$\{currentAgentAccessibilityPrefix\}: \$\{currentAgentLabel\}\. Tap to change\.`\}/);
  assert.match(screenSource, /accessibilityHint=\{agentSelectionAccessibilityHint\}/);
  assert.match(screenSource, /<Text style=\{styles\.agentSelectorChipLabel\}>\{composerAgentChipLabel\}<\/Text>/);
});

test('refreshes composer agent selector visibility when the chat screen regains focus', () => {
  assert.match(screenSource, /navigation\?\.addListener\?\.\('focus', \(\) => \{[\s\S]*?void refreshAgentSelectorAvailability\(\);/);
});

test('lets the composer agent selector label use available row width before truncating', () => {
  assert.match(screenSource, /agentSelectorChip:\s*\{[\s\S]*?maxWidth:\s*'100%'/);
  assert.match(screenSource, /agentSelectorChipValueRow:\s*\{[\s\S]*?flexShrink:\s*1,[\s\S]*?minWidth:\s*0,/);
  assert.match(screenSource, /agentSelectorChipValue:\s*\{[\s\S]*?flexShrink:\s*1,[\s\S]*?minWidth:\s*0,/);
});

test('keeps the composer agent selector chevron visible beside long agent names', () => {
  assert.match(screenSource, /<View style=\{styles\.agentSelectorChipValueRow\}>[\s\S]*?<Text style=\{styles\.agentSelectorChipValue\} numberOfLines=\{1\} ellipsizeMode="tail">[\s\S]*?\{currentAgentLabel\}[\s\S]*?<Text style=\{styles\.agentSelectorChipChevron\}>▼<\/Text>/);
  assert.doesNotMatch(screenSource, /\{currentAgentLabel\} ▼/);
});

test('exposes the edit-before-send toggle state to Expo Web accessibility APIs', () => {
  assert.match(screenSource, /accessibilityRole="switch"[\s\S]*?aria-checked=\{willCancel\}[\s\S]*?accessibilityState=\{\{ checked: willCancel \}\}/);
});