import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const runtimeSource = readFileSync(new URL("./generated-home-runtime.tsx", import.meta.url), "utf8")

describe("generated home runtime", () => {
  it("wraps generated homes in an error boundary and renders a fallback on failure", () => {
    expect(runtimeSource).toContain("class GeneratedHomeErrorBoundary")
    expect(runtimeSource).toContain("static getDerivedStateFromError")
    expect(runtimeSource).toContain("fallback ?? <GeneratedHomeFailure")
    expect(runtimeSource).toContain("<GeneratedHomeErrorBoundary")
  })

  it("exposes open-ended primitives for data, project, file, and media homes", () => {
    expect(runtimeSource).toContain("function Chart")
    expect(runtimeSource).toContain("function VideoPlayer")
    expect(runtimeSource).toContain("function FileList")
    expect(runtimeSource).toContain("function ProjectBoard")
    expect(runtimeSource).toContain("icons: LucideIcons")
  })
})
