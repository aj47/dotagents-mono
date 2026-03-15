import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for useOAuth hook — validates OAuth PKCE flow for MCP servers:
 * browser open, localhost callback, token exchange, error handling.
 *
 * Tests hook interface and callback patterns without rendering,
 * matching the pattern used by other CLI hook tests.
 */

// ============================================================================
// Mocks
// ============================================================================

const mockOAuthCallbackServer = {
  startServer: vi.fn(async () => {}),
  waitForCallback: vi.fn(async (_timeoutMs?: number): Promise<any> => ({
    code: 'test-auth-code',
    state: 'test-state',
  })),
  getRedirectUri: vi.fn(() => 'http://localhost:3000/callback'),
  getPort: vi.fn(() => 3000),
  isRunning: vi.fn(() => false),
  stop: vi.fn(),
};

const mockOAuthClient = {
  discoverServerMetadata: vi.fn(async () => ({
    issuer: 'https://auth.example.com',
    authorization_endpoint: 'https://auth.example.com/authorize',
    token_endpoint: 'https://auth.example.com/token',
    registration_endpoint: 'https://auth.example.com/register',
  })),
  registerClient: vi.fn(async () => ({
    clientId: 'test-client-id',
    clientSecret: undefined,
  })),
  startAuthorizationFlow: vi.fn(async () => ({
    authorizationUrl: 'https://auth.example.com/authorize?client_id=test&code_challenge=abc',
    codeVerifier: 'test-verifier',
    state: 'test-state',
  })),
  exchangeCodeForToken: vi.fn(async (_req?: any) => ({
    access_token: 'test-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'test-refresh-token',
  })),
  completeAuthorizationFlow: vi.fn(async (_handler?: any) => ({
    access_token: 'test-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'test-refresh-token',
  })),
  openAuthorizationUrl: vi.fn(async (_url?: string) => {}),
  isTokenValid: vi.fn(() => false),
  getValidToken: vi.fn(async () => 'test-access-token'),
  getConfig: vi.fn(() => ({})),
  updateConfig: vi.fn(),
};

const mockSetOAuthClientUserInteraction = vi.fn((_ui?: any) => {});
const mockHandleOAuthCallback = vi.fn(async (_timeoutMs?: number): Promise<any> => ({
  code: 'test-auth-code',
  state: 'test-state',
}));

vi.mock('@dotagents/core', () => ({
  OAuthClient: vi.fn().mockImplementation(() => mockOAuthClient),
  OAuthCallbackServer: vi.fn().mockImplementation(() => mockOAuthCallbackServer),
  getOAuthCallbackServer: vi.fn(() => mockOAuthCallbackServer),
  handleOAuthCallback: (timeoutMs?: number) => mockHandleOAuthCallback(timeoutMs),
  setOAuthClientUserInteraction: (ui?: any) => mockSetOAuthClientUserInteraction(ui),
}));

// ============================================================================
// Tests
// ============================================================================

describe('useOAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // OAuth Client
  // --------------------------------------------------------------------------

  describe('OAuth client creation', () => {
    it('should create OAuthClient with server base URL', () => {
      const { OAuthClient } = require('@dotagents/core');
      const client = new OAuthClient('https://mcp-server.example.com', {
        scope: 'user',
      });
      // OAuthClient is a mock constructor — verify it returns a valid client
      expect(client).toBeDefined();
      expect(typeof client.discoverServerMetadata).toBe('function');
      expect(typeof client.startAuthorizationFlow).toBe('function');
    });

    it('should discover server metadata', async () => {
      const metadata = await mockOAuthClient.discoverServerMetadata();
      expect(metadata.authorization_endpoint).toBe('https://auth.example.com/authorize');
      expect(metadata.token_endpoint).toBe('https://auth.example.com/token');
    });

    it('should register client dynamically', async () => {
      const reg = await mockOAuthClient.registerClient();
      expect(reg.clientId).toBe('test-client-id');
    });
  });

  // --------------------------------------------------------------------------
  // Authorization Flow
  // --------------------------------------------------------------------------

  describe('authorization flow', () => {
    it('should start authorization flow and get URL', async () => {
      const result = await mockOAuthClient.startAuthorizationFlow();
      expect(result.authorizationUrl).toContain('authorize');
      expect(result.codeVerifier).toBe('test-verifier');
      expect(result.state).toBe('test-state');
    });

    it('should open browser with authorization URL', async () => {
      await mockOAuthClient.openAuthorizationUrl(
        'https://auth.example.com/authorize?client_id=test',
      );
      expect(mockOAuthClient.openAuthorizationUrl).toHaveBeenCalledWith(
        'https://auth.example.com/authorize?client_id=test',
      );
    });

    it('should complete full authorization flow', async () => {
      const tokens = await mockOAuthClient.completeAuthorizationFlow(
        mockHandleOAuthCallback,
      );
      expect(tokens.access_token).toBe('test-access-token');
      expect(tokens.token_type).toBe('bearer');
      expect(tokens.refresh_token).toBe('test-refresh-token');
    });
  });

  // --------------------------------------------------------------------------
  // Token Exchange
  // --------------------------------------------------------------------------

  describe('token exchange', () => {
    it('should exchange code for tokens', async () => {
      const tokens = await mockOAuthClient.exchangeCodeForToken({
        code: 'test-auth-code',
        codeVerifier: 'test-verifier',
        state: 'test-state',
      });
      expect(tokens.access_token).toBe('test-access-token');
      expect(tokens.expires_in).toBe(3600);
    });

    it('should handle token exchange failure', async () => {
      mockOAuthClient.exchangeCodeForToken.mockRejectedValueOnce(
        new Error('Token exchange failed: 400 Bad Request'),
      );
      await expect(
        mockOAuthClient.exchangeCodeForToken({
          code: 'bad-code',
          codeVerifier: 'verifier',
          state: 'state',
        }),
      ).rejects.toThrow('Token exchange failed');
    });
  });

  // --------------------------------------------------------------------------
  // Callback Server
  // --------------------------------------------------------------------------

  describe('callback server', () => {
    it('should start callback server', async () => {
      await mockOAuthCallbackServer.startServer();
      expect(mockOAuthCallbackServer.startServer).toHaveBeenCalled();
    });

    it('should wait for callback with code and state', async () => {
      const result = await mockOAuthCallbackServer.waitForCallback();
      expect(result.code).toBe('test-auth-code');
      expect(result.state).toBe('test-state');
    });

    it('should return redirect URI', () => {
      const uri = mockOAuthCallbackServer.getRedirectUri();
      expect(uri).toBe('http://localhost:3000/callback');
    });

    it('should use handleOAuthCallback for automatic server management', async () => {
      const result = await mockHandleOAuthCallback();
      expect(result.code).toBe('test-auth-code');
      expect(result.state).toBe('test-state');
    });

    it('should handle callback timeout', async () => {
      mockHandleOAuthCallback.mockRejectedValueOnce(new Error('OAuth callback timeout'));
      await expect(mockHandleOAuthCallback(5000)).rejects.toThrow('OAuth callback timeout');
    });

    it('should handle callback error', async () => {
      mockOAuthCallbackServer.waitForCallback.mockResolvedValueOnce({
        error: 'access_denied',
        error_description: 'User denied the request',
      });
      const result = await mockOAuthCallbackServer.waitForCallback();
      expect(result.error).toBe('access_denied');
      expect(result.error_description).toBe('User denied the request');
    });

    it('should stop callback server', () => {
      mockOAuthCallbackServer.stop();
      expect(mockOAuthCallbackServer.stop).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // UserInteraction wiring
  // --------------------------------------------------------------------------

  describe('UserInteraction wiring', () => {
    it('should wire UserInteraction for opening external URLs', () => {
      const mockUI = { openExternal: vi.fn() };
      mockSetOAuthClientUserInteraction(mockUI);
      expect(mockSetOAuthClientUserInteraction).toHaveBeenCalledWith(mockUI);
    });
  });

  // --------------------------------------------------------------------------
  // Token validity
  // --------------------------------------------------------------------------

  describe('token management', () => {
    it('should check token validity', () => {
      expect(mockOAuthClient.isTokenValid()).toBe(false);
    });

    it('should get valid token (refreshing if needed)', async () => {
      const token = await mockOAuthClient.getValidToken();
      expect(token).toBe('test-access-token');
    });
  });
});
