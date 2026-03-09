const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

const helperModuleUrl = pathToFileURL(
  path.join(__dirname, '..', 'src', 'screens', 'chat-stub-session-notice.ts')
).href;

const loadStubSessionHelpers = () => import(helperModuleUrl);

test('builds the ChatScreen connection-settings notice action model and routes press to settings', async () => {
  const {
    createChatScreenStubSessionNoticeActionModel,
    createStubSessionCredentialsNotice,
  } = await loadStubSessionHelpers();

  const notice = createStubSessionCredentialsNotice('stub-credentials');
  const openedScreens = [];
  const setMessagesCalls = [];
  const retriedSessionIds = [];

  const actionModel = createChatScreenStubSessionNoticeActionModel(notice, {
    navigate: (screenName) => {
      openedScreens.push(screenName);
    },
    setMessages: (messages) => {
      setMessagesCalls.push(messages);
    },
    loadStubSessionMessages: (sessionId) => {
      retriedSessionIds.push(sessionId);
    },
  });

  actionModel.onPress();

  assert.deepEqual(
    {
      title: actionModel.title,
      message: notice.message,
      actionLabel: actionModel.actionLabel,
      accessibilityLabel: actionModel.accessibilityLabel,
      accessibilityHint: actionModel.accessibilityHint,
    },
    {
      title: 'Synced chat needs connection settings',
      message: 'Connect this mobile app to DotAgents to load synced chats from desktop.',
      actionLabel: 'Open settings',
      accessibilityLabel: 'Open connection settings button',
      accessibilityHint: 'Opens connection settings so this mobile app can load synced chat history.',
    }
  );
  assert.deepEqual(openedScreens, ['ConnectionSettings']);
  assert.deepEqual(setMessagesCalls, []);
  assert.deepEqual(retriedSessionIds, []);
});

test('builds the ChatScreen retry notice action model and routes press to clear and reload', async () => {
  const {
    createChatScreenStubSessionNoticeActionModel,
    createStubSessionLoadFailedNotice,
  } = await loadStubSessionHelpers();

  const notice = createStubSessionLoadFailedNotice('stub-retry');
  const openedScreens = [];
  const setMessagesCalls = [];
  const retriedSessionIds = [];

  const actionModel = createChatScreenStubSessionNoticeActionModel(notice, {
    navigate: (screenName) => {
      openedScreens.push(screenName);
    },
    setMessages: (messages) => {
      setMessagesCalls.push(messages);
    },
    loadStubSessionMessages: (sessionId) => {
      retriedSessionIds.push(sessionId);
    },
  });

  actionModel.onPress();

  assert.deepEqual(
    {
      title: actionModel.title,
      message: notice.message,
      actionLabel: actionModel.actionLabel,
      accessibilityLabel: actionModel.accessibilityLabel,
      accessibilityHint: actionModel.accessibilityHint,
    },
    {
      title: 'Couldn’t load synced chat history',
      message: 'Couldn’t load this synced chat from desktop. Check your connection and retry.',
      actionLabel: 'Retry',
      accessibilityLabel: 'Retry loading synced chat button',
      accessibilityHint: 'Attempts to load the current synced chat history from desktop again.',
    }
  );
  assert.deepEqual(openedScreens, []);
  assert.deepEqual(setMessagesCalls, [[]]);
  assert.deepEqual(retriedSessionIds, ['stub-retry']);
});

test('ChatScreen uses the ChatScreen stub-session action model for the rendered banner button', () => {
  assert.match(
    chatScreenSource,
    /const activeStubSessionNoticeAction = activeStubSessionNotice[\s\S]*?createChatScreenStubSessionNoticeActionModel\(activeStubSessionNotice, \{[\s\S]*?navigate: \(screenName\) => navigation\.navigate\(screenName\),[\s\S]*?setMessages,[\s\S]*?loadStubSessionMessages,[\s\S]*?\}\)/
  );
  assert.match(chatScreenSource, /onPress=\{activeStubSessionNoticeAction\?\.onPress\}/);
  assert.match(chatScreenSource, /accessibilityLabel=\{activeStubSessionNoticeAction\?\.accessibilityLabel\}/);
  assert.match(chatScreenSource, /accessibilityHint=\{activeStubSessionNoticeAction\?\.accessibilityHint\}/);
  assert.match(chatScreenSource, /\{activeStubSessionNoticeAction\?\.actionLabel\}/);
});

test('returns a retry notice when stub-session lazy loading resolves null for the active session', async () => {
  const { resolveStubSessionLazyLoad } = await loadStubSessionHelpers();

  const outcome = await resolveStubSessionLazyLoad({
    stubSessionId: 'stub-null',
    getCurrentSessionId: () => 'stub-null',
    loadMessages: async () => null,
  });

  assert.deepEqual(outcome, {
    kind: 'notice',
    notice: {
      kind: 'load-failed',
      sessionId: 'stub-null',
      message: 'Couldn’t load this synced chat from desktop. Check your connection and retry.',
    },
  });
});

test('returns a retry notice when stub-session lazy loading throws for the active session', async () => {
  const { resolveStubSessionLazyLoad } = await loadStubSessionHelpers();
  const error = new Error('network down');
  const loggedErrors = [];

  const outcome = await resolveStubSessionLazyLoad({
    stubSessionId: 'stub-throw',
    getCurrentSessionId: () => 'stub-throw',
    loadMessages: async () => {
      throw error;
    },
    onError: (err) => {
      loggedErrors.push(err);
    },
  });

  assert.deepEqual(loggedErrors, [error]);
  assert.deepEqual(outcome, {
    kind: 'notice',
    notice: {
      kind: 'load-failed',
      sessionId: 'stub-throw',
      message: 'Couldn’t load this synced chat from desktop. Check your connection and retry.',
    },
  });
});

test('hydrates stub-session messages when lazy loading succeeds for the active session', async () => {
  const { resolveStubSessionLazyLoad } = await loadStubSessionHelpers();
  const messages = [{ role: 'assistant', content: 'Loaded from desktop', timestamp: 1 }];

  const outcome = await resolveStubSessionLazyLoad({
    stubSessionId: 'stub-loaded',
    getCurrentSessionId: () => 'stub-loaded',
    loadMessages: async () => ({ messages, freshlyFetched: true }),
  });

  assert.equal(outcome.kind, 'loaded');
  assert.deepEqual(outcome.messages, messages);
  assert.equal(outcome.shouldSkipPersist, true);
});
