import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./agent-selector.tsx", import.meta.url), "utf8")

describe("agent selector feedback", () => {
  it("keeps a visible trigger while loading or when the agent list fails to load", () => {
    expect(source).toContain("function getAgentLoadErrorMessage(error: unknown): string")
    expect(source).toContain(
      'const { data: agents = [], error, isLoading, isFetching, refetch } = useQuery<AgentProfile[]>({'
    )
    expect(source).toContain("if ((isLoading || isFetching) && agents.length === 0) {")
    expect(source).toContain('aria-label="Loading agents"')
    expect(source).toContain("Loading agents...")
    expect(source).toContain("if (error && agents.length === 0) {")
    expect(source).toContain('onClick={() => void refetch()}')
    expect(source).toContain('aria-label="Retry loading agents"')
    expect(source).toContain('title={getAgentLoadErrorMessage(error)}')
    expect(source).toContain("Retry agents")
  })
})