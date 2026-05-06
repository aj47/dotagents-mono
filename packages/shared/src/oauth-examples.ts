import type { MCPServerConfigLike, MCPTransportType } from './mcp-utils'

export interface OAuthClientMetadataLike {
  client_name: string
  redirect_uris: string[]
  grant_types: string[]
  response_types: string[]
  scope?: string
  token_endpoint_auth_method?: string
}

export interface OAuthTokensLike {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  scope?: string
  expires_at?: number
}

export interface OAuthServerMetadataLike {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  registration_endpoint?: string
  jwks_uri?: string
  scopes_supported?: string[]
  response_types_supported?: string[]
  grant_types_supported?: string[]
  token_endpoint_auth_methods_supported?: string[]
  code_challenge_methods_supported?: string[]
}

export interface OAuthConfigLike {
  serverMetadata?: OAuthServerMetadataLike
  clientId?: string
  clientSecret?: string
  clientMetadata?: OAuthClientMetadataLike
  tokens?: OAuthTokensLike
  scope?: string
  useDiscovery?: boolean
  useDynamicRegistration?: boolean
  redirectUri?: string
  pendingAuth?: {
    codeVerifier: string
    state: string
  }
}

export type OAuthMCPServerConfig = MCPServerConfigLike & {
  transport: MCPTransportType
  oauth?: OAuthConfigLike
}

export interface OAuthMCPExample {
  name: string
  description: string
  config: OAuthMCPServerConfig
  setupInstructions: string[]
  requiredScopes?: string[]
  documentationUrl?: string
}

export const OAUTH_MCP_EXAMPLES: Record<string, OAuthMCPExample> = {
  notion: {
    name: 'Notion',
    description: 'Connect to Notion workspace with OAuth authentication',
    config: {
      transport: 'streamableHttp',
      url: 'https://api.notion.com/mcp',
      oauth: {
        scope: 'read write',
        useDiscovery: true,
        useDynamicRegistration: true,
      },
    },
    setupInstructions: [
      'Go to https://www.notion.so/my-integrations to create a new integration',
      'Copy the OAuth client ID and secret to your OAuth configuration',
      'Add your redirect URI to the integration settings',
      'Grant the integration access to your Notion workspace',
    ],
    requiredScopes: ['read', 'write'],
    documentationUrl: 'https://developers.notion.com/docs/authorization',
  },
}
