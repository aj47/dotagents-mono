/**
 * MemoriesPanel — TUI panel for managing agent memories.
 *
 * Provides full CRUD operations:
 * - List memories with importance indicator
 * - Create new memory with title, content, tags, importance
 * - Edit existing memory fields
 * - Delete memory
 * - Auto-extraction indicator showing when enabled
 *
 * Uses keyboard navigation (arrows, Enter, Escape, Tab).
 * Persists all changes via @dotagents/core memoryService
 * to ~/.agents/memories/ directory.
 */

import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import type { AgentMemory } from '@dotagents/core';
import type { MemoryFormData } from '../hooks/useMemories';

// ============================================================================
// Types
// ============================================================================

export type MemoryPanelView = 'list' | 'create' | 'edit' | 'confirm-delete';

export interface MemoriesPanelProps {
  memories: AgentMemory[];
  autoExtractionEnabled: boolean;
  error: string | null;
  onClose: () => void;
  onCreateMemory: (data: MemoryFormData) => Promise<AgentMemory | null>;
  onUpdateMemory: (id: string, updates: Partial<MemoryFormData>) => Promise<boolean>;
  onDeleteMemory: (id: string) => Promise<boolean>;
}

// ============================================================================
// Helpers
// ============================================================================

const IMPORTANCE_COLORS: Record<AgentMemory['importance'], string> = {
  low: '#565f89',
  medium: '#a9b1d6',
  high: '#e0af68',
  critical: '#f7768e',
};

const IMPORTANCE_LABELS: Record<AgentMemory['importance'], string> = {
  low: '○',
  medium: '◐',
  high: '●',
  critical: '◉',
};

// ============================================================================
// Sub-views
// ============================================================================

/**
 * Memory list view — shows all memories with importance indicator.
 */
function MemoryListView({
  memories,
  selectedIndex,
  autoExtractionEnabled,
}: {
  memories: AgentMemory[];
  selectedIndex: number;
  autoExtractionEnabled: boolean;
}) {
  return (
    <box flexDirection="column" paddingX={1}>
      {/* Auto-extraction indicator */}
      {autoExtractionEnabled && (
        <text fg="#9ece6a">⚡ Auto-extraction enabled — memories created after agent sessions</text>
      )}

      {memories.length === 0 ? (
        <box paddingY={1}>
          <text fg="#565f89">No memories found. Press "c" to create one.</text>
        </box>
      ) : (
        memories.map((memory, index) => {
          const isSelected = index === selectedIndex;
          const importanceIndicator = IMPORTANCE_LABELS[memory.importance];
          const importanceColor = IMPORTANCE_COLORS[memory.importance];
          const tags = memory.tags.length > 0 ? ` [${memory.tags.join(', ')}]` : '';

          return (
            <text
              key={memory.id}
              fg={isSelected ? '#7aa2f7' : importanceColor}
            >
              {isSelected ? '▸ ' : '  '}
              {importanceIndicator} {memory.title}{tags}
            </text>
          );
        })
      )}
    </box>
  );
}

/**
 * Memory create/edit form view.
 */
function MemoryFormView({
  formData,
  activeField,
  isEdit,
}: {
  formData: MemoryFormData;
  activeField: number;
  isEdit: boolean;
}) {
  const importanceValues: AgentMemory['importance'][] = ['low', 'medium', 'high', 'critical'];
  const fields = [
    { label: 'Title', value: formData.title },
    { label: 'Content', value: formData.content.slice(0, 100) + (formData.content.length > 100 ? '...' : '') },
    { label: 'Tags', value: (formData.tags ?? []).join(', ') || '(none)' },
    { label: 'Importance', value: formData.importance ?? 'medium' },
    { label: 'Notes', value: formData.userNotes || '(none)' },
  ];

  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#7aa2f7">
        <strong>{isEdit ? 'Edit Memory' : 'Create Memory'}</strong>
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
function ConfirmDeleteView({ memoryTitle }: { memoryTitle: string }) {
  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#f7768e">
        <strong>Delete Memory</strong>
      </text>
      <text fg="#a9b1d6">
        Are you sure you want to delete "{memoryTitle}"?
      </text>
      <text fg="#565f89">Press "y" to confirm or "n"/Escape to cancel</text>
    </box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MemoriesPanel({
  memories,
  autoExtractionEnabled,
  error,
  onClose,
  onCreateMemory,
  onUpdateMemory,
  onDeleteMemory,
}: MemoriesPanelProps) {
  const [view, setView] = useState<MemoryPanelView>('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [formData, setFormData] = useState<MemoryFormData>({
    title: '',
    content: '',
    tags: [],
    importance: 'medium',
  });
  const [activeField, setActiveField] = useState(0);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedMemory = memories[selectedIndex];

  const handleCreate = useCallback(async () => {
    const result = await onCreateMemory(formData);
    if (result) {
      setStatusMessage(`✓ Created memory "${result.title}"`);
      setView('list');
      setFormData({ title: '', content: '', tags: [], importance: 'medium' });
    }
  }, [formData, onCreateMemory]);

  const handleUpdate = useCallback(async () => {
    if (!editingMemoryId) return;
    const success = await onUpdateMemory(editingMemoryId, formData);
    if (success) {
      setStatusMessage('✓ Memory updated');
      setView('list');
      setEditingMemoryId(null);
      setFormData({ title: '', content: '', tags: [], importance: 'medium' });
    }
  }, [editingMemoryId, formData, onUpdateMemory]);

  const handleDelete = useCallback(async () => {
    if (!selectedMemory) return;
    const success = await onDeleteMemory(selectedMemory.id);
    if (success) {
      setStatusMessage(`✓ Deleted memory "${selectedMemory.title}"`);
      setView('list');
      if (selectedIndex >= memories.length - 1) {
        setSelectedIndex(Math.max(0, memories.length - 2));
      }
    }
  }, [selectedMemory, onDeleteMemory, selectedIndex, memories.length]);

  useKeyboard((key) => {
    // Global: Escape to go back
    if (key.name === 'escape') {
      if (view === 'list') {
        onClose();
      } else {
        setView('list');
        setEditingMemoryId(null);
      }
      return;
    }

    if (view === 'list') {
      if (key.name === 'up' && memories.length > 0) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        setStatusMessage(null);
      } else if (key.name === 'down' && memories.length > 0) {
        setSelectedIndex((prev) => Math.min(memories.length - 1, prev + 1));
        setStatusMessage(null);
      } else if (key.name === 'c') {
        setFormData({ title: '', content: '', tags: [], importance: 'medium' });
        setActiveField(0);
        setView('create');
        setStatusMessage(null);
      } else if (key.name === 'e' && selectedMemory) {
        setFormData({
          title: selectedMemory.title,
          content: selectedMemory.content,
          tags: [...selectedMemory.tags],
          importance: selectedMemory.importance,
          userNotes: selectedMemory.userNotes,
        });
        setEditingMemoryId(selectedMemory.id);
        setActiveField(0);
        setView('edit');
        setStatusMessage(null);
      } else if (key.name === 'd' && selectedMemory) {
        setView('confirm-delete');
        setStatusMessage(null);
      }
    } else if (view === 'create' || view === 'edit') {
      if (key.name === 'tab') {
        setActiveField((prev) => (prev + 1) % 5);
      } else if (key.name === 'return') {
        if (view === 'create') void handleCreate();
        else void handleUpdate();
      }
    } else if (view === 'confirm-delete') {
      if (key.name === 'y') {
        void handleDelete();
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
          <strong>Memories Management</strong>
        </text>
        <text fg="#565f89"> ({memories.length} memories)</text>
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
        <MemoryListView
          memories={memories}
          selectedIndex={selectedIndex}
          autoExtractionEnabled={autoExtractionEnabled}
        />
      )}

      {(view === 'create' || view === 'edit') && (
        <MemoryFormView
          formData={formData}
          activeField={activeField}
          isEdit={view === 'edit'}
        />
      )}

      {view === 'confirm-delete' && selectedMemory && (
        <ConfirmDeleteView memoryTitle={selectedMemory.title} />
      )}

      {/* Footer help text */}
      <box paddingX={1} marginTop={1}>
        <text fg="#565f89">
          {view === 'list'
            ? '↑/↓ navigate • c create • e edit • d delete • Esc close'
            : view === 'confirm-delete'
              ? 'y confirm • n/Esc cancel'
              : 'Tab switch fields • Enter save • Esc cancel'}
        </text>
      </box>
    </box>
  );
}
