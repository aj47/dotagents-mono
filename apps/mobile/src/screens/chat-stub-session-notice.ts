import type { ChatMessage } from '../lib/openaiClient';

export type StubSessionNotice = {
  kind: 'credentials' | 'load-failed';
  sessionId: string;
  message: string;
};

type StubSessionLoadMessagesResult = {
  messages: ChatMessage[];
  freshlyFetched: boolean;
} | null;

export type StubSessionLazyLoadOutcome =
  | { kind: 'loaded'; messages: ChatMessage[]; shouldSkipPersist: boolean }
  | { kind: 'notice'; notice: StubSessionNotice }
  | { kind: 'stale' };

const STUB_SESSION_CREDENTIALS_MESSAGE =
  'Connect this mobile app to DotAgents to load synced chats from desktop.';
const STUB_SESSION_LOAD_FAILED_MESSAGE =
  'Couldn’t load this synced chat from desktop. Check your connection and retry.';
const FALLBACK_BUTTON_LABEL = 'Action button';

const createStubSessionButtonAccessibilityLabel = (actionName: string) => {
  const normalizedName = actionName.trim();
  return normalizedName.length > 0 ? `${normalizedName} button` : FALLBACK_BUTTON_LABEL;
};

export const createStubSessionCredentialsNotice = (sessionId: string): StubSessionNotice => ({
  kind: 'credentials',
  sessionId,
  message: STUB_SESSION_CREDENTIALS_MESSAGE,
});

export const createStubSessionLoadFailedNotice = (sessionId: string): StubSessionNotice => ({
  kind: 'load-failed',
  sessionId,
  message: STUB_SESSION_LOAD_FAILED_MESSAGE,
});

export const getStubSessionNoticeViewModel = (notice: StubSessionNotice) => {
  if (notice.kind === 'credentials') {
    return {
      title: 'Synced chat needs connection settings',
      actionLabel: 'Open settings',
      accessibilityLabel: createStubSessionButtonAccessibilityLabel('Open connection settings'),
      accessibilityHint: 'Opens connection settings so this mobile app can load synced chat history.',
    };
  }

  return {
    title: 'Couldn’t load synced chat history',
    actionLabel: 'Retry',
    accessibilityLabel: createStubSessionButtonAccessibilityLabel('Retry loading synced chat'),
    accessibilityHint: 'Attempts to load the current synced chat history from desktop again.',
  };
};

export const activateStubSessionNotice = (
  notice: StubSessionNotice,
  handlers: {
    openConnectionSettings: () => void;
    retryLoad: (sessionId: string) => void;
    clearMessages?: () => void;
  },
) => {
  if (notice.kind === 'credentials') {
    handlers.openConnectionSettings();
    return;
  }

  handlers.clearMessages?.();
  handlers.retryLoad(notice.sessionId);
};

export const resolveStubSessionLazyLoad = async ({
  stubSessionId,
  getCurrentSessionId,
  loadMessages,
  onError,
}: {
  stubSessionId: string;
  getCurrentSessionId: () => string | null;
  loadMessages: () => Promise<StubSessionLoadMessagesResult>;
  onError?: (error: unknown) => void;
}): Promise<StubSessionLazyLoadOutcome> => {
  try {
    const result = await loadMessages();

    if (!result) {
      return getCurrentSessionId() === stubSessionId
        ? { kind: 'notice', notice: createStubSessionLoadFailedNotice(stubSessionId) }
        : { kind: 'stale' };
    }

    if (getCurrentSessionId() !== stubSessionId) {
      return { kind: 'stale' };
    }

    return {
      kind: 'loaded',
      messages: result.messages,
      shouldSkipPersist: result.messages.length > 0,
    };
  } catch (error) {
    onError?.(error);

    return getCurrentSessionId() === stubSessionId
      ? { kind: 'notice', notice: createStubSessionLoadFailedNotice(stubSessionId) }
      : { kind: 'stale' };
  }
};