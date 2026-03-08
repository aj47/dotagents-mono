const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const overlaySource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'overlay-follow-up-input.tsx'),
  'utf8'
)

test('overlay follow-up input resets local composer state when the focused session changes', () => {
  assert.match(overlaySource, /const composerScopeKey = `\$\{conversationId \?\? "new"\}:\$\{sessionId \?\? "none"\}`/)
  assert.match(overlaySource, /const previousComposerScopeKeyRef = useRef\(composerScopeKey\)/)
  assert.match(overlaySource, /useEffect\(\(\) => \{[\s\S]*submitInFlightRef\.current = false[\s\S]*setSubmissionError\(null\)[\s\S]*setText\(""\)[\s\S]*setImageAttachments\(\[\]\)/)
})

test('overlay follow-up input ignores stale async submit and attachment completions from the previous session', () => {
  assert.match(overlaySource, /const submittedScopeKey = composerScopeKey/)
  assert.match(overlaySource, /if \(latestComposerScopeKeyRef\.current === submittedScopeKey\) \{[\s\S]*setText\(""\)[\s\S]*setImageAttachments\(\[\]\)[\s\S]*setSubmissionError\(null\)/)
  assert.match(overlaySource, /if \(latestComposerScopeKeyRef\.current === submittedScopeKey\) \{[\s\S]*setSubmissionError\(errorMessage\)/)
  assert.match(overlaySource, /if \(latestComposerScopeKeyRef\.current === submittedScopeKey\) \{[\s\S]*submitInFlightRef\.current = false[\s\S]*setIsSubmitting\(false\)/)
  assert.match(overlaySource, /if \(submittedSessionId\) \{[\s\S]*appendUserMessageToSession\(submittedSessionId, message\)/)
  assert.match(overlaySource, /if \(latestComposerScopeKeyRef\.current !== selectionScopeKey\) \{[\s\S]*return/)
})