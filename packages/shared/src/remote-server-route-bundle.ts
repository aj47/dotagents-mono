import type { RemoteServerRouteContext } from './remote-server-controller-contracts';
import {
  registerInjectedMcpRoutes,
  type RemoteServerInjectedMcpRouteServer,
} from './remote-server-injected-mcp-routes';
import {
  registerMobileApiRoutes,
  type RemoteServerMobileApiReplyLike,
  type RemoteServerMobileApiRequestLike,
  type RemoteServerMobileApiRouteServer,
} from './remote-server-mobile-api-routes';
import {
  registerOperatorRoutes,
  type RemoteServerOperatorRouteReplyLike,
  type RemoteServerOperatorRouteRequestLike,
  type RemoteServerOperatorRouteServer,
} from './remote-server-operator-routes';
import type {
  InjectedMcpRouteActions,
  MobileApiRouteActions,
  OperatorRouteActions,
} from './remote-server-route-contracts';

export type RemoteServerRouteBundleRequestLike =
  & RemoteServerMobileApiRequestLike
  & RemoteServerOperatorRouteRequestLike;

export type RemoteServerRouteBundleReplyLike =
  & RemoteServerMobileApiReplyLike
  & RemoteServerOperatorRouteReplyLike;

export type RemoteServerRouteBundleServer<
  Request extends RemoteServerRouteBundleRequestLike = RemoteServerRouteBundleRequestLike,
  Reply extends RemoteServerRouteBundleReplyLike = RemoteServerRouteBundleReplyLike,
> =
  & RemoteServerOperatorRouteServer<Request, Reply>
  & RemoteServerMobileApiRouteServer<Request, Reply>
  & RemoteServerInjectedMcpRouteServer<Request, Reply>;

export interface RemoteServerRouteBundleActions<
  Request extends RemoteServerRouteBundleRequestLike = RemoteServerRouteBundleRequestLike,
  Reply extends RemoteServerRouteBundleReplyLike = RemoteServerRouteBundleReplyLike,
> {
  operatorRouteActions: OperatorRouteActions<Request>;
  mobileApiRouteActions: MobileApiRouteActions<Request, Reply>;
  injectedMcpRouteActions: InjectedMcpRouteActions<Request, Reply>;
}

export function registerRemoteServerRouteBundle<
  Request extends RemoteServerRouteBundleRequestLike = RemoteServerRouteBundleRequestLike,
  Reply extends RemoteServerRouteBundleReplyLike = RemoteServerRouteBundleReplyLike,
>(
  fastify: RemoteServerRouteBundleServer<Request, Reply>,
  context: RemoteServerRouteContext<Reply>,
  actions: RemoteServerRouteBundleActions<Request, Reply>,
): void {
  registerOperatorRoutes(fastify, {
    actions: actions.operatorRouteActions,
    providerSecretMask: context.providerSecretMask,
    getRemoteServerStatus: context.getRemoteServerStatus,
    getAppVersion: context.getAppVersion,
    runAgent: context.runAgent,
    scheduleRemoteServerRestartFromOperator: context.scheduleRemoteServerRestartFromOperator,
    scheduleAppRestartFromOperator: context.scheduleAppRestartFromOperator,
    scheduleRemoteServerRestartAfterReply: context.scheduleRemoteServerRestartAfterReply,
  });

  registerMobileApiRoutes(fastify, {
    actions: actions.mobileApiRouteActions,
    providerSecretMask: context.providerSecretMask,
    remoteServerSecretMask: context.remoteServerSecretMask,
    discordSecretMask: context.discordSecretMask,
    langfuseSecretMask: context.langfuseSecretMask,
    runAgent: context.runAgent,
    notifyConversationHistoryChanged: context.notifyConversationHistoryChanged,
    scheduleRemoteServerLifecycleActionAfterReply: context.scheduleRemoteServerLifecycleActionAfterReply,
  });

  registerInjectedMcpRoutes(fastify, {
    actions: actions.injectedMcpRouteActions,
  });
}
