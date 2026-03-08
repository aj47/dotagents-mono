import { useSearchParams } from "react-router-dom"
import { cn } from "@renderer/lib/utils"
import { Component as McpToolsPage } from "./settings-mcp-tools"
import { Component as SkillsPage } from "./settings-skills"

const tabs = [
  { id: "skills", label: "Skills", icon: "i-mingcute-sparkles-line" },
  { id: "mcp-servers", label: "MCP Servers", icon: "i-mingcute-tool-line" },
] as const

type TabId = (typeof tabs)[number]["id"]

const DEFAULT_TAB: TabId = "skills"

function isTabId(value: string | null): value is TabId {
  return tabs.some(tab => tab.id === value)
}

export function Component() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const activeTab = isTabId(requestedTab) ? requestedTab : DEFAULT_TAB

  const handleTabChange = (tabId: TabId) => {
    if (tabId === activeTab) return

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set("tab", tabId)
    setSearchParams(nextSearchParams)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-6 pt-4 pb-2 shrink-0 border-b bg-background">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <span className={cn(tab.icon, "shrink-0")} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — each page provides its own scroll container */}
      <div className="flex-1 min-h-0">
        {activeTab === "skills" && <SkillsPage />}
        {activeTab === "mcp-servers" && <McpToolsPage />}
      </div>
    </div>
  )
}

