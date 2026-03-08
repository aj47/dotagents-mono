const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

const sessionListScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

for (const [screenName, source] of [
  ['ChatScreen', chatScreenSource],
  ['SessionListScreen', sessionListScreenSource],
]) {
  test(`${screenName} gives the header agent selector a minimum mobile touch target`, () => {
    assert.match(source, /headerAgentSelectorTouchTarget = createMinimumTouchTargetStyle\([\s\S]*?horizontalMargin: 0[\s\S]*?\)/);
    assert.match(source, /headerAgentSelectorTrigger:\s*\{[\s\S]*?\.\.\.headerAgentSelectorTouchTarget/);
  });

  test(`${screenName} keeps the header agent label legible on narrow screens`, () => {
    assert.match(source, /style=\{styles\.headerAgentSelectorBadge\}/);
    assert.match(source, /style=\{styles\.headerAgentSelectorBadgeText\} numberOfLines=\{2\} ellipsizeMode="tail"/);
    assert.match(source, /headerAgentSelectorBadge:\s*\{[\s\S]*?alignItems: 'flex-start',[\s\S]*?paddingVertical: 4,[\s\S]*?maxWidth: 180,[\s\S]*?minWidth: 0/);
    assert.match(source, /headerAgentSelectorBadgeText:\s*\{[\s\S]*?fontSize: 12,[\s\S]*?lineHeight: 15,[\s\S]*?flexShrink: 1,[\s\S]*?minWidth: 0/);
    assert.match(source, /maxWidth: 180/);
  });

  test(`${screenName} only makes the header agent control interactive when switchable options exist`, () => {
    assert.match(source, /const \[hasAgentSelectorOptions, setHasAgentSelectorOptions\] = useState\(false\);/);
    assert.match(source, /const \[isAcpMainAgentMode, setIsAcpMainAgentMode\] = useState\(false\);/);
    assert.match(source, /const currentProfileRepresentsAcpMainAgent = currentProfile\?\.guidelines === 'ACP main agent';/);
    assert.match(source, /setIsAcpMainAgentMode\(settings\.mainAgentMode === 'acp'\);/);
    assert.match(source, /const currentAgentLabel = currentProfile\?\.name \|\| \(isAcpMainAgentMode \? 'Main Agent' : 'Default Profile'\);/);
    assert.match(source, /const currentAgentAccessibilityPrefix = isAcpMainAgentMode \? 'Current main agent' : 'Current profile';/);
    assert.match(source, /const agentSelectionAccessibilityHint = isAcpMainAgentMode[\s\S]*?'Opens main agent selection menu'[\s\S]*?'Opens profile selection menu';/);
    assert.match(source, /const noOtherAgentsAvailableText = isAcpMainAgentMode[\s\S]*?'No other main agents are available to switch to right now\.'[\s\S]*?'No other profiles are available to switch to right now\.';/);
    assert.match(source, /const hasAlternativeAgentSelectorOption = useCallback\(\(optionIds: string\[\]\) => \{[\s\S]*?if \(optionIds\.length === 0\) return false;[\s\S]*?if \(!currentAgentId\) return true;[\s\S]*?optionIds\.some\(\(optionId\) => optionId !== currentAgentId\);[\s\S]*?\}, \[currentAgentId\]\);/);
    assert.match(source, /hasAgentSelectorOptions \? \(/);
    assert.match(source, /accessibilityLabel=\{`\$\{currentAgentAccessibilityPrefix\}: \$\{currentAgentLabel\}\. Tap to change\.`\}/);
    assert.match(source, /accessibilityHint=\{agentSelectionAccessibilityHint\}/);
    assert.match(source, /accessibilityLabel=\{`\$\{currentAgentAccessibilityPrefix\}: \$\{currentAgentLabel\}\. \$\{noOtherAgentsAvailableText\}`\}/);
    assert.match(source, /\{currentAgentLabel\}/);
    assert.match(source, /style=\{styles\.headerAgentSelectorBadgeChevron\}[\s\S]*?>\s*▼\s*<\/Text>/);
    assert.doesNotMatch(source, /\{`\$\{currentAgentLabel\} ▼`\}/);
  });

  test(`${screenName} falls back to the current selection mode if header selector refresh fails`, () => {
    assert.match(source, /const currentProfileRepresentsAcpMainAgent = currentProfile\?\.guidelines === 'ACP main agent';/);
    assert.match(source, /catch \(error\) \{[\s\S]*?setIsAcpMainAgentMode\(currentProfileRepresentsAcpMainAgent\);[\s\S]*?setHasAgentSelectorOptions\(false\);[\s\S]*?\}/);
  });

  test(`${screenName} styles the no-options header badge as passive status instead of an active selector`, () => {
    assert.match(source, /style=\{\[styles\.headerAgentSelectorBadge, styles\.headerAgentSelectorBadgeStatic\]\}/);
    assert.match(source, /style=\{\[styles\.headerAgentSelectorBadgeText, styles\.headerAgentSelectorBadgeTextStatic\]\}[\s\S]*?numberOfLines=\{2\}[\s\S]*?ellipsizeMode="tail"/);
    assert.match(source, /headerAgentSelectorBadgeStatic:\s*\{[\s\S]*?backgroundColor: theme\.colors\.muted/);
    assert.match(source, /headerAgentSelectorBadgeTextStatic:\s*\{[\s\S]*?color: theme\.colors\.mutedForeground/);
  });

  test(`${screenName} refreshes header selector availability when the screen regains focus`, () => {
    assert.match(source, /navigation\?\.addListener\?\.\('focus', \(\) => \{[\s\S]*?void refreshAgentSelectorAvailability\(\);/);
  });
}

test('Chat and Chats headers use the same fallback selection label when switching is unavailable', () => {
  assert.match(chatScreenSource, /const currentAgentLabel = currentProfile\?\.name \|\| \(isAcpMainAgentMode \? 'Main Agent' : 'Default Profile'\);/);
  assert.match(sessionListScreenSource, /const currentAgentLabel = currentProfile\?\.name \|\| \(isAcpMainAgentMode \? 'Main Agent' : 'Default Profile'\);/);
});
