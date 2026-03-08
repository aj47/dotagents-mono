import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsAgentsSource = readFileSync(
  new URL("./settings-agents.tsx", import.meta.url),
  "utf8",
)

function compact(source: string) {
  return source.replace(/\s+/g, "")
}

describe("settings agents editor tabs", () => {
  const compactSource = compact(settingsAgentsSource)

  it("keeps the editor tabs controlled and falls back from the internal-only model tab when it becomes invalid", () => {
    expect(compactSource).toContain(
      compact('returntab==="model"&&connectionType!=="internal"?"general":tab'),
    )
    expect(compactSource).toContain(compact('const[activeEditorTab,setActiveEditorTab]=useState<AgentEditorTab>("general")'))
    expect(compactSource).toContain(compact('useEffect(()=>{setActiveEditorTab(currentTab=>normalizeAgentEditorTab(currentTab,editing?.connectionType),)},[editing?.connectionType])'))
    expect(compactSource).toContain(compact('value={activeEditorTab}'))
    expect(compactSource).toContain(compact('onValueChange={(value)=>setActiveEditorTab(valueasAgentEditorTab)}'))
    expect(compactSource).not.toContain(compact('defaultValue="general"'))
  })
})