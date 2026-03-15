/**
 * LoopsPanel — TUI panel for managing repeat tasks (loops).
 *
 * Provides full CRUD operations:
 * - List repeat tasks with enabled/disabled and running status
 * - Create new task with name, prompt, interval, profile
 * - Edit existing task fields
 * - Delete task
 * - Enable/disable task
 * - Manually trigger task execution
 *
 * Uses keyboard navigation (arrows, Enter, Escape, Tab).
 * Persists all changes via @dotagents/core loopService
 * to ~/.agents/tasks/ directory.
 */

import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import type { LoopConfig, LoopStatus } from '@dotagents/core';
import type { LoopFormData } from '../hooks/useLoops';

// ============================================================================
// Types
// ============================================================================

export type LoopPanelView = 'list' | 'create' | 'edit' | 'confirm-delete';

export interface LoopsPanelProps {
  loops: LoopConfig[];
  statuses: LoopStatus[];
  error: string | null;
  onClose: () => void;
  onCreateLoop: (data: LoopFormData) => LoopConfig | null;
  onUpdateLoop: (id: string, updates: Partial<LoopFormData>) => boolean;
  onDeleteLoop: (id: string) => boolean;
  onEnableLoop: (id: string) => boolean;
  onDisableLoop: (id: string) => boolean;
  onTriggerLoop: (id: string) => Promise<boolean>;
}

// ============================================================================
// Helpers
// ============================================================================

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ''}`.trim();
  const days = Math.floor(minutes / 1440);
  const remainingHours = Math.floor((minutes % 1440) / 60);
  return `${days}d${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
}

function formatLastRun(timestamp?: number): string {
  if (!timestamp) return 'never';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ============================================================================
// Sub-views
// ============================================================================

/**
 * Loop list view — shows all repeat tasks with status indicators.
 */
function LoopListView({
  loops,
  statuses,
  selectedIndex,
}: {
  loops: LoopConfig[];
  statuses: LoopStatus[];
  selectedIndex: number;
}) {
  if (loops.length === 0) {
    return (
      <box paddingX={1} paddingY={1}>
        <text fg="#565f89">No repeat tasks found. Press "c" to create one.</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" paddingX={1}>
      {loops.map((loop, index) => {
        const isSelected = index === selectedIndex;
        const status = statuses.find((s) => s.id === loop.id);
        const enabledIndicator = loop.enabled ? '●' : '○';
        const runningIndicator = status?.isRunning ? ' ⟳' : '';
        const lastRun = formatLastRun(loop.lastRunAt);
        const interval = formatInterval(loop.intervalMinutes);

        return (
          <text
            key={loop.id}
            fg={isSelected ? '#7aa2f7' : loop.enabled ? '#9ece6a' : '#565f89'}
          >
            {isSelected ? '▸ ' : '  '}
            {enabledIndicator} {loop.name}{runningIndicator}
            <text fg="#565f89"> — every {interval} • last: {lastRun}</text>
          </text>
        );
      })}
    </box>
  );
}

/**
 * Loop create/edit form view.
 */
function LoopFormView({
  formData,
  activeField,
  isEdit,
}: {
  formData: LoopFormData;
  activeField: number;
  isEdit: boolean;
}) {
  const fields = [
    { label: 'Name', value: formData.name },
    { label: 'Prompt', value: formData.prompt.slice(0, 100) + (formData.prompt.length > 100 ? '...' : '') },
    { label: 'Interval (minutes)', value: String(formData.intervalMinutes) },
    { label: 'Enabled', value: formData.enabled !== false ? 'Yes' : 'No' },
    { label: 'Run on startup', value: formData.runOnStartup ? 'Yes' : 'No' },
  ];

  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#7aa2f7">
        <strong>{isEdit ? 'Edit Repeat Task' : 'Create Repeat Task'}</strong>
      </text>
      <text fg="#565f89">Tab to switch fields • Enter to save • Escape to cancel</text>
      <box flexDirection="column" marginTop={1}>
        {fields.map((field, index) => (
          <text
            key={field.label}
            fg={activeField === index ? '#7aa2f7' : '#a9b1d6'}
          >
            {activeField === index ? '▸ ' : '  '}
            {field.label}: {field.value || '(empty)'}
          </text>
        ))}
      </box>
    </box>
  );
}

/**
 * Delete confirmation view.
 */
function ConfirmDeleteView({ loopName }: { loopName: string }) {
  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#f7768e">
        <strong>Delete Repeat Task</strong>
      </text>
      <text fg="#a9b1d6">
        Are you sure you want to delete "{loopName}"?
      </text>
      <text fg="#565f89">Press "y" to confirm or "n"/Escape to cancel</text>
    </box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LoopsPanel({
  loops,
  statuses,
  error,
  onClose,
  onCreateLoop,
  onUpdateLoop,
  onDeleteLoop,
  onEnableLoop,
  onDisableLoop,
  onTriggerLoop,
}: LoopsPanelProps) {
  const [view, setView] = useState<LoopPanelView>('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [formData, setFormData] = useState<LoopFormData>({
    name: '',
    prompt: '',
    intervalMinutes: 60,
    enabled: true,
    runOnStartup: false,
  });
  const [activeField, setActiveField] = useState(0);
  const [editingLoopId, setEditingLoopId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedLoop = loops[selectedIndex];

  const handleCreate = useCallback(() => {
    const result = onCreateLoop(formData);
    if (result) {
      setStatusMessage(`✓ Created repeat task "${result.name}"`);
      setView('list');
      setFormData({ name: '', prompt: '', intervalMinutes: 60, enabled: true, runOnStartup: false });
    }
  }, [formData, onCreateLoop]);

  const handleUpdate = useCallback(() => {
    if (!editingLoopId) return;
    const success = onUpdateLoop(editingLoopId, formData);
    if (success) {
      setStatusMessage('✓ Repeat task updated');
      setView('list');
      setEditingLoopId(null);
      setFormData({ name: '', prompt: '', intervalMinutes: 60, enabled: true, runOnStartup: false });
    }
  }, [editingLoopId, formData, onUpdateLoop]);

  const handleDelete = useCallback(() => {
    if (!selectedLoop) return;
    const success = onDeleteLoop(selectedLoop.id);
    if (success) {
      setStatusMessage(`✓ Deleted repeat task "${selectedLoop.name}"`);
      setView('list');
      if (selectedIndex >= loops.length - 1) {
        setSelectedIndex(Math.max(0, loops.length - 2));
      }
    }
  }, [selectedLoop, onDeleteLoop, selectedIndex, loops.length]);

  const handleToggleEnable = useCallback(() => {
    if (!selectedLoop) return;
    if (selectedLoop.enabled) {
      onDisableLoop(selectedLoop.id);
      setStatusMessage(`○ Disabled "${selectedLoop.name}"`);
    } else {
      onEnableLoop(selectedLoop.id);
      setStatusMessage(`● Enabled "${selectedLoop.name}"`);
    }
  }, [selectedLoop, onEnableLoop, onDisableLoop]);

  const handleTrigger = useCallback(async () => {
    if (!selectedLoop) return;
    setStatusMessage(`⠋ Triggering "${selectedLoop.name}"...`);
    const success = await onTriggerLoop(selectedLoop.id);
    if (success) {
      setStatusMessage(`✓ Triggered "${selectedLoop.name}"`);
    } else {
      setStatusMessage(`⚠ Could not trigger "${selectedLoop.name}"`);
    }
  }, [selectedLoop, onTriggerLoop]);

  useKeyboard((key) => {
    // Global: Escape to go back
    if (key.name === 'escape') {
      if (view === 'list') {
        onClose();
      } else {
        setView('list');
        setEditingLoopId(null);
      }
      return;
    }

    if (view === 'list') {
      if (key.name === 'up' && loops.length > 0) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        setStatusMessage(null);
      } else if (key.name === 'down' && loops.length > 0) {
        setSelectedIndex((prev) => Math.min(loops.length - 1, prev + 1));
        setStatusMessage(null);
      } else if (key.name === 'c') {
        setFormData({ name: '', prompt: '', intervalMinutes: 60, enabled: true, runOnStartup: false });
        setActiveField(0);
        setView('create');
        setStatusMessage(null);
      } else if (key.name === 'e' && selectedLoop) {
        setFormData({
          name: selectedLoop.name,
          prompt: selectedLoop.prompt,
          intervalMinutes: selectedLoop.intervalMinutes,
          enabled: selectedLoop.enabled,
          profileId: selectedLoop.profileId,
          runOnStartup: selectedLoop.runOnStartup,
        });
        setEditingLoopId(selectedLoop.id);
        setActiveField(0);
        setView('edit');
        setStatusMessage(null);
      } else if (key.name === 'd' && selectedLoop) {
        setView('confirm-delete');
        setStatusMessage(null);
      } else if (key.name === 'return' && selectedLoop) {
        handleToggleEnable();
      } else if (key.name === 't' && selectedLoop) {
        void handleTrigger();
      }
    } else if (view === 'create' || view === 'edit') {
      if (key.name === 'tab') {
        setActiveField((prev) => (prev + 1) % 5);
      } else if (key.name === 'return') {
        if (view === 'create') handleCreate();
        else handleUpdate();
      }
    } else if (view === 'confirm-delete') {
      if (key.name === 'y') {
        handleDelete();
      } else if (key.name === 'n') {
        setView('list');
      }
    }
  });

  return (
    <box flexDirection="column" width="100%" flexGrow={1}>
      {/* Header */}
      <box paddingX={1}>
        <text fg="#7aa2f7">
          <strong>Repeat Tasks</strong>
        </text>
        <text fg="#565f89"> ({loops.length} tasks)</text>
      </box>

      {/* Error display */}
      {error && (
        <box paddingX={1}>
          <text fg="#f7768e">⚠ {error}</text>
        </box>
      )}

      {/* Status message */}
      {statusMessage && view === 'list' && (
        <box paddingX={1}>
          <text fg="#9ece6a">{statusMessage}</text>
        </box>
      )}

      {/* Views */}
      {view === 'list' && (
        <LoopListView
          loops={loops}
          statuses={statuses}
          selectedIndex={selectedIndex}
        />
      )}

      {(view === 'create' || view === 'edit') && (
        <LoopFormView
          formData={formData}
          activeField={activeField}
          isEdit={view === 'edit'}
        />
      )}

      {view === 'confirm-delete' && selectedLoop && (
        <ConfirmDeleteView loopName={selectedLoop.name} />
      )}

      {/* Footer help text */}
      <box paddingX={1} marginTop={1}>
        <text fg="#565f89">
          {view === 'list'
            ? '↑/↓ navigate • Enter toggle • c create • e edit • d delete • t trigger • Esc close'
            : view === 'confirm-delete'
              ? 'y confirm • n/Esc cancel'
              : 'Tab switch fields • Enter save • Esc cancel'}
        </text>
      </box>
    </box>
  );
}
