import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const tipcSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/main/tipc.ts'),
  'utf8',
)

test('skills folder open action uses the resilient file-manager helper', () => {
  assert.match(tipcSource, /async function openDirectoryInFileManager\(directoryPath: string\)/)
  assert.match(tipcSource, /const openPathError = await shell\.openPath\(resolvedPath\)/)
  assert.match(tipcSource, /shell\.showItemInFolder\(resolvedPath\)/)
  assert.match(
    tipcSource,
    /openSkillsFolder:[\s\S]*?const skillsDir = getAgentsSkillsDir\(layer\)[\s\S]*?return openDirectoryInFileManager\(skillsDir\)/,
  )
  assert.match(
    tipcSource,
    /openWorkspaceSkillsFolder:[\s\S]*?const skillsDir = getAgentsSkillsDir\(layer\)[\s\S]*?return openDirectoryInFileManager\(skillsDir\)/,
  )
})