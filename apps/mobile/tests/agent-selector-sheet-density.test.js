const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sheetSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'AgentSelectorSheet.tsx'),
  'utf8'
);

test('keeps the mobile agent selector close affordance in a compact header instead of a footer band', () => {
  assert.match(sheetSource, /<View style=\{styles\.header\}>/);
  assert.match(sheetSource, /accessibilityLabel="Close agent selector"/);
  assert.match(sheetSource, /<Text style=\{styles\.headerCloseButtonText\}>Close<\/Text>/);
  assert.doesNotMatch(sheetSource, /<Text style=\{styles\.closeButtonText\}>Cancel<\/Text>/);
  assert.doesNotMatch(sheetSource, /closeButton:\s*\{/);
});

test('keeps the mobile agent selector title shrink-safe beside the header close action', () => {
  assert.match(sheetSource, /header:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?alignItems:\s*'center',[\s\S]*?marginBottom:\s*spacing\.md,/);
  assert.match(sheetSource, /title:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,[\s\S]*?lineHeight:\s*22,/);
  assert.match(sheetSource, /<Text style=\{styles\.title\} numberOfLines=\{1\}>/);
});

test('turns the missing-config agent selector state into a direct connection-settings action', () => {
  assert.match(sheetSource, /const showConfigBlocker = error === missingConfigError;/);
  assert.match(sheetSource, /Finish connection setup to choose an agent/);
  assert.match(sheetSource, /Open Connection settings to add your DotAgents server URL and API key, then return here to switch agents\./);
  assert.match(sheetSource, /You can keep reviewing existing chats while disconnected\./);
  assert.match(sheetSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Open connection settings'\)\}/);
  assert.match(sheetSource, /configBlockerPrimaryButton:\s*\{[\s\S]*?createMinimumTouchTargetStyle\(\{ horizontalPadding: spacing\.lg, verticalPadding: spacing\.sm, horizontalMargin: 0 \}\),[\s\S]*?width:\s*'100%',/);
});