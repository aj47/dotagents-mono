const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const sessionModulePath = path.join(
  __dirname,
  '..',
  'packages',
  'shared',
  'src',
  'session.ts',
);

test('sessionToListItem keeps readable mobile session titles when stored titles are blank', async () => {
  const { sessionToListItem } = await import(pathToFileURL(sessionModulePath).href);

  assert.equal(
    sessionToListItem({
      id: 'session_1234567890',
      title: '  Resume invoice flow  ',
      createdAt: 1,
      updatedAt: 2,
      messages: [],
    }).title,
    'Resume invoice flow',
  );

  assert.equal(
    sessionToListItem({
      id: 'session_1234567890',
      title: '   ',
      createdAt: 1,
      updatedAt: 2,
      messages: [
        { id: 'm1', role: 'user', content: '   Help me debug the release check please   ', timestamp: 1 },
        { id: 'm2', role: 'assistant', content: 'Sure — what is failing?', timestamp: 2 },
      ],
    }).title,
    'Help me debug the release check please',
  );

  assert.equal(
    sessionToListItem({
      id: 'session_1234567890',
      title: '',
      createdAt: 1,
      updatedAt: 2,
      messages: [],
      serverConversationId: 'conv-1',
      serverMetadata: {
        messageCount: 2,
        lastMessage: 'assistant: Sure',
        preview: 'user: Continue debugging the release check | assistant: Sure',
      },
    }).title,
    'Continue debugging the release check',
  );

  assert.equal(
    sessionToListItem({
      id: 'session_1234567890',
      title: '',
      createdAt: 1,
      updatedAt: 2,
      messages: [],
      serverConversationId: 'conv-1',
      serverMetadata: {
        messageCount: 0,
        lastMessage: '',
        preview: '   ',
      },
    }).title,
    'Session session_',
  );
});