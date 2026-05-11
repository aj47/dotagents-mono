import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appLayoutSource = readFileSync(new URL("./app-layout.tsx", import.meta.url), "utf8")

describe("app layout responsive shell", () => {
  it("uses the shared app-shell contract for breakpoints and nav items", () => {
    expect(appLayoutSource).toContain("@dotagents/shared/app-shell")
    expect(appLayoutSource).toContain("resolveAppShellLayout(viewportWidth)")
    expect(appLayoutSource).toContain("APP_SHELL_PRIMARY_NAV_ITEMS.map(renderPrimaryNavLink)")
    expect(appLayoutSource).toContain("getDesktopSettingsNavItems")
  })

  it("switches the desktop sidebar off in compact windows", () => {
    expect(appLayoutSource).toContain('isCompactShell && "hidden"')
    expect(appLayoutSource).toContain("sidebarWidth: isCompactShell ? 0 : sidebarWidth")
    expect(appLayoutSource).toContain('aria-label="Primary navigation"')
  })
})
