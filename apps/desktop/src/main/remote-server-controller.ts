import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type {
  RemoteServerController as SharedRemoteServerController,
  RemoteServerControllerAdapters as SharedRemoteServerControllerAdapters,
  RemoteServerControllerConfigLike,
  RemoteServerControllerOptions as SharedRemoteServerControllerOptions,
  RemoteServerConfigStore as SharedRemoteServerConfigStore,
  RemoteServerDiagnostics,
  RemoteServerRouteContext as SharedRemoteServerRouteContext,
  RemoteServerRouteRegistrar as SharedRemoteServerRouteRegistrar,
  RemoteServerRunAgentExecutor,
  StartRemoteServerOptions,
  StartRemoteServerResult,
} from "@dotagents/shared/remote-server-controller-contracts"

export { createRemoteServerController } from "@dotagents/shared/remote-server-controller"

export type {
  RemoteServerDiagnostics,
  RemoteServerRunAgentExecutor,
  StartRemoteServerOptions,
  StartRemoteServerResult,
}

export type RemoteServerControllerConfig = RemoteServerControllerConfigLike
export type RemoteServerConfigStore = SharedRemoteServerConfigStore<RemoteServerControllerConfig>
export type RemoteServerControllerAdapters = SharedRemoteServerControllerAdapters<
  FastifyRequest,
  FastifyReply,
  RemoteServerControllerConfig,
  FastifyInstance
>
export type RemoteServerControllerOptions = SharedRemoteServerControllerOptions<
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  RemoteServerControllerConfig
>
export type RemoteServerRouteContext = SharedRemoteServerRouteContext<FastifyReply>
export type RemoteServerRouteRegistrar = SharedRemoteServerRouteRegistrar<FastifyInstance, FastifyReply>
export type RemoteServerController = SharedRemoteServerController
