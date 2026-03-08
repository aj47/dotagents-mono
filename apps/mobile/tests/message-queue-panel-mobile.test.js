const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const queuePanelSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'MessageQueuePanel.tsx'),
  'utf8'
);

test('makes busy queue state explicit instead of silently disabling Clear All', () => {
  assert.match(queuePanelSource, /const hasProcessingMessage = messages\.some\(\(m\) => m\.status === 'processing'\);/);
  assert.match(queuePanelSource, /const clearQueueAccessibilityHint = hasProcessingMessage[\s\S]*?Wait for the active queued message to finish before clearing the rest of this queue\.[\s\S]*?Removes all queued messages for this conversation\./);
  assert.match(queuePanelSource, /\{hasProcessingMessage && !isListCollapsed && \([\s\S]*?<View style=\{styles\.processingNotice\}>[\s\S]*?<ActivityIndicator size="small" color=\{theme\.colors\.primary\} \/>[\s\S]*?One queued message is sending now\. Clear All stays disabled until it finishes\.[\s\S]*?<\/View>[\s\S]*?\)\}/);
  assert.match(queuePanelSource, /processingNotice:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?backgroundColor:\s*`\$\{theme\.colors\.primary\}10`/);
  assert.match(queuePanelSource, /processingNoticeText:\s*\{[\s\S]*?lineHeight:\s*18,[\s\S]*?color:\s*theme\.colors\.primary/);
});

test('gives queue header actions mobile-sized button semantics and explanatory hints', () => {
  assert.match(queuePanelSource, /headerActionTouchTarget: createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\)/);
  assert.match(queuePanelSource, /style=\{\[styles\.headerActionTouchTarget, styles\.clearButton, hasProcessingMessage && styles\.clearButtonDisabled\]\}[\s\S]*?accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\('Clear queued messages'\)[\s\S]*?accessibilityHint=\{clearQueueAccessibilityHint\}[\s\S]*?accessibilityState=\{\{ disabled: hasProcessingMessage \}\}/);
  assert.match(queuePanelSource, /createExpandCollapseAccessibilityLabel\('queued messages', !isListCollapsed\)/);
  assert.match(queuePanelSource, /accessibilityHint="Shows or hides queued messages for this conversation\."/);
  assert.match(queuePanelSource, /clearButtonDisabled:\s*\{[\s\S]*?opacity:\s*0\.7/);
});

test('surfaces processing state in the compact queue summary too', () => {
  assert.match(queuePanelSource, /const queuedMessageLabel = `\$\{messages\.length\} queued message\$\{messages\.length > 1 \? 's' : ''\}`;/);
  assert.match(queuePanelSource, /const compactSummaryText = hasProcessingMessage[\s\S]*?`\$\{queuedMessageLabel\} • Sending now`[\s\S]*?: queuedMessageLabel;/);
  assert.match(queuePanelSource, /<Text style=\{styles\.compactText\} numberOfLines=\{1\} ellipsizeMode="tail">[\s\S]*?\{compactSummaryText\}[\s\S]*?<\/Text>/);
});

test('gives queued-message row actions mobile-sized targets and explicit labels', () => {
  assert.match(queuePanelSource, /const queueActionTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(queuePanelSource, /actionButton:\s*\{[\s\S]*?\.\.\.queueActionTouchTarget[\s\S]*?borderRadius:\s*999/);
  assert.match(queuePanelSource, /actionButtonDanger:\s*\{[\s\S]*?theme\.colors\.destructive/);
  assert.match(queuePanelSource, /createButtonAccessibilityLabel\('Retry failed queued message'\)/);
  assert.match(queuePanelSource, /accessibilityHint="Moves this failed message back into the queue so it can send again\."/);
  assert.match(queuePanelSource, /createButtonAccessibilityLabel\('Edit queued message'\)/);
  assert.match(queuePanelSource, /accessibilityHint="Lets you revise this queued message before it sends\."/);
  assert.match(queuePanelSource, /createButtonAccessibilityLabel\('Remove queued message'\)/);
  assert.match(queuePanelSource, /accessibilityHint="Deletes this queued message without sending it\."/);
});

test('gives the queued-message expander disclosure semantics with a mobile touch target', () => {
  assert.match(queuePanelSource, /const expandButtonTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(queuePanelSource, /expandButton:\s*\{[\s\S]*?\.\.\.expandButtonTouchTarget[\s\S]*?borderRadius:\s*999/);
  assert.match(queuePanelSource, /createExpandCollapseAccessibilityLabel\('queued message details', isExpanded\)/);
  assert.match(queuePanelSource, /accessibilityHint="Shows or hides the full queued message text\."/);
  assert.match(queuePanelSource, /accessibilityState=\{\{ expanded: isExpanded \}\}/);
});

test('gives queued-message edit actions mobile-sized targets and explicit save/cancel semantics', () => {
  assert.match(queuePanelSource, /const queueEditActionTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalPadding:\s*14,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(queuePanelSource, /editActions:\s*\{[\s\S]*?justifyContent:\s*'flex-end',[\s\S]*?flexWrap:\s*'wrap',[\s\S]*?alignItems:\s*'center'/);
  assert.match(queuePanelSource, /editButton:\s*\{[\s\S]*?\.\.\.queueEditActionTouchTarget[\s\S]*?alignItems:\s*'center',[\s\S]*?justifyContent:\s*'center',[\s\S]*?borderRadius:\s*999,[\s\S]*?borderWidth:\s*1/);
  assert.match(queuePanelSource, /createButtonAccessibilityLabel\('Cancel queued message edit'\)/);
  assert.match(queuePanelSource, /accessibilityHint="Restores the original queued message text without saving your changes\."/);
  assert.match(queuePanelSource, /createButtonAccessibilityLabel\('Save queued message edit'\)/);
  assert.match(queuePanelSource, /accessibilityHint=\{!editText\.trim\(\)[\s\S]*?Enter message text before saving your queued message changes\.[\s\S]*?Applies your queued message edits before it sends\.[\s\S]*?\}/);
  assert.match(queuePanelSource, /accessibilityState=\{\{ disabled: !editText\.trim\(\) \}\}/);
});