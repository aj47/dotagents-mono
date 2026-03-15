import crypto from "crypto"
import type { OAuthConfig, OAuthTokens, OAuthServerMetadata, OAuthClientMetadata } from "./types"
import type { UserInteraction } from "./interfaces/user-interaction"

// Injected UserInteraction for opening external URLs
let userInteraction: UserInteraction | null = null

/**
 * Set the UserInteraction for opening browser URLs during OAuth.
 */
export function setOAuthClientUserInteraction(ui: UserInteraction): void {
  userInteraction = ui
}

export interface OAuthAuthorizationRequest {
  authorizationUrl: string
  codeVerifier: string
  state: string
}

export interface OAuthTokenRequest {
  code: string
  codeVerifier: string
  state: string
}

export interface OAuthCallbackResult {
  code?: string
  state?: string
  error?: string
  error_description?: string
}

/**
 * Factory function type for creating OAuth callback handlers.
 * Desktop uses localhost callback server, CLI uses system open + localhost.
 */
export type OAuthCallbackHandler = (timeoutMs?: number) => Promise<OAuthCallbackResult>

export class OAuthClient {
  private config: OAuthConfig
  private baseUrl: string

  constructor(baseUrl: string, config: OAuthConfig = {}) {
    this.baseUrl = baseUrl
    this.config = {
      scope: "user",
      useDiscovery: true,
      useDynamicRegistration: true,
      ...config,
    }
  }

  async discoverServerMetadata(): Promise<OAuthServerMetadata> {
    if (this.config.serverMetadata) {
      return this.config.serverMetadata
    }

    const url = new URL(this.baseUrl)
    const metadataUrl = `${url.protocol}//${url.host}/.well-known/oauth-authorization-server`

    try {
      const response = await fetch(metadataUrl, {
        headers: {
          'Accept': 'application/json',
          'MCP-Protocol-Version': '2025-03-26',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to discover server metadata: ${response.status} ${response.statusText}`)
      }

      const metadata = await response.json() as OAuthServerMetadata

      if (!metadata.authorization_endpoint || !metadata.token_endpoint) {
        throw new Error('Invalid server metadata: missing required endpoints')
      }

      this.config.serverMetadata = metadata
      return metadata
    } catch (error) {
      const fallbackMetadata: OAuthServerMetadata = {
        issuer: `${url.protocol}//${url.host}`,
        authorization_endpoint: `${url.protocol}//${url.host}/authorize`,
        token_endpoint: `${url.protocol}//${url.host}/token`,
        registration_endpoint: `${url.protocol}//${url.host}/register`,
        scopes_supported: ['user'],
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
        code_challenge_methods_supported: ['S256'],
      }

      this.config.serverMetadata = fallbackMetadata
      return fallbackMetadata
    }
  }

  async registerClient(): Promise<{ clientId: string; clientSecret?: string }> {
    if (this.config.clientId) {
      return {
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
      }
    }

    const metadata = await this.discoverServerMetadata()

    if (!metadata.registration_endpoint) {
      throw new Error('Dynamic client registration not supported by server')
    }

    const redirectUri = this.getRedirectUri()

    const clientMetadata: OAuthClientMetadata = {
      client_name: 'DotAgents',
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: this.config.scope || 'user',
      token_endpoint_auth_method: 'none',
      ...(this.config.clientMetadata && {
        client_name: this.config.clientMetadata.client_name || 'DotAgents',
        grant_types: this.config.clientMetadata.grant_types || ['authorization_code', 'refresh_token'],
        response_types: this.config.clientMetadata.response_types || ['code'],
        scope: this.config.clientMetadata.scope || this.config.scope || 'user',
        token_endpoint_auth_method: this.config.clientMetadata.token_endpoint_auth_method || 'none',
        redirect_uris: this.config.clientMetadata.redirect_uris || [redirectUri],
      }),
    }

    try {
      const response = await fetch(metadata.registration_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(clientMetadata),
      })

      if (!response.ok) {
        throw new Error(`Client registration failed: ${response.status} ${response.statusText}`)
      }

      const registrationResponse = await response.json() as Record<string, unknown>

      this.config.clientId = registrationResponse.client_id as string
      this.config.clientSecret = registrationResponse.client_secret as string | undefined
      this.config.clientMetadata = clientMetadata

      await this.saveClientConfig()

      return {
        clientId: registrationResponse.client_id as string,
        clientSecret: registrationResponse.client_secret as string | undefined,
      }
    } catch (error) {
      throw new Error(`Failed to register OAuth client: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')

    return { codeVerifier, codeChallenge }
  }

  /**
   * Determine redirect URI, allowing server config to override the default scheme.
   */
  private getRedirectUri(): string {
    if (this.config.redirectUri) {
      return this.config.redirectUri
    }

    const isDevelopment = process.env.NODE_ENV === 'development' || !!process.env.ELECTRON_RENDERER_URL
    return isDevelopment ? 'http://localhost:3000/callback' : 'dotagents://oauth/callback'
  }

  /**
   * Generate authorization URL and initiate OAuth flow
   */
  async startAuthorizationFlow(): Promise<OAuthAuthorizationRequest> {
    const metadata = await this.discoverServerMetadata()
    const { clientId } = await this.registerClient()
    const { codeVerifier, codeChallenge } = this.generatePKCE()
    const state = crypto.randomBytes(16).toString('base64url')

    const authUrl = new URL(metadata.authorization_endpoint)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)

    const redirectUri = this.getRedirectUri()

    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', this.config.scope || 'user')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    return {
      authorizationUrl: authUrl.toString(),
      codeVerifier,
      state,
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(request: OAuthTokenRequest): Promise<OAuthTokens> {
    const metadata = await this.discoverServerMetadata()

    let { clientId, clientSecret } = this.config

    if (!clientId) {
      const registration = await this.registerClient()
      clientId = registration.clientId
      clientSecret = registration.clientSecret
    }

    const redirectUri = this.getRedirectUri()

    const tokenRequest = new URLSearchParams({
      grant_type: 'authorization_code',
      code: request.code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: request.codeVerifier,
    })

    if (clientSecret) {
      tokenRequest.set('client_secret', clientSecret)
    }

    try {
      const response = await fetch(metadata.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: tokenRequest.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const tokenResponse = await response.json() as Record<string, unknown>

      const tokens: OAuthTokens = {
        access_token: tokenResponse.access_token as string,
        token_type: tokenResponse.token_type as string,
        expires_in: tokenResponse.expires_in as number | undefined,
        refresh_token: tokenResponse.refresh_token as string | undefined,
        scope: tokenResponse.scope as string | undefined,
        expires_at: tokenResponse.expires_in
          ? Date.now() + ((tokenResponse.expires_in as number) * 1000)
          : undefined,
      }

      this.config.tokens = tokens
      return tokens
    } catch (error) {
      throw new Error(`Failed to exchange code for token: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<OAuthTokens> {
    if (!this.config.tokens?.refresh_token) {
      throw new Error('No refresh token available')
    }

    const metadata = await this.discoverServerMetadata()
    const { clientId, clientSecret } = await this.registerClient()

    const tokenRequest = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.config.tokens.refresh_token,
      client_id: clientId,
    })

    if (clientSecret) {
      tokenRequest.set('client_secret', clientSecret)
    }

    try {
      const response = await fetch(metadata.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: tokenRequest.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const tokenResponse = await response.json() as Record<string, unknown>

      const tokens: OAuthTokens = {
        access_token: tokenResponse.access_token as string,
        token_type: tokenResponse.token_type as string,
        expires_in: tokenResponse.expires_in as number | undefined,
        refresh_token: (tokenResponse.refresh_token as string | undefined) || this.config.tokens.refresh_token,
        scope: tokenResponse.scope as string | undefined,
        expires_at: tokenResponse.expires_in
          ? Date.now() + ((tokenResponse.expires_in as number) * 1000)
          : undefined,
      }

      this.config.tokens = tokens
      return tokens
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Check if current token is valid and not expired
   */
  isTokenValid(): boolean {
    if (!this.config.tokens?.access_token) {
      return false
    }

    if (this.config.tokens.expires_at && Date.now() >= this.config.tokens.expires_at) {
      return false
    }

    return true
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.config.tokens!.access_token
    }

    if (this.config.tokens?.refresh_token) {
      const tokens = await this.refreshToken()
      return tokens.access_token
    }

    throw new Error('No valid token available and no refresh token')
  }

  /**
   * Open authorization URL in default browser
   */
  async openAuthorizationUrl(authorizationUrl: string): Promise<void> {
    if (userInteraction) {
      await userInteraction.openExternal(authorizationUrl)
    } else {
      throw new Error('No UserInteraction configured for opening external URLs. Call setOAuthClientUserInteraction() first.')
    }
  }

  /**
   * Complete OAuth flow with callback handler
   */
  async completeAuthorizationFlow(callbackHandler: OAuthCallbackHandler): Promise<OAuthTokens> {
    // Start authorization flow
    const authRequest = await this.startAuthorizationFlow()

    // Start callback handler first
    const callbackPromise = callbackHandler(300000) // 5 minute timeout

    // Open authorization URL after handler is ready
    await this.openAuthorizationUrl(authRequest.authorizationUrl)

    // Wait for callback
    const callbackResult = await callbackPromise

    if (callbackResult.error) {
      throw new Error(`OAuth authorization failed: ${callbackResult.error} - ${callbackResult.error_description || 'Unknown error'}`)
    }

    if (!callbackResult.code) {
      throw new Error('No authorization code received')
    }

    if (callbackResult.state !== authRequest.state) {
      throw new Error('Invalid OAuth state parameter')
    }

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForToken({
      code: callbackResult.code,
      codeVerifier: authRequest.codeVerifier,
      state: callbackResult.state,
    })

    return tokens
  }

  /**
   * Get current configuration
   */
  getConfig(): OAuthConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<OAuthConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Save client configuration to persistent storage
   */
  private async saveClientConfig(): Promise<void> {
    // Platform-specific storage is handled by injected MCPOAuthStorage
    // This is a no-op in core; desktop and CLI wire up their own storage
  }
}
