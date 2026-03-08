const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'onboarding.tsx'),
  'utf8'
)

test('onboarding loads the latest config before saving when the query cache is still empty', () => {
  assert.match(source, /const baseConfig = configQuery\.data \?\? await tipcClient\.getConfig\(\)/)
  assert.match(source, /reportConfigSaveError\(error\)/)
})

test('onboarding tracks pending save actions for API key, skip, and completion flows', () => {
  assert.match(source, /type OnboardingPendingAction = "save-api-key" \| "skip-onboarding" \| "complete-onboarding"/)
  assert.match(source, /const \[pendingAction, setPendingAction\] = useState<OnboardingPendingAction \| null>\(null\)/)
  assert.match(source, /const isSavingApiKey = pendingAction === "save-api-key"/)
  assert.match(source, /const isSkippingOnboarding = pendingAction === "skip-onboarding"/)
  assert.match(source, /const isCompletingOnboarding = pendingAction === "complete-onboarding"/)
})

test('onboarding keeps users oriented with inline retry guidance while saves are pending or fail', () => {
  assert.match(source, /Your API key is still here, so you can try again\./)
  assert.match(source, /You're still on this step, so you can try again\./)
  assert.match(source, /\{isSkipping \? "Skipping\.\.\." : "Skip Tutorial"\}/)
  assert.match(source, /\{isSaving \? "Saving\.\.\." : "Continue"\}/)
  assert.match(source, /\{isCompletingOnboarding \? "Starting\.\.\." : `Start Using \$\{process\.env\.PRODUCT_NAME\}`\}/)
  assert.match(source, /<OnboardingActionError message=\{actionError\} \/>/)
})