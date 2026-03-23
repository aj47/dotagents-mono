import { describe, expect, it } from "vitest"

import { acpSmartRouter } from "./acp-smart-router"

describe("acpSmartRouter", () => {
  it("discourages delegating local workspace coding away from the current agent", () => {
    const prompt = acpSmartRouter.generateDelegationPromptAddition([
      {
        definition: {
          name: "augustus",
          displayName: "augustus",
          description: "Coding specialist",
        },
      },
    ])

    expect(prompt).toContain("Keep local repo/workspace coding and debugging in the current agent")
    expect(prompt).toContain("user explicitly asked for a specialist")
    expect(prompt).toContain("clear specialty advantage")
  })
})
