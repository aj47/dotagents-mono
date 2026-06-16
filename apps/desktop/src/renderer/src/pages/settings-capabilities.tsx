import { useState } from "react"
import { cn } from "@renderer/lib/utils"
import { Component as McpToolsPage } from "./settings-mcp-tools"
import { Component as SkillsPage } from "./settings-skills"

const tabs = [
  { id: "skills", label: "Skills", icon: "i-mingcute-sparkles-line" },
  { id: "mcp-servers", label: "MCP Servers", icon: "i-mingcute-tool-line" },
] as const

type TabId = (typeof tabs)[number]["id"]

export function Component() {
  const [activeTab, setActiveTab] = useState<TabId>("skills")

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="bg-background flex shrink-0 items-center gap-1 border-b px-6 pb-2 pt-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <span className={cn(tab.icon, "shrink-0")} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — each page provides its own scroll container */}
      <div className="min-h-0 flex-1">
        {activeTab === "skills" && <SkillsPage />}
        {activeTab === "mcp-servers" && <McpToolsPage />}
      </div>
    </div>
  )
}
