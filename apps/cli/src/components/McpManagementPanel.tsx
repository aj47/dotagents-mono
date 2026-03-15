/**
 * McpManagementPanel — TUI panel for managing MCP servers and tools.
 *
 * Provides:
 * - List servers with connection status and tool count
 * - Add new server (stdio, websocket, streamable-http transport types)
 * - Remove server with confirmation
 * - Trigger reconnection
 * - List all available tools across servers
 *
 * Uses keyboard navigation (arrows, Tab, Enter, Escape, a/d/r keys).
 * Persists all changes via @dotagents/core configStore.
 */

import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import type {
  McpServerInfo,
  McpToolInfo,
  McpOperationResult,
} from '../hooks/useMcpManagement';
import type { MCPTransportType } from '@dotagents/core';

// ============================================================================
// Types
// ============================================================================

export type McpPanelView = 'servers' | 'tools' | 'add' | 'confirm-delete';

export interface McpManagementPanelProps {
  servers: McpServerInfo[];
  allTools: McpToolInfo[];
  error: string | null;
  onClose: () => void;
  onAddServer: (name: string, config: { transport?: MCPTransportType; command?: string; args?: string[]; url?: string; env?: Record<string, string>; headers?: Record<string, string> }) => Promise<McpOperationResult>;
  onRemoveServer: (name: string) => Promise<McpOperationResult>;
  onReconnectServer: (name: string) => Promise<McpOperationResult>;
  onRefresh: () => void;
}

// ============================================================================
// Sub-views
// ============================================================================

/**
 * View tabs — horizontal navigation at the top of the MCP panel.
 */
function ViewTabs({ activeView }: { activeView: McpPanelView }) {
  const tabs = [
    { id: 'servers' as const, label: 'Servers' },
    { id: 'tools' as const, label: 'Tools' },
  ];

  return (
    <box flexDirection="row" width="100%" gap={1} paddingX={1}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeView || (activeView === 'add' && tab.id === 'servers') || (activeView === 'confirm-delete' && tab.id === 'servers');
        return (
          <text
            key={tab.id}
            fg={isActive ? '#7aa2f7' : '#565f89'}
          >
            {isActive ? <strong>[{tab.label}]</strong> : ` ${tab.label} `}
          </text>
        );
      })}
    </box>
  );
}

/**
 * Server list view — shows all configured servers with status.
 */
function ServerListView({
  servers,
  selectedIndex,
}: {
  servers: McpServerInfo[];
  selectedIndex: number;
}) {
  if (servers.length === 0) {
    return (
      <box paddingX={1} paddingY={1}>
        <text fg="#565f89">No MCP servers configured. Press "a" to add one.</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" paddingX={1}>
      {servers.map((server, index) => {
        const isSelected = index === selectedIndex;

        // Status indicator
        const statusIcon = server.configDisabled
          ? '⊘'
          : server.connected
            ? '●'
            : '○';
        const statusColor = server.configDisabled
          ? '#565f89'
          : server.connected
            ? '#9ece6a'
            : '#f7768e';

        // Transport badge
        const transportBadge =
          server.transport === 'stdio'
            ? '[stdio]'
            : server.transport === 'websocket'
              ? '[ws]'
              : '[http]';

        return (
          <text
            key={server.name}
            fg={isSelected ? '#7aa2f7' : '#a9b1d6'}
          >
            {isSelected ? '▸ ' : '  '}
            <text fg={statusColor}>{statusIcon}</text>{' '}
            {server.name}{' '}
            <text fg="#565f89">{transportBadge}</text>{' '}
            <text fg="#565f89">({server.toolCount} tools)</text>
            {server.configDisabled ? <text fg="#565f89"> [disabled]</text> : null}
            {server.error ? <text fg="#f7768e"> ⚠ {server.error}</text> : null}
          </text>
        );
      })}
    </box>
  );
}

/**
 * Add server form view — collects server name, transport type, and config.
 */
function AddServerView({
  step,
  serverName,
  transport,
  commandOrUrl,
  args,
  statusMessage,
}: {
  step: 'name' | 'transport' | 'endpoint' | 'args' | 'confirm';
  serverName: string;
  transport: MCPTransportType;
  commandOrUrl: string;
  args: string;
  statusMessage: string | null;
}) {
  return (
    <box flexDirection="column" paddingX={1} gap={0}>
      <text fg="#7aa2f7"><strong>Add New MCP Server</strong></text>
      <text fg="#565f89">─────────────────────────</text>

      {/* Server name */}
      <box flexDirection="row">
        <text fg={step === 'name' ? '#7aa2f7' : '#a9b1d6'}>
          {step === 'name' ? '▸ ' : '  '}Name: {serverName || '(type server name)'}
        </text>
      </box>

      {/* Transport type */}
      {(step === 'transport' || step === 'endpoint' || step === 'args' || step === 'confirm') && (
        <box flexDirection="row">
          <text fg={step === 'transport' ? '#7aa2f7' : '#a9b1d6'}>
            {step === 'transport' ? '▸ ' : '  '}Transport: {transport}
            {step === 'transport' ? ' (↑/↓ to change, Enter to confirm)' : ''}
          </text>
        </box>
      )}

      {/* Endpoint (command or URL) */}
      {(step === 'endpoint' || step === 'args' || step === 'confirm') && (
        <box flexDirection="row">
          <text fg={step === 'endpoint' ? '#7aa2f7' : '#a9b1d6'}>
            {step === 'endpoint' ? '▸ ' : '  '}
            {transport === 'stdio' ? 'Command' : 'URL'}: {commandOrUrl || '(type value)'}
          </text>
        </box>
      )}

      {/* Args (for stdio) */}
      {transport === 'stdio' && (step === 'args' || step === 'confirm') && (
        <box flexDirection="row">
          <text fg={step === 'args' ? '#7aa2f7' : '#a9b1d6'}>
            {step === 'args' ? '▸ ' : '  '}Args: {args || '(space-separated, optional)'}
          </text>
        </box>
      )}

      {/* Confirm */}
      {step === 'confirm' && (
        <box flexDirection="column" marginTop={1}>
          <text fg="#9ece6a">Ready to add server. Press Enter to confirm, Escape to cancel.</text>
        </box>
      )}

      {/* Status message */}
      {statusMessage && (
        <box marginTop={1}>
          <text fg="#e0af68">{statusMessage}</text>
        </box>
      )}

      <box marginTop={1}>
        <text fg="#565f89">
          {step === 'name' || step === 'endpoint' || step === 'args'
            ? 'Type value and press Enter • Escape to cancel'
            : step === 'transport'
              ? '↑/↓ select transport • Enter to confirm • Escape to cancel'
              : 'Enter to save • Escape to cancel'}
        </text>
      </box>
    </box>
  );
}

/**
 * Confirm delete view.
 */
function ConfirmDeleteView({
  serverName,
}: {
  serverName: string;
}) {
  return (
    <box flexDirection="column" paddingX={1} paddingY={1}>
      <text fg="#f7768e">
        <strong>Remove server "{serverName}"?</strong>
      </text>
      <text fg="#a9b1d6">
        This will disconnect and remove the server configuration.
      </text>
      <box marginTop={1}>
        <text fg="#565f89">Enter/y to confirm • Escape/n to cancel</text>
      </box>
    </box>
  );
}

/**
 * Tools list view — shows all available tools across servers.
 */
function ToolsListView({
  tools,
  selectedIndex,
}: {
  tools: McpToolInfo[];
  selectedIndex: number;
}) {
  if (tools.length === 0) {
    return (
      <box paddingX={1} paddingY={1}>
        <text fg="#565f89">No tools available. Add an MCP server first.</text>
      </box>
    );
  }

  // Group tools by server
  const groupedTools: Map<string, McpToolInfo[]> = new Map();
  for (const tool of tools) {
    const existing = groupedTools.get(tool.serverName) || [];
    existing.push(tool);
    groupedTools.set(tool.serverName, existing);
  }

  let flatIndex = 0;
  const elements: any[] = [];

  for (const [serverName, serverTools] of groupedTools) {
    elements.push(
      <box key={`header-${serverName}`} paddingX={1}>
        <text fg="#7aa2f7">
          <strong>─ {serverName} ({serverTools.length} tools) ─</strong>
        </text>
      </box>,
    );

    for (const tool of serverTools) {
      const isSelected = flatIndex === selectedIndex;
      const enabledIcon = tool.enabled ? '✓' : '✗';
      const enabledColor = tool.enabled ? '#9ece6a' : '#f7768e';
      const shortName = tool.name.includes(':')
        ? tool.name.split(':').slice(1).join(':')
        : tool.name;

      elements.push(
        <text
          key={tool.name}
          fg={isSelected ? '#7aa2f7' : '#a9b1d6'}
        >
          {isSelected ? '  ▸ ' : '    '}
          <text fg={enabledColor}>{enabledIcon}</text>{' '}
          {shortName}
          <text fg="#565f89"> — {tool.description || '(no description)'}</text>
        </text>,
      );
      flatIndex++;
    }
  }

  return (
    <box flexDirection="column">
      {elements}
    </box>
  );
}

// ============================================================================
// Transport options
// ============================================================================

const TRANSPORT_OPTIONS: MCPTransportType[] = ['stdio', 'websocket', 'streamableHttp'];

// ============================================================================
// Main component
// ============================================================================

export function McpManagementPanel({
  servers,
  allTools,
  error,
  onClose,
  onAddServer,
  onRemoveServer,
  onReconnectServer,
  onRefresh,
}: McpManagementPanelProps) {
  const [view, setView] = useState<McpPanelView>('servers');
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [selectedToolIndex, setSelectedToolIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Add server form state
  const [addStep, setAddStep] = useState<'name' | 'transport' | 'endpoint' | 'args' | 'confirm'>('name');
  const [addName, setAddName] = useState('');
  const [addTransport, setAddTransport] = useState<MCPTransportType>('stdio');
  const [addTransportIndex, setAddTransportIndex] = useState(0);
  const [addEndpoint, setAddEndpoint] = useState('');
  const [addArgs, setAddArgs] = useState('');
  // Text input buffer for capturing keystrokes in add form
  const [inputBuffer, setInputBuffer] = useState('');

  /** Reset add form to initial state */
  const resetAddForm = useCallback(() => {
    setAddStep('name');
    setAddName('');
    setAddTransport('stdio');
    setAddTransportIndex(0);
    setAddEndpoint('');
    setAddArgs('');
    setInputBuffer('');
    setStatusMessage(null);
  }, []);

  /** Submit the add server form */
  const submitAddServer = useCallback(async () => {
    const config: any = { transport: addTransport };
    if (addTransport === 'stdio') {
      config.command = addEndpoint;
      if (addArgs.trim()) {
        config.args = addArgs.trim().split(/\s+/);
      }
    } else {
      config.url = addEndpoint;
    }

    setStatusMessage('Adding server...');
    const result = await onAddServer(addName, config);

    if (result.success) {
      setStatusMessage(`✓ Server "${addName}" added successfully`);
      resetAddForm();
      setView('servers');
      onRefresh();
    } else {
      setStatusMessage(`⚠ ${result.error || 'Failed to add server'}`);
    }
  }, [addName, addTransport, addEndpoint, addArgs, onAddServer, resetAddForm, onRefresh]);

  // ========================================================================
  // Keyboard handler
  // ========================================================================

  useKeyboard((key: any) => {
    // --- Global keys ---
    if (key.name === 'escape') {
      if (view === 'add') {
        resetAddForm();
        setView('servers');
        return;
      }
      if (view === 'confirm-delete') {
        setDeleteTarget(null);
        setView('servers');
        return;
      }
      onClose();
      return;
    }

    // --- Add server form input ---
    if (view === 'add') {
      handleAddFormInput(key);
      return;
    }

    // --- Confirm delete ---
    if (view === 'confirm-delete') {
      if (key.name === 'return' || key.name === 'y') {
        if (deleteTarget) {
          onRemoveServer(deleteTarget).then((result) => {
            if (result.success) {
              setStatusMessage(`✓ Server "${deleteTarget}" removed`);
              setSelectedServerIndex(0);
            } else {
              setStatusMessage(`⚠ ${result.error || 'Failed to remove server'}`);
            }
            setDeleteTarget(null);
            setView('servers');
            onRefresh();
          });
        }
        return;
      }
      if (key.name === 'n') {
        setDeleteTarget(null);
        setView('servers');
        return;
      }
      return;
    }

    // --- Tab to switch between servers/tools views ---
    if (key.name === 'tab') {
      if (view === 'servers') {
        setView('tools');
        setSelectedToolIndex(0);
      } else if (view === 'tools') {
        setView('servers');
      }
      setStatusMessage(null);
      return;
    }

    // --- Server list keys ---
    if (view === 'servers') {
      if (key.name === 'up') {
        setSelectedServerIndex((i: number) => Math.max(0, i - 1));
        return;
      }
      if (key.name === 'down') {
        setSelectedServerIndex((i: number) => Math.min(servers.length - 1, i));
        return;
      }

      // 'a' — add server
      if (key.name === 'a') {
        resetAddForm();
        setView('add');
        return;
      }

      // 'r' — reconnect selected server
      if (key.name === 'r' && servers.length > 0) {
        const server = servers[selectedServerIndex];
        if (server) {
          setStatusMessage(`Reconnecting ${server.name}...`);
          onReconnectServer(server.name).then((result) => {
            if (result.success) {
              setStatusMessage(`✓ ${server.name} reconnected`);
            } else {
              setStatusMessage(`⚠ ${result.error || 'Reconnect failed'}`);
            }
            onRefresh();
          });
        }
        return;
      }

      // 'd' — delete selected server
      if (key.name === 'd' && servers.length > 0) {
        const server = servers[selectedServerIndex];
        if (server) {
          setDeleteTarget(server.name);
          setView('confirm-delete');
        }
        return;
      }
    }

    // --- Tools list keys ---
    if (view === 'tools') {
      if (key.name === 'up') {
        setSelectedToolIndex((i: number) => Math.max(0, i - 1));
        return;
      }
      if (key.name === 'down') {
        setSelectedToolIndex((i: number) => Math.min(allTools.length - 1, i));
        return;
      }
    }
  });

  /**
   * Handle keypresses in the add-server form.
   */
  function handleAddFormInput(key: any) {
    // Backspace removes last char
    if (key.name === 'backspace') {
      setInputBuffer((buf: string) => buf.slice(0, -1));
      return;
    }

    // Enter advances to next step
    if (key.name === 'return') {
      switch (addStep) {
        case 'name': {
          const name = inputBuffer.trim();
          if (!name) {
            setStatusMessage('Please enter a server name');
            return;
          }
          setAddName(name);
          setInputBuffer('');
          setAddStep('transport');
          setStatusMessage(null);
          return;
        }
        case 'transport': {
          setAddTransport(TRANSPORT_OPTIONS[addTransportIndex]);
          setInputBuffer('');
          setAddStep('endpoint');
          setStatusMessage(null);
          return;
        }
        case 'endpoint': {
          const endpoint = inputBuffer.trim();
          if (!endpoint) {
            setStatusMessage(
              addTransport === 'stdio'
                ? 'Please enter a command'
                : 'Please enter a URL',
            );
            return;
          }
          setAddEndpoint(endpoint);
          setInputBuffer('');
          if (addTransport === 'stdio') {
            setAddStep('args');
          } else {
            setAddStep('confirm');
          }
          setStatusMessage(null);
          return;
        }
        case 'args': {
          setAddArgs(inputBuffer.trim());
          setInputBuffer('');
          setAddStep('confirm');
          setStatusMessage(null);
          return;
        }
        case 'confirm': {
          submitAddServer();
          return;
        }
      }
      return;
    }

    // Arrow keys for transport selection
    if (addStep === 'transport') {
      if (key.name === 'up') {
        setAddTransportIndex((i: number) => Math.max(0, i - 1));
        setAddTransport(TRANSPORT_OPTIONS[Math.max(0, addTransportIndex - 1)]);
        return;
      }
      if (key.name === 'down') {
        setAddTransportIndex((i: number) => Math.min(TRANSPORT_OPTIONS.length - 1, i + 1));
        setAddTransport(TRANSPORT_OPTIONS[Math.min(TRANSPORT_OPTIONS.length - 1, addTransportIndex + 1)]);
        return;
      }
    }

    // Regular character input
    if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
      setInputBuffer((buf: string) => buf + key.sequence);
    }
  }

  // ========================================================================
  // Render
  // ========================================================================

  // Determine display values for add form
  const displayName = addStep === 'name' ? inputBuffer : addName;
  const displayEndpoint = addStep === 'endpoint' ? inputBuffer : addEndpoint;
  const displayArgs = addStep === 'args' ? inputBuffer : addArgs;

  return (
    <box flexDirection="column" width="100%" flexGrow={1}>
      {/* Header */}
      <box
        border
        borderStyle="single"
        borderColor="#7aa2f7"
        paddingX={1}
        width="100%"
      >
        <text fg="#7aa2f7"><strong>MCP Server Management</strong></text>
        <text fg="#565f89">
          {' '}— {servers.length} server{servers.length !== 1 ? 's' : ''}, {allTools.length} tool{allTools.length !== 1 ? 's' : ''}
        </text>
      </box>

      {/* Tabs */}
      <ViewTabs activeView={view} />

      {/* Error display */}
      {error && (
        <box paddingX={1}>
          <text fg="#f7768e">⚠ {error}</text>
        </box>
      )}

      {/* Status message */}
      {statusMessage && view !== 'add' && (
        <box paddingX={1}>
          <text fg="#e0af68">{statusMessage}</text>
        </box>
      )}

      {/* Content area */}
      {view === 'servers' && (
        <ServerListView
          servers={servers}
          selectedIndex={selectedServerIndex}
        />
      )}

      {view === 'tools' && (
        <ToolsListView
          tools={allTools}
          selectedIndex={selectedToolIndex}
        />
      )}

      {view === 'add' && (
        <AddServerView
          step={addStep}
          serverName={displayName}
          transport={addTransport}
          commandOrUrl={displayEndpoint}
          args={displayArgs}
          statusMessage={statusMessage}
        />
      )}

      {view === 'confirm-delete' && deleteTarget && (
        <ConfirmDeleteView serverName={deleteTarget} />
      )}

      {/* Footer — keybinding hints */}
      <box width="100%" paddingX={1} marginTop={1}>
        <text fg="#565f89">
          {view === 'servers'
            ? 'Tab tools • ↑/↓ navigate • a add • r reconnect • d remove • Esc close'
            : view === 'tools'
              ? 'Tab servers • ↑/↓ navigate • Esc close'
              : view === 'add'
                ? 'Enter next • Escape cancel'
                : 'Enter/y confirm • Escape/n cancel'}
        </text>
      </box>
    </box>
  );
}
