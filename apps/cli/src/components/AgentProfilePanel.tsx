/**
 * AgentProfilePanel — TUI panel for managing agent profiles.
 *
 * Provides full CRUD operations:
 * - List profiles (global + workspace layers merged)
 * - Create new profile with name, role, system prompt
 * - Edit existing profile fields
 * - Switch active profile (affects subsequent chat sessions)
 * - Delete profile (prevents deleting built-in profiles)
 *
 * Uses keyboard navigation (arrows, Enter, Escape, Tab).
 * Persists all changes via @dotagents/core agentProfileService
 * to ~/.agents/agents/ directory.
 */

import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import type { AgentProfile, AgentProfileRole } from '@dotagents/core';
import type { ProfileFormData } from '../hooks/useAgentProfiles';

// ============================================================================
// Types
// ============================================================================

export type ProfilePanelView = 'list' | 'create' | 'edit' | 'confirm-delete';

export interface AgentProfilePanelProps {
  profiles: AgentProfile[];
  activeProfile: AgentProfile | undefined;
  error: string | null;
  onClose: () => void;
  onCreateProfile: (data: ProfileFormData) => AgentProfile | null;
  onUpdateProfile: (id: string, updates: Partial<ProfileFormData>) => AgentProfile | null;
  onDeleteProfile: (id: string) => boolean;
  onSwitchProfile: (id: string) => boolean;
}

// ============================================================================
// Sub-views
// ============================================================================

/**
 * Profile list view — shows all profiles with active indicator.
 */
function ProfileListView({
  profiles,
  activeProfileId,
  selectedIndex,
}: {
  profiles: AgentProfile[];
  activeProfileId: string | undefined;
  selectedIndex: number;
}) {
  if (profiles.length === 0) {
    return (
      <box paddingX={1} paddingY={1}>
        <text fg="#565f89">No profiles found. Press "c" to create one.</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" paddingX={1}>
      {profiles.map((profile, index) => {
        const isSelected = index === selectedIndex;
        const isActive = profile.id === activeProfileId;
        const indicator = isActive ? '●' : '○';
        const builtInTag = profile.isBuiltIn ? ' [built-in]' : '';
        const roleTag = profile.role ? ` (${profile.role})` : '';

        return (
          <text
            key={profile.id}
            fg={isSelected ? '#7aa2f7' : isActive ? '#9ece6a' : '#a9b1d6'}
          >
            {isSelected ? '▸ ' : '  '}
            {indicator} {profile.displayName}{builtInTag}{roleTag}
            {profile.description ? ` — ${profile.description}` : ''}
          </text>
        );
      })}
    </box>
  );
}

/**
 * Profile form view — used for both create and edit.
 */
function ProfileFormView({
  title,
  fields,
  activeFieldIndex,
  editValues,
}: {
  title: string;
  fields: { label: string; key: string; value: string }[];
  activeFieldIndex: number;
  editValues: Record<string, string>;
}) {
  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#7aa2f7">
        <strong>{title}</strong>
      </text>
      <text fg="#565f89">──────────────────────────────</text>
      {fields.map((field, index) => {
        const isActive = index === activeFieldIndex;
        const currentValue = editValues[field.key] ?? field.value;

        return (
          <box key={field.key} flexDirection="row" gap={1}>
            <text fg={isActive ? '#7aa2f7' : '#565f89'}>
              {isActive ? '▸' : ' '} {field.label}:
            </text>
            <text fg={isActive ? '#c0caf5' : '#a9b1d6'}>
              {currentValue || '(empty)'}
            </text>
          </box>
        );
      })}
      <text fg="#565f89">──────────────────────────────</text>
      <text fg="#565f89">
        ↑/↓ navigate • Enter to edit field • Tab to cycle role • Ctrl+S to save • Escape to cancel
      </text>
    </box>
  );
}

/**
 * Delete confirmation view.
 */
function ConfirmDeleteView({
  profile,
  confirmed,
}: {
  profile: AgentProfile;
  confirmed: boolean;
}) {
  return (
    <box flexDirection="column" paddingX={1} paddingY={1}>
      <text fg="#f7768e">
        <strong>Delete Profile</strong>
      </text>
      <text fg="#a9b1d6">
        Are you sure you want to delete &quot;{profile.displayName}&quot;?
      </text>
      <text fg="#565f89">
        This action cannot be undone. Profile data and associated
        conversations will be permanently removed.
      </text>
      <box flexDirection="row" gap={2} paddingTop={1}>
        <text fg={confirmed ? '#f7768e' : '#565f89'}>
          {confirmed ? '▸ ' : '  '}[Delete]
        </text>
        <text fg={!confirmed ? '#9ece6a' : '#565f89'}>
          {!confirmed ? '▸ ' : '  '}[Cancel]
        </text>
      </box>
      <text fg="#565f89">
        ←/→ to select • Enter to confirm
      </text>
    </box>
  );
}

// ============================================================================
// Field editing overlay
// ============================================================================

function FieldEditOverlay({
  fieldLabel,
  fieldValue,
}: {
  fieldLabel: string;
  fieldValue: string;
}) {
  return (
    <box flexDirection="column" paddingX={1} paddingY={1}>
      <text fg="#7aa2f7">
        <strong>Editing: {fieldLabel}</strong>
      </text>
      <box border borderStyle="single" borderColor="#565f89" paddingX={1}>
        <text fg="#c0caf5">{fieldValue || '(type to enter value)'}</text>
      </box>
      <text fg="#565f89">Type to edit • Enter to confirm • Escape to cancel</text>
    </box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const FORM_FIELDS = [
  { key: 'displayName', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'role', label: 'Role' },
  { key: 'systemPrompt', label: 'System Prompt' },
  { key: 'guidelines', label: 'Guidelines' },
];

const ROLES: AgentProfileRole[] = ['user-profile', 'delegation-target', 'external-agent'];

export function AgentProfilePanel({
  profiles,
  activeProfile,
  error,
  onClose,
  onCreateProfile,
  onUpdateProfile,
  onDeleteProfile,
  onSwitchProfile,
}: AgentProfilePanelProps) {
  const [view, setView] = useState<ProfilePanelView>('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [formFieldIndex, setFormFieldIndex] = useState(0);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingFieldValue, setEditingFieldValue] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
    // Status messages auto-clear is handled by view changes
  }, []);

  /**
   * Start creating a new profile.
   */
  const startCreate = useCallback(() => {
    setView('create');
    setFormFieldIndex(0);
    setEditValues({
      displayName: '',
      description: '',
      role: 'user-profile',
      systemPrompt: '',
      guidelines: '',
    });
    setEditingField(null);
    setStatusMessage(null);
  }, []);

  /**
   * Start editing an existing profile.
   */
  const startEdit = useCallback(
    (profile: AgentProfile) => {
      setView('edit');
      setEditingProfileId(profile.id);
      setFormFieldIndex(0);
      setEditValues({
        displayName: profile.displayName || '',
        description: profile.description || '',
        role: profile.role || 'user-profile',
        systemPrompt: profile.systemPrompt || '',
        guidelines: profile.guidelines || '',
      });
      setEditingField(null);
      setStatusMessage(null);
    },
    [],
  );

  /**
   * Start delete confirmation.
   */
  const startDelete = useCallback(
    (profile: AgentProfile) => {
      if (profile.isBuiltIn) {
        showStatus('✗ Cannot delete built-in profiles');
        return;
      }
      setView('confirm-delete');
      setDeleteConfirmed(false);
      setStatusMessage(null);
    },
    [showStatus],
  );

  /**
   * Save create or edit form.
   */
  const saveForm = useCallback(() => {
    const data: ProfileFormData = {
      displayName: editValues.displayName || '',
      description: editValues.description || undefined,
      systemPrompt: editValues.systemPrompt || undefined,
      guidelines: editValues.guidelines || undefined,
      role: (editValues.role as AgentProfileRole) || 'user-profile',
    };

    if (!data.displayName.trim()) {
      showStatus('✗ Name is required');
      return;
    }

    if (view === 'create') {
      const result = onCreateProfile(data);
      if (result) {
        showStatus(`✓ Created profile: ${result.displayName}`);
        setView('list');
        // Select the newly created profile
        const newIndex = profiles.length; // will be at end
        setSelectedIndex(Math.min(newIndex, profiles.length));
      }
    } else if (view === 'edit' && editingProfileId) {
      const result = onUpdateProfile(editingProfileId, data);
      if (result) {
        showStatus(`✓ Updated profile: ${result.displayName}`);
        setView('list');
      }
    }
  }, [view, editValues, editingProfileId, onCreateProfile, onUpdateProfile, profiles.length, showStatus]);

  /**
   * Cycle through roles.
   */
  const cycleRole = useCallback(() => {
    const currentRole = editValues.role || 'user-profile';
    const currentIndex = ROLES.indexOf(currentRole as AgentProfileRole);
    const nextIndex = (currentIndex + 1) % ROLES.length;
    setEditValues((prev) => ({ ...prev, role: ROLES[nextIndex] }));
  }, [editValues.role]);

  // Keyboard handler
  useKeyboard((key) => {
    // Editing a field inline
    if (editingField !== null) {
      if (key.name === 'return') {
        // Save the field value
        setEditValues((prev) => ({
          ...prev,
          [editingField]: editingFieldValue,
        }));
        setEditingField(null);
        return;
      }
      if (key.name === 'escape') {
        setEditingField(null);
        return;
      }
      if (key.name === 'backspace') {
        setEditingFieldValue((prev) => prev.slice(0, -1));
        return;
      }
      if (key.sequence && !key.ctrl && !key.meta && key.sequence.length === 1) {
        setEditingFieldValue((prev) => prev + key.sequence);
        return;
      }
      return;
    }

    // ---- List view ----
    if (view === 'list') {
      if (key.name === 'escape') {
        onClose();
        return;
      }
      if (key.name === 'up') {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.name === 'down') {
        setSelectedIndex((prev) => Math.min(profiles.length - 1, prev + 1));
        return;
      }
      if (key.name === 'return') {
        // Switch to selected profile
        const profile = profiles[selectedIndex];
        if (profile) {
          const success = onSwitchProfile(profile.id);
          if (success) {
            showStatus(`✓ Switched to: ${profile.displayName}`);
          }
        }
        return;
      }
      if (key.sequence === 'c') {
        startCreate();
        return;
      }
      if (key.sequence === 'e') {
        const profile = profiles[selectedIndex];
        if (profile) startEdit(profile);
        return;
      }
      if (key.sequence === 'd') {
        const profile = profiles[selectedIndex];
        if (profile) startDelete(profile);
        return;
      }
      return;
    }

    // ---- Create/Edit view ----
    if (view === 'create' || view === 'edit') {
      if (key.name === 'escape') {
        setView('list');
        return;
      }
      if (key.name === 'up') {
        setFormFieldIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.name === 'down') {
        setFormFieldIndex((prev) => Math.min(FORM_FIELDS.length - 1, prev + 1));
        return;
      }
      if (key.name === 'tab') {
        // Tab cycles role when on the role field
        if (FORM_FIELDS[formFieldIndex]?.key === 'role') {
          cycleRole();
        }
        return;
      }
      if (key.name === 'return') {
        // Enter to edit the selected field
        const field = FORM_FIELDS[formFieldIndex];
        if (field && field.key !== 'role') {
          setEditingField(field.key);
          setEditingFieldValue(editValues[field.key] || '');
        }
        return;
      }
      if (key.ctrl && key.sequence === '\x13') {
        // Ctrl+S to save
        saveForm();
        return;
      }
      return;
    }

    // ---- Confirm delete view ----
    if (view === 'confirm-delete') {
      if (key.name === 'escape') {
        setView('list');
        return;
      }
      if (key.name === 'left' || key.name === 'right') {
        setDeleteConfirmed((prev) => !prev);
        return;
      }
      if (key.name === 'return') {
        if (deleteConfirmed) {
          const profile = profiles[selectedIndex];
          if (profile) {
            const success = onDeleteProfile(profile.id);
            if (success) {
              showStatus(`✓ Deleted: ${profile.displayName}`);
              setSelectedIndex(Math.max(0, selectedIndex - 1));
            }
          }
        }
        setView('list');
        return;
      }
      return;
    }
  });

  // ---- Render ----

  const formFields = FORM_FIELDS.map((f) => ({
    ...f,
    value: editValues[f.key] || '',
  }));

  return (
    <box flexDirection="column" width="100%">
      {/* Header */}
      <box
        border
        borderStyle="single"
        borderColor="#bb9af7"
        paddingX={1}
        width="100%"
      >
        <text fg="#bb9af7">
          <strong>Agent Profiles</strong>
        </text>
        <text fg="#565f89">
          {view === 'list' && ' — ↑/↓ select • Enter switch • c create • e edit • d delete • Esc close'}
          {view === 'create' && ' — Creating new profile'}
          {view === 'edit' && ' — Editing profile'}
          {view === 'confirm-delete' && ' — Confirm deletion'}
        </text>
      </box>

      {/* Error / Status message */}
      {error && (
        <box paddingX={1}>
          <text fg="#f7768e">✗ {error}</text>
        </box>
      )}
      {statusMessage && (
        <box paddingX={1}>
          <text fg="#9ece6a">{statusMessage}</text>
        </box>
      )}

      {/* Content */}
      {view === 'list' && (
        <ProfileListView
          profiles={profiles}
          activeProfileId={activeProfile?.id}
          selectedIndex={selectedIndex}
        />
      )}

      {(view === 'create' || view === 'edit') && !editingField && (
        <ProfileFormView
          title={view === 'create' ? 'Create New Profile' : 'Edit Profile'}
          fields={formFields}
          activeFieldIndex={formFieldIndex}
          editValues={editValues}
        />
      )}

      {(view === 'create' || view === 'edit') && editingField && (
        <FieldEditOverlay
          fieldLabel={FORM_FIELDS.find((f) => f.key === editingField)?.label || editingField}
          fieldValue={editingFieldValue}
        />
      )}

      {view === 'confirm-delete' && profiles[selectedIndex] && (
        <ConfirmDeleteView
          profile={profiles[selectedIndex]}
          confirmed={deleteConfirmed}
        />
      )}
    </box>
  );
}
