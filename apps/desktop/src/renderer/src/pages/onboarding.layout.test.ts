import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const onboardingSource = readFileSync(new URL("./onboarding.tsx", import.meta.url), "utf8")

describe("onboarding page layout", () => {
  it("resets scroll position when switching steps so taller later screens open at the top", () => {
    expect(onboardingSource).toContain(
      "const scrollContainerRef = useRef<HTMLDivElement | null>(null)",
    )
    expect(onboardingSource).toContain("useLayoutEffect(() => {")
    expect(onboardingSource).toContain(
      'scrollContainerRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" })',
    )
    expect(onboardingSource).toContain('window.scrollTo({ top: 0, left: 0, behavior: "auto" })')
    expect(onboardingSource).toContain("document.documentElement.scrollTop = 0")
    expect(onboardingSource).toContain("document.body.scrollTop = 0")
    expect(onboardingSource).toContain("const frame = requestAnimationFrame(resetStepScrollPosition)")
    expect(onboardingSource).toContain("cancelAnimationFrame(frame)")
    expect(onboardingSource).toContain('ref={scrollContainerRef} className="app-drag-region flex h-dvh overflow-y-auto"')
  })
})