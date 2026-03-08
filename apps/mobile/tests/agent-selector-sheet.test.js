const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sheetSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'AgentSelectorSheet.tsx'),
  'utf8'
);

test('refreshes the current profile context when the selector sheet opens', () => {
  assert.match(sheetSource, /if \(visible\) \{[\s\S]*?void Promise\.all\(\[refresh\(\), fetchProfiles\(\)\]\);/);
});

test('keeps the empty state anchored to the current agent and explains where to manage agents', () => {
  assert.match(sheetSource, /Current: \{currentAgentName\}/);
  assert.match(sheetSource, /No switchable agents yet/);
  assert.match(sheetSource, /Manage delegation agents in Settings → Agents\./);
});

test('offers a mobile-friendly path back to agent settings from the empty state', () => {
  assert.match(sheetSource, /navigation\.navigate\('Settings'\)/);
  assert.match(sheetSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Open agent settings'\)\}/);
  assert.match(sheetSource, /manageAgentsButton:\s*\{[\s\S]*?minHeight:\s*44,[\s\S]*?minWidth:\s*180,/);
});

test('turns the missing-config selector error into a direct settings escape hatch', () => {
  assert.match(sheetSource, /const missingConfigError = 'Configure server URL and API key in Settings to switch agents\.'/);
  assert.match(sheetSource, /const isMissingConfigError = error === missingConfigError;/);
  assert.match(sheetSource, /\{isMissingConfigError \? \([\s\S]*?style=\{styles\.manageAgentsButton\}[\s\S]*?onPress=\{handleOpenAgentSettings\}[\s\S]*?createButtonAccessibilityLabel\('Open agent settings'\)[\s\S]*?Returns to Settings so you can add server details and review agent mode\.[\s\S]*?Open Agent Settings/);
});

test('keeps selector-sheet retry and cancel actions mobile-sized with explicit button semantics for recoverable errors', () => {
  assert.match(sheetSource, /const actionButtonTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\)/);
  assert.match(sheetSource, /\) : \([\s\S]*?style=\{styles\.retryButton\}[\s\S]*?accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\('Retry loading agents'\)/);
  assert.match(sheetSource, /accessibilityHint="Attempts to load the available agents again\."/);
  assert.match(sheetSource, /retryButton:\s*\{[\s\S]*?\.\.\.actionButtonTouchTarget/);
  assert.match(sheetSource, /style=\{styles\.closeButton\}[\s\S]*?accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\('Close agent selector'\)/);
  assert.match(sheetSource, /accessibilityHint="Dismisses this sheet and returns to the current screen\."/);
  assert.match(sheetSource, /closeButton:\s*\{[\s\S]*?\.\.\.actionButtonTouchTarget[\s\S]*?width:\s*'100%'/);
});

test('keeps long agent names and descriptions stable inside selector rows on narrow screens', () => {
  assert.match(sheetSource, /<Text[\s\S]*?style=\{\[styles\.profileName, isSelected && styles\.profileNameSelected\]\}[\s\S]*?numberOfLines=\{1\}[\s\S]*?ellipsizeMode="tail"[\s\S]*?\{item\.name\}/);
  assert.match(sheetSource, /profileInfo:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,[\s\S]*?marginRight:/);
  assert.match(sheetSource, /profileName:\s*\{[\s\S]*?flexShrink:\s*1/);
  assert.match(sheetSource, /profileDescription:\s*\{[\s\S]*?flexShrink:\s*1/);
  assert.match(sheetSource, /checkmark:\s*\{[\s\S]*?flexShrink:\s*0/);
});

test('drops the generic ACP placeholder subtitle while keeping real selector descriptions', () => {
  assert.match(sheetSource, /const secondaryDescription = item\.guidelines && item\.guidelines !== 'ACP main agent'[\s\S]*?\? item\.guidelines[\s\S]*?: null;/);
  assert.match(sheetSource, /\{secondaryDescription && \([\s\S]*?<Text style=\{styles\.profileDescription\}[\s\S]*?\{secondaryDescription\}/);
});