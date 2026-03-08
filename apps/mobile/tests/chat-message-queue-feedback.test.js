const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const queuePanelSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'MessageQueuePanel.tsx'),
  'utf8'
);

const queueStoreSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'store', 'message-queue.ts'),
  'utf8'
);

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('mobile queue panel treats false action results as retryable inline failures', () => {
  assert.match(queuePanelSource, /type QueuedMessageActionError = \{[\s\S]*kind: 'update' \| 'remove' \| 'retry';/);
  assert.match(queuePanelSource, /function QueueActionError\(/);
  assert.match(queuePanelSource, /await ensureQueueActionSuccess\(onUpdate\(trimmed\), "Couldn't save changes to this queued message yet"\);/);
  assert.match(queuePanelSource, /await ensureQueueActionSuccess\(onRetry\(\), "Couldn't retry this queued message right now"\);/);
  assert.match(queuePanelSource, /await ensureQueueActionSuccess\(onRemove\(\), "Couldn't remove this queued message right now"\);/);
  assert.match(queuePanelSource, /Your draft is still here, so you can review it and try again\./);
  assert.match(queuePanelSource, /Retry clear/);
});

test('mobile queue store clearQueue reports whether clear actually happened', () => {
  assert.match(queueStoreSource, /clearQueue: \(conversationId: string\) => boolean;/);
  assert.match(queueStoreSource, /const clearQueue = useCallback\(\(conversationId: string\): boolean => \{/);
  assert.match(queueStoreSource, /if \(!queue\) return false;/);
  assert.match(queueStoreSource, /if \(queue\.some\(m => m\.status === 'processing'\)\) return false;/);
  assert.match(queueStoreSource, /return true;\s*\}, \[updateQueues\]\);/);
});

test('mobile chat screen returns queue-action success so the panel can show failures', () => {
  assert.match(chatScreenSource, /const resetSucceeded = messageQueue\.resetToPending\(currentConversationId, messageId\);/);
  assert.match(chatScreenSource, /if \(!resetSucceeded\) \{\s*return false;\s*\}/);
  assert.match(chatScreenSource, /const markSucceeded = messageQueue\.markProcessing\(currentConversationId, nextMessage\.id\);/);
  assert.match(chatScreenSource, /if \(!markSucceeded\) \{\s*return false;\s*\}/);
  assert.match(chatScreenSource, /return true;\s*\}\}\s*onClear=\{\(\) => messageQueue\.clearQueue\(currentConversationId\)\}/);
});