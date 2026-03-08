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

test('bundle import dialog renders an import plan with add and rename outcome details', () => {
  assert.match(dialogSource, /<Label>Import plan<\/Label>/);
  assert.match(dialogSource, /Review the exact items that will be added, skipped, overwritten, or renamed before importing anything\. Memories always stay additive-only\./);
  assert.match(dialogSource, /function buildImportPlanItems\(/);
  assert.match(dialogSource, /bundle\?\.agentProfiles \?\? \[\]/);
  assert.match(dialogSource, /function formatImportPlanOutcome\(item: ImportPlanItem\)/);
  assert.match(dialogSource, /Will be added as a new item\./);
  assert.match(dialogSource, /Will import alongside the existing item as \$\{item\.renameTargetId\}\./);
  assert.match(dialogSource, /<ImportPlanSection/);
  assert.match(dialogSource, /Add new/);
  assert.match(dialogSource, /Renamed ID preview:/);
});

test('bundle import supports per-item cherry-pick selection across dialog, tipc, and service layers', () => {
  assert.match(bundleServiceSource, /selectedItems\?: BundleItemSelectionOptions/);
  assert.match(bundleServiceSource, /function createImportSelectionSet\(ids\?: string\[\]\): Set<string> \| null/);
  assert.match(bundleServiceSource, /if \(!isImportItemSelected\(selectedAgentProfileIds, bundleProfile\.id\)\) \{/);
  assert.match(bundleServiceSource, /if \(!isImportItemSelected\(selectedMcpServerNames, bundleServer\.name\)\) \{/);
  assert.match(bundleServiceSource, /action: "skipped"/);
  assert.match(tipcSource, /selectedItems\?: \{[\s\S]*agentProfileIds\?: string\[\][\s\S]*memoryIds\?: string\[\][\s\S]*\}/);
  assert.match(dialogSource, /type BundleItemSelectionKey =/);
  assert.match(dialogSource, /function createDefaultItemSelections\(bundle\?: BundlePreview\["bundle"\]\)/);
  assert.match(dialogSource, /const \[selectedItems, setSelectedItems\] = useState<BundleItemSelectionState>/);
  assert.match(dialogSource, /selectedItems,/);
  assert.match(dialogSource, /action: "exclude"/);
  assert.match(dialogSource, /Excluded/);
  assert.match(dialogSource, /Switch checked=\{item\.selected\} onCheckedChange=\{\(\) => onToggleItem\(item\.id\)\}/);
});

test('memory import conflicts stay skip-only and bundle service deduplicates by content fingerprint', () => {
  assert.match(bundleServiceSource, /import \{ createHash \} from "crypto"/);
  assert.match(bundleServiceSource, /function getMemoryContentFingerprint\(memory: Pick<AgentMemory, "content"> \| Pick<BundleMemory, "content">\): string/);
  assert.match(bundleServiceSource, /const existingMemoryByContentFingerprint = new Map/);
  assert.match(bundleServiceSource, /defaultStrategy: "skip" as const/);
  assert.match(bundleServiceSource, /const existsByContent = existingContentFingerprints\.has\(contentFingerprint\)/);
  assert.match(dialogSource, /function formatExpectedMemoryConflictOutcome\(conflictCount: number\): string \| null/);
  assert.match(dialogSource, /Memory selection: \{expectedMemoryConflictOutcome\}/);
  assert.match(dialogSource, /memory imports are additive-only/);
});

test('bundle import dialog supports section-level bulk selection and blocks empty imports', () => {
  assert.match(dialogSource, /function getBundleImportItems\(/);
  assert.match(dialogSource, /const setImportPlanSectionSelection = \(key: BundleComponentKey, selected: boolean\) => \{/);
  assert.match(dialogSource, /Select all/);
  assert.match(dialogSource, /Clear all/);
  assert.match(dialogSource, /Select at least one item to import\./);
  assert.match(dialogSource, /const importDisabled = !preview\?\.filePath \|\| importing \|\| loading \|\| selectedPlanItemCount === 0/);
  assert.match(dialogSource, /<Button onClick=\{handleImport\} disabled=\{importDisabled\}>/);
});