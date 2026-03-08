import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsAgentsSource = readFileSync(
  new URL("./settings-agents.tsx", import.meta.url),
  "utf8",
)

function compact(source: string) {
  return source.replace(/\s+/g, "")
}

describe("settings agents system prompt editor", () => {
  const compactSource = compact(settingsAgentsSource)

  it("keeps an empty system-prompt draft empty instead of reinserting the default prompt into the live value", () => {
    expect(compactSource).toContain(compact('value={editing.systemPrompt}'))
    expect(compactSource).toContain(compact('placeholder={defaultSystemPrompt}'))
    expect(compactSource).not.toContain(compact('value={editing.systemPrompt || defaultSystemPrompt}'))
  })

  it("shows explicit load and retry states for capability data instead of silently falling back to misleading empty states", () => {
    expect(compactSource).toContain(compact('const[skillsLoadError,setSkillsLoadError]=useState<string|null>(null)'))
    expect(compactSource).toContain(compact('const[serverStatusLoadError,setServerStatusLoadError]=useState<string|null>(null)'))
    expect(compactSource).toContain(compact('const[allToolsLoadError,setAllToolsLoadError]=useState<string|null>(null)'))
    expect(compactSource).toContain(compact('console.error("[SettingsAgents] Failed to load skills:",error)'))
    expect(compactSource).toContain(compact('console.error("[SettingsAgents] Failed to load MCP server status:",error)'))
    expect(compactSource).toContain(compact('console.error("[SettingsAgents] Failed to load MCP tool list:",error)'))
    expect(compactSource).toContain(compact('skillsLoadError&&skills.length===0'))
    expect(compactSource).toContain(compact('serverStatusLoadError&&serverNames.length===0'))
    expect(compactSource).toContain(compact('allToolsLoadError&&allTools.length===0'))
    expect(compactSource).not.toContain(compact('catch{}'))
  })

  it("surfaces partial MCP tool-list failures instead of showing false zero-tool states in capabilities", () => {
    expect(compactSource).toContain(compact('allToolsLoadError&&serverNames.length>0&&renderToolListWarning('))
    expect(settingsAgentsSource).toContain('Tool counts may be incomplete because the MCP tool list could not be refreshed.')
    expect(compactSource).toContain(compact('constshowMissingToolListWarning=Boolean(allToolsLoadError)&&serverToolList.length===0'))
    expect(compactSource).toContain(compact('showMissingToolListWarning?"Tools unavailable":`${serverToolList.length}tools`'))
    expect(settingsAgentsSource).toContain("This server's tool list is unavailable right now.")
    expect(compactSource).toContain(compact('allToolsLoadError&&allTools.length>0&&renderToolListWarning('))
    expect(settingsAgentsSource).toContain('Built-in tool toggles may be incomplete because the tool list could not be refreshed.')
  })
})
