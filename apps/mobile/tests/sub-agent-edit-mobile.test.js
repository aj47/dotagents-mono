const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const agentEditSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

const loopEditSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'LoopEditScreen.tsx'),
  'utf8'
);

test('AgentEditScreen makes connection-type chips mobile-sized buttons with selected-state semantics', () => {
  assert.match(agentEditSource, /createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\)/);
  assert.match(agentEditSource, /connectionTypeOption:\s*\{[\s\S]*?\.\.\.selectionChipTouchTarget/);
  assert.match(agentEditSource, /accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(`Use \$\{ct\.label\} connection type`\)/);
  assert.match(agentEditSource, /accessibilityState=\{\{ selected: formData\.connectionType === ct\.value, disabled: isBuiltInAgent \}\}/);
});

test('AgentEditScreen makes built-in read-only fields look passive instead of editable', () => {
  assert.match(agentEditSource, /Built-in agents keep their name, connection, and prompts\. You can still update guidelines,[\s\S]*?enabled, and auto spawn\./);
  assert.match(agentEditSource, /const renderFieldLabel = \(label: string, options\?: \{ required\?: boolean; readOnly\?: boolean \}\) =>/);
  assert.match(agentEditSource, /options\?\.readOnly \? <Text style=\{styles\.labelReadOnlyText\}> · Read only<\/Text> : null/);
  assert.match(agentEditSource, /renderFieldLabel\('Display Name', \{ required: true, readOnly: isBuiltInAgent \}\)/);
  assert.match(agentEditSource, /renderFieldLabel\('Connection Type', \{ readOnly: isBuiltInAgent \}\)/);
  assert.match(agentEditSource, /renderFieldLabel\('System Prompt', \{ readOnly: isBuiltInAgent \}\)/);
  assert.match(agentEditSource, /style=\{\[styles\.input, isBuiltInAgent && styles\.inputReadOnly\]\}/);
  assert.match(agentEditSource, /isBuiltInAgent && styles\.connectionTypeOptionReadOnly/);
  assert.match(agentEditSource, /isBuiltInAgent && formData\.connectionType === ct\.value && styles\.connectionTypeOptionReadOnlyActive/);
  assert.match(agentEditSource, /Built-in agent connections are fixed and cannot be changed here\./);
  assert.match(agentEditSource, /inputReadOnly:\s*\{[\s\S]*?backgroundColor:\s*theme\.colors\.secondary[\s\S]*?borderColor:\s*theme\.colors\.input/);
  assert.match(agentEditSource, /labelReadOnlyText:\s*\{[\s\S]*?fontSize:\s*12,[\s\S]*?color:\s*theme\.colors\.mutedForeground/);
  assert.match(agentEditSource, /connectionTypeTextReadOnly:\s*\{[\s\S]*?color:\s*theme\.colors\.mutedForeground/);
});

test('LoopEditScreen makes profile chips mobile-sized buttons with selected-state semantics', () => {
  assert.match(loopEditSource, /createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\)/);
  assert.match(loopEditSource, /profileOption:\s*\{[\s\S]*?\.\.\.selectionChipTouchTarget/);
  assert.match(loopEditSource, /createButtonAccessibilityLabel\('Select no profile'\)/);
  assert.match(loopEditSource, /createButtonAccessibilityLabel\(`Use \$\{profile\.displayName\} profile`\)/);
  assert.match(loopEditSource, /accessibilityState=\{\{ selected: !formData\.profileId \}\}/);
  assert.match(loopEditSource, /accessibilityState=\{\{ selected: formData\.profileId === profile\.id \}\}/);
});

test('LoopEditScreen keeps long profile chips stable on narrow screens', () => {
  assert.match(loopEditSource, /profileOptions:\s*\{[\s\S]*?alignItems:\s*'flex-start'/);
  assert.match(loopEditSource, /profileOption:\s*\{[\s\S]*?maxWidth:\s*'100%'[\s\S]*?alignSelf:\s*'flex-start'/);
  assert.match(loopEditSource, /profileOptionText:\s*\{[\s\S]*?maxWidth:\s*'100%'[\s\S]*?flexShrink:\s*1/);
  assert.match(loopEditSource, /numberOfLines=\{1\}[\s\S]*?ellipsizeMode="tail"[\s\S]*?\{profile\.displayName\}/);
});

test('LoopEditScreen previews interval minutes with readable cadence labels', () => {
  assert.match(loopEditSource, /function formatLoopIntervalLabel\(minutes: number\): string/);
  assert.match(loopEditSource, /minutes === 60\) return 'Hourly'/);
  assert.match(loopEditSource, /minutes === 1440\) return 'Daily'/);
  assert.match(loopEditSource, /function getLoopIntervalPreview\(intervalInput: string\): \{ text: string; isInvalid: boolean \}/);
  assert.match(loopEditSource, /return \{ text: 'Examples: 60 = Hourly • 1440 = Daily', isInvalid: false \};/);
  assert.match(loopEditSource, /return \{ text: 'Use whole minutes, like 60 for Hourly or 1440 for Daily\.', isInvalid: true \};/);
  assert.match(loopEditSource, /return \{ text: `Schedule: \$\{formatLoopIntervalLabel\(minutes\)\}`, isInvalid: false \};/);
  assert.match(loopEditSource, /const intervalPreview = getLoopIntervalPreview\(formData\.intervalMinutes\);/);
  assert.match(loopEditSource, /<Text style=\{\[styles\.intervalHelperText, intervalPreview\.isInvalid && styles\.intervalHelperTextWarning\]\}>[\s\S]*?\{intervalPreview\.text\}[\s\S]*?<\/Text>/);
  assert.match(loopEditSource, /intervalHelperText:\s*\{[\s\S]*?lineHeight:\s*17/);
  assert.match(loopEditSource, /intervalHelperTextWarning:\s*\{[\s\S]*?color:\s*theme\.colors\.destructive/);
});

test('AgentEditScreen wraps edit-flow switches in named mobile-sized controls', () => {
  assert.match(agentEditSource, /const switchTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\)/);
  assert.match(agentEditSource, /Platform\.OS === 'web'[\s\S]*?styles\.switchTrack/);
  assert.match(agentEditSource, /<Switch[\s\S]*?accessible=\{false\}[\s\S]*?value=\{enabled\}/);
  assert.match(agentEditSource, /style=\{styles\.switchButton\}[\s\S]*?createSwitchAccessibilityLabel\('Agent enabled'\)/);
  assert.match(agentEditSource, /createSwitchAccessibilityLabel\('Auto spawn'\)/);
  assert.match(agentEditSource, /accessibilityState=\{\{ checked: formData\.enabled \}\}/);
  assert.match(agentEditSource, /accessibilityState=\{\{ checked: formData\.autoSpawn \}\}/);
});

test('AgentEditScreen makes missing server config explicit before the primary save action', () => {
  assert.match(agentEditSource, /if \(!settingsClient\) \{[\s\S]*?setError\('Configure Base URL and API key in Settings before saving'\);[\s\S]*?return;[\s\S]*?\}/);
  assert.match(agentEditSource, /const hasDisplayName = formData\.displayName\.trim\(\)\.length > 0;/);
  assert.match(agentEditSource, /const saveValidationMessage = !hasDisplayName[\s\S]*?Add a display name to enable saving\./);
  assert.match(agentEditSource, /const isSaveDisabled = isSaving \|\| !settingsClient \|\| !!saveValidationMessage;/);
  assert.match(agentEditSource, /!settingsClient && \([\s\S]*?Configure Base URL and API key in Settings to save changes\.[\s\S]*?\)/);
  assert.match(agentEditSource, /settingsClient && saveValidationMessage && \([\s\S]*?styles\.saveHelperText[\s\S]*?\{saveValidationMessage\}[\s\S]*?\)/);
  assert.match(agentEditSource, /style=\{\[styles\.saveButton, isSaveDisabled && styles\.saveButtonDisabled\]\}/);
  assert.match(agentEditSource, /disabled=\{isSaveDisabled\}/);
  assert.match(agentEditSource, /saveHelperText:\s*\{[\s\S]*?fontSize:\s*12,[\s\S]*?color:\s*theme\.colors\.mutedForeground/);
});

test('AgentEditScreen gives the primary save action explicit mobile button semantics', () => {
  assert.match(agentEditSource, /const saveButtonAccessibilityLabel = createButtonAccessibilityLabel\(isEditing \? 'Save agent changes' : 'Create agent'\);/);
  assert.match(agentEditSource, /const saveButtonAccessibilityHint = !settingsClient[\s\S]*?Configure Base URL and API key in Settings before saving this agent\.[\s\S]*?Saving this agent now\.[\s\S]*?saveValidationMessage[\s\S]*?Saves your changes to this agent\.[\s\S]*?Creates this agent with the current settings\./);
  assert.match(agentEditSource, /accessibilityRole="button"[\s\S]*?accessibilityLabel=\{saveButtonAccessibilityLabel\}[\s\S]*?accessibilityHint=\{saveButtonAccessibilityHint\}[\s\S]*?accessibilityState=\{\{ disabled: isSaveDisabled, busy: isSaving \}\}/);
});

test('LoopEditScreen wraps the enabled switch in a named mobile-sized control', () => {
  assert.match(loopEditSource, /const switchTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\)/);
  assert.match(loopEditSource, /Platform\.OS === 'web'[\s\S]*?styles\.switchTrack/);
  assert.match(loopEditSource, /<Switch[\s\S]*?accessible=\{false\}[\s\S]*?value=\{enabled\}/);
  assert.match(loopEditSource, /style=\{styles\.switchButton\}[\s\S]*?createSwitchAccessibilityLabel\('Loop enabled'\)/);
  assert.match(loopEditSource, /accessibilityState=\{\{ checked: formData\.enabled \}\}/);
});

test('LoopEditScreen gives the primary save action explicit mobile button semantics', () => {
  assert.match(loopEditSource, /const trimmedName = formData\.name\.trim\(\);/);
  assert.match(loopEditSource, /const trimmedPrompt = formData\.prompt\.trim\(\);/);
  assert.match(loopEditSource, /const trimmedIntervalMinutes = formData\.intervalMinutes\.trim\(\);/);
  assert.match(loopEditSource, /const saveValidationMessage = !trimmedName && !trimmedPrompt[\s\S]*?Add a name and prompt to enable saving\.[\s\S]*?Add a name to enable saving\.[\s\S]*?Add a prompt to enable saving\.[\s\S]*?Enter a valid interval in whole minutes to enable saving\./);
  assert.match(loopEditSource, /const isSaveDisabled = isSaving \|\| !settingsClient \|\| !!saveValidationMessage;/);
  assert.match(loopEditSource, /const saveButtonAccessibilityLabel = createButtonAccessibilityLabel\(isEditing \? 'Save loop changes' : 'Create loop'\);/);
  assert.match(loopEditSource, /const saveButtonAccessibilityHint = !settingsClient[\s\S]*?Configure Base URL and API key in Settings before saving this loop\.[\s\S]*?Saving this loop now\.[\s\S]*?saveValidationMessage[\s\S]*?Saves your changes to this loop\.[\s\S]*?Creates this loop with the current settings\./);
  assert.match(loopEditSource, /settingsClient && saveValidationMessage && \([\s\S]*?styles\.saveHelperText[\s\S]*?\{saveValidationMessage\}[\s\S]*?\)/);
  assert.match(loopEditSource, /accessibilityRole="button"[\s\S]*?accessibilityLabel=\{saveButtonAccessibilityLabel\}[\s\S]*?accessibilityHint=\{saveButtonAccessibilityHint\}[\s\S]*?accessibilityState=\{\{ disabled: isSaveDisabled, busy: isSaving \}\}/);
  assert.match(loopEditSource, /saveHelperText:\s*\{[\s\S]*?fontSize:\s*12,[\s\S]*?color:\s*theme\.colors\.mutedForeground/);
});
