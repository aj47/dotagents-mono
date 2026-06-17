import { readFileSync } from "fs"
import { describe, expect, it } from "vitest"

const routerSource = readFileSync(
  new URL("../router.tsx", import.meta.url),
  "utf8",
)
const appLayoutSource = readFileSync(
  new URL("../components/app-layout.tsx", import.meta.url),
  "utf8",
)
const bottomBarSource = readFileSync(
  new URL("../components/app-bottom-bar.tsx", import.meta.url),
  "utf8",
)
const artifactsPageSource = readFileSync(
  new URL("./artifacts.tsx", import.meta.url),
  "utf8",
)

describe("artifacts navigation", () => {
  it("registers the artifacts route", () => {
    expect(routerSource).toContain('path: "artifacts"')
    expect(routerSource).toContain('lazy: () => import("./pages/artifacts")')
  })

  it("keeps artifacts separate from the sessions active state", () => {
    expect(appLayoutSource).toContain(
      '!location.pathname.startsWith("/artifacts")',
    )
    expect(appLayoutSource).toContain('to="/artifacts"')
    expect(bottomBarSource).toContain('navigate("/artifacts")')
  })

  it("keeps artifact list rows compact by default", () => {
    expect(artifactsPageSource).toContain("flex h-9 w-full items-center")
    expect(artifactsPageSource).toContain(
      "grid-cols-[minmax(8rem,1fr)_minmax(7rem,0.8fr)]",
    )
    expect(artifactsPageSource).toContain(
      "md:grid-cols-[minmax(9rem,0.9fr)_minmax(8rem,0.75fr)_minmax(0,1.35fr)]",
    )
    expect(artifactsPageSource).not.toContain("line-clamp-1 text-xs")
  })

  it("keeps preview split behind a wider breakpoint", () => {
    expect(artifactsPageSource).toContain(
      "xl:grid-cols-[minmax(18rem,30rem)_minmax(0,1fr)]",
    )
    expect(artifactsPageSource).toContain(
      "grid-rows-[minmax(9rem,32%)_minmax(0,1fr)]",
    )
    expect(artifactsPageSource).toContain("xl:hidden")
    expect(artifactsPageSource).toContain("xl:flex xl:border-t-0")
  })
})
