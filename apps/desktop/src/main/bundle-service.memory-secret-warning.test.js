import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const bundleServiceSource = fs.readFileSync(new URL('./bundle-service.ts', import.meta.url), 'utf8');

test('bundle service surfaces memory secret-warning metadata for export previews', () => {
  assert.match(bundleServiceSource, /export interface ExportableBundleMemory \{[\s\S]*containsPotentialSecret: boolean[\s\S]*secretWarningFields: Array<"content" \| "keyFindings" \| "userNotes">/);
  assert.match(bundleServiceSource, /const MEMORY_SECRET_VALUE_PATTERNS = \[/);
  assert.match(bundleServiceSource, /\/\\bsk-\[A-Za-z0-9_-\]\{16,\}\\b\//);
  assert.match(bundleServiceSource, /\/\\bgh\[pousr\]_\[A-Za-z0-9_\]\{20,\}\\b\/i/);
  assert.match(bundleServiceSource, /\/\\beyJ\[A-Za-z0-9_-\]\+\\\.\[A-Za-z0-9_-\]\+\\\.\[A-Za-z0-9_-\]\+\\b\//);
  assert.match(bundleServiceSource, /function getMemorySecretWarningFields\(memory: AgentMemory\)/);
  assert.match(bundleServiceSource, /containsPotentialSecret: hasPotentialSecretInMemory\(memory\)/);
  assert.match(bundleServiceSource, /secretWarningFields: getMemorySecretWarningFields\(memory\)/);
});