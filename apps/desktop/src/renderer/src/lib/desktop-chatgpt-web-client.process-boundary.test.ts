import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-chatgpt-web-client.ts", import.meta.url), "utf8")
const settingsProvidersSource = readFileSync(new URL("../pages/settings-providers.tsx", import.meta.url), "utf8")

describe("desktop ChatGPT Web renderer client", () => {
  it("centralizes desktop ChatGPT Web auth IPC channels behind a shared auth status type", () => {
    expect(clientSource).toContain("ChatGptWebAuthStatus")
    expect(clientSource).toContain("tipcClient.getChatGptWebAuthStatus()")
    expect(clientSource).toContain("tipcClient.loginChatGptWebOAuth()")
    expect(clientSource).toContain("tipcClient.logoutChatGptWebOAuth()")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps settings providers UI off direct ChatGPT Web auth IPC channels", () => {
    expect(settingsProvidersSource).toContain("desktopChatGptWebClient.getAuthStatus()")
    expect(settingsProvidersSource).toContain("desktopChatGptWebClient.loginOAuth()")
    expect(settingsProvidersSource).toContain("desktopChatGptWebClient.logoutOAuth()")
    expect(settingsProvidersSource).not.toContain("tipcClient.getChatGptWebAuthStatus(")
    expect(settingsProvidersSource).not.toContain("tipcClient.loginChatGptWebOAuth(")
    expect(settingsProvidersSource).not.toContain("tipcClient.logoutChatGptWebOAuth(")
  })
})
