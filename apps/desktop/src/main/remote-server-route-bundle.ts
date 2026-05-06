import type { RemoteServerRouteRegistrar } from "./remote-server-controller"
import { injectedMcpDesktopActions } from "./injected-mcp-desktop-actions"
import { registerInjectedMcpRoutes } from "./injected-mcp-routes"
import { mobileApiDesktopActions } from "./mobile-api-desktop-actions"
import { registerMobileApiRoutes } from "./mobile-api-routes"
import { operatorRouteDesktopActions } from "./operator-route-desktop-actions"
import { registerOperatorRoutes } from "./operator-routes"

export const registerDesktopRemoteServerRoutes: RemoteServerRouteRegistrar = (fastify, context) => {
  registerOperatorRoutes(fastify, {
    actions: operatorRouteDesktopActions,
    providerSecretMask: context.providerSecretMask,
    getRemoteServerStatus: context.getRemoteServerStatus,
    getAppVersion: context.getAppVersion,
    runAgent: context.runAgent,
    scheduleRemoteServerRestartFromOperator: context.scheduleRemoteServerRestartFromOperator,
    scheduleAppRestartFromOperator: context.scheduleAppRestartFromOperator,
    scheduleRemoteServerRestartAfterReply: context.scheduleRemoteServerRestartAfterReply,
  })

  registerMobileApiRoutes(fastify, {
    actions: mobileApiDesktopActions,
    providerSecretMask: context.providerSecretMask,
    remoteServerSecretMask: context.remoteServerSecretMask,
    discordSecretMask: context.discordSecretMask,
    langfuseSecretMask: context.langfuseSecretMask,
    runAgent: context.runAgent,
    notifyConversationHistoryChanged: context.notifyConversationHistoryChanged,
    scheduleRemoteServerLifecycleActionAfterReply: context.scheduleRemoteServerLifecycleActionAfterReply,
  })

  registerInjectedMcpRoutes(fastify, {
    actions: injectedMcpDesktopActions,
  })
}
