import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const bundleServiceSource = fs.readFileSync(new URL('../../../main/bundle-service.ts', import.meta.url), 'utf8');
const tipcSource = fs.readFileSync(new URL('../../../main/tipc.ts', import.meta.url), 'utf8');
const dialogSource = fs.readFileSync(new URL('./bundle-import-dialog.tsx', import.meta.url), 'utf8');

test('bundle preview conflicts include default skip policy and deterministic rename previews', () => {
  assert.match(bundleServiceSource, /export interface PreviewConflict \{[\s\S]*defaultStrategy: ImportConflictStrategy[\s\S]*renameTargetId\?: string/);
  assert.match(bundleServiceSource, /function createPreviewConflict\([\s\S]*defaultStrategy: "skip"[\s\S]*renameTargetId: generateUniqueId\(id, existingIds\)/);
  assert.match(tipcSource, /type BundleConflictItem = \{[\s\S]*defaultStrategy: "skip"[\s\S]*renameTargetId\?: string/);
});

test('bundle import dialog renders a concrete conflict preview with rename outcome details', () => {
  assert.match(dialogSource, /<Label>Conflict preview<\/Label>/);
  assert.match(dialogSource, /Review the exact items that already exist before importing anything\./);
  assert.match(dialogSource, /function formatConflictOutcome\(conflict: PreviewConflict, strategy: ConflictStrategy\)/);
  assert.match(dialogSource, /Will import alongside the existing item as \$\{conflict\.renameTargetId\}\./);
  assert.match(dialogSource, /<ConflictPreviewSection/);
  assert.match(dialogSource, /Renamed ID preview:/);
});