import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sidebarSource = readFileSync(new URL("./active-agents-sidebar.tsx", import.meta.url), "utf8")

describe("active agents sidebar folder drag drop crash (issue #512)", () => {
  it("guards getSessionDropPosition against a null currentTarget", () => {
    expect(sidebarSource).toContain("const target = event.currentTarget as Element | null")
    expect(sidebarSource).toContain('if (!target || typeof target.getBoundingClientRect !== "function") return "after"')
  })

  it("resolves the group-header drop position before scheduling the setState updater", () => {
    const handlerStart = sidebarSource.indexOf("const handleGroupHeaderDrop = useCallback")
    const handlerEnd = sidebarSource.indexOf("}, [clearSessionDragState, getDraggedGroupId, getSessionDropPosition])", handlerStart)
    expect(handlerStart).toBeGreaterThan(-1)
    expect(handlerEnd).toBeGreaterThan(handlerStart)

    const handler = sidebarSource.slice(handlerStart, handlerEnd)
    const positionAssignIdx = handler.indexOf("const position = getSessionDropPosition(event)")
    const setSessionGroupsIdx = handler.indexOf("setSessionGroups((prev) => reorderSidebarSessionGroups(")
    expect(positionAssignIdx).toBeGreaterThan(-1)
    expect(setSessionGroupsIdx).toBeGreaterThan(positionAssignIdx)
    expect(handler).not.toContain("targetGroupId,\n        getSessionDropPosition(event),")
  })
})
