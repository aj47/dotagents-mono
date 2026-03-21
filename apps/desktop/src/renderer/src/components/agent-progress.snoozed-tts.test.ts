import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("agent progress TTS guardrails", () => {
  it("disables overlay auto-play generation when the session is snoozed", () => {
    expect(agentProgressSource).toContain('const shouldAutoPlay = variant === "overlay" && !isSnoozed')
  })

  it("threads snoozed state through overlay and tile TTS players", () => {
    expect(agentProgressSource).toContain('isSnoozed={progress.isSnoozed}')
    expect(agentProgressSource).toContain('autoPlay={!isSnoozed && (configQuery.data?.ttsAutoPlay ?? true)}')
  })

  it("keeps response-linked assistant messages replayable and eligible for smart auto-play", () => {
    expect(agentProgressSource).toContain('(isComplete || !!message.responseEvent)')
    expect(agentProgressSource).toContain('autoPlay={(isLast || !!message.responseEvent) ? ((configQuery.data?.ttsAutoPlay ?? true) && !isSnoozed) : false}')
  })

  it("marks and cleans up the same final content TTS key during mid-turn auto-play", () => {
    expect(agentProgressSource).toContain('const contentCompletionKey = buildContentTTSKey(sessionId, ttsSource, "final")')
    expect(agentProgressSource).toContain('const completionKeys = [eventCompletionKey, contentCompletionKey].filter(')
    expect(agentProgressSource).toContain('completionKeys.forEach((key) => markTTSPlayed(key))')
    expect(agentProgressSource).toContain('completionKeys.forEach((key) => removeTTSKey(key))')
  })
})
