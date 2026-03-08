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