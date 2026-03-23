import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const loopServiceSource = readFileSync(new URL("./loop-service.ts", import.meta.url), "utf8")

function getSection(source: string, startMarker: string, endMarker: string): string {
  const startIndex = source.indexOf(startMarker)
  const endIndex = source.indexOf(endMarker)

  expect(startIndex).toBeGreaterThanOrEqual(0)
  expect(endIndex).toBeGreaterThan(startIndex)

  return source.slice(startIndex, endIndex)
}

describe("loop-service save semantics", () => {
  it("keeps config.json shadow sync best-effort after task-file persistence", () => {
    const saveTaskSection = getSection(loopServiceSource, "  private saveTask(", "  /** Remove a task's files")

    expect(saveTaskSection).toContain("this.syncToConfigJson(")
    expect(saveTaskSection).toContain("return savedTaskFile")
    expect(saveTaskSection).not.toContain("return this.syncToConfigJson() && savedTaskFile")

    const syncIndex = saveTaskSection.indexOf("this.syncToConfigJson(")
    const returnIndex = saveTaskSection.indexOf("return savedTaskFile")

    expect(syncIndex).toBeGreaterThanOrEqual(0)
    expect(returnIndex).toBeGreaterThan(syncIndex)
  })

  it("builds a next snapshot and only commits this.loops after persistence succeeds", () => {
    const saveLoopSection = getSection(loopServiceSource, "  saveLoop(loop: LoopConfig): boolean {", "  /** Delete a loop. */")

    expect(saveLoopSection).toContain("const nextLoops =")
    expect(saveLoopSection).toContain("this.saveTask(")
    expect(saveLoopSection).toContain("this.loops = nextLoops")
    expect(saveLoopSection).not.toContain("this.loops[idx] = loop")
    expect(saveLoopSection).not.toContain("this.loops.push(loop)")

    const nextLoopsIndex = saveLoopSection.indexOf("const nextLoops =")
    const saveIndex = saveLoopSection.indexOf("this.saveTask(")
    const commitIndex = saveLoopSection.indexOf("this.loops = nextLoops")

    expect(nextLoopsIndex).toBeGreaterThanOrEqual(0)
    expect(saveIndex).toBeGreaterThan(nextLoopsIndex)
    expect(commitIndex).toBeGreaterThan(saveIndex)
  })

  it("passes task-specific maxIterations overrides into background agent sessions", () => {
    expect(loopServiceSource).toContain("await runAgentLoopSession(loop.prompt, conversation.id, sessionId, {")
    expect(loopServiceSource).toContain("maxIterations: loop.maxIterations")
  })
})
