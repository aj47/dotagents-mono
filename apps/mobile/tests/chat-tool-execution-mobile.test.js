const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('gives the collapsed tool execution summary a minimum mobile touch target', () => {
  assert.match(chatScreenSource, /const toolCallCompactTouchTarget = createMinimumTouchTargetStyle\([\s\S]*?minSize: 44,[\s\S]*?horizontalMargin: 0[\s\S]*?\);/);
  assert.match(chatScreenSource, /toolCallCompactRow:\s*\{[\s\S]*?\.\.\.toolCallCompactTouchTarget,[\s\S]*?justifyContent: 'flex-start',[\s\S]*?minWidth: 0,[\s\S]*?gap: spacing\.xs/);
});

test('keeps collapsed tool execution labels legible on narrow mobile screens', () => {
  assert.match(chatScreenSource, /toolCallCompactIcon:\s*\{[\s\S]*?fontSize: 11/);
  assert.match(chatScreenSource, /toolCallCompactName:\s*\{[\s\S]*?fontSize: 12,[\s\S]*?lineHeight: 16,[\s\S]*?flexShrink: 1,[\s\S]*?minWidth: 0/);
  assert.match(chatScreenSource, /toolCallCompactStatus:\s*\{[\s\S]*?fontSize: 11/);
  assert.match(chatScreenSource, /toolCallCompactPreview:\s*\{[\s\S]*?fontSize: 11,[\s\S]*?lineHeight: 15,[\s\S]*?flex: 1,[\s\S]*?minWidth: 0,[\s\S]*?flexShrink: 1/);
  assert.match(chatScreenSource, /toolCallCompactChevron:\s*\{[\s\S]*?fontSize: 10/);
});

test('keeps collapsed multi-tool summaries explicit on narrow mobile screens', () => {
  assert.match(chatScreenSource, /const toolCallNames = \(m\.toolCalls \?\? \[\]\)\.map\(tc => tc\.name\);/);
  assert.match(chatScreenSource, /const collapsedToolPrimaryName = toolCallNames\[0\] \|\| 'Tool execution';/);
  assert.match(chatScreenSource, /const additionalToolCallCount = Math\.max\(toolCallNames\.length - 1, 0\);/);
  assert.match(chatScreenSource, /const toolExecutionSummaryLabel = additionalToolCallCount > 0[\s\S]*?\? `\$\{toolCallNames\.length\} tool execution details`[\s\S]*?: `\$\{collapsedToolPrimaryName\} tool execution details`;/);
  assert.match(chatScreenSource, /accessibilityLabel=\{createExpandCollapseAccessibilityLabel\(toolExecutionSummaryLabel, false\)\}/);
  assert.match(chatScreenSource, /\{collapsedToolPrimaryName\}/);
  assert.match(chatScreenSource, /\{additionalToolCallCount > 0 && \([\s\S]*?<Text style=\{styles\.toolCallCompactCountBadge\}>\+\{additionalToolCallCount\}<\/Text>[\s\S]*?\)\}/);
  assert.match(chatScreenSource, /toolCallCompactCountBadge:\s*\{[\s\S]*?fontSize: 10,[\s\S]*?fontWeight: '600',[\s\S]*?borderRadius: 999,[\s\S]*?flexShrink: 0/);
});

test('lets expanded tool disclosure headers wrap before long tool names get squeezed on narrow screens', () => {
  assert.match(chatScreenSource, /const toolCallHeaderTouchTarget = createMinimumTouchTargetStyle\([\s\S]*?minSize: 44,[\s\S]*?horizontalMargin: 0[\s\S]*?\);/);
  assert.match(chatScreenSource, /toolCallHeader:\s*\{[\s\S]*?\.\.\.toolCallHeaderTouchTarget,[\s\S]*?alignItems: 'flex-start',[\s\S]*?justifyContent: 'flex-start',[\s\S]*?flexWrap: 'wrap',[\s\S]*?minWidth: 0,[\s\S]*?gap: spacing\.xs/);
  assert.match(chatScreenSource, /toolName:\s*\{[\s\S]*?fontSize: 12,[\s\S]*?lineHeight: 16,[\s\S]*?flex: 1,[\s\S]*?flexShrink: 1,[\s\S]*?minWidth: 0/);
  assert.match(chatScreenSource, /toolCallExpandHint:\s*\{[\s\S]*?fontSize: 11,[\s\S]*?lineHeight: 16,[\s\S]*?fontWeight: '500',[\s\S]*?marginLeft: 'auto',[\s\S]*?flexShrink: 0/);
});

test('lets expanded tool result metadata wrap cleanly before the output header gets squeezed on narrow screens', () => {
  assert.match(chatScreenSource, /<View style=\{styles\.toolResultHeader\}>[\s\S]*?<View style=\{styles\.toolResultHeaderMeta\}>[\s\S]*?<Text style=\{\[styles\.toolSectionLabel, styles\.toolSectionLabelInline\]\}>Output:<\/Text>[\s\S]*?<Text style=\{styles\.toolResultCharCount\}>/);
  assert.match(chatScreenSource, /toolResultHeader:\s*\{[\s\S]*?alignItems: 'flex-start',[\s\S]*?justifyContent: 'space-between',[\s\S]*?flexWrap: 'wrap',[\s\S]*?gap: spacing\.xs/);
  assert.match(chatScreenSource, /toolResultHeaderMeta:\s*\{[\s\S]*?flex: 1,[\s\S]*?minWidth: 0,[\s\S]*?flexDirection: 'row',[\s\S]*?alignItems: 'center',[\s\S]*?flexWrap: 'wrap',[\s\S]*?gap: spacing\.xs/);
  assert.match(chatScreenSource, /toolResultCharCount:\s*\{[\s\S]*?fontSize: 10,[\s\S]*?lineHeight: 14,[\s\S]*?marginLeft: 'auto',[\s\S]*?flexShrink: 0/);
  assert.match(chatScreenSource, /toolResultBadge:\s*\{[\s\S]*?fontSize: 10,[\s\S]*?lineHeight: 14,[\s\S]*?flexShrink: 0/);
});
