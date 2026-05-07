import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-conversations-client.ts", import.meta.url), "utf8")
const queriesSource = readFileSync(new URL("./queries.ts", import.meta.url), "utf8")
const sessionsSource = readFileSync(new URL("../pages/sessions.tsx", import.meta.url), "utf8")
const activeAgentsSidebarSource = readFileSync(new URL("../components/active-agents-sidebar.tsx", import.meta.url), "utf8")
const agentProgressSource = readFileSync(new URL("../components/agent-progress.tsx", import.meta.url), "utf8")

describe("desktop conversations renderer client", () => {
  it("centralizes conversation IPC channels", () => {
    expect(clientSource).toContain("tipcClient.getConversationHistory()")
    expect(clientSource).toContain("tipcClient.loadConversation(request)")
    expect(clientSource).toContain("tipcClient.saveConversation({ conversation })")
    expect(clientSource).toContain("tipcClient.createConversation(request)")
    expect(clientSource).toContain("tipcClient.addMessageToConversation(request)")
    expect(clientSource).toContain("tipcClient.renameConversationTitle({ conversationId, title })")
    expect(clientSource).toContain("tipcClient.deleteConversation({ conversationId })")
    expect(clientSource).toContain("tipcClient.deleteAllConversations()")
    expect(clientSource).toContain("tipcClient.branchConversation({ conversationId, messageIndex })")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps conversation hooks and UI off direct conversation IPC channels", () => {
    const combinedSource = [
      queriesSource,
      sessionsSource,
      activeAgentsSidebarSource,
      agentProgressSource,
    ].join("\n")

    expect(queriesSource).toContain("desktopConversationsClient.getConversationHistory()")
    expect(queriesSource).toContain("desktopConversationsClient.loadConversation({ conversationId })")
    expect(queriesSource).toContain("desktopConversationsClient.saveConversation(conversation)")
    expect(queriesSource).toContain("desktopConversationsClient.createConversation({ firstMessage, role })")
    expect(queriesSource).toContain("desktopConversationsClient.addMessageToConversation({")
    expect(queriesSource).toContain("desktopConversationsClient.deleteConversation(conversationId)")
    expect(queriesSource).toContain("desktopConversationsClient.deleteAllConversations()")
    expect(sessionsSource).toContain("desktopConversationsClient.loadConversation({")
    expect(activeAgentsSidebarSource).toContain("desktopConversationsClient.renameConversationTitle(conversationId, nextTitle)")
    expect(agentProgressSource).toContain("desktopConversationsClient.branchConversation(")
    expect(agentProgressSource).toContain("desktopConversationsClient.renameConversationTitle(conversationId, nextTitle)")

    expect(combinedSource).not.toContain("tipcClient.getConversationHistory(")
    expect(combinedSource).not.toContain("tipcClient.loadConversation(")
    expect(combinedSource).not.toContain("tipcClient.saveConversation(")
    expect(combinedSource).not.toContain("tipcClient.createConversation(")
    expect(combinedSource).not.toContain("tipcClient.addMessageToConversation(")
    expect(combinedSource).not.toContain("tipcClient.renameConversationTitle(")
    expect(combinedSource).not.toContain("tipcClient.deleteConversation(")
    expect(combinedSource).not.toContain("tipcClient.deleteAllConversations(")
    expect(combinedSource).not.toContain("tipcClient.branchConversation(")
  })
})
