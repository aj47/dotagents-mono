import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentSelectorSource = readFileSync(new URL("./agent-selector.tsx", import.meta.url), "utf8")

describe("agent selector layout", () => {
  it("keeps the compact trigger bounded and readable in dense session chrome", () => {
    expect(agentSelectorSource).toContain("getAgentSelectorCommonCopyState")
    expect(agentSelectorSource).toContain("getAgentSelectorDesktopSurfaceState")
    expect(agentSelectorSource).toContain("const selectorCopy = getAgentSelectorCommonCopyState()")
    expect(agentSelectorSource).toContain("const selectorSurface = getAgentSelectorDesktopSurfaceState()")
    expect(agentSelectorSource).toContain("className={selectorSurface.triggerClassName}")
    expect(agentSelectorSource).toContain('title={displayName}')
    expect(agentSelectorSource).toContain("aria-label={formatAgentSelectorSelectedAccessibilityLabel(displayName)}")
    expect(agentSelectorSource).toContain("size={selectorSurface.triggerAvatarSize}")
    expect(agentSelectorSource).toContain("<Bot className={selectorSurface.triggerBotIconClassName} />")
  })

  it("protects long agent names and descriptions inside the dropdown", () => {
    expect(agentSelectorSource).toContain("className={selectorSurface.contentClassName}")
    expect(agentSelectorSource).toContain("className={selectorSurface.itemClassName}")
    expect(agentSelectorSource).toContain("className={selectorSurface.agentItemClassName}")
    expect(agentSelectorSource).toContain("className={selectorSurface.avatarClassName}")
    expect(agentSelectorSource).toContain("className={selectorSurface.labelClassName}")
    expect(agentSelectorSource).toContain("className={cn(selectorSurface.checkIconClassName")
    expect(agentSelectorSource).toContain("{selectorCopy.defaultAgentLabel}")
    expect(agentSelectorSource).toContain("{selectorCopy.newAgentLabel}")
    expect(agentSelectorSource).not.toContain("AGENT_SELECTOR_PRESENTATION")
  })
})
