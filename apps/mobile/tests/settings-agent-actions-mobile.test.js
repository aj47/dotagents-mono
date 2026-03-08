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
  assert.match(settingsSource, /accessibilityHint=\{agentToggleHint\}/);
  assert.match(settingsSource, /Enables or disables this agent for delegation\./);
  assert.match(settingsSource, /agentSwitchButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget/);
  assert.match(settingsSource, /renderActionRailSwitchVisual\(profile\.enabled\)/);
  assert.match(settingsSource, /Platform\.OS === 'web'[\s\S]*?styles\.actionRailSwitchTrack/);
  assert.match(settingsSource, /accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?renderActionRailSwitchVisual\(profile\.enabled\)/);
  assert.match(settingsSource, /styles\.actionRailSwitchTrack[\s\S]*?accessible=\{false\}/);
});

test('gives agent delete actions explicit button semantics and a mobile-sized target', () => {
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Delete \$\{profile\.displayName\} agent`\)/);
  assert.match(settingsSource, /const agentDeleteHint = isSelectedMainAgentProfile[\s\S]*?Removes this agent after confirmation\.[\s\S]*?This agent is currently selected as the main agent for new chats in ACP mode\./);
  assert.match(settingsSource, /accessibilityHint=\{agentDeleteHint\}/);
  assert.match(settingsSource, /const deleteMessage = isSelectedMainAgentProfile[\s\S]*?Are you sure you want to delete "\$\{profile\.displayName\}"\?[\s\S]*?This agent is currently selected as the main agent for new chats in ACP mode\./);
  assert.match(settingsSource, /agentDeleteButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget/);
  assert.match(settingsSource, /style=\{\[styles\.agentDeleteButton, styles\.agentDeleteButtonDanger\]\}/);
  assert.match(settingsSource, /<Ionicons name="trash-outline" size=\{16\} color=\{theme\.colors\.destructive\} style=\{styles\.agentDeleteIcon\} \/>/);
  assert.match(settingsSource, /agentDeleteButtonDanger:\s*\{[\s\S]*?borderColor:\s*theme\.colors\.destructive \+ '2E',[\s\S]*?backgroundColor:\s*theme\.colors\.destructive \+ '10'/);
  assert.match(settingsSource, /agentDeleteButton:\s*\{[\s\S]*?alignItems:\s*'center',[\s\S]*?justifyContent:\s*'center'/);
});

test('makes the create-agent action a full-width mobile button with explicit creation semantics', () => {
  assert.match(settingsSource, /style=\{styles\.subAgentCreateButton\}[\s\S]*?onPress=\{\(\) => handleAgentProfileEdit\(\)\}[\s\S]*?accessibilityRole="button"/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\('Create new agent'\)/);
  assert.match(settingsSource, /accessibilityHint="Opens the agent editor so you can add another delegation or main-agent option\."/);
  assert.match(settingsSource, /subAgentCreateButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget,[\s\S]*?justifyContent:\s*'center',[\s\S]*?alignSelf:\s*'stretch'/);
});

test('adds an explicit edit affordance to each agent row', () => {
  assert.match(settingsSource, /onPress=\{\(\) => handleAgentProfileEdit\(profile\.id\)\}[\s\S]*?accessibilityRole="button"/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Edit \$\{profile\.displayName\} agent`\)/);
  assert.match(settingsSource, /accessibilityHint=\{agentEditHint\}/);
  assert.match(settingsSource, /Opens this agent so you can review and change its settings\./);
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

test('surfaces the currently selected ACP main agent directly in the mobile agent row', () => {
  assert.match(settingsSource, /function normalizeAgentLookupName\(name\?: string\): string/);
  assert.match(settingsSource, /const selectedMainAgentLookupName = useMemo\([\s\S]*?remoteSettings\?\.mainAgentMode === 'acp' \? remoteSettings\.mainAgentName : undefined/);
  assert.match(settingsSource, /const isSelectedMainAgentProfile = selectedMainAgentLookupName\.length > 0[\s\S]*?normalizeAgentLookupName\(profile\.name\) === selectedMainAgentLookupName;/);
  assert.match(settingsSource, /\{\(isSelectedMainAgentProfile \|\| profile\.isBuiltIn \|\| !profile\.enabled\) && \([\s\S]*?<View style=\{styles\.agentRowBadges\}>/);
  assert.match(settingsSource, /\{isSelectedMainAgentProfile && \([\s\S]*?<Text style=\{\[styles\.agentRowBadgeText, styles\.agentRowBadgeTextMainAgent\]\}>Main agent<\/Text>/);
  assert.match(settingsSource, /agentRowBadgeMainAgent:\s*\{[\s\S]*?borderColor:\s*theme\.colors\.primary \+ '35'[\s\S]*?backgroundColor:\s*theme\.colors\.primary \+ '14'/);
  assert.match(settingsSource, /agentRowBadgeTextMainAgent:\s*\{[\s\S]*?color:\s*theme\.colors\.primary,[\s\S]*?fontWeight:\s*'600'/);
  assert.match(settingsSource, /accessibilityHint=\{agentEditHint\}/);
  assert.match(settingsSource, /accessibilityHint=\{agentToggleHint\}/);
  assert.match(settingsSource, /This is the current main agent for new chats in ACP mode\./);
  assert.match(settingsSource, /This agent is currently selected as the main agent for new chats in ACP mode\./);
});

test('keeps agent availability context visible in the collapsed Agents header on mobile', () => {
  assert.match(settingsSource, /const agentsSectionSummary = useMemo\(\(\) => \{/);
  assert.match(settingsSource, /if \(isLoadingAgentProfiles\) return 'Loading agents…';/);
  assert.match(settingsSource, /if \(agentProfiles\.length === 0\) return 'No agents';/);
  assert.match(settingsSource, /const disabledAgentCount = agentProfiles\.filter\(\(profile\) => !profile\.enabled\)\.length;/);
  assert.match(settingsSource, /const summaryParts = \[`\$\{agentProfiles\.length\} \$\{agentProfiles\.length === 1 \? 'agent' : 'agents'\}`\];/);
  assert.match(settingsSource, /if \(remoteSettings\?\.mainAgentMode === 'acp'\) \{[\s\S]*?Main disabled: \$\{selectedMainAgentLabel\}[\s\S]*?Main unavailable: \$\{selectedMainAgentLabel\}[\s\S]*?Main: \$\{selectedMainAgentLabel\}[\s\S]*?summaryParts\.push\('No main agent'\);/);
  assert.match(settingsSource, /if \(disabledAgentCount > 0\) \{[\s\S]*?summaryParts\.push\(`\$\{disabledAgentCount\} disabled`\);/);
  assert.match(settingsSource, /else if \(remoteSettings\?\.mainAgentMode !== 'acp'\) \{[\s\S]*?summaryParts\.push\('all enabled'\);/);
  assert.match(settingsSource, /return summaryParts\.join\(' • '\);/);
  assert.match(settingsSource, /selectedMainAgentAvailabilityState,[\s\S]*?selectedMainAgentLabel,/);
  assert.match(settingsSource, /<CollapsibleSection id="agents" title="Agents" summary=\{agentsSectionSummary\}>/);
});

test('keeps long agent names stable when built-in and disabled badges are present', () => {
  assert.match(settingsSource, /<Text[\s\S]*?style=\{\[styles\.serverName, styles\.agentRowName\]\}[\s\S]*?numberOfLines=\{2\}[\s\S]*?ellipsizeMode="tail"[\s\S]*?\{profile\.displayName\}/);
  assert.match(settingsSource, /\{\(isSelectedMainAgentProfile \|\| profile\.isBuiltIn \|\| !profile\.enabled\) && \([\s\S]*?<View style=\{styles\.agentRowBadges\}>[\s\S]*?Built-in[\s\S]*?Disabled[\s\S]*?\)\}/);
  assert.match(settingsSource, /agentRowName:\s*\{[\s\S]*?flexGrow:\s*1,[\s\S]*?minWidth:\s*0/);
  assert.match(settingsSource, /agentRowBadges:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?flexWrap:\s*'wrap',[\s\S]*?gap:\s*spacing\.xs,[\s\S]*?flexShrink:\s*0/);
});

test('uses the agent preview line for auto-start state before falling back to optional descriptions on mobile', () => {
  assert.match(settingsSource, /function formatAgentRowSecondaryText\(profile: AgentProfile\): string \| null \{[\s\S]*?profile\.enabled && profile\.autoSpawn && \(profile\.connectionType === 'acp' \|\| profile\.connectionType === 'stdio'\)[\s\S]*?return 'Starts automatically with DotAgents';[\s\S]*?const description = profile\.description\?\.trim\(\);[\s\S]*?return description \? description : null;[\s\S]*?\}/);
  assert.doesNotMatch(settingsSource, /function formatAgentRowSecondaryText\(profile: AgentProfile\): string \| null \{[\s\S]*?if \(profile\.autoSpawn && \(profile\.connectionType === 'acp' \|\| profile\.connectionType === 'stdio'\)\) \{/);
  assert.match(settingsSource, /const agentSecondaryPreview = formatAgentRowSecondaryText\(profile\);/);
  assert.match(settingsSource, /\{agentSecondaryPreview && \([\s\S]*?<Text style=\{styles\.agentSecondaryPreview\} numberOfLines=\{1\} ellipsizeMode="tail">[\s\S]*?\{agentSecondaryPreview\}[\s\S]*?<\/Text>[\s\S]*?\)\}/);
  assert.match(settingsSource, /agentSecondaryPreview:\s*\{[\s\S]*?fontSize:\s*11,[\s\S]*?color:\s*theme\.colors\.mutedForeground,[\s\S]*?marginTop:\s*spacing\.xs,[\s\S]*?lineHeight:\s*15/);
});