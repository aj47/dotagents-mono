const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const metroConfig = require(path.join(__dirname, '..', 'metro.config.js'));
const {
  collectWatchFolders,
  monorepoRoot,
  nodeModulesPaths,
  workspacePackageRoots,
} = metroConfig.__testUtils;

test('loads Metro config with watchFolders derived from the configured nodeModules paths', () => {
  assert.deepEqual(new Set(metroConfig.watchFolders), new Set(collectWatchFolders(nodeModulesPaths)));
  assert.ok(metroConfig.watchFolders.includes(monorepoRoot));
});

test('collectWatchFolders includes symlinked node_modules realpaths and linked workspace packages', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'metro-watchfolders-'));

  try {
    const dependencyStoreNodeModules = path.join(tempRoot, 'dependency-store', 'node_modules');
    const linkedWorkspacePackageRealPath = path.join(tempRoot, 'workspace-packages', 'shared');
    const symlinkedNodeModulesPath = path.join(tempRoot, 'apps', 'mobile', 'node_modules');
    const linkedWorkspacePackagePath = path.join(dependencyStoreNodeModules, '@dotagents', 'shared');

    fs.mkdirSync(path.join(dependencyStoreNodeModules, '@dotagents'), { recursive: true });
    fs.mkdirSync(linkedWorkspacePackageRealPath, { recursive: true });
    fs.mkdirSync(path.dirname(symlinkedNodeModulesPath), { recursive: true });

    fs.symlinkSync(dependencyStoreNodeModules, symlinkedNodeModulesPath, 'dir');
    fs.symlinkSync(linkedWorkspacePackageRealPath, linkedWorkspacePackagePath, 'dir');

    const watchFolders = new Set(collectWatchFolders([symlinkedNodeModulesPath]));

    assert.ok(watchFolders.has(monorepoRoot));
    assert.ok(watchFolders.has(symlinkedNodeModulesPath));
    assert.ok(watchFolders.has(fs.realpathSync(symlinkedNodeModulesPath)));
    assert.ok(watchFolders.has(fs.realpathSync(linkedWorkspacePackageRealPath)));
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('pins @dotagents workspace packages to the current worktree roots', () => {
  assert.equal(
    workspacePackageRoots['@dotagents/shared'],
    path.join(monorepoRoot, 'packages', 'shared')
  );
  assert.equal(
    metroConfig.resolver.extraNodeModules['@dotagents/shared'],
    path.join(monorepoRoot, 'packages', 'shared')
  );
});