import type { OperatorAuditEntry } from './api-types';
import {
  appendOperatorAuditLogEntry,
  parseOperatorAuditLogEntries,
  serializeOperatorAuditLogEntries,
} from './operator-actions';

export const DEFAULT_OPERATOR_AUDIT_LOG_LIMIT = 200;

export type OperatorAuditStoreOperation =
  | 'read'
  | 'write'
  | 'append';

export interface OperatorAuditLogStoreOptions {
  limit?: number;
  readLog: () => string | undefined;
  writeLog: (content: string) => void;
  appendLog: (content: string) => void;
  onError?: (operation: OperatorAuditStoreOperation, error: unknown) => void;
}

export interface OperatorAuditLogStore {
  ensureLoaded(): void;
  append(entry: OperatorAuditEntry): void;
  getEntries(): OperatorAuditEntry[];
}

export function createOperatorAuditLogStore(
  options: OperatorAuditLogStoreOptions,
): OperatorAuditLogStore {
  const limit = options.limit ?? DEFAULT_OPERATOR_AUDIT_LOG_LIMIT;
  const entries: OperatorAuditEntry[] = [];
  let loaded = false;

  function reportError(operation: OperatorAuditStoreOperation, error: unknown): void {
    options.onError?.(operation, error);
  }

  function ensureLoaded(): void {
    if (loaded) return;
    loaded = true;

    try {
      const raw = options.readLog();
      if (!raw) return;

      const parsedEntries = parseOperatorAuditLogEntries(raw, limit);
      if (parsedEntries.length === 0) return;

      entries.splice(0, entries.length, ...parsedEntries);
    } catch (error) {
      reportError('read', error);
    }
  }

  function writeEntries(): void {
    try {
      options.writeLog(serializeOperatorAuditLogEntries(entries));
    } catch (error) {
      reportError('write', error);
    }
  }

  function append(entry: OperatorAuditEntry): void {
    ensureLoaded();
    const appendResult = appendOperatorAuditLogEntry(entries, entry, limit);
    entries.splice(0, entries.length, ...appendResult.entries);

    if (appendResult.shouldRewrite) {
      writeEntries();
      return;
    }

    try {
      options.appendLog(serializeOperatorAuditLogEntries([entry]));
    } catch (error) {
      reportError('append', error);
    }
  }

  function getEntries(): OperatorAuditEntry[] {
    ensureLoaded();
    return [...entries];
  }

  return {
    ensureLoaded,
    append,
    getEntries,
  };
}
