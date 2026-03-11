const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

function extractBetween(startMarker, endMarker) {
  const start = settingsSource.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);

  const end = settingsSource.indexOf(endMarker, start);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);

  return settingsSource.slice(start, end);
}

test('keeps mobile settings overlay close affordances text-first and explicitly labeled', () => {
  assert.doesNotMatch(settingsSource, /<Text style=\{styles\.(?:modelPickerClose|importModalClose|modalCloseText)\}>✕<\/Text>/);

  const closeTextMatches = [
    ...settingsSource.matchAll(/<Text style=\{styles\.modalCloseText\}>Close<\/Text>/g),
  ];
  assert.equal(closeTextMatches.length, 5);

  assert.match(settingsSource, /accessibilityLabel="Close model picker"/);
  assert.match(settingsSource, /accessibilityLabel="Close endpoint picker"/);
  assert.match(settingsSource, /accessibilityLabel="Close TTS model picker"/);
  assert.match(settingsSource, /accessibilityLabel="Close TTS voice picker"/);
  assert.match(settingsSource, /accessibilityLabel="Close import profile modal"/);
});

test('keeps mobile settings overlay headers compact and flex-safe on narrow widths', () => {
  const modelPickerHeaderStyles = extractBetween('modelPickerHeader: {', 'modelPickerTitle: {');
  assert.match(modelPickerHeaderStyles, /gap:\s*spacing\.sm/);
  assert.match(modelPickerHeaderStyles, /paddingHorizontal:\s*spacing\.lg/);
  assert.match(modelPickerHeaderStyles, /paddingVertical:\s*spacing\.md/);
  assert.doesNotMatch(modelPickerHeaderStyles, /padding:\s*spacing\.lg/);

  const modelPickerTitleStyles = extractBetween('modelPickerTitle: {', 'modalCloseButton: {');
  assert.match(modelPickerTitleStyles, /flex:\s*1/);
  assert.match(modelPickerTitleStyles, /flexShrink:\s*1/);
  assert.match(modelPickerTitleStyles, /paddingRight:\s*spacing\.xs/);

  const importModalHeaderStyles = extractBetween('importModalHeader: {', 'importModalTitle: {');
  assert.match(importModalHeaderStyles, /gap:\s*spacing\.sm/);

  const importModalTitleStyles = extractBetween('importModalTitle: {', 'importModalDescription: {');
  assert.match(importModalTitleStyles, /flex:\s*1/);
  assert.match(importModalTitleStyles, /flexShrink:\s*1/);
  assert.match(importModalTitleStyles, /paddingRight:\s*spacing\.xs/);
});

test('keeps mobile settings picker triggers full-width with explicit button semantics', () => {
  const modelSelectorStyles = extractBetween('modelSelector: {', 'modelSelectorContent: {');
  assert.match(modelSelectorStyles, /width:\s*'100%'/);
  assert.match(modelSelectorStyles, /minHeight:\s*48/);
  assert.match(modelSelectorStyles, /justifyContent:\s*'center'/);

  assert.match(settingsSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Open endpoint picker'\)\}/);
  assert.match(settingsSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Open model picker'\)\}/);
  assert.match(settingsSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Open TTS model picker'\)\}/);
  assert.match(settingsSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Open TTS voice picker'\)\}/);
  assert.match(settingsSource, /role="button"/);
  assert.match(settingsSource, /aria-label=\{createButtonAccessibilityLabel\('Open TTS voice picker'\)\}/);
  assert.match(settingsSource, /aria-expanded=\{showTtsVoicePicker\}/);

  const expandedStateMatches = [
    ...settingsSource.matchAll(/accessibilityState=\{\{ expanded:/g),
  ];
  assert.ok(expandedStateMatches.length >= 4);
});

test('keeps settings picker modal actions at minimum touch-target size and marks selected options', () => {
  const modalCloseButtonStyles = extractBetween('modalCloseButton: {', 'modalCloseText: {');
  assert.match(modalCloseButtonStyles, /createMinimumTouchTargetStyle\(\{ minSize:\s*44, horizontalMargin:\s*0, horizontalPadding:\s*spacing\.sm, verticalPadding:\s*spacing\.xs \}\)/);
  assert.match(modalCloseButtonStyles, /minWidth:\s*64/);
  assert.match(modalCloseButtonStyles, /backgroundColor:\s*theme\.colors\.secondary/);

  const modelItemStyles = extractBetween('modelItem: {', 'modelItemActive: {');
  assert.match(modelItemStyles, /minHeight:\s*48/);
  assert.match(settingsSource, /aria-selected=\{isSelected\}/);

  const selectedStateMatches = [
    ...settingsSource.matchAll(/accessibilityState=\{\{ selected: isSelected \}\}/g),
  ];
  assert.equal(selectedStateMatches.length, 4);
});