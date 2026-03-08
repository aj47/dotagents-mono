const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const helperSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'acp-user-response.ts'),
  'utf8'
)

const mainAgentSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'acp-main-agent.ts'),
  'utf8'
)

test('ACP user-response derivation ignores earlier conversation history before the current run start index', () => {
  assert.match(helperSource, /for \(const message of conversationHistory\.slice\(currentRunStartIndex\)\)/)
  assert.match(mainAgentSource, /const currentRunHistoryStartIndex = conversationHistory\.length/)
})

test('ACP progress and final completion both derive respond_to_user state from the current run scope', () => {
  assert.match(
    mainAgentSource,
    /deriveAcpUserResponseState\(\s*conversationHistory,\s*currentRunHistoryStartIndex\s*\)/
  )

  assert.match(
    mainAgentSource,
    /const \{ userResponse, userResponseHistory \} = deriveAcpUserResponseState\(\s*conversationHistory,\s*currentRunHistoryStartIndex\s*\)/
  )
})