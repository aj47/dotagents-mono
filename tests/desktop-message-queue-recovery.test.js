const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const queuePanelSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'message-queue-panel.tsx'),
  'utf8'
);

const tipcSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'tipc.ts'),
  'utf8'
);

test('paused failed queues expose a one-click retry and resume recovery action', () => {
  assert.match(queuePanelSource, /const headFailedMessage = messages\[0\]\?\.status === "failed" \? messages\[0\] : undefined/);
  assert.match(queuePanelSource, /const retryAndResumeMutation = useMutation\(\{/);
  assert.match(queuePanelSource, /Retry & Resume/);
  assert.match(queuePanelSource, /Retry failed message and resume queue/);
  assert.match(queuePanelSource, /Queue was stopped while the first queued message failed\. Retry it to resume processing the rest of the queue\./);
});

test('failed head message recovery resumes paused queues in the main process before processing', () => {
  assert.match(tipcSource, /const isHeadMessage = queue\[0\]\?\.id === input\.messageId/);
  assert.match(tipcSource, /const wasPaused = messageQueueService\.isQueuePaused\(input\.conversationId\)/);
  assert.match(tipcSource, /Editing the failed head item is an explicit recovery action\./);
  assert.match(tipcSource, /Retrying the failed head item is an explicit recovery action\./);
  assert.match(tipcSource, /if \(wasPaused && isHeadMessage\) \{\s*messageQueueService\.resumeQueue\(input\.conversationId\)/);
});