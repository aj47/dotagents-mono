import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const settingsSource = fs.readFileSync(path.join(__dirname, 'settings-agents.tsx'), 'utf8')
const dialogSource = fs.readFileSync(path.join(__dirname, '..', 'components', 'bundle-import-dialog.tsx'), 'utf8')
const startupRoutingSource = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'main', 'startup-routing.ts'), 'utf8')
const indexSource = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'main', 'index.ts'), 'utf8')

test('Hub install routing preserves source provenance from the deep link into the settings route', () => {
  assert.match(startupRoutingSource, /export function buildHubBundleInstallUrl\([\s\S]*sourceBundleUrl\?: string \| null/)
  assert.match(startupRoutingSource, /const params = new URLSearchParams\(\{ installBundle: filePath \}\)/)
  assert.match(startupRoutingSource, /if \(sourceBundleUrl\) \{\s*params\.set\("installBundleSource", sourceBundleUrl\)/)
  assert.match(startupRoutingSource, /buildHubBundleInstallUrl\(pendingHubBundleHandoffPath, pendingHubBundleSourceUrl\)/)
})

test('main-process Hub download handoff stores the original bundle URL alongside the temp file path', () => {
  assert.match(indexSource, /let pendingHubBundleSourceUrl: string \| null = null/)
  assert.match(indexSource, /options: \{ openIfReady\?: boolean; sourceBundleUrl\?: string \| null \} = \{\}/)
  assert.match(indexSource, /pendingHubBundleSourceUrl = sourceBundleUrl/)
  assert.match(indexSource, /queueHubBundleInstall\(downloadedPath, \{ \.\.\.options, sourceBundleUrl: bundleUrl \}\)/)
  assert.match(indexSource, /sourceBundleUrl: pendingHubBundleSourceUrl \?\? undefined/)
})

test('settings agents forwards Hub source provenance into the existing import dialog flow', () => {
  assert.match(settingsSource, /const \[prefilledImportSourceUrl, setPrefilledImportSourceUrl\] = useState<string \| null>\(null\)/)
  assert.match(settingsSource, /const installBundleSource = searchParams\.get\("installBundleSource"\)\?\.trim\(\) \|\| null/)
  assert.match(settingsSource, /setPrefilledImportSourceUrl\(installBundleSource\)/)
  assert.match(settingsSource, /nextParams\.delete\("installBundleSource"\)/)
  assert.match(settingsSource, /sourceLabel=\{prefilledImportSourceUrl \? "Downloaded from Hub" : undefined\}/)
  assert.match(settingsSource, /sourceUrl=\{prefilledImportSourceUrl \|\| undefined\}/)
})

test('bundle import dialog renders a visible external source link when provenance is available', () => {
  assert.match(dialogSource, /sourceLabel\?: string/)
  assert.match(dialogSource, /sourceUrl\?: string/)
  assert.match(dialogSource, /sourceLabel = "Bundle source"/)
  assert.match(dialogSource, /sourceUrl && \(/)
  assert.match(dialogSource, /href=\{sourceUrl\}/)
  assert.match(dialogSource, /target="_blank"/)
  assert.match(dialogSource, /rel="noopener noreferrer"/)
})