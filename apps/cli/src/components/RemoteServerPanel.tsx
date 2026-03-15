/**
 * RemoteServerPanel — TUI panel for Remote Server mode and OAuth.
 *
 * Provides:
 * - View server status (running/stopped, port, URL)
 * - Start/stop the remote server
 * - Display QR code for mobile app pairing
 * - Show pairing URL for manual connection
 * - Configure port and bind address
 * - Initiate OAuth flow for MCP server authentication
 *
 * Uses keyboard navigation (arrows, Enter, Escape, letter keys).
 * All remote server operations use @dotagents/core remote-server.
 */

import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import type { RemoteServerStatus } from '../hooks/useRemoteServer';
import type { OAuthStatus } from '../hooks/useOAuth';

// ============================================================================
// Types
// ============================================================================

export type ServerView = 'menu' | 'config' | 'oauth';

export interface RemoteServerPanelProps {
  /** Current server status */
  serverStatus: RemoteServerStatus;
  /** Whether a start/stop operation is in progress */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Start the remote server */
  onStartServer: () => Promise<void>;
  /** Stop the remote server */
  onStopServer: () => Promise<void>;
  /** Show QR code in terminal */
  onShowQRCode: () => Promise<void>;
  /** Set port */
  onSetPort: (port: number) => void;
  /** Set bind address */
  onSetBindAddress: (address: string) => void;
  /** OAuth flow status */
  oauthStatus: OAuthStatus;
  /** OAuth error */
  oauthError: string | null;
  /** Start OAuth flow for an MCP server URL */
  onStartOAuth: (serverUrl: string) => Promise<void>;
  /** Close panel */
  onClose: () => void;
}

// ============================================================================
// Menu items
// ============================================================================

const MENU_ITEMS_STOPPED = [
  { key: 'start', label: 'Start Server', description: 'Start the remote server for mobile connections' },
  { key: 'config', label: 'Configure', description: 'Set port and bind address' },
  { key: 'oauth', label: 'OAuth Authentication', description: 'Authenticate with an OAuth-enabled MCP server' },
] as const;

const MENU_ITEMS_RUNNING = [
  { key: 'qr', label: 'Show QR Code', description: 'Display QR code for mobile app pairing' },
  { key: 'stop', label: 'Stop Server', description: 'Stop the remote server' },
  { key: 'config', label: 'Configure', description: 'Set port and bind address (requires restart)' },
  { key: 'oauth', label: 'OAuth Authentication', description: 'Authenticate with an OAuth-enabled MCP server' },
] as const;

// ============================================================================
// Sub-views
// ============================================================================

function StatusView({ serverStatus }: { serverStatus: RemoteServerStatus }) {
  return (
    <box flexDirection="column" paddingX={1}>
      <box flexDirection="row">
        <text fg={serverStatus.running ? '#9ece6a' : '#565f89'}>
          {serverStatus.running ? '● Running' : '○ Stopped'}
        </text>
      </box>
      <text fg="#a9b1d6">
        Port: {serverStatus.port} • Bind: {serverStatus.bind}
      </text>
      {serverStatus.running && serverStatus.connectableUrl && (
        <text fg="#7aa2f7">
          URL: {serverStatus.connectableUrl}
        </text>
      )}
      {serverStatus.running && serverStatus.url && !serverStatus.connectableUrl && (
        <text fg="#7aa2f7">
          URL: {serverStatus.url}
        </text>
      )}
      {serverStatus.running && serverStatus.apiKey && (
        <text fg="#565f89">
          API Key: {serverStatus.apiKey}
        </text>
      )}
      {serverStatus.lastError && (
        <text fg="#f7768e">
          Last error: {serverStatus.lastError}
        </text>
      )}
    </box>
  );
}

function MenuView({
  items,
  selectedIndex,
}: {
  items: ReadonlyArray<{ key: string; label: string; description: string }>;
  selectedIndex: number;
}) {
  return (
    <box flexDirection="column" paddingX={1}>
      {items.map((item, index) => (
        <box key={item.key} flexDirection="column">
          <text fg={index === selectedIndex ? '#7aa2f7' : '#a9b1d6'}>
            {index === selectedIndex ? '▸ ' : '  '}
            {item.label}
          </text>
          {index === selectedIndex && (
            <text fg="#565f89">    {item.description}</text>
          )}
        </box>
      ))}
    </box>
  );
}

function ConfigView({
  port,
  bind,
  activeField,
}: {
  port: number;
  bind: string;
  activeField: number;
}) {
  const fields = [
    { label: 'Port', value: String(port) },
    { label: 'Bind Address', value: bind },
  ];

  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#7aa2f7">
        <strong>Server Configuration</strong>
      </text>
      <text fg="#565f89">
        Tab to switch fields • Enter to save • Escape to cancel
      </text>
      <box marginTop={1} flexDirection="column">
        {fields.map((field, index) => (
          <text
            key={field.label}
            fg={activeField === index ? '#7aa2f7' : '#a9b1d6'}
          >
            {activeField === index ? '▸ ' : '  '}
            {field.label}: {field.value}
          </text>
        ))}
      </box>
      <box marginTop={1}>
        <text fg="#565f89">
          Common bind addresses: 0.0.0.0 (all interfaces) • 127.0.0.1 (local only)
        </text>
      </box>
    </box>
  );
}

function OAuthView({
  status,
  error,
  serverUrl,
}: {
  status: OAuthStatus;
  error: string | null;
  serverUrl: string;
}) {
  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#7aa2f7">
        <strong>OAuth Authentication</strong>
      </text>
      <text fg="#565f89">
        Authenticate with an OAuth-enabled MCP server
      </text>
      <box marginTop={1}>
        <text fg="#a9b1d6">
          Server URL: {serverUrl || '(type MCP server URL)'}
        </text>
      </box>
      <box marginTop={1}>
        <text fg="#565f89">Enter to start OAuth flow • Escape to cancel</text>
      </box>
      {status === 'authenticating' && (
        <box marginTop={1}>
          <text fg="#e0af68">
            ⠋ Opening browser for authentication... Waiting for callback...
          </text>
        </box>
      )}
      {status === 'success' && (
        <box marginTop={1}>
          <text fg="#9ece6a">✓ Authentication successful! Tokens obtained.</text>
        </box>
      )}
      {status === 'error' && error && (
        <box marginTop={1}>
          <text fg="#f7768e">⚠ {error}</text>
        </box>
      )}
    </box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RemoteServerPanel({
  serverStatus,
  loading,
  error,
  onStartServer,
  onStopServer,
  onShowQRCode,
  onSetPort,
  onSetBindAddress,
  oauthStatus,
  oauthError,
  onStartOAuth,
  onClose,
}: RemoteServerPanelProps) {
  const [view, setView] = useState<ServerView>('menu');
  const [menuIndex, setMenuIndex] = useState(0);
  const [configField, setConfigField] = useState(0);
  const [portInput, setPortInput] = useState(String(serverStatus.port));
  const [bindInput, setBindInput] = useState(serverStatus.bind);
  const [oauthUrlInput, setOauthUrlInput] = useState('');

  const menuItems = serverStatus.running ? MENU_ITEMS_RUNNING : MENU_ITEMS_STOPPED;

  const navigateToMenu = useCallback(() => {
    setView('menu');
    setMenuIndex(0);
    setConfigField(0);
  }, []);

  const handleMenuSelect = useCallback(
    async (key: string) => {
      switch (key) {
        case 'start':
          await onStartServer();
          break;
        case 'stop':
          await onStopServer();
          break;
        case 'qr':
          await onShowQRCode();
          break;
        case 'config':
          setView('config');
          setPortInput(String(serverStatus.port));
          setBindInput(serverStatus.bind);
          setConfigField(0);
          break;
        case 'oauth':
          setView('oauth');
          setOauthUrlInput('');
          break;
      }
    },
    [onStartServer, onStopServer, onShowQRCode, serverStatus],
  );

  useKeyboard((key) => {
    // Global: Escape to go back
    if (key.name === 'escape') {
      if (view === 'menu') {
        onClose();
      } else {
        navigateToMenu();
      }
      return;
    }

    // View-specific handlers
    switch (view) {
      case 'menu': {
        if (key.name === 'up') {
          setMenuIndex((prev) => Math.max(0, prev - 1));
        } else if (key.name === 'down') {
          setMenuIndex((prev) => Math.min(menuItems.length - 1, prev + 1));
        } else if (key.name === 'return') {
          void handleMenuSelect(menuItems[menuIndex].key);
        }
        break;
      }

      case 'config': {
        if (key.name === 'tab') {
          setConfigField((prev) => (prev + 1) % 2);
        } else if (key.name === 'return') {
          // Save config
          const port = parseInt(portInput, 10);
          if (!isNaN(port) && port > 0 && port < 65536) {
            onSetPort(port);
          }
          onSetBindAddress(bindInput);
          navigateToMenu();
        }
        break;
      }

      case 'oauth': {
        if (key.name === 'return' && oauthUrlInput.trim()) {
          void onStartOAuth(oauthUrlInput.trim());
        }
        break;
      }
    }
  });

  return (
    <box flexDirection="column" width="100%" flexGrow={1}>
      {/* Header */}
      <box paddingX={1}>
        <text fg="#7aa2f7">
          <strong>Remote Server</strong>
        </text>
      </box>

      {/* Server status */}
      <StatusView serverStatus={serverStatus} />

      {/* Loading indicator */}
      {loading && (
        <box paddingX={1}>
          <text fg="#565f89">⠋ Processing...</text>
        </box>
      )}

      {/* Error */}
      {error && (
        <box paddingX={1}>
          <text fg="#f7768e">⚠ {error}</text>
        </box>
      )}

      {/* Views */}
      {view === 'menu' && (
        <box marginTop={1}>
          <MenuView items={menuItems} selectedIndex={menuIndex} />
        </box>
      )}

      {view === 'config' && (
        <box marginTop={1}>
          <ConfigView
            port={parseInt(portInput, 10) || serverStatus.port}
            bind={bindInput}
            activeField={configField}
          />
        </box>
      )}

      {view === 'oauth' && (
        <box marginTop={1}>
          <OAuthView
            status={oauthStatus}
            error={oauthError}
            serverUrl={oauthUrlInput}
          />
        </box>
      )}

      {/* Footer help text */}
      <box paddingX={1} marginTop={1}>
        <text fg="#565f89">
          {view === 'menu'
            ? '↑/↓ navigate • Enter select • Esc close'
            : view === 'config'
              ? 'Tab switch fields • Enter save • Esc back'
              : 'Enter start auth • Esc back'}
        </text>
      </box>
    </box>
  );
}
