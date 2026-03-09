import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const onboardingSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/onboarding.tsx'),
  'utf8',
)

const welcomeStepMatch = onboardingSource.match(/function WelcomeStep[\s\S]*?\/\/ API Key Step/)

assert.ok(welcomeStepMatch, 'expected to find WelcomeStep in onboarding.tsx')

const welcomeStepSource = welcomeStepMatch[0]

test('desktop onboarding welcome step uses a tighter bounded hero layout', () => {
  assert.doesNotMatch(welcomeStepSource, /className="text-center"/)
  assert.match(welcomeStepSource, /className="mx-auto max-w-xl text-center"/)
  assert.match(welcomeStepSource, /text-5xl text-primary sm:text-6xl/)
  assert.match(welcomeStepSource, /mb-3 text-2xl font-bold tracking-tight sm:text-3xl/)
  assert.match(welcomeStepSource, /mx-auto mb-6 max-w-xl text-base text-muted-foreground sm:text-lg/)
})

test('desktop onboarding welcome actions avoid the old fixed-width CTA and tighten secondary chrome', () => {
  assert.doesNotMatch(welcomeStepSource, /className="w-64"/)
  assert.match(welcomeStepSource, /className="flex flex-col items-center gap-2\.5"/)
  assert.match(welcomeStepSource, /<Button size="lg" onClick=\{onNext\} className="w-full max-w-56">/)
  assert.match(welcomeStepSource, /<Button variant="ghost" size="sm" onClick=\{onSkip\} className="text-muted-foreground">/)
})