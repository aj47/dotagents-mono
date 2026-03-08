import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appLayoutSource = readFileSync(
  new URL("./app-layout.tsx", import.meta.url),
  "utf8",
)

describe("app layout sidebar settings navigation", () => {
  it("keeps the settings section header readable in a cramped expanded sidebar", () => {
    expect(appLayoutSource).toContain(
      'const SETTINGS_SECTION_BUTTON_CLASS_NAME =',
    )
    expect(appLayoutSource).toContain(
      '"flex w-full min-w-0 items-start gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-accent/50 hover:text-foreground"',
    )
    expect(appLayoutSource).toContain(
      'const SETTINGS_SECTION_LABEL_CLASS_NAME =',
    )
    expect(appLayoutSource).toContain(
      '"min-w-0 flex-1 break-words text-left leading-tight [overflow-wrap:anywhere]"',
    )
    expect(appLayoutSource).toContain(
      '<span className={SETTINGS_SECTION_LABEL_CLASS_NAME}>Settings</span>',
    )
    expect(appLayoutSource).not.toContain(
      '<span className="truncate">Settings</span>',
    )
  })

  it("constrains expanded settings nav rows to the sidebar width instead of content width", () => {
    expect(appLayoutSource).toContain('const SETTINGS_NAV_LINK_CLASS_NAME =')
    expect(appLayoutSource).toContain(
      '"flex min-h-7 w-full min-w-0 items-start gap-2 rounded-md px-2 py-1.5 font-medium transition-all duration-200"',
    )
    expect(appLayoutSource).toContain('const SETTINGS_NAV_LABEL_CLASS_NAME =')
    expect(appLayoutSource).toContain(
      '<span className={SETTINGS_NAV_LABEL_CLASS_NAME}>{link.text}</span>',
    )
    expect(appLayoutSource).not.toContain(
      '<span className="truncate font-medium">{link.text}</span>',
    )
  })
})