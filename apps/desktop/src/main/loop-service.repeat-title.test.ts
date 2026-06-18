import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const loopServiceSource = readFileSync(new URL("./loop-service.ts", import.meta.url), "utf8")

describe("loop-service repeat task session titles", () => {
  it("persists the repeat-task title on fresh and resumed task conversations", () => {
    expect(loopServiceSource).toContain("const conversationTitle = formatRepeatTaskTitle(loop.name)")
    expect(loopServiceSource).toContain("await conversationService.renameConversationTitle(")
    expect(loopServiceSource).toContain("await conversationService.markConversationRepeatTaskSource(conversationId, workerRepeatTaskSource)")
    expect(loopServiceSource).toContain("repeatTask: workerRepeatTaskSource")
    expect(loopServiceSource).toContain("agentSessionTracker.startSession(")
    expect(loopServiceSource).toContain("conversationTitle,")
  })

  it("marks fresh and resumed loop sessions as repeat tasks", () => {
    expect(loopServiceSource).toContain("buildRepeatTaskConversationSource(loop, repeatTaskRunId, \"worker\")")
    expect(loopServiceSource).toContain("{ isRepeatTask: true, repeatTask: workerRepeatTaskSource },")
  })

  it("tracks repeat-task conversation backfill per task signature", () => {
    expect(loopServiceSource).toContain('const REPEAT_TASK_PROVENANCE_BACKFILL_MARKER = "repeat-task-conversation-provenance-v2.json"')
    expect(loopServiceSource).toContain('createHash("sha256")')
    expect(loopServiceSource).toContain("private repeatTaskBackfillTimer")
    expect(loopServiceSource).toContain("taskSignatures: Record<string, string>")
    expect(loopServiceSource).toContain("marker.taskSignatures[loop.id] === signature")
    expect(loopServiceSource).toContain("getRepeatTaskBackfillSignature(existingLoop) !== getRepeatTaskBackfillSignature(loop)")
    expect(loopServiceSource).toContain("safePendingSources.map((source) => ({")
    expect(loopServiceSource).toContain("nextTaskSignatures[source.taskId] = source.signature")
  })

  it("revives the worker session before appending adversarial critique revisions", () => {
    const revisionStart = loopServiceSource.indexOf("const revisionPrompt = buildWorkerRevisionPrompt(critique)")
    const revisionSource = loopServiceSource.slice(
      revisionStart,
      loopServiceSource.indexOf('logApp(`[LoopService] Critic produced no critique', revisionStart),
    )

    const reviveIndex = revisionSource.indexOf("agentSessionTracker.reviveSession(sessionId, startSnoozed)")
    const appendIndex = revisionSource.indexOf("conversationService.addMessageToConversation(")

    expect(revisionStart).toBeGreaterThanOrEqual(0)
    expect(reviveIndex).toBeGreaterThanOrEqual(0)
    expect(appendIndex).toBeGreaterThan(reviveIndex)
    expect(revisionSource).toContain("agentSessionTracker.completeSession(sessionId)")
  })
})
