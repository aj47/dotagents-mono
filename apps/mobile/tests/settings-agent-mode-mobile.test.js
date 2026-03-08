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

test('wraps Inject Builtin Tools in a named mobile-sized switch control', () => {
  assert.match(settingsSource, /style=\{styles\.agentSettingsSwitchButton\}/);
  assert.match(settingsSource, /onPress=\{\(\) => handleRemoteSettingToggle\('acpInjectBuiltinTools', !\(remoteSettings\.acpInjectBuiltinTools \?\? true\)\)\}/);
  assert.match(settingsSource, /accessibilityRole="switch"[\s\S]*?createSwitchAccessibilityLabel\('Inject Builtin Tools'\)/);
  assert.match(settingsSource, /accessibilityHint="Adds DotAgents tools like delegation and settings to ACP sessions\."/);
  assert.match(settingsSource, /accessibilityState=\{\{ checked: remoteSettings\.acpInjectBuiltinTools \?\? true \}\}/);
  assert.match(settingsSource, /agentSettingsSwitchButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget[\s\S]*?alignSelf:\s*'center'/);
  assert.match(settingsSource, /accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?renderActionRailSwitchVisual\(remoteSettings\.acpInjectBuiltinTools \?\? true\)/);
});

test('wraps Require Tool Approval in the same named mobile-sized switch control', () => {
  assert.match(settingsSource, /<Text style=\{styles\.label\}>Require Tool Approval<\/Text>[\s\S]*?style=\{styles\.agentSettingsSwitchButton\}/);
  assert.match(settingsSource, /onPress=\{\(\) => handleRemoteSettingToggle\('mcpRequireApprovalBeforeToolCall', !\(remoteSettings\.mcpRequireApprovalBeforeToolCall \?\? false\)\)\}/);
  assert.match(settingsSource, /accessibilityRole="switch"[\s\S]*?createSwitchAccessibilityLabel\('Require Tool Approval'\)/);
  assert.match(settingsSource, /accessibilityHint="Requires approval before an agent can execute an MCP tool\."/);
  assert.match(settingsSource, /accessibilityState=\{\{ checked: remoteSettings\.mcpRequireApprovalBeforeToolCall \?\? false \}\}/);
  assert.match(settingsSource, /accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?renderActionRailSwitchVisual\(remoteSettings\.mcpRequireApprovalBeforeToolCall \?\? false\)/);
});

test('wraps Message Queue in the same named mobile-sized switch control', () => {
  assert.match(settingsSource, /<Text style=\{styles\.label\}>Message Queue<\/Text>[\s\S]*?style=\{styles\.agentSettingsSwitchButton\}/);
  assert.match(settingsSource, /onPress=\{\(\) => handleRemoteSettingToggle\('mcpMessageQueueEnabled', !\(remoteSettings\.mcpMessageQueueEnabled \?\? true\)\)\}/);
  assert.match(settingsSource, /accessibilityRole="switch"[\s\S]*?createSwitchAccessibilityLabel\('Message Queue'\)/);
  assert.match(settingsSource, /accessibilityHint="Queues incoming messages while the agent is already working on another step\."/);
  assert.match(settingsSource, /accessibilityState=\{\{ checked: remoteSettings\.mcpMessageQueueEnabled \?\? true \}\}/);
  assert.match(settingsSource, /accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?renderActionRailSwitchVisual\(remoteSettings\.mcpMessageQueueEnabled \?\? true\)/);
});

test('wraps Verify Completion in the same named mobile-sized switch control', () => {
  assert.match(settingsSource, /<Text style=\{styles\.label\}>Verify Completion<\/Text>[\s\S]*?style=\{styles\.agentSettingsSwitchButton\}/);
  assert.match(settingsSource, /onPress=\{\(\) => handleRemoteSettingToggle\('mcpVerifyCompletionEnabled', !\(remoteSettings\.mcpVerifyCompletionEnabled \?\? true\)\)\}/);
  assert.match(settingsSource, /accessibilityRole="switch"[\s\S]*?createSwitchAccessibilityLabel\('Verify Completion'\)/);
  assert.match(settingsSource, /accessibilityHint="Checks whether the agent actually finished the task before stopping\."/);
  assert.match(settingsSource, /accessibilityState=\{\{ checked: remoteSettings\.mcpVerifyCompletionEnabled \?\? true \}\}/);
  assert.match(settingsSource, /accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?renderActionRailSwitchVisual\(remoteSettings\.mcpVerifyCompletionEnabled \?\? true\)/);
});

test('wraps Final Summary in the same named mobile-sized switch control', () => {
  assert.match(settingsSource, /<Text style=\{styles\.label\}>Final Summary<\/Text>[\s\S]*?style=\{styles\.agentSettingsSwitchButton\}/);
  assert.match(settingsSource, /onPress=\{\(\) => handleRemoteSettingToggle\('mcpFinalSummaryEnabled', !\(remoteSettings\.mcpFinalSummaryEnabled \?\? false\)\)\}/);
  assert.match(settingsSource, /accessibilityRole="switch"[\s\S]*?createSwitchAccessibilityLabel\('Final Summary'\)/);
  assert.match(settingsSource, /accessibilityHint="Generates a summary after the agent finishes the task\."/);
  assert.match(settingsSource, /accessibilityState=\{\{ checked: remoteSettings\.mcpFinalSummaryEnabled \?\? false \}\}/);
  assert.match(settingsSource, /accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?renderActionRailSwitchVisual\(remoteSettings\.mcpFinalSummaryEnabled \?\? false\)/);
});

test('wraps Unlimited Iterations in the same named mobile-sized switch control', () => {
  assert.match(settingsSource, /<Text style=\{styles\.label\}>Unlimited Iterations<\/Text>[\s\S]*?style=\{styles\.agentSettingsSwitchButton\}/);
  assert.match(settingsSource, /onPress=\{\(\) => handleRemoteSettingToggle\('mcpUnlimitedIterations', !\(remoteSettings\.mcpUnlimitedIterations \?\? false\)\)\}/);
  assert.match(settingsSource, /accessibilityRole="switch"[\s\S]*?createSwitchAccessibilityLabel\('Unlimited Iterations'\)/);
  assert.match(settingsSource, /accessibilityHint="Removes the max-iteration limit so the agent can keep working until it finishes or you stop it\."/);
  assert.match(settingsSource, /accessibilityState=\{\{ checked: remoteSettings\.mcpUnlimitedIterations \?\? false \}\}/);
  assert.match(settingsSource, /accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?renderActionRailSwitchVisual\(remoteSettings\.mcpUnlimitedIterations \?\? false\)/);
});

test('hides max iterations while unlimited iterations is enabled', () => {
  assert.match(settingsSource, /<Text style=\{styles\.label\}>Unlimited Iterations<\/Text>[\s\S]*?remoteSettings\.mcpUnlimitedIterations \? \(/);
  assert.match(settingsSource, /No iteration limit\. The agent will keep working until it finishes or you stop it\./);
  assert.match(settingsSource, /: \([\s\S]*?<Text style=\{styles\.label\}>Max Iterations<\/Text>[\s\S]*?<TextInput/);
  assert.doesNotMatch(settingsSource, /<Text style=\{styles\.label\}>Max Iterations<\/Text>[\s\S]*?<TextInput[\s\S]*?<Text style=\{styles\.label\}>Unlimited Iterations<\/Text>/);
});