import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dialogSource = fs.readFileSync(new URL('./bundle-export-dialog.tsx', import.meta.url), 'utf8');
const selectionSource = fs.readFileSync(new URL('./bundle-selection.tsx', import.meta.url), 'utf8');
const bundleServiceSource = fs.readFileSync(new URL('../../../main/bundle-service.ts', import.meta.url), 'utf8');

test('bundle export dialog warns about selected memories with secret-like text', () => {
  assert.match(selectionSource, /export function getBundleMemorySecretWarnings\(/);
  assert.match(selectionSource, /containsPotentialSecret: boolean/);
  assert.match(selectionSource, /secretWarningFields: Array<"content" \| "keyFindings" \| "userNotes">/);
  assert.match(dialogSource, /const memorySecretWarnings = getBundleMemorySecretWarnings\(exportableItemsQuery\.data, components, selection\)/);
  assert.match(dialogSource, /Potential secret-like text was detected in \{memorySecretWarnings\.length\} selected memor/);
  assert.match(dialogSource, /bundle files include memory text as-is/);
});

test('bundle export keeps memories opt-in by default', () => {
  assert.match(selectionSource, /memories: false,/);
  assert.match(selectionSource, /Memory content and notes\. Off by default for privacy\./);
  assert.match(dialogSource, /createDetailedBundleSelection\(exportableItemsQuery\.data, DEFAULT_EXPORT_COMPONENTS\)/);
  assert.match(bundleServiceSource, /const DEFAULT_EXPORT_COMPONENTS: Required<BundleComponentSelection> = \{[\s\S]*memories: false,/);
});