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
