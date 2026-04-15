import { describe, expect, it } from "vitest"

import { ConvergenceController, assessToolBatch, classifyToolCall } from "./convergence-controller"

describe("convergence-controller", () => {
  it("classifies read-only execute_command batches as research", () => {
    expect(classifyToolCall({
      name: "execute_command",
      arguments: { command: "cd repo && pwd && find . -maxdepth 2 -type f | sed -n '1,120p'" },
    } as any)).toBe("research")
  })

  it("classifies build/test execute_command batches as validation", () => {
    expect(classifyToolCall({
      name: "execute_command",
      arguments: { command: "cd repo && pnpm test" },
    } as any)).toBe("validation")
  })

  it("distinguishes communication-only and research-only tool batches", () => {
    expect(assessToolBatch([
      { name: "respond_to_user", arguments: { text: "Hello" } },
    ] as any)).toEqual(expect.objectContaining({
      communicationOnly: true,
      researchOnly: false,
      substantive: false,
    }))

    expect(assessToolBatch([
      { name: "load_skill_instructions", arguments: { skillId: "video-editing" } },
      { name: "read_more_context", arguments: { contextRef: "ctx_abc", mode: "overview" } },
    ] as any)).toEqual(expect.objectContaining({
      communicationOnly: false,
      researchOnly: true,
      substantive: false,
    }))
  })

  it("blocks repeated research-only batches after the configured budget", () => {
    const controller = new ConvergenceController({
      maxConsecutiveResearchTurns: 2,
      maxBlockedResearchBatches: 2,
    })
    const researchBatch = [
      { name: "load_skill_instructions", arguments: { skillId: "video-editing" } },
    ] as any

    controller.recordSuccessfulToolBatch(researchBatch)
    controller.recordSuccessfulToolBatch(researchBatch)

    const firstBlock = controller.evaluateResearchBatch(researchBatch)
    expect(firstBlock).toEqual(expect.objectContaining({
      allowExecution: false,
      shouldForceStop: false,
    }))

    const secondBlock = controller.evaluateResearchBatch(researchBatch)
    expect(secondBlock).toEqual(expect.objectContaining({
      allowExecution: false,
      shouldForceStop: true,
    }))
  })

  it("resets the research budget after substantive work", () => {
    const controller = new ConvergenceController({
      maxConsecutiveResearchTurns: 1,
      maxBlockedResearchBatches: 1,
    })
    const researchBatch = [
      { name: "load_skill_instructions", arguments: { skillId: "video-editing" } },
    ] as any

    controller.recordSuccessfulToolBatch(researchBatch)
    controller.resetResearchBudget()

    expect(controller.evaluateResearchBatch(researchBatch)).toEqual(expect.objectContaining({
      allowExecution: true,
      shouldForceStop: false,
    }))
  })
})

