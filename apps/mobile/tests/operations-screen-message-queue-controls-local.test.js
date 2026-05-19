const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const operationsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'OperationsScreen.tsx'),
  'utf8',
);
const settingsClientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8',
);
const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8',
);

test('mobile operations restores operator message queue controls locally', () => {
  assert.match(operationsSource, /Queued messages/);
  assert.match(operationsSource, /editingQueuedMessage/);
  assert.match(operationsSource, /pauseOperatorMessageQueue/);
  assert.match(operationsSource, /resumeOperatorMessageQueue/);
  assert.match(operationsSource, /clearOperatorMessageQueue/);
  assert.match(operationsSource, /retryOperatorQueuedMessage/);
  assert.match(operationsSource, /removeOperatorQueuedMessage/);
  assert.match(operationsSource, /updateOperatorQueuedMessageText/);
  assert.match(operationsSource, /canEditQueuedMessage/);
  assert.match(operationsSource, /hasProcessingQueuedMessage/);
});

test('mobile client and desktop server expose narrow queue mutation routes', () => {
  assert.match(settingsClientSource, /async pauseOperatorMessageQueue/);
  assert.match(settingsClientSource, /async resumeOperatorMessageQueue/);
  assert.match(settingsClientSource, /async clearOperatorMessageQueue/);
  assert.match(settingsClientSource, /async removeOperatorQueuedMessage/);
  assert.match(settingsClientSource, /async retryOperatorQueuedMessage/);
  assert.match(settingsClientSource, /async updateOperatorQueuedMessageText/);
  assert.match(remoteServerSource, /"\/v1\/operator\/message-queues\/:conversationId\/pause"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/message-queues\/:conversationId\/resume"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/message-queues\/:conversationId\/clear"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/message-queues\/:conversationId\/messages\/:messageId"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/message-queues\/:conversationId\/messages\/:messageId\/retry"/);
  assert.doesNotMatch(remoteServerSource, /registerDesktopRemoteServerRoutes/);
});
