/**
 * SandboxPanel — TUI panel for managing sandbox slots.
 *
 * Provides full CRUD operations:
 * - List sandbox slots with active indicator
 * - Save current config as a named sandbox slot
 * - Switch to a different sandbox slot
 * - Delete a sandbox slot (can't delete active or default)
 * - Import a bundle file into a new sandbox slot
 *
 * Uses keyboard navigation (arrows, Enter, Escape, Tab).
 * Persists all changes via @dotagents/core sandbox-service
 * to ~/.agents/.sandboxes/ directory.
 */

import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import type { SandboxSlot, SandboxState } from '@dotagents/core';
import type { SaveSlotResult, SwitchSlotResult, DeleteSlotResult } from '@dotagents/core';

// ============================================================================
// Types
// ============================================================================

export type SandboxPanelView = 'list' | 'save' | 'import' | 'confirm-delete';

export interface SandboxPanelProps {
  state: SandboxState;
  error: string | null;
  statusMessage: string | null;
  onClose: () => void;
  onSaveSlot: (name: string) => SaveSlotResult;
  onSwitchSlot: (name: string) => SwitchSlotResult;
  onDeleteSlot: (name: string) => DeleteSlotResult;
  onImportBundle: (bundlePath: string, slotName: string) => Promise<{ success: boolean; error?: string }>;
  onReload: () => void;
}

// ============================================================================
// Sub-views
// ============================================================================

/**
 * Sandbox slot list view — shows all slots with active indicator.
 */
function SlotListView({
  slots,
  activeSlot,
  selectedIndex,
}: {
  slots: SandboxSlot[];
  activeSlot: string | null;
  selectedIndex: number;
}) {
  if (slots.length === 0) {
    return (
      <box paddingX={1} paddingY={1}>
        <text fg="#565f89">No sandbox slots found. Press "s" to save current config as a slot.</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" paddingX={1}>
      {slots.map((slot, index) => {
        const isSelected = index === selectedIndex;
        const isActive = slot.name === activeSlot;
        const indicator = isActive ? '●' : '○';
        const sourceTag = slot.sourceBundleName ? ` [from: ${slot.sourceBundleName}]` : '';
        const defaultTag = slot.isDefault ? ' (baseline)' : '';

        return (
          <text
            key={slot.name}
            fg={isSelected ? '#7aa2f7' : isActive ? '#9ece6a' : '#a9b1d6'}
          >
            {isSelected ? '▸ ' : '  '}
            {indicator} {slot.name}{defaultTag}{sourceTag}
            <text fg="#565f89"> — {new Date(slot.updatedAt).toLocaleDateString()}</text>
          </text>
        );
      })}
    </box>
  );
}

/**
 * Save slot form view.
 */
function SaveSlotView({ slotName }: { slotName: string }) {
  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#7aa2f7">
        <strong>Save Current Config as Sandbox Slot</strong>
      </text>
      <text fg="#565f89">Enter a name for the sandbox slot • Enter to save • Escape to cancel</text>
      <box marginTop={1}>
        <text fg="#a9b1d6">Slot name: {slotName || '(type a name)'}</text>
      </box>
    </box>
  );
}

/**
 * Import bundle into sandbox form view.
 */
function ImportBundleView({
  bundlePath,
  slotName,
  activeField,
  importStatus,
}: {
  bundlePath: string;
  slotName: string;
  activeField: number;
  importStatus: string | null;
}) {
  const fields = [
    { label: 'Bundle path', value: bundlePath },
    { label: 'Slot name', value: slotName },
  ];

  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#7aa2f7">
        <strong>Import Bundle into Sandbox</strong>
      </text>
      <text fg="#565f89">Tab to switch fields • Enter to import • Escape to cancel</text>
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
      {importStatus && (
        <box marginTop={1}>
          <text fg={importStatus.startsWith('✓') ? '#9ece6a' : importStatus.startsWith('⚠') ? '#e0af68' : '#565f89'}>
            {importStatus}
          </text>
        </box>
      )}
    </box>
  );
}

/**
 * Delete confirmation view.
 */
function ConfirmDeleteView({ slotName }: { slotName: string }) {
  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#f7768e">
        <strong>Delete Sandbox Slot</strong>
      </text>
      <text fg="#a9b1d6">
        Are you sure you want to delete sandbox slot "{slotName}"?
      </text>
      <text fg="#565f89">Press "y" to confirm or "n"/Escape to cancel</text>
    </box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SandboxPanel({
  state,
  error,
  statusMessage,
  onClose,
  onSaveSlot,
  onSwitchSlot,
  onDeleteSlot,
  onImportBundle,
  onReload,
}: SandboxPanelProps) {
  const [view, setView] = useState<SandboxPanelView>('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slotNameInput, setSlotNameInput] = useState('');
  const [bundlePathInput, setBundlePathInput] = useState('');
  const [importSlotName, setImportSlotName] = useState('');
  const [importActiveField, setImportActiveField] = useState(0);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [localStatusMessage, setLocalStatusMessage] = useState<string | null>(null);

  const selectedSlot = state.slots[selectedIndex];
  const displayStatus = localStatusMessage ?? statusMessage;

  const handleSave = useCallback(() => {
    if (!slotNameInput.trim()) return;
    const result = onSaveSlot(slotNameInput.trim());
    if (result.success) {
      setLocalStatusMessage(`✓ Saved sandbox slot "${result.slot?.name ?? slotNameInput.trim()}"`);
      setView('list');
      setSlotNameInput('');
      onReload();
    }
  }, [slotNameInput, onSaveSlot, onReload]);

  const handleSwitch = useCallback(() => {
    if (!selectedSlot) return;
    const result = onSwitchSlot(selectedSlot.name);
    if (result.success) {
      setLocalStatusMessage(`✓ Switched to sandbox slot "${selectedSlot.name}"`);
      onReload();
    }
  }, [selectedSlot, onSwitchSlot, onReload]);

  const handleDelete = useCallback(() => {
    if (!selectedSlot) return;
    const result = onDeleteSlot(selectedSlot.name);
    if (result.success) {
      setLocalStatusMessage(`✓ Deleted sandbox slot "${selectedSlot.name}"`);
      setView('list');
      if (selectedIndex >= state.slots.length - 1) {
        setSelectedIndex(Math.max(0, state.slots.length - 2));
      }
      onReload();
    }
  }, [selectedSlot, onDeleteSlot, selectedIndex, state.slots.length, onReload]);

  const handleImport = useCallback(async () => {
    if (!bundlePathInput.trim() || !importSlotName.trim()) return;
    setImportStatus('⠋ Importing bundle...');
    const result = await onImportBundle(bundlePathInput.trim(), importSlotName.trim());
    if (result.success) {
      setImportStatus(`✓ Imported bundle into sandbox slot "${importSlotName.trim()}"`);
      setTimeout(() => {
        setView('list');
        setBundlePathInput('');
        setImportSlotName('');
        setImportStatus(null);
        onReload();
      }, 1500);
    } else {
      setImportStatus(`⚠ ${result.error ?? 'Import failed'}`);
    }
  }, [bundlePathInput, importSlotName, onImportBundle, onReload]);

  useKeyboard((key) => {
    // Global: Escape to go back
    if (key.name === 'escape') {
      if (view === 'list') {
        onClose();
      } else {
        setView('list');
        setSlotNameInput('');
        setBundlePathInput('');
        setImportSlotName('');
        setImportStatus(null);
      }
      return;
    }

    if (view === 'list') {
      // Navigation
      if (key.name === 'up' && state.slots.length > 0) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        setLocalStatusMessage(null);
      } else if (key.name === 'down' && state.slots.length > 0) {
        setSelectedIndex((prev) => Math.min(state.slots.length - 1, prev + 1));
        setLocalStatusMessage(null);
      }
      // Actions
      else if (key.name === 's') {
        setSlotNameInput('');
        setView('save');
        setLocalStatusMessage(null);
      } else if (key.name === 'return' && selectedSlot) {
        handleSwitch();
      } else if (key.name === 'd' && selectedSlot) {
        setView('confirm-delete');
        setLocalStatusMessage(null);
      } else if (key.name === 'i') {
        setBundlePathInput('');
        setImportSlotName('');
        setImportActiveField(0);
        setImportStatus(null);
        setView('import');
        setLocalStatusMessage(null);
      } else if (key.name === 'r') {
        onReload();
        setLocalStatusMessage('✓ Refreshed sandbox state');
      }
    } else if (view === 'save') {
      if (key.name === 'return') {
        handleSave();
      }
    } else if (view === 'confirm-delete') {
      if (key.name === 'y') {
        handleDelete();
      } else if (key.name === 'n') {
        setView('list');
      }
    } else if (view === 'import') {
      if (key.name === 'tab') {
        setImportActiveField((prev) => (prev + 1) % 2);
      } else if (key.name === 'return') {
        void handleImport();
      }
    }
  });

  return (
    <box flexDirection="column" width="100%" flexGrow={1}>
      {/* Header */}
      <box paddingX={1}>
        <text fg="#7aa2f7">
          <strong>Sandbox Management</strong>
        </text>
        <text fg="#565f89"> ({state.slots.length} slots{state.activeSlot ? `, active: ${state.activeSlot}` : ''})</text>
      </box>

      {/* Error display */}
      {error && (
        <box paddingX={1}>
          <text fg="#f7768e">⚠ {error}</text>
        </box>
      )}

      {/* Status message */}
      {displayStatus && view === 'list' && (
        <box paddingX={1}>
          <text fg="#9ece6a">{displayStatus}</text>
        </box>
      )}

      {/* Views */}
      {view === 'list' && (
        <SlotListView
          slots={state.slots}
          activeSlot={state.activeSlot}
          selectedIndex={selectedIndex}
        />
      )}

      {view === 'save' && (
        <SaveSlotView slotName={slotNameInput} />
      )}

      {view === 'import' && (
        <ImportBundleView
          bundlePath={bundlePathInput}
          slotName={importSlotName}
          activeField={importActiveField}
          importStatus={importStatus}
        />
      )}

      {view === 'confirm-delete' && selectedSlot && (
        <ConfirmDeleteView slotName={selectedSlot.name} />
      )}

      {/* Footer help text */}
      <box paddingX={1} marginTop={1}>
        <text fg="#565f89">
          {view === 'list'
            ? '↑/↓ navigate • Enter switch • s save • d delete • i import bundle • r refresh • Esc close'
            : view === 'confirm-delete'
              ? 'y confirm • n/Esc cancel'
              : view === 'save'
                ? 'Enter save • Esc cancel'
                : 'Tab switch fields • Enter import • Esc cancel'}
        </text>
      </box>
    </box>
  );
}
