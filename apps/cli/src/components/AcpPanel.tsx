/**
 * AcpPanel — TUI panel for ACP multi-agent management.
 *
 * Provides:
 * - List agents with connection type, status, enabled flag
 * - Start/stop agents via keyboard (s/x keys)
 * - Add new agent (a key → add form)
 * - Remove agent (d key → confirm delete)
 * - Edit agent (e key → edit form)
 * - View delegation chain for active sessions
 *
 * Keyboard navigation: ↑/↓ to navigate, Enter to toggle, Escape to close/back.
 */

import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import type {
  AcpAgentInfo,
  AcpOperationResult,
  DelegationEntry,
} from '../hooks/useAcp';
import type { ACPAgentConfig, ACPConnectionType } from '@dotagents/core';

// ============================================================================
// Types
// ============================================================================

export type AcpPanelView = 'list' | 'add' | 'confirm-delete' | 'delegations';

export interface AcpPanelProps {
  agents: AcpAgentInfo[];
  onClose: () => void;
  onStartAgent: (name: string) => Promise<AcpOperationResult>;
  onStopAgent: (name: string) => Promise<AcpOperationResult>;
  onAddAgent: (config: Omit<ACPAgentConfig, 'name'> & { name: string }) => Promise<AcpOperationResult>;
  onRemoveAgent: (name: string) => Promise<AcpOperationResult>;
  onRefresh: () => void;
  delegations?: DelegationEntry[];
}

// ============================================================================
// Sub-views
// ============================================================================

/**
 * Agent list view — shows configured ACP agents with status.
 */
function AgentListView({
  agents,
  selectedIndex,
}: {
  agents: AcpAgentInfo[];
  selectedIndex: number;
}) {
  if (agents.length === 0) {
    return (
      <box paddingX={1} paddingY={1}>
        <text fg="#565f89">No ACP agents configured. Press "a" to add one.</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" paddingX={1}>
      {agents.map((agent, index) => {
        const isSelected = index === selectedIndex;

        // Status indicator
        const statusIcon =
          agent.status === 'ready'
            ? '●'
            : agent.status === 'starting'
              ? '◐'
              : agent.status === 'error'
                ? '✗'
                : '○';
        const statusColor =
          agent.status === 'ready'
            ? '#9ece6a'
            : agent.status === 'starting'
              ? '#e0af68'
              : agent.status === 'error'
                ? '#f7768e'
                : '#565f89';

        // Connection type badge
        const typeBadge = agent.connectionType === 'remote' ? '[remote]' : '[stdio]';

        return (
          <box key={agent.name} flexDirection="row" width="100%">
            <text fg={isSelected ? '#7aa2f7' : '#c0caf5'}>
              {isSelected ? '❯ ' : '  '}
              <text fg={statusColor}>{statusIcon}</text>
              {' '}
              {agent.displayName}
              {' '}
              <text fg="#565f89">{typeBadge}</text>
              {!agent.enabled && <text fg="#565f89"> (disabled)</text>}
              {agent.autoSpawn && <text fg="#565f89"> (auto)</text>}
              {agent.error && <text fg="#f7768e"> — {agent.error}</text>}
            </text>
          </box>
        );
      })}
    </box>
  );
}

/**
 * Add agent form view.
 */
function AddAgentForm({
  formState,
  onFieldChange,
}: {
  formState: AddFormState;
  onFieldChange: (field: keyof AddFormState, value: string) => void;
}) {
  return (
    <box flexDirection="column" paddingX={1} gap={1}>
      <text fg="#7aa2f7"><strong>Add New ACP Agent</strong></text>
      <box flexDirection="column">
        <text fg="#c0caf5">
          Name: <text fg="#9ece6a">{formState.name || '(type name)'}</text>
        </text>
        <text fg="#c0caf5">
          Display Name: <text fg="#9ece6a">{formState.displayName || '(optional)'}</text>
        </text>
        <text fg="#c0caf5">
          Type: <text fg="#9ece6a">{formState.connectionType}</text>
          <text fg="#565f89"> (t to toggle)</text>
        </text>
        {formState.connectionType === 'stdio' ? (
          <text fg="#c0caf5">
            Command: <text fg="#9ece6a">{formState.command || '(required for stdio)'}</text>
          </text>
        ) : (
          <text fg="#c0caf5">
            Base URL: <text fg="#9ece6a">{formState.baseUrl || '(required for remote)'}</text>
          </text>
        )}
      </box>
      <text fg="#565f89">Enter to save • Escape to cancel • Tab to switch fields</text>
      {formState.error && <text fg="#f7768e">⚠ {formState.error}</text>}
    </box>
  );
}

/**
 * Delete confirmation view.
 */
function ConfirmDeleteView({ agentName }: { agentName: string }) {
  return (
    <box paddingX={1} paddingY={1}>
      <text fg="#f7768e">
        Delete agent "{agentName}"? Press Enter to confirm, Escape to cancel.
      </text>
    </box>
  );
}

/**
 * Delegations view — shows the delegation chain.
 */
function DelegationsView({
  delegations,
}: {
  delegations: DelegationEntry[];
}) {
  if (delegations.length === 0) {
    return (
      <box paddingX={1} paddingY={1}>
        <text fg="#565f89">No active delegations.</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#7aa2f7"><strong>Delegation Chain</strong></text>
      {delegations.map((entry, index) => {
        const statusIcon =
          entry.status === 'running'
            ? '⠋'
            : entry.status === 'completed'
              ? '✓'
              : entry.status === 'failed'
                ? '✗'
                : '○';
        const statusColor =
          entry.status === 'running'
            ? '#7aa2f7'
            : entry.status === 'completed'
              ? '#9ece6a'
              : entry.status === 'failed'
                ? '#f7768e'
                : '#565f89';

        return (
          <box key={entry.runId} flexDirection="row">
            <text fg="#565f89">{'  '.repeat(index)}→ </text>
            <text fg={statusColor}>{statusIcon} </text>
            <text fg="#c0caf5">
              {entry.agentName}: {entry.task}
              {entry.progress && <text fg="#565f89"> ({entry.progress})</text>}
            </text>
          </box>
        );
      })}
    </box>
  );
}

// ============================================================================
// Form state
// ============================================================================

interface AddFormState {
  name: string;
  displayName: string;
  connectionType: ACPConnectionType;
  command: string;
  baseUrl: string;
  error: string | null;
}

const initialFormState: AddFormState = {
  name: '',
  displayName: '',
  connectionType: 'stdio',
  command: '',
  baseUrl: '',
  error: null,
};

// ============================================================================
// Main Component
// ============================================================================

export function AcpPanel({
  agents,
  onClose,
  onStartAgent,
  onStopAgent,
  onAddAgent,
  onRemoveAgent,
  onRefresh,
  delegations = [],
}: AcpPanelProps) {
  const [view, setView] = useState<AcpPanelView>('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [formState, setFormState] = useState<AddFormState>({ ...initialFormState });
  const [operationMessage, setOperationMessage] = useState<string | null>(null);

  const handleFieldChange = useCallback(
    (field: keyof AddFormState, value: string) => {
      setFormState((prev: AddFormState) => ({ ...prev, [field]: value, error: null }));
    },
    [],
  );

  const handleAddSubmit = useCallback(async () => {
    const config: Omit<ACPAgentConfig, 'name'> & { name: string } = {
      name: formState.name,
      displayName: formState.displayName || formState.name,
      connection: {
        type: formState.connectionType,
        ...(formState.connectionType === 'stdio'
          ? { command: formState.command }
          : { baseUrl: formState.baseUrl }),
      },
      enabled: true,
    };

    const result = await onAddAgent(config);
    if (result.success) {
      setFormState({ ...initialFormState });
      setView('list');
      setOperationMessage('✓ Agent added successfully');
      onRefresh();
    } else {
      setFormState((prev: AddFormState) => ({ ...prev, error: result.error || 'Failed to add agent' }));
    }
  }, [formState, onAddAgent, onRefresh]);

  const handleDelete = useCallback(async () => {
    const agent = agents[selectedIndex];
    if (!agent) return;

    const result = await onRemoveAgent(agent.name);
    if (result.success) {
      setView('list');
      setOperationMessage(`✓ Agent "${agent.name}" removed`);
      setSelectedIndex(Math.max(0, selectedIndex - 1));
      onRefresh();
    } else {
      setOperationMessage(`⚠ ${result.error || 'Failed to remove agent'}`);
    }
  }, [agents, selectedIndex, onRemoveAgent, onRefresh]);

  useKeyboard((key) => {
    if (view === 'add') {
      if (key.name === 'escape') {
        setView('list');
        setFormState({ ...initialFormState });
      } else if (key.name === 'return') {
        void handleAddSubmit();
      } else if (key.name === 't') {
        // Toggle connection type
        setFormState((prev: AddFormState) => ({
          ...prev,
          connectionType: prev.connectionType === 'stdio' ? 'remote' : 'stdio',
        }));
      }
      return;
    }

    if (view === 'confirm-delete') {
      if (key.name === 'return') {
        void handleDelete();
      } else if (key.name === 'escape') {
        setView('list');
      }
      return;
    }

    if (view === 'delegations') {
      if (key.name === 'escape') {
        setView('list');
      }
      return;
    }

    // List view navigation
    if (key.name === 'escape') {
      onClose();
    } else if (key.name === 'up') {
      setSelectedIndex((i: number) => Math.max(0, i - 1));
    } else if (key.name === 'down') {
      setSelectedIndex((i: number) => Math.min(agents.length - 1, i + 1));
    } else if (key.name === 'a') {
      setView('add');
      setFormState({ ...initialFormState });
      setOperationMessage(null);
    } else if (key.name === 'd' && agents.length > 0) {
      setView('confirm-delete');
      setOperationMessage(null);
    } else if (key.name === 's' && agents[selectedIndex]) {
      // Start selected agent
      const agent = agents[selectedIndex];
      void onStartAgent(agent.name).then((res) => {
        setOperationMessage(
          res.success
            ? `✓ Agent "${agent.name}" started`
            : `⚠ ${res.error || 'Failed to start agent'}`,
        );
        onRefresh();
      });
    } else if (key.name === 'x' && agents[selectedIndex]) {
      // Stop selected agent
      const agent = agents[selectedIndex];
      void onStopAgent(agent.name).then((res) => {
        setOperationMessage(
          res.success
            ? `✓ Agent "${agent.name}" stopped`
            : `⚠ ${res.error || 'Failed to stop agent'}`,
        );
        onRefresh();
      });
    } else if (key.name === 'v') {
      // View delegations
      setView('delegations');
    } else if (key.name === 'r') {
      onRefresh();
      setOperationMessage('✓ Refreshed');
    }
  });

  return (
    <box flexDirection="column" width="100%" flexGrow={1}>
      {/* Title */}
      <box
        border
        borderStyle="single"
        borderColor="#bb9af7"
        paddingX={1}
        width="100%"
      >
        <text fg="#bb9af7"><strong>ACP Agents</strong></text>
        <text fg="#565f89">
          {' '}— {agents.length} configured
          {agents.filter((a) => a.status === 'ready').length > 0 &&
            ` (${agents.filter((a) => a.status === 'ready').length} running)`}
        </text>
      </box>

      {/* Operation message */}
      {operationMessage && (
        <box paddingX={1}>
          <text fg={operationMessage.startsWith('✓') ? '#9ece6a' : '#e0af68'}>
            {operationMessage}
          </text>
        </box>
      )}

      {/* Views */}
      {view === 'list' && (
        <AgentListView agents={agents} selectedIndex={selectedIndex} />
      )}

      {view === 'add' && (
        <AddAgentForm formState={formState} onFieldChange={handleFieldChange} />
      )}

      {view === 'confirm-delete' && agents[selectedIndex] && (
        <ConfirmDeleteView agentName={agents[selectedIndex].name} />
      )}

      {view === 'delegations' && (
        <DelegationsView delegations={delegations} />
      )}

      {/* Help bar */}
      <box paddingX={1} paddingY={0}>
        <text fg="#565f89">
          {view === 'list'
            ? '↑/↓ navigate • s start • x stop • a add • d delete • v delegations • r refresh • Esc close'
            : view === 'add'
              ? 'Enter save • t toggle type • Esc cancel'
              : view === 'confirm-delete'
                ? 'Enter confirm • Esc cancel'
                : 'Esc back'}
        </text>
      </box>
    </box>
  );
}
