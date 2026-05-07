import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type {
  MobileApiActionResult,
  MobileApiRouteActions as SharedMobileApiRouteActions,
  MobileApiRouteOptions as SharedMobileApiRouteOptions,
  MobileApiRunAgentExecutor,
  RemoteServerMobileApiRouteServer,
} from "@dotagents/shared/remote-server-mobile-api-routes"
import { registerMobileApiRoutes as registerSharedMobileApiRoutes } from "@dotagents/shared/remote-server-mobile-api-routes"

export type {
  MobileApiActionResult,
  MobileApiRunAgentExecutor,
}

export type MobileApiRouteActions = SharedMobileApiRouteActions<FastifyRequest, FastifyReply>

export type RegisterMobileApiRoutesOptions = SharedMobileApiRouteOptions<FastifyRequest, FastifyReply>

export function registerMobileApiRoutes(
  fastify: FastifyInstance,
  options: RegisterMobileApiRoutesOptions,
): void {
  return registerSharedMobileApiRoutes(
    fastify as RemoteServerMobileApiRouteServer<FastifyRequest, FastifyReply>,
    options,
  )
}
