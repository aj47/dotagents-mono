import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const onboardingSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/onboarding.tsx'),
  'utf8',
)

const onboardingHelperSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/lib/onboarding-main-agent.ts'),
  'utf8',
)

const installerSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/main/opencode-installer.ts'),
  'utf8',
)

const mcpServiceSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/main/mcp-service.ts'),
  'utf8',
)

test('OpenCode onboarding supports managed API-key setup', () => {
  assert.match(onboardingSource, /Configure OpenCode now with an API key/)
  assert.match(onboardingHelperSource, /OPENCODE_CONFIG_CONTENT/)
  assert.match(onboardingHelperSource, /DOTAGENTS_OPENCODE_PROVIDER_API_KEY/)
})

test('desktop supports managed on-demand OpenCode install and command resolution', () => {
  assert.match(installerSource, /installManagedOpencode/)
  assert.match(installerSource, /opencode-darwin-arm64/)
  assert.match(mcpServiceSource, /opencodeResourceSuffix/)
  assert.match(mcpServiceSource, /external-tools", "opencode", "current"/)
  assert.match(mcpServiceSource, /resourcesPath, "opencode"/)
})