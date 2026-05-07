import type { ChatGptWebAuthStatus } from "@dotagents/shared/api-types"
import { tipcClient } from "@renderer/lib/tipc-client"

export type DesktopChatGptWebAuthStatus = ChatGptWebAuthStatus

export const desktopChatGptWebClient = {
  getAuthStatus(): Promise<DesktopChatGptWebAuthStatus> {
    return tipcClient.getChatGptWebAuthStatus() as Promise<DesktopChatGptWebAuthStatus>
  },

  loginOAuth(): Promise<DesktopChatGptWebAuthStatus> {
    return tipcClient.loginChatGptWebOAuth() as Promise<DesktopChatGptWebAuthStatus>
  },

  logoutOAuth(): Promise<void> {
    return tipcClient.logoutChatGptWebOAuth()
  },
}
