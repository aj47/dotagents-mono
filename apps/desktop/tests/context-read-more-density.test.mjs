import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd())

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('runtime tool surface exposes read_more_context', () => {
  const definitions = read('apps/desktop/src/main/runtime-tool-definitions.ts')
  const handlers = read('apps/desktop/src/main/runtime-tools.ts')

  assert.match(definitions, /name: "read_more_context"/)
  assert.match(handlers, /read_more_context: async/)
  assert.match(handlers, /readMoreContext\(/)
})

test('agent prompts teach the model to use Context refs', () => {
  const prompts = read('apps/desktop/src/main/system-prompts.ts')

  assert.match(prompts, /COMPACTED CONTEXT:/)
  assert.match(prompts, /Context ref: ctx_/)
  assert.match(prompts, /read_more_context/)
})