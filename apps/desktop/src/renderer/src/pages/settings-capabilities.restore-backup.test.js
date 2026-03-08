import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const settingsSource = fs.readFileSync(path.join(__dirname, 'settings-capabilities.tsx'), 'utf8')
const dialogSource = fs.readFileSync(path.join(__dirname, '..', 'components', 'bundle-import-dialog.tsx'), 'utf8')
const tipcSource = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'main', 'tipc.ts'), 'utf8')
const bundleServiceSource = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'main', 'bundle-service.ts'), 'utf8')

test('settings capabilities exposes a restore-backup entrypoint that reuses the bundle import dialog', () => {
  assert.match(settingsSource, /Restore Backup/)
  assert.match(settingsSource, /tipcClient\.selectBundleBackupFile\(\)/)
  assert.match(settingsSource, /tipcClient\.listBundleBackups\(\{ limit: 4 \}\)/)
  assert.match(settingsSource, /Recent backups/)
  assert.match(settingsSource, /openRestoreDialogForFile\(backup\.filePath\)/)
  assert.match(settingsSource, /<BundleImportDialog[\s\S]*title="Restore Backup"/)
  assert.match(settingsSource, /confirmLabel="Restore"/)
  assert.match(settingsSource, /successVerb="restored"/)
  assert.match(settingsSource, /queryClient\.invalidateQueries\(\{ queryKey: \["skills"\] \}\)/)
  assert.match(settingsSource, /queryClient\.invalidateQueries\(\{ queryKey: \["config"\] \}\)/)
  assert.match(settingsSource, /queryClient\.invalidateQueries\(\{ queryKey: \["bundle-import-backups"\] \}\)/)
})

test('bundle import dialog supports restore-specific labels without forking the import flow', () => {
  assert.match(dialogSource, /confirmLabel\?: string/)
  assert.match(dialogSource, /successVerb\?: string/)
  assert.match(dialogSource, /confirmLabel = "Import"/)
  assert.match(dialogSource, /successVerb = "imported"/)
  assert.match(dialogSource, /Successfully \$\{successVerb\} \$\{imported\} item\(s\)/)
  assert.match(dialogSource, /<Button onClick=\{handleImport\}[\s\S]*\{confirmLabel\}/)
})

test('main process offers a backup-file picker rooted in the default backup directory', () => {
  assert.match(bundleServiceSource, /export function getDefaultImportBackupDirectory\(\): string/)
  assert.match(bundleServiceSource, /export async function selectImportBackupBundleFromDialog\(\): Promise<string \| null>/)
  assert.match(bundleServiceSource, /export function listImportBackups\(options\?: \{ limit\?: number \}\): ImportBackupSummary\[]/)
  assert.match(bundleServiceSource, /manifestName: bundle\.manifest\.name/)
  assert.match(bundleServiceSource, /\.sort\(\(a, b\) => b\.modifiedAt - a\.modifiedAt\)/)
  assert.match(bundleServiceSource, /title: "Restore Backup Bundle"/)
  assert.match(bundleServiceSource, /defaultPath: backupDir/)
  assert.match(tipcSource, /selectBundleBackupFile: t\.procedure\.action\(async \(\) =>/)
  assert.match(tipcSource, /listBundleBackups: t\.procedure/)
  assert.match(tipcSource, /listImportBackups\(\{ limit: input\?\.limit \}\)/)
  assert.match(tipcSource, /selectImportBackupBundleFromDialog/)
})