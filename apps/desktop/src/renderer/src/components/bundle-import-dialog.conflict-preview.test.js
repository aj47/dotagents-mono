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
  assert.match(bundleServiceSource, /export interface BundlePreviewResult \{[\s\S]*importTarget\?: \{[\s\S]*layer: BundleBackupTargetLayer[\s\S]*agentsDir: string[\s\S]*backupDir: string/);
  assert.match(bundleServiceSource, /function createBundleImportTargetPreview\(targetAgentsDir: string\): NonNullable<BundlePreviewResult\["importTarget"\]> \{[\s\S]*backupDir: path\.resolve\(getDefaultImportBackupDirectory\(\)\)/);
  assert.match(bundleServiceSource, /return \{[\s\S]*importTarget: createBundleImportTargetPreview\(targetAgentsDir\),[\s\S]*conflicts,[\s\S]*\}/);
  assert.match(tipcSource, /type BundleConflictPreview = \{[\s\S]*importTarget\?: \{[\s\S]*layer: "global" \| "workspace" \| "custom"[\s\S]*backupDir: string/);
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

test('bundle import dialog shows the automatic safety backup guarantee before confirmation', () => {
  assert.match(dialogSource, /<Label>Automatic safety backup<\/Label>/);
  assert.match(dialogSource, /Before DotAgents writes anything from this bundle, it will create a fresh pre-import backup of your current setup\./);
  assert.match(dialogSource, /This import will update the \{formatImportTargetLayerLabel\(importTarget\?\.layer\)\} and store the backup in/);
  assert.match(dialogSource, /You can restore it later from Settings → Capabilities → Restore Backup\./);
  assert.match(dialogSource, /Import target: <span className="font-medium text-foreground">\{formatImportTargetLayerLabel\(importTarget\.layer\)\}<\/span>/);
  assert.match(dialogSource, /const handleOpenBackupsFolderClick = async \(\) => \{/);
  assert.match(dialogSource, /tipcClient\.openBundleBackupFolder\(\)/);
  assert.match(dialogSource, /Open Backups Folder/);
  assert.match(dialogSource, /const backupMessage = result\.backupFilePath/);
  assert.match(dialogSource, /const revealBackupFile = async \(filePath: string\) => \{/);
  assert.match(dialogSource, /tipcClient\.revealBundleBackupFile\(\{ filePath \}\)/);
  assert.match(dialogSource, /const getRevealBackupToastOptions = \(filePath: string \| null\) => \{/);
  assert.match(dialogSource, /label: "Reveal Backup"/);
  assert.match(dialogSource, /toast\.success\([\s\S]*getRevealBackupToastOptions\(result\.backupFilePath\)/);
  assert.match(dialogSource, /toast\.error\([\s\S]*getRevealBackupToastOptions\(result\.backupFilePath\)/);
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

test('bundle import preserves MCP placeholder metadata and warns about post-import reconfiguration', () => {
  assert.match(bundleServiceSource, /export interface BundleMCPServer \{[\s\S]*config\?: Record<string, unknown>[\s\S]*redactedSecretFields\?: string\[\]/);
  assert.match(bundleServiceSource, /function getRedactedSecretFieldNames\(config: Record<string, unknown>\): string\[]/);
  assert.match(bundleServiceSource, /function buildImportedMcpServerConfig\(bundleServer: BundleMCPServer\): Record<string, unknown>/);
  assert.match(dialogSource, /import \{ useNavigate \} from "react-router-dom"/);
  assert.match(dialogSource, /const MCP_SERVERS_SETTINGS_ROUTE = "\/settings\/capabilities\?tab=mcp-servers"/);
  assert.match(dialogSource, /function getSelectedMcpServersRequiringConfiguration\(/);
  assert.match(dialogSource, /Credential reconfiguration required/);
  assert.match(dialogSource, /<CONFIGURE_YOUR_KEY>/);
  assert.match(dialogSource, /Settings → Capabilities/);
  assert.match(dialogSource, /const openMcpServersSettings = \(\) => navigate\(MCP_SERVERS_SETTINGS_ROUTE\)/);
  assert.match(dialogSource, /onClick=\{openMcpServersSettings\}/);
  assert.match(dialogSource, /toast\.warning\(/);
  assert.match(dialogSource, /label: "Open MCP Servers"/);
  assert.match(dialogSource, /<ExternalLink className="h-3\.5 w-3\.5" \/>/);
});

test('bundle import dialog supports per-item conflict overrides alongside the global default strategy', () => {
  assert.match(dialogSource, /type ConflictStrategyOverrideKey = Exclude<BundleComponentKey, "memories">/);
  assert.match(dialogSource, /const \[conflictStrategyOverrides, setConflictStrategyOverrides\] = useState<ConflictStrategyOverrideState>/);
  assert.match(dialogSource, /function getConflictStrategyOverride\(/);
  assert.match(dialogSource, /function summarizeSelectedConflictPlan\(/);
  assert.match(dialogSource, /setConflictOverride\(/);
  assert.match(dialogSource, /Choose the default policy for conflicting items, then override individual rows below/);
  assert.match(dialogSource, /Conflict action/);
  assert.match(dialogSource, /Overrides import default/);
  assert.match(dialogSource, /Using import default/);
  assert.match(dialogSource, /conflictStrategyOverrides,/);
});
