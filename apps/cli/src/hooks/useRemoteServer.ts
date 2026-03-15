/**
 * useRemoteServer — Remote server management hook for CLI.
 *
 * Provides:
 * - Start/stop the Fastify remote server on configurable port
 * - Display QR code and pairing URL for mobile connection
 * - Status tracking (running, port, URL, error)
 * - Port and bind address configuration
 *
 * Wires @dotagents/core remote-server with CLI adapters:
 * - ProgressEmitter for UI notifications
 * - ConversationService for chat persistence
 *
 * Uses startRemoteServerForced() to ensure server starts even when
 * remoteServerEnabled is false in config (since the user explicitly
 * requested it via /server command).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  startRemoteServerForced,
  stopRemoteServer,
  printQRCodeToTerminal,
  getRemoteServerStatus,
  setRemoteServerProgressEmitter,
  setRemoteServerConversationService,
  configStore,
  ConversationService,
} from '@dotagents/core';
import type { ProgressEmitter } from '@dotagents/core';

// ── Types ────────────────────────────────────────────────────────────

export interface RemoteServerStatus {
  running: boolean;
  url?: string;
  connectableUrl?: string;
  bind: string;
  port: number;
  lastError?: string;
  apiKey?: string;
}

export interface UseRemoteServerReturn {
  /** Current server status */
  status: RemoteServerStatus;
  /** Whether a start/stop operation is in progress */
  loading: boolean;
  /** Last error message */
  error: string | null;
  /** Start the remote server */
  startServer: () => Promise<void>;
  /** Stop the remote server */
  stopServer: () => Promise<void>;
  /** Display QR code in terminal */
  showQRCode: () => Promise<void>;
  /** Set custom port */
  setPort: (port: number) => void;
  /** Set bind address */
  setBindAddress: (address: string) => void;
  /** Refresh status from core */
  refreshStatus: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

function redactApiKey(key?: string): string | undefined {
  if (!key) return undefined;
  if (key.length <= 8) return '***';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function getStatusFromCore(): RemoteServerStatus {
  const coreStatus = getRemoteServerStatus();
  const cfg = configStore.get();
  return {
    running: coreStatus.running,
    url: coreStatus.url,
    connectableUrl: coreStatus.connectableUrl,
    bind: coreStatus.bind,
    port: coreStatus.port,
    lastError: coreStatus.lastError,
    apiKey: redactApiKey(cfg.remoteServerApiKey),
  };
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useRemoteServer(
  progressEmitter?: ProgressEmitter,
): UseRemoteServerReturn {
  const [status, setStatus] = useState<RemoteServerStatus>(getStatusFromCore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wiredRef = useRef(false);

  // Wire dependencies on first mount
  useEffect(() => {
    if (!wiredRef.current) {
      wiredRef.current = true;

      // Wire ConversationService for the remote server
      const conversationService = new ConversationService();
      setRemoteServerConversationService(conversationService);

      // Wire ProgressEmitter if provided
      if (progressEmitter) {
        setRemoteServerProgressEmitter(progressEmitter);
      }
    }
  }, [progressEmitter]);

  const refreshStatus = useCallback(() => {
    setStatus(getStatusFromCore());
  }, []);

  const startServer = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cfg = configStore.get();
      const bindAddress = cfg.remoteServerBindAddress || '0.0.0.0';

      const result = await startRemoteServerForced({
        bindAddressOverride: bindAddress,
      });

      if (!result.running) {
        setError((result as any).error || 'Failed to start server');
      }

      refreshStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start remote server';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);

  const stopServer = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await stopRemoteServer();
      refreshStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to stop remote server';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);

  const showQRCode = useCallback(async () => {
    try {
      const success = await printQRCodeToTerminal();
      if (!success) {
        setError('Could not display QR code. Is the server running?');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to display QR code';
      setError(msg);
    }
  }, []);

  const setPort = useCallback((port: number) => {
    const cfg = configStore.get();
    configStore.save({ ...cfg, remoteServerPort: port });
    refreshStatus();
  }, [refreshStatus]);

  const setBindAddress = useCallback((address: string) => {
    const cfg = configStore.get();
    configStore.save({ ...cfg, remoteServerBindAddress: address });
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    loading,
    error,
    startServer,
    stopServer,
    showQRCode,
    setPort,
    setBindAddress,
    refreshStatus,
  };
}
