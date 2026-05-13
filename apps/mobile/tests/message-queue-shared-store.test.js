import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/store/message-queue.ts', import.meta.url), 'utf8');

test('mobile message queue uses the shared queue store boundary', () => {
  assert.match(source, /createMessageQueueStore/);
  assert.match(source, /idFactory: \(\) => generateMessageId\(\)/);
  assert.match(source, /setQueues\(buildQueueSnapshot\(store\.getAllQueues\(\)\)\)/);
  assert.doesNotMatch(source, /enqueueQueuedMessage|clearQueuedMessages|markQueuedMessageProcessing/);
});

test('mobile message queue exposes shared pause and resume controls', () => {
  assert.match(source, /pauseQueue: \(conversationId: string\) => void;/);
  assert.match(source, /resumeQueue: \(conversationId: string\) => void;/);
  assert.match(source, /isQueuePaused: \(conversationId: string\) => boolean;/);
  assert.match(source, /queueStore\.pauseQueue\(conversationId\);/);
  assert.match(source, /queueStore\.resumeQueue\(conversationId\);/);
  assert.match(source, /return queueStore\.isQueuePaused\(conversationId\);/);
});
