import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OAuthClient, setOAuthClientUserInteraction } from './oauth-client'
import type { UserInteraction } from './interfaces/user-interaction'

describe('OAuthClient', () => {
  let client: OAuthClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new OAuthClient('https://example.com/mcp')
  })

  it('creates instance with default config', () => {
    const config = client.getConfig()
    expect(config.scope).toBe('user')
    expect(config.useDiscovery).toBe(true)
    expect(config.useDynamicRegistration).toBe(true)
  })

  it('creates instance with custom config', () => {
    const custom = new OAuthClient('https://example.com/mcp', {
      scope: 'admin',
      clientId: 'my-client',
    })
    const config = custom.getConfig()
    expect(config.scope).toBe('admin')
    expect(config.clientId).toBe('my-client')
  })

  it('updateConfig merges with existing config', () => {
    client.updateConfig({ clientId: 'updated-id' })
    const config = client.getConfig()
    expect(config.clientId).toBe('updated-id')
    expect(config.scope).toBe('user') // preserved
  })

  it('isTokenValid returns false when no tokens', () => {
    expect(client.isTokenValid()).toBe(false)
  })

  it('isTokenValid returns false when token is expired', () => {
    client.updateConfig({
      tokens: {
        access_token: 'test',
        token_type: 'bearer',
        expires_at: Date.now() - 1000,
      },
    })
    expect(client.isTokenValid()).toBe(false)
  })

  it('isTokenValid returns true when token is valid and not expired', () => {
    client.updateConfig({
      tokens: {
        access_token: 'test',
        token_type: 'bearer',
        expires_at: Date.now() + 60000,
      },
    })
    expect(client.isTokenValid()).toBe(true)
  })

  it('PKCE generates proper code challenge', async () => {
    // Start authorization flow will internally generate PKCE
    // We can test the authorization URL contains code_challenge
    const mockMetadata = {
      issuer: 'https://example.com',
      authorization_endpoint: 'https://example.com/authorize',
      token_endpoint: 'https://example.com/token',
    }

    client.updateConfig({
      serverMetadata: mockMetadata,
      clientId: 'test-client',
    })

    const request = await client.startAuthorizationFlow()

    expect(request.authorizationUrl).toContain('code_challenge=')
    expect(request.authorizationUrl).toContain('code_challenge_method=S256')
    expect(request.codeVerifier).toBeTruthy()
    expect(request.state).toBeTruthy()
  })

  it('openAuthorizationUrl throws without UserInteraction', async () => {
    setOAuthClientUserInteraction(null as unknown as UserInteraction)
    await expect(client.openAuthorizationUrl('https://example.com')).rejects.toThrow('No UserInteraction configured')
  })

  it('openAuthorizationUrl calls UserInteraction.openExternal', async () => {
    const mockUI: UserInteraction = {
      showError: vi.fn(),
      showWarning: vi.fn(),
      showInfo: vi.fn(),
      pickFile: vi.fn(),
      saveFile: vi.fn(),
      requestApproval: vi.fn(),
      openExternal: vi.fn().mockResolvedValue(undefined),
      confirm: vi.fn(),
    }
    setOAuthClientUserInteraction(mockUI)

    await client.openAuthorizationUrl('https://example.com/auth')
    expect(mockUI.openExternal).toHaveBeenCalledWith('https://example.com/auth')
  })
})
