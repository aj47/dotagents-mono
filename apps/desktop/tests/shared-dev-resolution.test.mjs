import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const viteConfigSource = fs.readFileSync(
  path.join(process.cwd(), 'electron.vite.config.ts'),
  'utf8',
)

const tsconfigWebSource = fs.readFileSync(
  path.join(process.cwd(), 'tsconfig.web.json'),
  'utf8',
)

test('desktop renderer resolves @dotagents/shared directly to source during dev', () => {
  assert.match(viteConfigSource, /sharedSrcRoot = resolve\(__dirname, "\.\.\/\.\.\/packages\/shared\/src"\)/)
  assert.ok(viteConfigSource.includes('find: /^@dotagents\\/shared$/'))
  assert.ok(viteConfigSource.includes('find: /^@dotagents\\/shared\\/(.+)$/'))
  assert.ok(viteConfigSource.includes('replacement: `${sharedSrcRoot}/$1.ts`'))
})

test('desktop web tsconfig maps @dotagents/shared imports to source files', () => {
  assert.match(tsconfigWebSource, /"@dotagents\/shared": \[/)
  assert.match(tsconfigWebSource, /"\.\.\/\.\.\/packages\/shared\/src\/index\.ts"/)
  assert.match(tsconfigWebSource, /"@dotagents\/shared\/\*": \[/)
  assert.match(tsconfigWebSource, /"\.\.\/\.\.\/packages\/shared\/src\/\*"/)
})