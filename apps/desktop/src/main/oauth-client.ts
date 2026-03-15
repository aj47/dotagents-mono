// Re-export from @dotagents/core — single source of truth
export {
  OAuthClient,
  setOAuthClientUserInteraction,
} from "@dotagents/core"
export type {
  OAuthAuthorizationRequest,
  OAuthTokenRequest,
  OAuthClientCallbackResult as OAuthCallbackResult,
  OAuthCallbackHandler,
} from "@dotagents/core"
