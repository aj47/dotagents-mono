import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const repoRoot = path.resolve(process.cwd())

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8")
}

test("voice recording sessions stay runtime-registered before title tools run", () => {
  const source = read("apps/desktop/src/main/tipc.ts")

  assert.match(
    source,
    /agentSessionTracker\.updateSession\(sessionId,[\s\S]*?suppressPanelAutoShow: launchState\.shouldSuppressPanelAutoShow,[\s\S]*?\}\)\s*\n\s*agentSessionStateManager\.createSession\(sessionId, profileSnapshot\)/,
  )
  assert.match(
    source,
    /agentSessionTracker\.errorSession\(sessionId, getErrorMessage\(error, "Transcription failed"\)\)\s*\n\s*agentSessionStateManager\.cleanupSession\(sessionId\)/,
  )
})

test("automatic session title generation uses the active agent provider", () => {
  const source = read("apps/desktop/src/main/conversation-service.ts")

  assert.match(source, /import \{ getCurrentProviderId \} from "\.\/ai-sdk-provider"/)
  assert.match(
    source,
    /makeTextCompletionWithFetch\(\s*prompt,\s*getCurrentProviderId\(\),\s*sessionId,[\s\S]*?modelContext: "mcp",[\s\S]*?failureLogLevel: "warning"/,
  )
  assert.doesNotMatch(source, /makeTextCompletionWithFetch\(prompt, undefined, sessionId\)/)
})
