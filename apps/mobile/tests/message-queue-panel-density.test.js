const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'MessageQueuePanel.tsx'),
  'utf8'
);

test('mobile queued-message rows use text-first actions with explicit accessibility labels', () => {
  assert.match(source, /<Text style=\{styles\.retryActionText\}>\{MESSAGE_QUEUE_PANEL_PRESENTATION\.actions\.retryLabel\}<\/Text>/);
  assert.match(source, /<Text style=\{styles\.editActionText\}>\{MESSAGE_QUEUE_PANEL_PRESENTATION\.actions\.editLabel\}<\/Text>/);
  assert.match(source, /<Text style=\{styles\.removeActionText\}>\{MESSAGE_QUEUE_PANEL_PRESENTATION\.actions\.removeLabel\}<\/Text>/);
  assert.match(source, /accessibilityLabel=\{MESSAGE_QUEUE_PANEL_PRESENTATION\.actions\.retryAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{MESSAGE_QUEUE_PANEL_PRESENTATION\.actions\.editAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{MESSAGE_QUEUE_PANEL_PRESENTATION\.actions\.removeAccessibilityLabel\}/);
  assert.doesNotMatch(source, /<Ionicons name="refresh" size=\{16\} color=\{theme\.colors\.foreground\} \/>/);
  assert.doesNotMatch(source, /<Ionicons name="pencil" size=\{16\} color=\{theme\.colors\.foreground\} \/>/);
  assert.doesNotMatch(source, /<Ionicons name="close" size=\{16\} color=\{theme\.colors\.foreground\} \/>/);
});

test('mobile queued-message actions keep wrap-safe chip sizing instead of a tiny side icon rail', () => {
  assert.match(source, /actions:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?flexWrap:\s*'wrap',[\s\S]*?gap:\s*8,[\s\S]*?marginTop:\s*6,/);
  assert.match(source, /actionButton:\s*\{[\s\S]*?alignSelf:\s*'flex-start',[\s\S]*?minHeight:\s*28,[\s\S]*?paddingHorizontal:\s*8,[\s\S]*?paddingVertical:\s*4,[\s\S]*?borderRadius:\s*999,/);
  assert.match(source, /hitSlop=\{\{ top: 8, bottom: 8, left: 8, right: 8 \}\}/);
});

test('mobile queue panel exposes an explicit send-next action for queued drafts', () => {
  assert.match(source, /onProcessNext\?: \(\) => void;/);
  assert.match(source, /canProcessNext\?: boolean;/);
  assert.match(source, /accessibilityLabel=\{MESSAGE_QUEUE_PANEL_PRESENTATION\.actions\.sendNextAccessibilityLabel\}/);
  assert.match(source, /<Text style=\{styles\.processButtonText\}>\{MESSAGE_QUEUE_PANEL_PRESENTATION\.actions\.sendNextLabel\}<\/Text>/);
});

test('mobile queue panel uses shared queued-message eligibility rules', () => {
  assert.match(source, /MESSAGE_QUEUE_PANEL_PRESENTATION/);
  assert.match(source, /formatMessageQueueCompactLabel\(messages\.length\)/);
  assert.match(source, /formatMessageQueuePanelTitle\(messages\.length\)/);
  assert.match(source, /getQueuedMessageItemPresentation\(message, isExpanded\)/);
  assert.match(source, /getMessageQueueListToggleLabel\(isListCollapsed\)/);
  assert.match(source, /messagePresentation/);
  assert.match(source, /statusLabel,/);
  assert.match(source, /errorText,/);
  assert.match(source, /hasProcessingQueuedMessage\(messages\)/);

  assert.doesNotMatch(source, /Queued Messages \(\{messages\.length\}\)/);
  assert.doesNotMatch(source, /Error: \{message\.errorMessage\}/);
  assert.doesNotMatch(source, /message\.status === ['"]processing['"]/);
  assert.doesNotMatch(source, /message\.status === ['"]failed['"]/);
  assert.doesNotMatch(source, /isQueuedMessageProcessing\(message\)/);
  assert.doesNotMatch(source, /isQueuedMessageFailed\(message\)/);
  assert.doesNotMatch(source, /isFailed \? 'Failed' : isProcessing \? 'Processing\.\.\.' : 'Queued'/);
  assert.doesNotMatch(source, /messages\.some\(\(m\) => m\.status === ['"]processing['"]\)/);
});
