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

test('desktop onboarding keeps only the welcome hero vertically centered', () => {
  assert.match(
    onboardingSource,
    /const shellClassName =\s*step === "welcome"\s*\?\s*"w-full max-w-2xl mx-auto my-auto px-6 py-10"\s*:\s*"w-full max-w-2xl self-start mx-auto px-6 py-6 sm:py-8"/,
  )
  assert.match(onboardingSource, /<div className=\{shellClassName\}>/)
})

test('desktop onboarding setup steps use a tighter shared step-indicator gap', () => {
  assert.match(onboardingSource, /<div className="mb-6 flex justify-center gap-2">/)
  assert.doesNotMatch(onboardingSource, /<div className="flex justify-center gap-2 mb-8">/)
})

test('desktop onboarding source includes the requested main-agent choices', () => {
  assert.match(onboardingHelperSource, /Bring Your Own Key \(BYOK\)/)
  assert.match(onboardingHelperSource, /id: "opencode"/)
  assert.match(onboardingSource, /Connect your provider/)
})