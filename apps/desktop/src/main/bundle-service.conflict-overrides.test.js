import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const bundleServiceSource = fs.readFileSync(new URL('./bundle-service.ts', import.meta.url), 'utf8');
const tipcSource = fs.readFileSync(new URL('./tipc.ts', import.meta.url), 'utf8');

test('bundle import supports per-item conflict strategy overrides on top of the global default', () => {
  assert.match(bundleServiceSource, /export type ConflictStrategyOverrideKey = "agentProfiles" \| "mcpServers" \| "skills" \| "repeatTasks"/);
  assert.match(bundleServiceSource, /export type ImportConflictStrategyOverrides = Partial<[\s\S]*Record<ConflictStrategyOverrideKey, Record<string, ImportConflictStrategy>>/);
  assert.match(bundleServiceSource, /conflictStrategyOverrides\?: ImportConflictStrategyOverrides/);
  assert.match(bundleServiceSource, /function resolveImportConflictStrategy\(/);
  assert.match(bundleServiceSource, /const itemConflictStrategy = resolveImportConflictStrategy\([\s\S]*"agentProfiles"/);
  assert.match(bundleServiceSource, /const itemConflictStrategy = resolveImportConflictStrategy\([\s\S]*"mcpServers"/);
  assert.match(bundleServiceSource, /const itemConflictStrategy = resolveImportConflictStrategy\([\s\S]*"skills"/);
  assert.match(bundleServiceSource, /const itemConflictStrategy = resolveImportConflictStrategy\([\s\S]*"repeatTasks"/);
  assert.match(tipcSource, /conflictStrategyOverrides\?: \{/);
  assert.match(tipcSource, /conflictStrategyOverrides: input\.conflictStrategyOverrides/);
});