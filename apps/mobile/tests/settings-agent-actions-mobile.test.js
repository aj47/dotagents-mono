const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('wraps each agent toggle in a named minimum touch target', () => {
  assert.match(settingsSource, /style=\{styles\.agentSwitchButton\}/);
  assert.match(settingsSource, /accessibilityRole="switch"[\s\S]*?createSwitchAccessibilityLabel\(`\$\{profile\.displayName\} agent`\)/);
  assert.match(settingsSource, /accessibilityHint="Enables or disables this agent for delegation\."/);
  assert.match(settingsSource, /agentSwitchButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget/);
  assert.match(settingsSource, /renderActionRailSwitchVisual\(profile\.enabled\)/);
  assert.match(settingsSource, /Platform\.OS === 'web'[\s\S]*?styles\.actionRailSwitchTrack/);
  assert.match(settingsSource, /accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?renderActionRailSwitchVisual\(profile\.enabled\)/);
  assert.match(settingsSource, /styles\.actionRailSwitchTrack[\s\S]*?accessible=\{false\}/);
});

test('gives agent delete actions explicit button semantics and a mobile-sized target', () => {
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Delete \$\{profile\.displayName\} agent`\)/);
  assert.match(settingsSource, /accessibilityHint="Removes this agent after confirmation\."/);
  assert.match(settingsSource, /agentDeleteButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget/);
});

test('adds an explicit edit affordance to each agent row', () => {
  assert.match(settingsSource, /onPress=\{\(\) => handleAgentProfileEdit\(profile\.id\)\}[\s\S]*?accessibilityRole="button"/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Edit \$\{profile\.displayName\} agent`\)/);
  assert.match(settingsSource, /accessibilityHint="Opens this agent so you can review and change its settings\."/);
  assert.match(settingsSource, /renderInlineEditAffordance\(\)/);
  assert.match(settingsSource, /editAffordance:\s*\{[\s\S]*?backgroundColor: theme\.colors\.primary \+ '14'/);
});

test('formats agent row metadata into human-readable mobile labels', () => {
  assert.match(settingsSource, /function formatAgentConnectionTypeLabel\(connectionType: AgentProfile\['connectionType'\]\): 'Internal' \| 'ACP' \| 'Stdio' \| 'Remote'/);
  assert.match(settingsSource, /case 'acp':[\s\S]*?return 'ACP';/);
  assert.match(settingsSource, /case 'stdio':[\s\S]*?return 'Stdio';/);
  assert.match(settingsSource, /case 'remote':[\s\S]*?return 'Remote';/);
  assert.match(settingsSource, /case 'internal':[\s\S]*?return 'Internal';/);
  assert.match(settingsSource, /function formatAgentRoleLabel\(role\?: AgentProfile\['role'\]\): 'Profile' \| 'Delegation' \| 'External' \| 'Agent'/);
  assert.match(settingsSource, /case 'user-profile':[\s\S]*?return 'Profile';/);
  assert.match(settingsSource, /case 'delegation-target':[\s\S]*?return 'Delegation';/);
  assert.match(settingsSource, /case 'external-agent':[\s\S]*?return 'External';/);
  assert.match(settingsSource, /\{formatAgentConnectionTypeLabel\(profile\.connectionType\)\} • \{formatAgentRoleLabel\(profile\.role\)\}/);
  assert.doesNotMatch(settingsSource, /\{profile\.connectionType\} • \{profile\.role \|\| 'agent'\}/);
});

test('surfaces disabled agent state directly in the mobile row header', () => {
  assert.match(settingsSource, /\{!profile\.enabled && \([\s\S]*?<Text style=\{\[styles\.agentRowBadgeText, styles\.agentRowBadgeTextDisabled\]\}>Disabled<\/Text>[\s\S]*?\)\}/);
  assert.match(settingsSource, /agentRowBadge:\s*\{[\s\S]*?borderRadius:\s*radius\.full,[\s\S]*?paddingHorizontal:\s*6,[\s\S]*?paddingVertical:\s*2/);
  assert.match(settingsSource, /agentRowBadgeDisabled:\s*\{[\s\S]*?backgroundColor:\s*theme\.colors\.secondary/);
  assert.match(settingsSource, /agentRowBadgeTextDisabled:\s*\{[\s\S]*?color:\s*theme\.colors\.mutedForeground,[\s\S]*?fontWeight:\s*'600'/);
});