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
})
