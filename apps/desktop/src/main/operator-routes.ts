import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type {
  OperatorRouteActions as SharedOperatorRouteActions,
  OperatorRouteActionResult,
  OperatorRouteAuditContext,
  OperatorRouteOptions as SharedOperatorRouteOptions,
  OperatorRunAgentExecutor,
  RemoteServerOperatorRouteServer,
} from "@dotagents/shared/remote-server-operator-routes"
import { registerOperatorRoutes as registerSharedOperatorRoutes } from "@dotagents/shared/remote-server-operator-routes"

export type {
  OperatorRouteActionResult,
  OperatorRouteAuditContext,
  OperatorRunAgentExecutor,
}

export type OperatorRouteActions = SharedOperatorRouteActions<FastifyRequest>

export type RegisterOperatorRoutesOptions = SharedOperatorRouteOptions<FastifyRequest, FastifyReply>

export function registerOperatorRoutes(
  fastify: FastifyInstance,
  options: RegisterOperatorRoutesOptions,
): void {
  return registerSharedOperatorRoutes(
    fastify as RemoteServerOperatorRouteServer<FastifyRequest, FastifyReply>,
    options,
  )
}
