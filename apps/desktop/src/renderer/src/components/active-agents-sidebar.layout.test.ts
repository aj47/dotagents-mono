import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sidebarSource = readFileSync(new URL("./active-agents-sidebar.tsx", import.meta.url), "utf8")

describe("active agents sidebar layout", () => {
  it("keeps the launch controls pinned at the top while the sidebar scrolls", () => {
    expect(sidebarSource).toContain('className="sticky top-0 z-40 -mx-2 bg-background/95 px-2 pb-2 pt-2"')
    expect(sidebarSource).toContain('className="rounded-lg border border-border/60 bg-muted/20 p-2"')
    expect(sidebarSource).toContain('title="Start text session"')
  })

  it("marks selected nested subagent rows with a visible selected state", () => {
    expect(sidebarSource).toContain("const isSelectedNestedSubagent = isNestedSubagent && isCurrentView")
    expect(sidebarSource).toContain('aria-current={isCurrentView ? "true" : undefined}')
    expect(sidebarSource).toContain("bg-blue-500/15 text-foreground ring-1 ring-inset ring-blue-500/25")
    expect(sidebarSource).toContain('isSelectedNestedSubagent ? "bg-blue-500" : statusRailColor')
  })

  it("keeps a backup of non-empty session groups so refreshes cannot blank folders", () => {
    expect(sidebarSource).toContain('const SESSION_GROUPS_BACKUP_STORAGE_KEY = "sidebar-session-groups-backup-v1"')
    expect(sidebarSource).toContain("localStorage.getItem(SESSION_GROUPS_BACKUP_STORAGE_KEY)")
    expect(sidebarSource).toContain("localStorage.setItem(SESSION_GROUPS_BACKUP_STORAGE_KEY, serialized)")
    expect(sidebarSource).toContain("clearSidebarSessionGroupsBackup()")
  })
})
