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
  assert.match(sheetSource, /<Text style=\{styles\.currentAgentBadgeLabel\}>Current agent<\/Text>/);
  assert.match(sheetSource, /<Text[\s\S]*?style=\{styles\.currentAgentBadgeText\}[\s\S]*?numberOfLines=\{2\}[\s\S]*?ellipsizeMode="tail"[\s\S]*?\{currentAgentName\}/);
  assert.match(sheetSource, /No switchable agents yet/);
  assert.match(sheetSource, /Manage delegation agents in Settings → Agents\./);
  assert.match(sheetSource, /currentAgentBadge:\s*\{[\s\S]*?maxWidth:\s*'100%'[\s\S]*?alignItems:\s*'center'/);
  assert.match(sheetSource, /currentAgentBadgeText:\s*\{[\s\S]*?textAlign:\s*'center'[\s\S]*?maxWidth:\s*'100%'[\s\S]*?flexShrink:\s*1/);
});

test('offers a mobile-friendly path back to agent settings from the empty state', () => {
  assert.match(sheetSource, /navigation\.navigate\('Settings'\)/);
  assert.match(sheetSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Open agent settings'\)\}/);
  assert.match(sheetSource, /\{selectorMode === 'acp' \? 'No main agents ready yet' : 'No switchable agents yet'\}[\s\S]*?style=\{styles\.manageAgentsButton\}[\s\S]*?activeOpacity=\{0\.7\}/);
  assert.match(sheetSource, /manageAgentsButton:\s*\{[\s\S]*?\.\.\.actionButtonTouchTarget,[\s\S]*?alignSelf:\s*'stretch'/);
  assert.match(sheetSource, /manageAgentsButtonText:\s*\{[\s\S]*?textAlign:\s*'center'/);
});

test('turns the missing-config selector error into a direct settings escape hatch', () => {
  assert.match(sheetSource, /const missingConfigError = 'Configure server URL and API key in Settings to switch agents\.'/);
  assert.match(sheetSource, /const isMissingConfigError = error === missingConfigError;/);
  assert.match(sheetSource, /\{isMissingConfigError \? \([\s\S]*?style=\{styles\.manageAgentsButton\}[\s\S]*?onPress=\{handleOpenAgentSettings\}[\s\S]*?createButtonAccessibilityLabel\('Open agent settings'\)[\s\S]*?Returns to Settings so you can add server details and review agent mode\.[\s\S]*?Open Agent Settings/);
});

test('keeps the current agent visible through selector-sheet errors so the failure feels recoverable', () => {
  assert.match(sheetSource, /const errorSupportText = isMissingConfigError[\s\S]*?Your current agent stays active\. Open Settings to finish connecting this server and review agent mode\.[\s\S]*?Your current agent stays active while you retry loading the available options\./);
  assert.match(sheetSource, /\) : error \? \([\s\S]*?<View style=\{styles\.errorContainer\}>[\s\S]*?<View style=\{styles\.currentAgentBadge\}>[\s\S]*?<Text style=\{styles\.currentAgentBadgeLabel\}>Current agent<\/Text>[\s\S]*?\{currentAgentName\}[\s\S]*?<Text style=\{styles\.errorText\}>\{error\}<\/Text>[\s\S]*?<Text style=\{styles\.errorSupportText\}>\{errorSupportText\}<\/Text>/);
  assert.match(sheetSource, /errorContainer:\s*\{[\s\S]*?paddingHorizontal:\s*spacing\.sm,[\s\S]*?gap:\s*spacing\.sm/);
  assert.match(sheetSource, /errorSupportText:\s*\{[\s\S]*?textAlign:\s*'center',[\s\S]*?lineHeight:\s*20/);
});

test('describes ACP-mode main-agent choices as command-based instead of ACP-only', () => {
  assert.match(sheetSource, /const emptyStateMessage = selectorMode === 'acp'[\s\S]*?No enabled command-based agents are available yet\. Add or enable an ACP or Stdio agent in Settings → Agents to use it as your main agent\./);
  assert.match(sheetSource, /selectorMode === 'acp'[\s\S]*?Choose which enabled command-based agent should act as the main agent for new chats\./);
  assert.match(sheetSource, /selectorMode === 'acp' \? 'No main agents ready yet' : 'No switchable agents yet'/);
});

test('makes the selector loading state read as active progress while keeping the current agent visible', () => {
  assert.match(sheetSource, /\{isLoading \? \([\s\S]*?style=\{styles\.loadingStateCard\}[\s\S]*?accessible[\s\S]*?accessibilityRole="progressbar"[\s\S]*?accessibilityLabel="Loading available agents"[\s\S]*?accessibilityHint="Your current agent stays active while the available agent options load\."[\s\S]*?<View style=\{styles\.currentAgentBadge\}>[\s\S]*?<Text style=\{styles\.currentAgentBadgeLabel\}>Current agent<\/Text>[\s\S]*?\{currentAgentName\}[\s\S]*?<View style=\{styles\.loadingStatusRow\}>[\s\S]*?<ActivityIndicator size="small" color=\{theme\.colors\.primary\} \/>[\s\S]*?<Text style=\{styles\.loadingStatusText\}>Loading available agents…<\/Text>[\s\S]*?<Text style=\{styles\.loadingText\}>Your current agent stays active while options load\.<\/Text>/);
  assert.match(sheetSource, /loadingStateCard:\s*\{[\s\S]*?alignItems:\s*'center',[\s\S]*?gap:\s*spacing\.sm/);
  assert.match(sheetSource, /loadingStatusRow:\s*\{[\s\S]*?flexDirection:\s*'row'[\s\S]*?alignItems:\s*'center'[\s\S]*?gap:\s*spacing\.sm/);
  assert.match(sheetSource, /loadingStatusText:\s*\{[\s\S]*?color:\s*theme\.colors\.primary,[\s\S]*?fontWeight:\s*'600'/);
  assert.match(sheetSource, /loadingText:\s*\{[\s\S]*?textAlign:\s*'center',[\s\S]*?lineHeight:\s*20/);
});

test('keeps selector-sheet retry and cancel actions mobile-sized with explicit button semantics for recoverable errors', () => {
  assert.match(sheetSource, /const actionButtonTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\)/);
  assert.match(sheetSource, /\) : \([\s\S]*?style=\{styles\.retryButton\}[\s\S]*?accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\('Retry loading agents'\)/);
  assert.match(sheetSource, /accessibilityHint="Attempts to load the available agents again\."/);
  assert.match(sheetSource, /retryButton:\s*\{[\s\S]*?\.\.\.actionButtonTouchTarget/);
  assert.match(sheetSource, /style=\{\[styles\.closeButton, isSwitching && styles\.closeButtonDisabled\]\}[\s\S]*?accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\('Close agent selector'\)/);
  assert.match(sheetSource, /accessibilityHint=\{isSwitching[\s\S]*?Wait for the current agent switch to finish before dismissing this sheet\.[\s\S]*?: 'Dismisses this sheet and returns to the current screen\.'/);
  assert.match(sheetSource, /closeButton:\s*\{[\s\S]*?\.\.\.actionButtonTouchTarget[\s\S]*?width:\s*'100%'/);
});

test('keeps long agent names and descriptions stable inside selector rows on narrow screens', () => {
  assert.match(sheetSource, /<Text[\s\S]*?style=\{\[styles\.profileName, isSelected && styles\.profileNameSelected\]\}[\s\S]*?numberOfLines=\{2\}[\s\S]*?ellipsizeMode="tail"[\s\S]*?\{item\.name\}/);
  assert.match(sheetSource, /profileInfo:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,[\s\S]*?marginRight:/);
  assert.match(sheetSource, /profileName:\s*\{[\s\S]*?lineHeight:\s*20,[\s\S]*?flexShrink:\s*1/);
  assert.match(sheetSource, /profileDescription:\s*\{[\s\S]*?flexShrink:\s*1/);
  assert.match(sheetSource, /profileCurrentBadge:\s*\{[\s\S]*?alignSelf:\s*'flex-start',[\s\S]*?flexShrink:\s*0/);
  assert.match(sheetSource, /profilePendingBadge:\s*\{[\s\S]*?alignSelf:\s*'flex-start',[\s\S]*?flexShrink:\s*0/);
});

test('gives selector rows the shared 44px mobile touch-target baseline', () => {
  assert.match(sheetSource, /const profileItemTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalPadding:\s*spacing\.sm,[\s\S]*?verticalPadding:\s*spacing\.md,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(sheetSource, /profileItem:\s*\{[\s\S]*?\.\.\.profileItemTouchTarget,[\s\S]*?flexDirection:\s*'row',[\s\S]*?justifyContent:\s*'space-between'/);
});

test('drops the generic ACP placeholder subtitle while keeping real selector descriptions', () => {
  assert.match(sheetSource, /const secondaryDescription = item\.guidelines && item\.guidelines !== 'ACP main agent'[\s\S]*?\? item\.guidelines[\s\S]*?: null;/);
  assert.match(sheetSource, /\{secondaryDescription && \([\s\S]*?<Text style=\{styles\.profileDescription\}[\s\S]*?\{secondaryDescription\}/);
});

test('makes the selected agent row read as the current state instead of only a checkmark', () => {
  assert.match(sheetSource, /const selectionAccessibilityLabel = isPending[\s\S]*?`Switching to \$\{item\.name\} agent`[\s\S]*?`Current \$\{item\.name\} agent`[\s\S]*?`Select \$\{item\.name\} agent`;/);
  assert.match(sheetSource, /const selectionAccessibilityHint = isPending[\s\S]*?Agent switch in progress\. Wait for the current request to finish\.[\s\S]*?Currently selected\. Double tap to close this selector and keep this agent\.[\s\S]*?Switches the current agent to this option\./);
  assert.match(sheetSource, /accessibilityState=\{\{ selected: isSelected, disabled: isSwitching, busy: isPending \}\}/);
  assert.match(sheetSource, /\{isPending \? \([\s\S]*?\) : isSelected && \([\s\S]*?<View style=\{styles\.profileCurrentBadge\}>[\s\S]*?<Text style=\{styles\.profileCurrentBadgeText\}>Current<\/Text>/);
  assert.match(sheetSource, /profileItemSelected:\s*\{[\s\S]*?borderWidth:\s*1,[\s\S]*?borderColor:\s*theme\.colors\.primary \+ '33'/);
  assert.match(sheetSource, /profileCurrentBadge:\s*\{[\s\S]*?backgroundColor:\s*theme\.colors\.primary \+ '16'[\s\S]*?borderColor:\s*theme\.colors\.primary \+ '33'/);
});

test('shows switching progress and temporarily prevents dismissing the sheet mid-switch', () => {
  assert.match(sheetSource, /const \[pendingProfileId, setPendingProfileId\] = useState<string \| null>\(null\);/);
  assert.match(sheetSource, /const \[pendingProfileName, setPendingProfileName\] = useState<string \| null>\(null\);/);
  assert.match(sheetSource, /const handleDismiss = useCallback\(\(\) => \{[\s\S]*?if \(isSwitching\) return;[\s\S]*?onClose\(\);[\s\S]*?\}, \[isSwitching, onClose\]\);/);
  assert.match(sheetSource, /setPendingProfileId\(profile\.id\);[\s\S]*?setPendingProfileName\(profile\.name\);[\s\S]*?setIsSwitching\(true\);/);
  assert.match(sheetSource, /finally \{[\s\S]*?setIsSwitching\(false\);[\s\S]*?setPendingProfileId\(null\);[\s\S]*?setPendingProfileName\(null\);[\s\S]*?\}/);
  assert.match(sheetSource, /const switchingMessage = pendingProfileName[\s\S]*?`Switching to \$\{pendingProfileName\}…`[\s\S]*?: 'Switching agents…';/);
  assert.match(sheetSource, /onRequestClose=\{handleDismiss\}/);
  assert.match(sheetSource, /<Pressable style=\{styles\.backdrop\} onPress=\{handleDismiss\} disabled=\{isSwitching\}>/);
  assert.match(sheetSource, /\{isSwitching && \([\s\S]*?<View style=\{styles\.switchingStatus\}>[\s\S]*?<ActivityIndicator size="small" color=\{theme\.colors\.primary\} \/>[\s\S]*?<Text style=\{styles\.switchingStatusText\}>\{switchingMessage\}<\/Text>/);
  assert.match(sheetSource, /style=\{\[styles\.closeButton, isSwitching && styles\.closeButtonDisabled\]\}[\s\S]*?disabled=\{isSwitching\}[\s\S]*?accessibilityState=\{\{ disabled: isSwitching \}\}/);
  assert.match(sheetSource, /Wait for the current agent switch to finish before dismissing this sheet\./);
  assert.match(sheetSource, /\{isSwitching \? 'Switching…' : 'Cancel'\}/);
});

test('marks the tapped selector row as pending while an agent switch is in flight', () => {
  assert.match(sheetSource, /const isPending = pendingProfileId === item\.id;/);
  assert.match(sheetSource, /const isBlockedBySwitch = isSwitching && !isPending && !isSelected;/);
  assert.match(sheetSource, /const selectionAccessibilityLabel = isPending[\s\S]*?`Switching to \$\{item\.name\} agent`[\s\S]*?`Current \$\{item\.name\} agent`[\s\S]*?`Select \$\{item\.name\} agent`;/);
  assert.match(sheetSource, /const selectionAccessibilityHint = isPending[\s\S]*?Agent switch in progress\. Wait for the current request to finish\.[\s\S]*?Another agent switch is in progress\. Wait for it to finish before changing this selection\.[\s\S]*?Currently selected\. Double tap to close this selector and keep this agent\.[\s\S]*?Switches the current agent to this option\./);
  assert.match(sheetSource, /style=\{\[[\s\S]*?styles\.profileItem,[\s\S]*?isSelected && styles\.profileItemSelected,[\s\S]*?isPending && styles\.profileItemPending,[\s\S]*?isBlockedBySwitch && styles\.profileItemBlocked,[\s\S]*?\]\}/);
  assert.match(sheetSource, /accessibilityState=\{\{ selected: isSelected, disabled: isSwitching, busy: isPending \}\}/);
  assert.match(sheetSource, /\{isPending \? \([\s\S]*?<View style=\{styles\.profilePendingBadge\}>[\s\S]*?<ActivityIndicator size="small" color=\{theme\.colors\.primary\} \/>[\s\S]*?<Text style=\{styles\.profilePendingBadgeText\}>Switching…<\/Text>/);
  assert.match(sheetSource, /profileItemPending:\s*\{[\s\S]*?backgroundColor:\s*theme\.colors\.primary \+ '12',[\s\S]*?borderColor:\s*theme\.colors\.primary \+ '2E'/);
  assert.match(sheetSource, /profileItemBlocked:\s*\{[\s\S]*?opacity:\s*0\.6/);
  assert.match(sheetSource, /profilePendingBadge:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?gap:\s*spacing\.xs,[\s\S]*?borderColor:\s*theme\.colors\.primary \+ '2E'/);
});

test('keeps the current agent at the top of the selector list so state is visible without scrolling', () => {
  assert.match(sheetSource, /const orderedProfiles = useMemo\(\(\) => \{[\s\S]*?if \(profiles\.length <= 1\) return profiles;[\s\S]*?const currentProfileId = currentProfile\?\.id;[\s\S]*?if \(!currentProfileId\) return profiles;[\s\S]*?const currentProfileIndex = profiles\.findIndex\(profile => profile\.id === currentProfileId\);[\s\S]*?if \(currentProfileIndex <= 0\) return profiles;[\s\S]*?const reorderedProfiles = profiles\.slice\(\);[\s\S]*?const \[currentProfileOption\] = reorderedProfiles\.splice\(currentProfileIndex, 1\);[\s\S]*?return currentProfileOption \? \[currentProfileOption, \.\.\.reorderedProfiles\] : profiles;[\s\S]*?\}, \[profiles, currentProfile\?\.id\]\);/);
  assert.match(sheetSource, /<FlatList[\s\S]*?data=\{orderedProfiles\}/);
});

test('keeps current state visible when the active agent is missing from the loaded selector options', () => {
  assert.match(sheetSource, /const isCurrentSelectionMissingFromList = Boolean\([\s\S]*?currentProfile\?\.id[\s\S]*?orderedProfiles\.length > 0[\s\S]*?!orderedProfiles\.some\(\(profile\) => profile\.id === currentProfile\.id\)[\s\S]*?\);/);
  assert.match(sheetSource, /const currentSelectionNoticeTitle = selectorMode === 'acp'[\s\S]*?'Current main agent unavailable in this list'[\s\S]*?'Current agent unavailable in this list';/);
  assert.match(sheetSource, /const currentSelectionNoticeText = selectorMode === 'acp'[\s\S]*?This agent stays active until you switch\.[\s\S]*?Settings → Agents if this main agent should be available again\.[\s\S]*?This agent stays active until you switch\.[\s\S]*?Settings → Agents if this profile should still be switchable\./);
  assert.match(sheetSource, /\{isCurrentSelectionMissingFromList && \([\s\S]*?<View style=\{styles\.currentSelectionNoticeCard\}>[\s\S]*?<Text style=\{styles\.currentSelectionNoticeTitle\}>\{currentSelectionNoticeTitle\}<\/Text>[\s\S]*?<View style=\{styles\.currentAgentBadge\}>[\s\S]*?<Text style=\{styles\.currentAgentBadgeLabel\}>Current agent<\/Text>[\s\S]*?\{currentAgentName\}[\s\S]*?<Text style=\{styles\.currentSelectionNoticeText\}>\{currentSelectionNoticeText\}<\/Text>[\s\S]*?\)\}/);
  assert.match(sheetSource, /currentSelectionNoticeCard:\s*\{[\s\S]*?marginBottom:\s*spacing\.sm,[\s\S]*?padding:\s*spacing\.md,[\s\S]*?borderRadius:\s*radius\.lg,[\s\S]*?backgroundColor:\s*theme\.colors\.secondary,[\s\S]*?alignItems:\s*'center'/);
  assert.match(sheetSource, /currentSelectionNoticeText:\s*\{[\s\S]*?textAlign:\s*'center',[\s\S]*?lineHeight:\s*20/);
});