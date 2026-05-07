import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-agents-folder-client.ts", import.meta.url), "utf8")
const settingsGeneralSource = readFileSync(new URL("../pages/settings-general.tsx", import.meta.url), "utf8")
const settingsSkillsSource = readFileSync(new URL("../pages/settings-skills.tsx", import.meta.url), "utf8")
const knowledgePageSource = readFileSync(new URL("../pages/knowledge.tsx", import.meta.url), "utf8")

describe("desktop agents folder renderer client", () => {
  it("centralizes .agents folder and file IPC channels", () => {
    expect(clientSource).toContain("tipcClient.getAgentsFolders()")
    expect(clientSource).toContain("tipcClient.openAgentsFolder()")
    expect(clientSource).toContain("tipcClient.openWorkspaceAgentsFolder()")
    expect(clientSource).toContain("tipcClient.openSystemPromptFile()")
    expect(clientSource).toContain("tipcClient.openAgentsGuidelinesFile()")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps settings and knowledge surfaces off direct .agents folder IPC channels", () => {
    const combinedSource = [settingsGeneralSource, settingsSkillsSource, knowledgePageSource].join("\n")

    expect(settingsGeneralSource).toContain("desktopAgentsFolderClient.getAgentsFolders()")
    expect(settingsGeneralSource).toContain("desktopAgentsFolderClient.openGlobalAgentsFolder()")
    expect(settingsGeneralSource).toContain("desktopAgentsFolderClient.openWorkspaceAgentsFolder()")
    expect(settingsGeneralSource).toContain("desktopAgentsFolderClient.openSystemPromptFile()")
    expect(settingsGeneralSource).toContain("desktopAgentsFolderClient.openAgentsGuidelinesFile()")
    expect(settingsSkillsSource).toContain("desktopAgentsFolderClient.getAgentsFolders()")
    expect(knowledgePageSource).toContain("desktopAgentsFolderClient.getAgentsFolders()")
    expect(combinedSource).not.toContain("tipcClient.getAgentsFolders(")
    expect(combinedSource).not.toContain("tipcClient.openAgentsFolder(")
    expect(combinedSource).not.toContain("tipcClient.openWorkspaceAgentsFolder(")
    expect(combinedSource).not.toContain("tipcClient.openSystemPromptFile(")
    expect(combinedSource).not.toContain("tipcClient.openAgentsGuidelinesFile(")
  })
})
