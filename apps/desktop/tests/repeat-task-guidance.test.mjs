import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd())

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('repeat-task guidance defaults new tasks to the global ~/.agents layer', () => {
  const skill = read('apps/desktop/resources/bundled-skills/dotagents-config-admin/SKILL.md')
  const prompt = read('apps/desktop/src/main/system-prompts-default.ts')

  assert.match(skill, /Create new repeat tasks in `~\/.agents\/tasks\/` by default/)
  assert.match(skill, /Use `\.\/.agents\/tasks\/` only when intentionally overriding or shadowing a global repeat task/)
  assert.match(prompt, /Create new repeat tasks in ~\/.agents\/tasks\/ by default; use \.\/.agents\/tasks\/ only for an intentional workspace override/)
})