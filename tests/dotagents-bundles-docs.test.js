const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const repoRoot = path.join(__dirname, '..')
const bundleDoc = fs.readFileSync(path.join(repoRoot, 'DOTAGENTS_BUNDLES.md'), 'utf8')
const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8')

test('bundle doc reflects current restore and MCP trust defaults', () => {
  assert.match(bundleDoc, /MCP setup disclosure before and after import/)
  assert.match(bundleDoc, /Restore`, `Reveal`, and `Copy path`/)
  assert.match(bundleDoc, /protected target layer/)
  assert.match(bundleDoc, /defaults back to the original snapshot target/)
  assert.match(bundleDoc, /one-click activation action afterward/)
  assert.match(bundleDoc, /Settings -> Capabilities -> MCP Servers/)
  assert.match(bundleDoc, /<CONFIGURE_YOUR_KEY>/)
  assert.match(bundleDoc, /<YOUR_USERNAME>/)
})

test('bundle doc reflects current website inspection warnings', () => {
  assert.match(bundleDoc, /Contains MCP commands/)
  assert.match(bundleDoc, /Requires setup/)
  assert.match(bundleDoc, /Large prompt content/)
  assert.match(bundleDoc, /startup-trigger behavior/)
})

test('README keeps the bundle doc discoverable from the repo homepage', () => {
  assert.match(readme, /Portable `\.dotagents` Bundles/)
  assert.match(readme, /original snapshot target/)
  assert.match(readme, /one-click slot activation afterward/)
  assert.match(readme, /DOTAGENTS_BUNDLES\.md/)
})