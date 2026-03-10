const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const metroConfigSource = fs.readFileSync(
  path.join(__dirname, '..', 'metro.config.js'),
  'utf8'
);

test('watches real node_modules paths so Expo web can run from symlinked worktrees', () => {
  assert.match(metroConfigSource, /function addWorkspacePackageWatchFolders\(nodeModulesPath, watchFolders\)/);
  assert.match(metroConfigSource, /function collectWatchFolders\(paths\)/);
  assert.match(metroConfigSource, /watchFolders\.add\(fs\.realpathSync\(candidatePath\)\)/);
  assert.match(metroConfigSource, /addWorkspacePackageWatchFolders\(candidatePath, watchFolders\);/);
  assert.match(metroConfigSource, /config\.watchFolders = collectWatchFolders\(nodeModulesPaths\);/);
});