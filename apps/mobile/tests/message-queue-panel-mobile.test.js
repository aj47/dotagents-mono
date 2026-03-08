const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const queuePanelSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'MessageQueuePanel.tsx'),
  'utf8'
);

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('makes busy queue state explicit instead of silently disabling Clear All', () => {
  assert.match(queuePanelSource, /const hasProcessingMessage = messages\.some\(\(m\) => m\.status === 'processing'\);/);
  assert.match(queuePanelSource, /const clearQueueAccessibilityHint = hasProcessingMessage[\s\S]*?processingCount === 1[\s\S]*?Wait for the active queued message to finish before clearing the rest of this queue\.[\s\S]*?Wait for the \$\{processingCount\} queued messages that are sending now to finish before clearing the rest of this queue\.[\s\S]*?Removes all queued messages for this conversation\./);
  assert.match(queuePanelSource, /const processingNoticeText = processingCount === 1[\s\S]*?One queued message is sending now\. Clear All stays disabled until it finishes\.[\s\S]*?\$\{processingCount\} queued messages are sending now\. Clear All stays disabled until they finish\./);
  assert.match(queuePanelSource, /\{hasProcessingMessage && !isListCollapsed && \([\s\S]*?<View style=\{styles\.processingNotice\}>[\s\S]*?<ActivityIndicator size="small" color=\{theme\.colors\.primary\} \/>[\s\S]*?\{processingNoticeText\}[\s\S]*?<\/View>[\s\S]*?\)\}/);
  assert.match(queuePanelSource, /processingNotice:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?backgroundColor:\s*`\$\{theme\.colors\.primary\}10`/);
  assert.match(queuePanelSource, /processingNoticeText:\s*\{[\s\S]*?lineHeight:\s*18,[\s\S]*?color:\s*theme\.colors\.primary/);
});

test('turns the queue header disclosure into a broad mobile tap target while keeping clear semantics separate', () => {
  assert.match(queuePanelSource, /const headerActionTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(queuePanelSource, /const headerDisclosureTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalPadding:\s*0,[\s\S]*?verticalPadding:\s*0,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(queuePanelSource, /headerDisclosureButton:\s*\{[\s\S]*?\.\.\.headerDisclosureTouchTarget,[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,[\s\S]*?justifyContent:\s*'space-between'/);
  assert.match(queuePanelSource, /<View style=\{\[styles\.header, isListCollapsed && styles\.headerCollapsed\]\}>[\s\S]*?<TouchableOpacity[\s\S]*?style=\{styles\.headerDisclosureButton\}[\s\S]*?onPress=\{\(\) => setIsListCollapsed\(\(prev\) => !prev\)\}[\s\S]*?accessibilityLabel=\{queueDisclosureLabel\}[\s\S]*?accessibilityHint="Shows or hides queued messages for this conversation\."[\s\S]*?accessibilityState=\{\{ expanded: !isListCollapsed \}\}[\s\S]*?activeOpacity=\{0\.7\}/);
  assert.match(queuePanelSource, /<Ionicons[\s\S]*?name=\{isListCollapsed \? 'chevron-down' : 'chevron-up'\}[\s\S]*?\/\>[\s\S]*?<\/TouchableOpacity>/);
  assert.match(queuePanelSource, /style=\{\[styles\.headerActionTouchTarget, styles\.clearButton, hasProcessingMessage && styles\.clearButtonDisabled\]\}[\s\S]*?accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\('Clear queued messages'\)[\s\S]*?accessibilityHint=\{clearQueueAccessibilityHint\}[\s\S]*?accessibilityState=\{\{ disabled: hasProcessingMessage \}\}/);
  assert.match(queuePanelSource, /clearButtonDisabled:\s*\{[\s\S]*?opacity:\s*0\.7/);
});

test('surfaces processing state in the compact queue summary too', () => {
  assert.match(queuePanelSource, /const queuedMessageLabel = `\$\{messages\.length\} queued message\$\{messages\.length > 1 \? 's' : ''\}`;/);
  assert.match(queuePanelSource, /const queueProcessingSummary = processingCount === 1 \? 'Sending now' : `\$\{processingCount\} sending now`;/);
  assert.match(queuePanelSource, /const compactSummaryText = hasProcessingMessage[\s\S]*?`\$\{queuedMessageLabel\} • \$\{queueProcessingSummary\}`[\s\S]*?: queuedMessageLabel;/);
  assert.match(queuePanelSource, /<Text style=\{styles\.compactText\} numberOfLines=\{1\} ellipsizeMode="tail">[\s\S]*?\{compactSummaryText\}[\s\S]*?<\/Text>/);
});

test('keeps the full queue header informative when the list is collapsed', () => {
  assert.match(queuePanelSource, /const processingCount = messages\.filter\(\(m\) => m\.status === 'processing'\)\.length;/);
  assert.match(queuePanelSource, /const waitingCount = messages\.filter\(\(m\) => m\.status === 'pending'\)\.length;/);
  assert.match(queuePanelSource, /const failedCount = messages\.filter\(\(m\) => m\.status === 'failed'\)\.length;/);
  assert.match(queuePanelSource, /const queueFailureSummary = failedCount === 1 \? 'Blocked by 1 failed' : `Blocked by \$\{failedCount\} failed`;/);
  assert.match(queuePanelSource, /const queueHeaderStatusParts: string\[\] = \[];[\s\S]*?if \(failedCount > 0\) queueHeaderStatusParts\.push\(queueFailureSummary\);[\s\S]*?if \(processingCount > 0\) queueHeaderStatusParts\.push\(queueProcessingSummary\);[\s\S]*?if \(waitingCount > 0\) queueHeaderStatusParts\.push\(`\$\{waitingCount\} waiting`\);/);
  assert.match(queuePanelSource, /const queueHeaderStatusText = queueHeaderStatusParts\.join\(' • '\) \|\| 'Queue activity updated';/);
  assert.match(queuePanelSource, /const queueDisclosureLabel = `\$\{createExpandCollapseAccessibilityLabel\('queued messages', !isListCollapsed\)\}\. \$\{queuedMessageLabel\}\. \$\{queueHeaderStatusText\}\.`;/);
  assert.match(queuePanelSource, /headerTitleGroup:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0/);
  assert.match(queuePanelSource, /headerTitleRow:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?alignItems:\s*'center',[\s\S]*?gap:\s*6/);
  assert.match(queuePanelSource, /badge:\s*\{[\s\S]*?backgroundColor:\s*theme\.colors\.primary,[\s\S]*?minWidth:\s*20,[\s\S]*?height:\s*20/);
  assert.match(queuePanelSource, /badgeText:\s*\{[\s\S]*?fontSize:\s*11,[\s\S]*?fontWeight:\s*'600',[\s\S]*?theme\.colors\.primaryForeground/);
  assert.match(queuePanelSource, /headerStatusText:\s*\{[\s\S]*?lineHeight:\s*16,[\s\S]*?color:\s*theme\.colors\.mutedForeground,[\s\S]*?flexShrink:\s*1/);
  assert.match(queuePanelSource, /headerStatusTextActive:\s*\{[\s\S]*?color:\s*theme\.colors\.primary/);
  assert.match(queuePanelSource, /headerStatusTextDanger:\s*\{[\s\S]*?color:\s*theme\.colors\.destructive/);
  assert.match(queuePanelSource, /<View style=\{styles\.headerTitleRow\}>[\s\S]*?<Text style=\{styles\.headerTitle\} numberOfLines=\{1\} ellipsizeMode="tail">[\s\S]*?Queued Messages[\s\S]*?<\/Text>[\s\S]*?<View style=\{styles\.badge\}>[\s\S]*?<Text style=\{styles\.badgeText\}>\{messages\.length\}<\/Text>/);
  assert.match(queuePanelSource, /style=\{\[[\s\S]*?styles\.headerStatusText,[\s\S]*?failedCount > 0[\s\S]*?styles\.headerStatusTextDanger[\s\S]*?hasProcessingMessage[\s\S]*?styles\.headerStatusTextActive/);
  assert.match(queuePanelSource, /style=\{\[[\s\S]*?styles\.headerStatusText,[\s\S]*?\]\}[\s\S]*?numberOfLines=\{2\}[\s\S]*?ellipsizeMode="tail"/);
  assert.match(queuePanelSource, /\{queueHeaderStatusText\}/);
  assert.match(queuePanelSource, /accessibilityLabel=\{queueDisclosureLabel\}/);
});

test('gives queued-message row actions mobile-sized targets and explicit labels', () => {
  assert.match(queuePanelSource, /const queueActionTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(queuePanelSource, /function formatQueuedMessageAccessibilityContext\(text: string, timestampLabel: string\): string \{[\s\S]*?text\.replace\(/);
  assert.match(queuePanelSource, /const rowTimestampLabel = formatTime\(message\.createdAt\);/);
  assert.match(queuePanelSource, /const queuedMessageAccessibilityContext = formatQueuedMessageAccessibilityContext\(message\.text, rowTimestampLabel\);/);
  assert.match(queuePanelSource, /const queueStatusLabel = isFailed \? 'Failed - blocking queue' : isProcessing \? 'Processing\.\.\.' : 'Queued';/);
  assert.match(queuePanelSource, /const queueMetaText = `\$\{queueStatusLabel\} • \$\{rowTimestampLabel\}`;/);
  assert.match(queuePanelSource, /<Text style=\{styles\.metaText\} numberOfLines=\{2\} ellipsizeMode="tail">[\s\S]*?\{queueMetaText\}[\s\S]*?<\/Text>/);
  assert.match(queuePanelSource, /actionButton:\s*\{[\s\S]*?\.\.\.queueActionTouchTarget[\s\S]*?borderRadius:\s*999/);
  assert.match(queuePanelSource, /actionButtonDanger:\s*\{[\s\S]*?theme\.colors\.destructive/);
  assert.match(queuePanelSource, /createButtonAccessibilityLabel\(`Retry failed queued message \$\{queuedMessageAccessibilityContext\}`\)/);
  assert.match(queuePanelSource, /const retryAccessibilityHint = isFailed[\s\S]*?isAddedToHistory[\s\S]*?Moves this failed queued message back into the queue so it can send again and unblock later queued messages without duplicating the existing chat history entry\.[\s\S]*?Moves this failed queued message back into the queue so it can send again and unblock later queued messages\.[\s\S]*?Moves this queued message back into the queue so it can send again without duplicating the existing chat history entry\.[\s\S]*?Moves this queued message back into the queue so it can send again\./);
  assert.match(queuePanelSource, /accessibilityHint=\{retryAccessibilityHint\}/);
  assert.match(queuePanelSource, /createButtonAccessibilityLabel\(`Edit queued message \$\{queuedMessageAccessibilityContext\}`\)/);
  assert.match(queuePanelSource, /accessibilityHint="Lets you revise this queued message before it sends\."/);
  assert.match(queuePanelSource, /createButtonAccessibilityLabel\(`Remove queued message \$\{queuedMessageAccessibilityContext\}`\)/);
  assert.match(queuePanelSource, /const removeAccessibilityHint = isFailed[\s\S]*?isAddedToHistory[\s\S]*?Deletes this failed queued message from the queue so later queued messages can continue\. The existing chat history entry stays in the conversation\.[\s\S]*?Deletes this failed queued message so later queued messages can continue\.[\s\S]*?Deletes this queued message from the queue\. The existing chat history entry stays in the conversation\.[\s\S]*?Deletes this queued message without sending it\./);
  assert.match(queuePanelSource, /accessibilityHint=\{removeAccessibilityHint\}/);
});

test('keeps queued-message status metadata readable beside the inline expander on narrow screens', () => {
  assert.match(queuePanelSource, /metaRow:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?alignItems:\s*'flex-start',[\s\S]*?minWidth:\s*0/);
  assert.match(queuePanelSource, /metaText:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,[\s\S]*?flexShrink:\s*1,[\s\S]*?fontSize:\s*12,[\s\S]*?lineHeight:\s*16/);
  assert.match(queuePanelSource, /\{hasExpandableDetails && \([\s\S]*?<TouchableOpacity[\s\S]*?style=\{styles\.expandButton\}/);
});

test('explains when a queued row is already in chat history and therefore not editable', () => {
  assert.match(queuePanelSource, /const historyLockDetailText = isAddedToHistory \? 'In chat history • Edit unavailable' : null;/);
  assert.match(queuePanelSource, /historyLockText:\s*\{[\s\S]*?lineHeight:\s*16,[\s\S]*?color:\s*theme\.colors\.mutedForeground,[\s\S]*?marginTop:\s*4/);
  assert.match(queuePanelSource, /historyLockTextWarning:\s*\{[\s\S]*?theme\.colors\.destructive/);
  assert.match(queuePanelSource, /\{historyLockDetailText && \([\s\S]*?<Text[\s\S]*?styles\.historyLockText,[\s\S]*?isFailed && styles\.historyLockTextWarning,[\s\S]*?\{historyLockDetailText\}[\s\S]*?<\/Text>[\s\S]*?\)\}/);
  assert.match(queuePanelSource, /\{!isAddedToHistory && \([\s\S]*?createButtonAccessibilityLabel\(`Edit queued message \$\{queuedMessageAccessibilityContext\}`\)/);
});

test('gives the queued-message expander disclosure semantics with a mobile touch target', () => {
  assert.match(queuePanelSource, /const expandButtonTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(queuePanelSource, /const hasLongErrorMessage = Boolean\(message\.errorMessage && message\.errorMessage\.length > 100\);/);
  assert.match(queuePanelSource, /const hasExpandableDetails = isLongMessage \|\| hasLongErrorMessage;/);
  assert.match(queuePanelSource, /expandButton:\s*\{[\s\S]*?\.\.\.expandButtonTouchTarget[\s\S]*?borderRadius:\s*999/);
  assert.match(queuePanelSource, /\{hasExpandableDetails && \([\s\S]*?<TouchableOpacity[\s\S]*?style=\{styles\.expandButton\}/);
  assert.match(queuePanelSource, /createExpandCollapseAccessibilityLabel\(`queued message details for \$\{queuedMessageAccessibilityContext\}`, isExpanded\)/);
  assert.match(queuePanelSource, /accessibilityHint="Shows or hides the full queued message details\."/);
  assert.match(queuePanelSource, /accessibilityState=\{\{ expanded: isExpanded \}\}/);
});

test('keeps failed queue error details compact by default while preserving full access when expanded', () => {
  assert.match(queuePanelSource, /errorText:\s*\{[\s\S]*?fontSize:\s*12,[\s\S]*?lineHeight:\s*16,[\s\S]*?color:\s*`\$\{theme\.colors\.destructive\}CC`,[\s\S]*?marginTop:\s*4/);
  assert.match(queuePanelSource, /\{isFailed && message\.errorMessage && \([\s\S]*?<Text[\s\S]*?style=\{styles\.errorText\}[\s\S]*?numberOfLines=\{isExpanded \? undefined : 2\}[\s\S]*?ellipsizeMode="tail"[\s\S]*?>[\s\S]*?Error: \{message\.errorMessage\}[\s\S]*?<\/Text>[\s\S]*?\)\}/);
});

test('gives queued-message edit actions mobile-sized targets and explicit save/cancel semantics', () => {
  assert.match(queuePanelSource, /const queueEditActionTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalPadding:\s*14,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(queuePanelSource, /const trimmedOriginalText = message\.text\.trim\(\);/);
  assert.match(queuePanelSource, /const trimmedEditText = editText\.trim\(\);/);
  assert.match(queuePanelSource, /const editValidationMessage = !trimmedEditText[\s\S]*?Enter message text to save your queued message changes\.[\s\S]*?Save stays disabled until you change the queued message text\.[\s\S]*?: null;/);
  assert.match(queuePanelSource, /const isSaveEditDisabled = !trimmedEditText \|\| trimmedEditText === trimmedOriginalText;/);
  assert.match(queuePanelSource, /editActions:\s*\{[\s\S]*?justifyContent:\s*'flex-end',[\s\S]*?flexWrap:\s*'wrap',[\s\S]*?alignItems:\s*'center'/);
  assert.match(queuePanelSource, /editHelperText:\s*\{[\s\S]*?lineHeight:\s*17,[\s\S]*?color:\s*theme\.colors\.mutedForeground/);
  assert.match(queuePanelSource, /editHelperTextWarning:\s*\{[\s\S]*?color:\s*theme\.colors\.destructive/);
  assert.match(queuePanelSource, /editButton:\s*\{[\s\S]*?\.\.\.queueEditActionTouchTarget[\s\S]*?alignItems:\s*'center',[\s\S]*?justifyContent:\s*'center',[\s\S]*?borderRadius:\s*999,[\s\S]*?borderWidth:\s*1/);
  assert.match(queuePanelSource, /saveButtonDisabled:\s*\{[\s\S]*?opacity:\s*0\.6/);
  assert.match(queuePanelSource, /createTextInputAccessibilityLabel\(`Queued message edit \$\{queuedMessageAccessibilityContext\}`\)/);
  assert.match(queuePanelSource, /accessibilityHint=\{editValidationMessage \?\? 'Revise this queued message before it sends\.'\}/);
  assert.match(queuePanelSource, /\{editValidationMessage && \([\s\S]*?<Text[\s\S]*?styles\.editHelperText,[\s\S]*?!trimmedEditText && styles\.editHelperTextWarning,[\s\S]*?\{editValidationMessage\}[\s\S]*?<\/Text>[\s\S]*?\)\}/);
  assert.match(queuePanelSource, /createButtonAccessibilityLabel\(`Cancel queued message edit \$\{queuedMessageAccessibilityContext\}`\)/);
  assert.match(queuePanelSource, /accessibilityHint="Restores the original queued message text without saving your changes\."/);
  assert.match(queuePanelSource, /createButtonAccessibilityLabel\(`Save queued message edit \$\{queuedMessageAccessibilityContext\}`\)/);
  assert.match(queuePanelSource, /accessibilityHint=\{isSaveEditDisabled[\s\S]*?Enter message text before saving your queued message changes\.[\s\S]*?Change the queued message text before saving\.[\s\S]*?Applies your queued message edits before it sends\.[\s\S]*?\}/);
  assert.match(queuePanelSource, /disabled=\{isSaveEditDisabled\}/);
  assert.match(queuePanelSource, /accessibilityState=\{\{ disabled: isSaveEditDisabled \}\}/);
  assert.match(queuePanelSource, /style=\{\[styles\.editButton, styles\.saveButton, isSaveEditDisabled && styles\.saveButtonDisabled\]\}/);
});

test('keeps queue edit mode anchored to the current queued or failed message context', () => {
  assert.match(queuePanelSource, /const editContextLabel = `\$\{isFailed \? 'Editing failed queued message' : 'Editing queued message'\} • \$\{rowTimestampLabel\}`;/);
  assert.match(queuePanelSource, /editContextText:\s*\{[\s\S]*?lineHeight:\s*17,[\s\S]*?color:\s*theme\.colors\.mutedForeground,[\s\S]*?fontWeight:\s*'600'/);
  assert.match(queuePanelSource, /editContextTextWarning:\s*\{[\s\S]*?color:\s*theme\.colors\.destructive/);
  assert.match(queuePanelSource, /editFailureText:\s*\{[\s\S]*?color:\s*`\$\{theme\.colors\.destructive\}CC`,[\s\S]*?marginTop:\s*2/);
  assert.match(queuePanelSource, /<Text[\s\S]*?styles\.editContextText,[\s\S]*?isFailed && styles\.editContextTextWarning,[\s\S]*?>[\s\S]*?\{editContextLabel\}[\s\S]*?<\/Text>/);
  assert.match(queuePanelSource, /\{isFailed && message\.errorMessage \? \([\s\S]*?<Text style=\{styles\.editFailureText\} numberOfLines=\{2\} ellipsizeMode="tail">[\s\S]*?Last error: \{message\.errorMessage\}[\s\S]*?<\/Text>[\s\S]*?\) : null\}/);
});

test('keeps queue editing usable with the keyboard open or after dragging the list', () => {
  assert.match(queuePanelSource, /<ScrollView[\s\S]*?style=\{styles\.list\}[\s\S]*?keyboardShouldPersistTaps="handled"[\s\S]*?keyboardDismissMode="on-drag"[\s\S]*?>/);
});

test('caps expanded queue height relative to the viewport so it does not crowd shorter mobile chat screens', () => {
  assert.match(queuePanelSource, /useWindowDimensions/);
  assert.match(queuePanelSource, /const \{ height: windowHeight \} = useWindowDimensions\(\);/);
  assert.match(queuePanelSource, /const queueListMaxHeight = Math\.min\(200, Math\.max\(160, Math\.round\(windowHeight \* 0\.28\)\)\);/);
  assert.match(queuePanelSource, /list:\s*\{[\s\S]*?maxHeight:\s*queueListMaxHeight,/);
});

test('keeps the queue panel aligned with the mobile chat gutters instead of stealing extra width', () => {
  assert.match(chatScreenSource, /<ScrollView[\s\S]*?style=\{\{ flex: 1, paddingHorizontal: spacing\.sm, paddingVertical: spacing\.xs, backgroundColor: theme\.colors\.background \}\}/);
  assert.match(chatScreenSource, /\{messageQueueEnabled && queuedMessages\.length > 0 && \([\s\S]*?<View style=\{\{ paddingHorizontal: spacing\.sm, paddingTop: spacing\.sm \}\}>[\s\S]*?<MessageQueuePanel/);
});