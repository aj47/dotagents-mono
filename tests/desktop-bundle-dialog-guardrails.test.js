const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const exportDialogSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'bundle-export-dialog.tsx'),
  'utf8'
);

const publishDialogSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'bundle-publish-dialog.tsx'),
  'utf8'
);

const importDialogSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'bundle-import-dialog.tsx'),
  'utf8'
);

const bundleSelectionSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'bundle-selection.tsx'),
  'utf8'
);

test('bundle export dialog warns before discarding a dirty export draft and blocks close while saving', () => {
  assert.match(exportDialogSource, /const \[selectionBaseline, setSelectionBaseline\] = useState<BundleDetailedSelectionState \| null>\(null\)/);
  assert.match(exportDialogSource, /const isExportDirty = hasExportDraftChanges\(form, components, selection, selectionBaseline\)/);
  assert.match(exportDialogSource, /if \(saving\) return/);
  assert.match(exportDialogSource, /Discard this bundle export draft\? Your selected items and metadata will be lost\./);
  assert.match(exportDialogSource, /You have unsaved export changes\. Save the bundle before closing to keep this selection and metadata\./);
  assert.match(exportDialogSource, /<Dialog open=\{open\} onOpenChange=\{handleOpenChange\}>/);
});

test('bundle publish dialog protects unsaved metadata and generated preview work across close paths', () => {
  assert.match(publishDialogSource, /const \[selectionBaseline, setSelectionBaseline\] = useState<BundleDetailedSelectionState \| null>\(null\)/);
  assert.match(publishDialogSource, /const \[savingBundle, setSavingBundle\] = useState\(false\)/);
  assert.match(publishDialogSource, /const \[savingSubmission, setSavingSubmission\] = useState\(false\)/);
  assert.match(publishDialogSource, /const isBusy = loading \|\| savingBundle \|\| savingSubmission/);
  assert.match(publishDialogSource, /const isPublishDirty = hasPublishFormChanges\(form\)[\s\S]*?\|\| preview !== null/);
  assert.match(publishDialogSource, /Discard this Hub publish draft\? Your selected items, metadata, and generated preview will be lost\./);
  assert.match(publishDialogSource, /You have unsaved publish work\. Save the bundle or Hub package before closing if you still need this generated preview\./);
  assert.match(publishDialogSource, /if \(isBusy\) return/);
  assert.match(publishDialogSource, /<Dialog open=\{open\} onOpenChange=\{handleOpenChange\}>/);
});

test('bundle import dialog explains conflict consequences and previews affected items before import', () => {
  assert.match(importDialogSource, /const CONFLICT_STRATEGY_COPY: Record<ConflictStrategy, \{ label: string; summary: string \}> = \{/);
  assert.match(importDialogSource, /Conflicting items will be skipped and left untouched in your current configuration\./);
  assert.match(importDialogSource, /Conflicting items in your current configuration will be replaced by the bundle versions\./);
  assert.match(importDialogSource, /Conflicting items will be imported alongside the existing ones with new IDs where needed\./);
  assert.match(importDialogSource, /const activeConflictGroups = conflicts/);
  assert.match(importDialogSource, /group\.items\.slice\(0, 3\)\.map\(item =>/);
  assert.match(importDialogSource, /Bundle:<\/span> \{item\.name\}/);
  assert.match(importDialogSource, /Existing:<\/span> \{item\.existingName\}/);
});

test('shared bundle selection helpers expose reusable dirty-state comparisons', () => {
  assert.match(bundleSelectionSource, /export function hasBundleComponentSelectionChanges\(/);
  assert.match(bundleSelectionSource, /export function hasDetailedBundleSelectionChanges\(/);
  assert.match(bundleSelectionSource, /const BUNDLE_COMPONENT_KEYS: \(keyof BundleComponentSelectionState\)\[] = \[/);
  assert.match(bundleSelectionSource, /const BUNDLE_SELECTION_KEYS: \(keyof BundleDetailedSelectionState\)\[] = \[/);
});