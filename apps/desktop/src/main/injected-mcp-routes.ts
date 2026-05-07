import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type {
  InjectedMcpRouteActions as SharedInjectedMcpRouteActions,
  InjectedMcpRouteOptions as SharedInjectedMcpRouteOptions,
  InjectedMcpRouteResult,
  RemoteServerInjectedMcpRouteServer,
} from "@dotagents/shared/remote-server-injected-mcp-routes"
import { registerInjectedMcpRoutes as registerSharedInjectedMcpRoutes } from "@dotagents/shared/remote-server-injected-mcp-routes"

export type { InjectedMcpRouteResult }

export type InjectedMcpRouteActions = SharedInjectedMcpRouteActions<FastifyRequest, FastifyReply>

export type RegisterInjectedMcpRoutesOptions = SharedInjectedMcpRouteOptions<FastifyRequest, FastifyReply>

export function registerInjectedMcpRoutes(
  fastify: FastifyInstance,
  options: RegisterInjectedMcpRoutesOptions,
): void {
  return registerSharedInjectedMcpRoutes(
    fastify as RemoteServerInjectedMcpRouteServer<FastifyRequest, FastifyReply>,
    options,
  )
}
