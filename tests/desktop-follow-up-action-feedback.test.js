const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const overlaySource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'overlay-follow-up-input.tsx'),
  'utf8'
)

const tileSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'tile-follow-up-input.tsx'),
  'utf8'
)

test('desktop follow-up composers map voice-start failures to actionable microphone guidance', () => {
  for (const source of [overlaySource, tileSource]) {
    assert.match(source, /function getFollowUpVoiceStartErrorDetails\(error: unknown\)/)
    assert.match(source, /title: "Microphone access needed"/)
    assert.match(source, /Allow microphone access in your system settings, then try recording again\./)
    assert.match(source, /title: "No microphone found"/)
    assert.match(source, /title: "Microphone unavailable"/)
    assert.match(source, /title: "Recording failed to start"/)
    assert.match(source, /setActionError\(\{ \.\.\.errorDetails, retryAction: "voice" \}\)/)
  }
})

test('desktop follow-up composers keep voice-start and stop failures inline with retry support', () => {
  for (const source of [overlaySource, tileSource]) {
    assert.match(source, /const \[actionError, setActionError\] = useState<FollowUpActionError \| null>\(null\)/)
    assert.match(source, /function getFollowUpStopErrorDetails\(error: unknown\)/)
    assert.match(source, /title: "Stop request failed"/)
    assert.match(source, /setActionError\(\{ \.\.\.errorDetails, retryAction: "stop" \}\)/)
    assert.match(source, /\{actionError && \(/)
    assert.match(source, /<span className="font-medium">\{actionError\.title\}\.<\/span> \{actionError\.message\}/)
    assert.match(source, /const retryActionError = async \(\) => \{/)
    assert.match(source, /if \(actionError\.retryAction === "stop"\) \{[\s\S]*setIsStoppingSession\(true\)[\s\S]*await stopSessionAction\(\)/)
    assert.match(source, /await startVoiceRecording\(\)/)
    assert.match(source, /onClick=\{\(\) => void retryActionError\(\)\}/)
    assert.match(source, />\s*Retry\s*<\/Button>/)
    assert.match(source, /role="alert"/)
  }
})