const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const helperModuleUrl = pathToFileURL(
  path.join(__dirname, '..', 'src', 'screens', 'chat-stub-session-notice.ts')
).href;

const loadStubSessionHelpers = () => import(helperModuleUrl);

test('builds the connection-settings notice and routes its action to settings', async () => {
  const {
    activateStubSessionNotice,
    createStubSessionCredentialsNotice,
    getStubSessionNoticeViewModel,
  } = await loadStubSessionHelpers();

  const notice = createStubSessionCredentialsNotice('stub-credentials');
  const viewModel = getStubSessionNoticeViewModel(notice);
  let openedSettings = 0;
  const retriedSessionIds = [];

  activateStubSessionNotice(notice, {
    openConnectionSettings: () => {
      openedSettings += 1;
    },
    retryLoad: (sessionId) => {
      retriedSessionIds.push(sessionId);
    },
  });

  assert.deepEqual(
    {
      title: viewModel.title,
      message: notice.message,
      actionLabel: viewModel.actionLabel,
      accessibilityLabel: viewModel.accessibilityLabel,
      accessibilityHint: viewModel.accessibilityHint,
    },
    {
      title: 'Synced chat needs connection settings',
      message: 'Connect this mobile app to DotAgents to load synced chats from desktop.',
      actionLabel: 'Open settings',
      accessibilityLabel: 'Open connection settings button',
      accessibilityHint: 'Opens connection settings so this mobile app can load synced chat history.',
    }
  );
  assert.equal(openedSettings, 1);
  assert.deepEqual(retriedSessionIds, []);
});

test('builds the retry notice and routes its action back into stub-session loading', async () => {
  const {
    activateStubSessionNotice,
    createStubSessionLoadFailedNotice,
    getStubSessionNoticeViewModel,
  } = await loadStubSessionHelpers();

  const notice = createStubSessionLoadFailedNotice('stub-retry');
  const viewModel = getStubSessionNoticeViewModel(notice);
  let clearedMessages = 0;
  const retriedSessionIds = [];

  activateStubSessionNotice(notice, {
    openConnectionSettings: () => {
      throw new Error('retry notice should not open settings');
    },
    clearMessages: () => {
      clearedMessages += 1;
    },
    retryLoad: (sessionId) => {
      retriedSessionIds.push(sessionId);
    },
  });

  assert.deepEqual(
    {
      title: viewModel.title,
      message: notice.message,
      actionLabel: viewModel.actionLabel,
      accessibilityLabel: viewModel.accessibilityLabel,
      accessibilityHint: viewModel.accessibilityHint,
    },
    {
      title: 'Couldn’t load synced chat history',
      message: 'Couldn’t load this synced chat from desktop. Check your connection and retry.',
      actionLabel: 'Retry',
      accessibilityLabel: 'Retry loading synced chat button',
      accessibilityHint: 'Attempts to load the current synced chat history from desktop again.',
    }
  );
  assert.equal(clearedMessages, 1);
  assert.deepEqual(retriedSessionIds, ['stub-retry']);
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
