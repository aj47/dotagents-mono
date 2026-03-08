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

test('AgentEditScreen explains the selected connection type and keeps ACP on the command-based path', () => {
  assert.match(agentEditSource, /const CONNECTION_TYPE_DETAILS: Record<ConnectionType, \{ helperText: string; accessibilityHint: string \}> = \{/);
  assert.match(agentEditSource, /helperText: 'Runs an ACP-compatible agent from a local command\.'/);
  assert.match(agentEditSource, /helperText: 'Starts a local process and communicates over stdio\.'/);
  assert.match(agentEditSource, /helperText: 'Connects to a remote HTTP agent endpoint\.'/);
  assert.match(agentEditSource, /const showCommandFields = formData\.connectionType === 'acp' \|\| formData\.connectionType === 'stdio';/);
  assert.match(agentEditSource, /const showBaseUrlField = formData\.connectionType === 'remote';/);
  assert.match(agentEditSource, /const selectedConnectionTypeDetails = CONNECTION_TYPE_DETAILS\[formData\.connectionType\];/);
  assert.match(agentEditSource, /const commandPlaceholder = formData\.connectionType === 'acp' \? 'claude-code-acp' : 'node';/);
  assert.match(agentEditSource, /const argumentsPlaceholder = formData\.connectionType === 'acp' \? '--acp' : 'agent\.js --port 3000';/);
  assert.match(agentEditSource, /<Text style=\{styles\.connectionTypeHelperText\}>\{selectedConnectionTypeDetails\.helperText\}<\/Text>/);
  assert.match(agentEditSource, /\{showCommandFields && \([\s\S]*?placeholder=\{commandPlaceholder\}[\s\S]*?placeholder=\{argumentsPlaceholder\}[\s\S]*?renderFieldLabel\('Working Directory'/);
  assert.match(agentEditSource, /\{showBaseUrlField && \([\s\S]*?renderFieldLabel\('Base URL'/);
  assert.match(agentEditSource, /connectionTypeHelperText:\s*\{[\s\S]*?lineHeight:\s*17/);
});

test('AgentEditScreen only exposes auto spawn for command-based agents and clears it when switching away', () => {
  assert.match(agentEditSource, /const supportsAutoSpawn = showCommandFields;/);
  assert.match(agentEditSource, /const handleConnectionTypeChange = useCallback\(\(connectionType: ConnectionType\) => \{[\s\S]*?connectionType,[\s\S]*?autoSpawn: connectionType === 'acp' \|\| connectionType === 'stdio' \? prev\.autoSpawn : false,[\s\S]*?\}\)\);/);
  assert.match(agentEditSource, /onPress=\{\(\) => handleConnectionTypeChange\(ct\.value\)\}/);
  assert.match(agentEditSource, /\{supportsAutoSpawn && \([\s\S]*?<Text style=\{styles\.switchLabel\}>Auto Spawn<\/Text>[\s\S]*?<Text style=\{styles\.switchHelperText\}>Start this command-based agent automatically when DotAgents starts<\/Text>[\s\S]*?accessibilityHint="Starts this command-based agent automatically when DotAgents starts\."[\s\S]*?\)\}/);
  assert.doesNotMatch(agentEditSource, /Start agent automatically on app launch|app launches\./);
});

test('AgentEditScreen makes built-in read-only fields look passive instead of editable', () => {
  assert.match(agentEditSource, /const builtInWarningText = supportsAutoSpawn[\s\S]*?You can still update guidelines, enabled, and auto spawn\.[\s\S]*?You can still update guidelines and enabled state\./);
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

test('AgentEditScreen gives built-in read-only text inputs explicit accessibility context', () => {
  assert.match(agentEditSource, /createTextInputAccessibilityLabel/);
  assert.match(agentEditSource, /const getReadOnlyInputAccessibilityProps = \(fieldName: string\) => \(\{[\s\S]*?accessibilityLabel: `\$\{createTextInputAccessibilityLabel\(fieldName\)\}, read only`[\s\S]*?accessibilityHint: 'Built-in agents keep this field fixed here\.'/);
  assert.match(agentEditSource, /getReadOnlyInputAccessibilityProps\('Display Name'\)/);
  assert.match(agentEditSource, /getReadOnlyInputAccessibilityProps\('Description'\)/);
  assert.match(agentEditSource, /getReadOnlyInputAccessibilityProps\('Command'\)/);
  assert.match(agentEditSource, /getReadOnlyInputAccessibilityProps\('Arguments'\)/);
  assert.match(agentEditSource, /getReadOnlyInputAccessibilityProps\('Working Directory'\)/);
  assert.match(agentEditSource, /getReadOnlyInputAccessibilityProps\('Base URL'\)/);
  assert.match(agentEditSource, /getReadOnlyInputAccessibilityProps\('System Prompt'\)/);
});

test('AgentEditScreen clarifies that Description is UI-only and not agent instruction text', () => {
  assert.match(agentEditSource, /renderFieldLabel\('Description', \{ readOnly: isBuiltInAgent \}\)/);
  assert.match(agentEditSource, /placeholder="What this agent does\.\.\."/);
  assert.match(agentEditSource, /<Text style=\{styles\.helperText\}>Shown only in the UI\. Use Guidelines for instructions the agent should follow\.<\/Text>/);
});

test('AgentEditScreen explains how Guidelines build on the core system prompt', () => {
  assert.match(agentEditSource, /<Text style=\{styles\.label\}>Guidelines<\/Text>/);
  assert.match(agentEditSource, /placeholder="Additional instructions for the agent\.\.\."/);
  assert.match(agentEditSource, /accessibilityHint="Adds extra instructions for this agent on top of the core tool-calling system prompt\."/);
  assert.match(agentEditSource, /<Text style=\{styles\.helperText\}>Additional instructions for this agent\. These are appended to the core tool-calling system prompt\.<\/Text>/);
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

test('LoopEditScreen explains when no saved profiles are available to assign', () => {
  assert.match(loopEditSource, /const \[profileLoadError, setProfileLoadError\] = useState<string \| null>\(null\);/);
  assert.match(loopEditSource, /setProfileLoadError\(null\);[\s\S]*?settingsClient\.getAgentProfiles\(\)/);
  assert.match(loopEditSource, /setProfileLoadError\(err\.message \|\| 'Failed to load agent profiles'\);/);
  assert.match(loopEditSource, /const showNoSavedProfilesNotice = !!settingsClient && !isLoadingProfiles && !profileLoadError && profiles\.length === 0;/);
  assert.match(loopEditSource, /showNoSavedProfilesNotice && \([\s\S]*?<View style=\{styles\.profileNoticeContainer\}>[\s\S]*?No saved profiles yet\. This loop can still run with No profile, or you can create an agent in Settings → Agents and come back to assign it here\.[\s\S]*?<\/View>[\s\S]*?\)/);
});

test('LoopEditScreen makes profile loading feel in-progress instead of passive helper text', () => {
  assert.match(loopEditSource, /const showProfileLoadingNotice = !!settingsClient && isLoadingProfiles;/);
  assert.match(loopEditSource, /showProfileLoadingNotice && \([\s\S]*?<View style=\{styles\.profileNoticeContainer\}>[\s\S]*?<View style=\{styles\.profileLoadingNoticeRow\}>[\s\S]*?<ActivityIndicator size="small" color=\{theme\.colors\.primary\} \/>[\s\S]*?Loading saved profiles\. You can keep No profile if you want this loop unassigned\.[\s\S]*?<\/View>[\s\S]*?\)/);
  assert.match(loopEditSource, /profileLoadingNoticeRow:\s*\{[\s\S]*?flexDirection:\s*'row'[\s\S]*?alignItems:\s*'center'[\s\S]*?gap:\s*spacing\.sm/);
  assert.match(loopEditSource, /profileLoadingNoticeText:\s*\{[\s\S]*?flex:\s*1/);
  assert.doesNotMatch(loopEditSource, /\{isLoadingProfiles && <Text style=\{styles\.helperText\}>Loading profiles\.\.\.<\/Text>\}/);
});

test('LoopEditScreen explains when the loop is intentionally left unassigned', () => {
  assert.match(loopEditSource, /const showNoProfileSelectedHelper = !!settingsClient && !isLoadingProfiles && !profileLoadError && profiles\.length > 0 && !formData\.profileId;/);
  assert.match(loopEditSource, /showNoProfileSelectedHelper && \([\s\S]*?No profile selected\. This loop will run without a saved profile until you choose one\.[\s\S]*?\)/);
});

test('LoopEditScreen surfaces load and save errors in a dedicated alert block', () => {
  assert.match(loopEditSource, /\{error && \([\s\S]*?<View style=\{styles\.errorContainer\}>[\s\S]*?<Text style=\{styles\.errorText\}>⚠️ \{error\}<\/Text>[\s\S]*?\)\}/);
  assert.match(loopEditSource, /errorContainer:\s*\{[\s\S]*?backgroundColor:\s*theme\.colors\.destructive \+ '20'[\s\S]*?padding:\s*spacing\.md[\s\S]*?borderRadius:\s*radius\.md[\s\S]*?marginBottom:\s*spacing\.md/);
  assert.match(loopEditSource, /errorText:\s*\{[\s\S]*?color:\s*theme\.colors\.destructive,[\s\S]*?fontSize:\s*14,[\s\S]*?lineHeight:\s*20/);
});

test('LoopEditScreen keeps profile load failures local to the Agent Profile section', () => {
  assert.match(loopEditSource, /const \[profileReloadNonce, setProfileReloadNonce\] = useState\(0\);/);
  assert.match(loopEditSource, /\}, \[settingsClient, profileReloadNonce\]\);/);
  assert.match(loopEditSource, /const handleRetryProfiles = useCallback\(\(\) => \{[\s\S]*?if \(isLoadingProfiles \|\| !settingsClient\) return;[\s\S]*?setProfileReloadNonce\(prev => prev \+ 1\);[\s\S]*?\}, \[isLoadingProfiles, settingsClient\]\);/);
  assert.match(loopEditSource, /const showProfileLoadErrorNotice = !!settingsClient && !isLoadingProfiles && !!profileLoadError;/);
  assert.match(loopEditSource, /showProfileLoadErrorNotice && \([\s\S]*?style=\{\[styles\.profileNoticeContainer, styles\.profileNoticeWarningContainer\]\}[\s\S]*?Saved profiles couldn't load right now\. You can still save this loop with No profile, or retry loading them\.[\s\S]*?style=\{styles\.profileNoticeRetryButton\}[\s\S]*?onPress=\{handleRetryProfiles\}[\s\S]*?createButtonAccessibilityLabel\('Retry loading saved profiles'\)[\s\S]*?Attempts to load saved profiles for this loop again\.[\s\S]*?Retry profiles[\s\S]*?\)/);
  assert.match(loopEditSource, /const noticeActionTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(loopEditSource, /profileNoticeRetryButton:\s*\{[\s\S]*?\.\.\.noticeActionTouchTarget,[\s\S]*?alignSelf:\s*'flex-start'/);
  assert.match(loopEditSource, /profileNoticeWarningContainer:\s*\{[\s\S]*?backgroundColor:\s*theme\.colors\.destructive \+ '12',[\s\S]*?borderColor:\s*theme\.colors\.destructive \+ '24'/);
  assert.doesNotMatch(loopEditSource, /setError\(err\.message \|\| 'Failed to load agent profiles'\);/);
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

test('LoopEditScreen clarifies that Prompt is the instruction sent on each run', () => {
  assert.match(loopEditSource, /<Text style=\{styles\.label\}>Prompt \*<\/Text>/);
  assert.match(loopEditSource, /placeholder="Summarize the latest updates and notify me"/);
  assert.match(loopEditSource, /accessibilityHint="Sends this instruction to the agent each time the loop runs\."/);
  assert.match(loopEditSource, /<Text style=\{styles\.helperText\}>Sent to the agent every time this loop runs\.<\/Text>/);
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

test('AgentEditScreen explains what the Enabled switch controls in sub-agent flows', () => {
  assert.match(agentEditSource, /<Text style=\{styles\.switchLabel\}>Enabled<\/Text>[\s\S]*?<Text style=\{styles\.switchHelperText\}>Show this agent in delegation and ACP main-agent choices<\/Text>/);
  assert.match(agentEditSource, /accessibilityHint="Shows or hides this agent in delegation and ACP main-agent choices\."/);
});

test('AgentEditScreen makes missing server config explicit before the primary save action', () => {
  assert.match(agentEditSource, /if \(!settingsClient\) \{[\s\S]*?setError\('Configure Base URL and API key in Settings before saving'\);[\s\S]*?return;[\s\S]*?\}/);
  assert.match(agentEditSource, /const hasDisplayName = formData\.displayName\.trim\(\)\.length > 0;/);
  assert.match(agentEditSource, /const saveValidationMessage = !hasDisplayName[\s\S]*?Add a display name to enable saving\./);
  assert.match(agentEditSource, /const isSaveDisabled = isSaving \|\| !settingsClient \|\| !!saveValidationMessage;/);
  assert.match(agentEditSource, /settingsClient && saveValidationMessage && \([\s\S]*?styles\.saveHelperText[\s\S]*?\{saveValidationMessage\}[\s\S]*?\)/);
  assert.match(agentEditSource, /style=\{\[styles\.saveButton, isSaveDisabled && styles\.saveButtonDisabled\]\}/);
  assert.match(agentEditSource, /disabled=\{isSaveDisabled\}/);
  assert.match(agentEditSource, /saveHelperText:\s*\{[\s\S]*?fontSize:\s*12,[\s\S]*?color:\s*theme\.colors\.mutedForeground/);
});

test('AgentEditScreen surfaces missing server config in a dedicated blocking notice', () => {
  assert.match(agentEditSource, /!settingsClient && \([\s\S]*?<View style=\{styles\.blockingNoticeContainer\}>[\s\S]*?<Text style=\{styles\.blockingNoticeText\}>[\s\S]*?Saving is disabled until Base URL and API key are configured in Settings\.[\s\S]*?<\/Text>[\s\S]*?<\/View>[\s\S]*?\)/);
  assert.match(agentEditSource, /blockingNoticeContainer:\s*\{[\s\S]*?backgroundColor:\s*theme\.colors\.secondary,[\s\S]*?borderWidth:\s*1,[\s\S]*?borderColor:\s*theme\.colors\.border,[\s\S]*?padding:\s*spacing\.md,[\s\S]*?borderRadius:\s*radius\.md,[\s\S]*?marginBottom:\s*spacing\.md/);
  assert.match(agentEditSource, /blockingNoticeText:\s*\{[\s\S]*?color:\s*theme\.colors\.foreground,[\s\S]*?fontSize:\s*14,[\s\S]*?lineHeight:\s*20/);
});

test('AgentEditScreen adds a direct connection-settings recovery action when saving is blocked by missing config', () => {
  assert.match(agentEditSource, /const handleOpenConnectionSettings = useCallback\(\(\) => \{[\s\S]*?navigation\.navigate\('ConnectionSettings'\);[\s\S]*?\}, \[navigation\]\);/);
  assert.match(agentEditSource, /!settingsClient && \([\s\S]*?style=\{styles\.blockingNoticeActionButton\}[\s\S]*?onPress=\{handleOpenConnectionSettings\}[\s\S]*?createButtonAccessibilityLabel\('Open connection settings'\)[\s\S]*?accessibilityHint="Opens Connection settings so you can add Base URL and API key\."[\s\S]*?Open Connection Settings/);
  assert.match(agentEditSource, /blockingNoticeActionButton:\s*\{[\s\S]*?\.\.\.noticeActionTouchTarget,[\s\S]*?alignSelf:\s*'stretch',[\s\S]*?borderColor:\s*theme\.colors\.primary \+ '26',[\s\S]*?justifyContent:\s*'center'/);
  assert.match(agentEditSource, /blockingNoticeActionButtonText:\s*\{[\s\S]*?color:\s*theme\.colors\.primary,[\s\S]*?fontWeight:\s*'600',[\s\S]*?textAlign:\s*'center'/);
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

test('LoopEditScreen explains what the Enabled switch controls in sub-agent loops', () => {
  assert.match(loopEditSource, /<Text style=\{styles\.switchLabel\}>Enabled<\/Text>[\s\S]*?<Text style=\{styles\.switchHelperText\}>Pause or resume this loop&apos;s schedule without deleting it<\/Text>/);
  assert.match(loopEditSource, /accessibilityHint="Pauses or resumes this loop&apos;s schedule without deleting it\."/);
  assert.match(loopEditSource, /switchHelperText:\s*\{[\s\S]*?fontSize:\s*12,[\s\S]*?color:\s*theme\.colors\.mutedForeground/);
});

test('LoopEditScreen exposes run-on-startup state without dropping it on save', () => {
  assert.match(loopEditSource, /type LoopFormData = \{[\s\S]*?runOnStartup: boolean;[\s\S]*?\};/);
  assert.match(loopEditSource, /runOnStartup: loopFromRoute\.runOnStartup \?\? false,/);
  assert.match(loopEditSource, /runOnStartup: loop\.runOnStartup \?\? false,/);
  assert.match(loopEditSource, /runOnStartup: formData\.runOnStartup,/);
  assert.match(loopEditSource, /<Text style=\{styles\.switchLabel\}>Run on Startup<\/Text>[\s\S]*?<Text style=\{styles\.switchHelperText\}>If enabled, run once immediately when DotAgents starts before resuming the regular interval<\/Text>/);
  assert.match(loopEditSource, /onPress=\{\(\) => updateField\('runOnStartup', !formData\.runOnStartup\)\}/);
  assert.match(loopEditSource, /createSwitchAccessibilityLabel\('Run on startup'\)/);
  assert.match(loopEditSource, /accessibilityState=\{\{ checked: formData\.runOnStartup \}\}/);
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

test('LoopEditScreen surfaces missing server config in a dedicated blocking notice', () => {
  assert.match(loopEditSource, /!settingsClient && \([\s\S]*?<View style=\{styles\.blockingNoticeContainer\}>[\s\S]*?<Text style=\{styles\.blockingNoticeText\}>[\s\S]*?Saving is disabled until Base URL and API key are configured in Settings\.[\s\S]*?<\/Text>[\s\S]*?<\/View>[\s\S]*?\)/);
  assert.match(loopEditSource, /blockingNoticeContainer:\s*\{[\s\S]*?backgroundColor:\s*theme\.colors\.secondary,[\s\S]*?borderWidth:\s*1,[\s\S]*?borderColor:\s*theme\.colors\.border,[\s\S]*?padding:\s*spacing\.md,[\s\S]*?borderRadius:\s*radius\.md,[\s\S]*?marginBottom:\s*spacing\.md/);
  assert.match(loopEditSource, /blockingNoticeText:\s*\{[\s\S]*?color:\s*theme\.colors\.foreground,[\s\S]*?fontSize:\s*14,[\s\S]*?lineHeight:\s*20/);
});

test('LoopEditScreen adds a direct connection-settings recovery action when saving is blocked by missing config', () => {
  assert.match(loopEditSource, /const handleOpenConnectionSettings = useCallback\(\(\) => \{[\s\S]*?navigation\.navigate\('ConnectionSettings'\);[\s\S]*?\}, \[navigation\]\);/);
  assert.match(loopEditSource, /!settingsClient && \([\s\S]*?style=\{styles\.blockingNoticeActionButton\}[\s\S]*?onPress=\{handleOpenConnectionSettings\}[\s\S]*?createButtonAccessibilityLabel\('Open connection settings'\)[\s\S]*?accessibilityHint="Opens Connection settings so you can add Base URL and API key\."[\s\S]*?Open Connection Settings/);
  assert.match(loopEditSource, /blockingNoticeActionButton:\s*\{[\s\S]*?\.\.\.noticeActionTouchTarget,[\s\S]*?alignSelf:\s*'stretch',[\s\S]*?borderColor:\s*theme\.colors\.primary \+ '26',[\s\S]*?justifyContent:\s*'center'/);
  assert.match(loopEditSource, /blockingNoticeActionButtonText:\s*\{[\s\S]*?color:\s*theme\.colors\.primary,[\s\S]*?fontWeight:\s*'600',[\s\S]*?textAlign:\s*'center'/);
});
