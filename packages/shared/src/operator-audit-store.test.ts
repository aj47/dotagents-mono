import { describe, expect, it } from 'vitest';
import type { OperatorAuditEntry } from './api-types';
import {
  DEFAULT_OPERATOR_AUDIT_LOG_LIMIT,
  createOperatorAuditLogStore,
} from './operator-audit-store';
import { serializeOperatorAuditLogEntries } from './operator-actions';

function auditEntry(id: string, timestamp = Date.parse('2026-01-01T00:00:00Z')): OperatorAuditEntry {
  return {
    timestamp,
    action: id,
    path: `/v1/operator/${id}`,
    success: true,
  };
}

describe('operator audit store', () => {
  it('loads persisted entries once and exposes a defensive copy', () => {
    const persisted = [auditEntry('one'), auditEntry('two')];
    let reads = 0;
    const store = createOperatorAuditLogStore({
      readLog: () => {
        reads += 1;
        return serializeOperatorAuditLogEntries(persisted);
      },
      writeLog: () => undefined,
      appendLog: () => undefined,
    });

    expect(store.getEntries()).toEqual(persisted);
    const entries = store.getEntries();
    entries.push(auditEntry('mutated'));

    expect(store.getEntries()).toEqual(persisted);
    expect(reads).toBe(1);
  });

  it('appends incrementally until the bounded log needs a rewrite', () => {
    const writes: string[] = [];
    const appends: string[] = [];
    const store = createOperatorAuditLogStore({
      limit: 2,
      readLog: () => serializeOperatorAuditLogEntries([auditEntry('one')]),
      writeLog: (content) => writes.push(content),
      appendLog: (content) => appends.push(content),
    });

    store.append(auditEntry('two'));
    expect(appends).toEqual([serializeOperatorAuditLogEntries([auditEntry('two')])]);
    expect(writes).toEqual([]);
    expect(store.getEntries().map((entry) => entry.action)).toEqual(['one', 'two']);

    store.append(auditEntry('three'));
    expect(appends).toHaveLength(1);
    expect(writes).toEqual([
      serializeOperatorAuditLogEntries([auditEntry('two'), auditEntry('three')]),
    ]);
    expect(store.getEntries().map((entry) => entry.action)).toEqual(['two', 'three']);
  });

  it('reports storage errors without throwing', () => {
    const errors: Array<{ operation: string; message: string }> = [];
    const store = createOperatorAuditLogStore({
      readLog: () => {
        throw new Error('read failed');
      },
      writeLog: () => {
        throw new Error('write failed');
      },
      appendLog: () => {
        throw new Error('append failed');
      },
      onError: (operation, error) => {
        errors.push({
          operation,
          message: error instanceof Error ? error.message : String(error),
        });
      },
    });

    expect(store.getEntries()).toEqual([]);
    store.append(auditEntry('one'));

    expect(errors).toEqual([
      { operation: 'read', message: 'read failed' },
      { operation: 'append', message: 'append failed' },
    ]);
    expect(store.getEntries()).toEqual([auditEntry('one')]);
  });

  it('uses the same default audit log limit as desktop operator routes expect', () => {
    expect(DEFAULT_OPERATOR_AUDIT_LOG_LIMIT).toBe(200);
  });
});
