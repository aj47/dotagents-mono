import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const indexSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/main/index.ts'),
  'utf8',
)

test('desktop startup begins watching repeat tasks without requiring restart', () => {
  assert.match(indexSource, /import \{ loopService, startTasksFolderWatcher \} from "\.\/loop-service"/)
  assert.match(indexSource, /loopService\.startAllLoops\(\)\s*\n\s*logApp\("Loop service started \(headless\)"\)\s*\n\s*startTasksFolderWatcher\(\)/)
  assert.match(indexSource, /loopService\.startAllLoops\(\)\s*\n\s*logApp\("Repeat tasks started"\)\s*\n\s*startTasksFolderWatcher\(\)/)
})