const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'memories.tsx'),
  'utf8'
);

test('desktop memories single-delete treats false results as failures and keeps retry guidance inline', () => {
  assert.match(source, /const \[deleteErrorMessage, setDeleteErrorMessage\] = useState<string \| null>\(null\)/);
  assert.match(source, /const deleted = await tipcClient\.deleteMemory\(\{ id \}\)/);
  assert.match(source, /if \(!deleted\) \{\s*throw new Error\(`Failed to delete memory \$\{id\}`\)/);
  assert.match(source, /Couldn't delete \$\{deleteMemoryLabel\} yet\. This memory is still available, so you can try again\./);
  assert.match(source, /<DestructiveActionError message=\{deleteErrorMessage\} \/>/);
  assert.match(source, /\{deleteErrorMessage \? "Retry delete" : "Delete"\}/);
});

test('desktop memories bulk delete failures stay inside the confirmation dialog', () => {
  assert.match(source, /const \[bulkDeleteErrorMessage, setBulkDeleteErrorMessage\] = useState<string \| null>\(null\)/);
  assert.match(source, /Couldn't delete the selected memories yet\. They are still available, so you can try again\./);
  assert.match(source, /<DestructiveActionError message=\{bulkDeleteErrorMessage\} \/>/);
  assert.match(source, /\{bulkDeleteErrorMessage \? "Retry delete" : `Delete \$\{visibleSelectedCount\} Memories`\}/);
});

test('desktop memories delete-all failures stay inside the confirmation dialog', () => {
  assert.match(source, /const \[deleteAllErrorMessage, setDeleteAllErrorMessage\] = useState<string \| null>\(null\)/);
  assert.match(source, /Couldn't delete all memories yet\. Your saved memories are still available, so you can try again\./);
  assert.match(source, /<DestructiveActionError message=\{deleteAllErrorMessage\} \/>/);
  assert.match(source, /\{deleteAllErrorMessage \? "Retry delete all" : "Delete All Memories"\}/);
});