/**
 * useOAuth — OAuth PKCE flow hook for CLI MCP server authentication.
 *
 * Provides:
 * - Start OAuth authorization flow for an MCP server URL
 * - Open browser via system open command (UserInteraction.openExternal)
 * - Start localhost callback server to capture auth code
 * - Exchange code for tokens
 * - Track flow status (idle, authenticating, success, error)
 *
 * Uses @dotagents/core OAuthClient + OAuthCallbackServer.
 * The browser is opened using the already-wired UserInteraction adapter,
 * which uses `open` (macOS) / `xdg-open` (Linux) / `start` (Windows).
 */

import { useState, useCallback } from 'react';
import {
  OAuthClient,
  handleOAuthCallback,
} from '@dotagents/core';
import type { OAuthCallbackResult as OAuthClientCallbackResult } from '@dotagents/core';

// ── Types ────────────────────────────────────────────────────────────

export type OAuthStatus = 'idle' | 'authenticating' | 'success' | 'error';

export interface OAuthTokens {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface UseOAuthReturn {
  /** Current OAuth flow status */
  status: OAuthStatus;
  /** Last error message */
  error: string | null;
  /** Obtained tokens (after success) */
  tokens: OAuthTokens | null;
  /**
   * Start OAuth flow for an MCP server.
   * Opens browser, waits for callback, exchanges code for tokens.
   * @param serverUrl The MCP server base URL
   * @param options Optional: redirect port, scope, timeout
   */
  startOAuth: (
    serverUrl: string,
    options?: { port?: number; scope?: string; timeoutMs?: number },
  ) => Promise<OAuthTokens | null>;
  /** Reset to idle state */
  reset: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useOAuth(): UseOAuthReturn {
  const [status, setStatus] = useState<OAuthStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<OAuthTokens | null>(null);

  const startOAuth = useCallback(
    async (
      serverUrl: string,
      options?: { port?: number; scope?: string; timeoutMs?: number },
    ): Promise<OAuthTokens | null> => {
      setStatus('authenticating');
      setError(null);
      setTokens(null);

      try {
        const port = options?.port ?? 3000;
        const scope = options?.scope ?? 'user';
        const timeoutMs = options?.timeoutMs ?? 300000; // 5 minutes

        // Create OAuth client configured for the MCP server
        const client = new OAuthClient(serverUrl, {
          scope,
          redirectUri: `http://localhost:${port}/callback`,
          useDiscovery: true,
          useDynamicRegistration: true,
        });

        // Use the complete authorization flow which:
        // 1. Discovers server metadata
        // 2. Registers client dynamically
        // 3. Generates PKCE code challenge
        // 4. Opens browser with authorization URL
        // 5. Waits for localhost callback
        // 6. Exchanges code for tokens
        const callbackHandler = async (callbackTimeoutMs?: number) => {
          return await handleOAuthCallback(callbackTimeoutMs ?? timeoutMs);
        };

        const result = await client.completeAuthorizationFlow(callbackHandler);

        const oauthTokens: OAuthTokens = {
          access_token: result.access_token,
          token_type: result.token_type,
          expires_in: result.expires_in,
          refresh_token: result.refresh_token,
          scope: result.scope,
        };

        setTokens(oauthTokens);
        setStatus('success');
        return oauthTokens;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'OAuth authentication failed';
        setError(msg);
        setStatus('error');
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTokens(null);
  }, []);

  return {
    status,
    error,
    tokens,
    startOAuth,
    reset,
  };
}
