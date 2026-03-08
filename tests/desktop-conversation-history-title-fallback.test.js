const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const helperPath = path.join(
  __dirname,
  '..',
  'apps',
  'desktop',
  'src',
  'renderer',
  'src',
  'lib',
  'conversation-history-display.ts',
);

test('desktop conversation history title helper prefers trimmed title, then preview, then session id', async () => {
  const { getConversationHistoryDisplayTitle } = await import(pathToFileURL(helperPath).href);

  assert.equal(
    getConversationHistoryDisplayTitle({
      id: 'conv_12345678',
      title: '  Resume invoice flow  ',
      preview: 'user: ignored preview',
    }),
    'Resume invoice flow',
  );

  assert.equal(
    getConversationHistoryDisplayTitle({
      id: 'conv_12345678',
      title: '   ',
      preview: 'user: Continue debugging the release check | assistant: Sure',
    }),
    'Continue debugging the release check',
  );

  assert.equal(
    getConversationHistoryDisplayTitle({
      id: 'conv_12345678',
      title: '',
      preview: '   ',
    }),
    'Session conv_123',
  );
});