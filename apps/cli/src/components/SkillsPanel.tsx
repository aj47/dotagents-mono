/**
 * SkillsPanel — TUI panel for managing agent skills.
 *
 * Provides full CRUD operations:
 * - List skills (global + workspace layers merged) with enabled/disabled status
 * - Create new skill with name, description, instructions
 * - Edit existing skill fields
 * - Delete skill
 * - Enable/disable skill for current profile
 * - Install skill from GitHub repository
 *
 * Uses keyboard navigation (arrows, Enter, Escape, Tab).
 * Persists all changes via @dotagents/core skillsService
 * to ~/.agents/skills/ directory.
 */

import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import type { AgentSkill } from '@dotagents/core';
import type { SkillFormData } from '../hooks/useSkills';

// ============================================================================
// Types
// ============================================================================

export type SkillPanelView = 'list' | 'create' | 'edit' | 'install' | 'confirm-delete';

export interface SkillsPanelProps {
  skills: AgentSkill[];
  enabledSkillIds: Set<string>;
  error: string | null;
  onClose: () => void;
  onCreateSkill: (data: SkillFormData) => AgentSkill | null;
  onUpdateSkill: (id: string, updates: Partial<SkillFormData>) => AgentSkill | null;
  onDeleteSkill: (id: string) => boolean;
  onEnableSkill: (id: string) => boolean;
  onDisableSkill: (id: string) => boolean;
  onInstallFromGitHub: (repo: string) => Promise<{ imported: AgentSkill[]; errors: string[] }>;
}

// ============================================================================
// Sub-views
// ============================================================================

/**
 * Skills list view — shows all skills with enabled/disabled indicator.
 */
function SkillListView({
  skills,
  enabledSkillIds,
  selectedIndex,
}: {
  skills: AgentSkill[];
  enabledSkillIds: Set<string>;
  selectedIndex: number;
}) {
  if (skills.length === 0) {
    return (
      <box paddingX={1} paddingY={1}>
        <text fg="#565f89">No skills found. Press "c" to create or "g" to install from GitHub.</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" paddingX={1}>
      {skills.map((skill, index) => {
        const isSelected = index === selectedIndex;
        const isEnabled = enabledSkillIds.has(skill.id);
        const indicator = isEnabled ? '●' : '○';
        const sourceTag = skill.source === 'imported' ? ' [imported]' : '';

        return (
          <text
            key={skill.id}
            fg={isSelected ? '#7aa2f7' : isEnabled ? '#9ece6a' : '#565f89'}
          >
            {isSelected ? '▸ ' : '  '}
            {indicator} {skill.name}{sourceTag}
            {skill.description ? ` — ${skill.description}` : ''}
          </text>
        );
      })}
    </box>
  );
}

/**
 * Skill create/edit form view.
 */
function SkillFormView({
  formData,
  activeField,
  isEdit,
}: {
  formData: SkillFormData;
  activeField: number;
  isEdit: boolean;
}) {
  const fields = [
    { label: 'Name', value: formData.name },
    { label: 'Description', value: formData.description },
    { label: 'Instructions', value: formData.instructions.slice(0, 100) + (formData.instructions.length > 100 ? '...' : '') },
  ];

  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#7aa2f7">
        <strong>{isEdit ? 'Edit Skill' : 'Create Skill'}</strong>
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
 * GitHub install view.
 */
function GitHubInstallView({
  repoInput,
  installStatus,
}: {
  repoInput: string;
  installStatus: string | null;
}) {
  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#7aa2f7">
        <strong>Install Skill from GitHub</strong>
      </text>
      <text fg="#565f89">Enter repo identifier (owner/repo or full URL) • Escape to cancel</text>
      <box marginTop={1}>
        <text fg="#a9b1d6">Repository: {repoInput || '(type repo identifier)'}</text>
      </box>
      {installStatus && (
        <box marginTop={1}>
          <text fg={installStatus.startsWith('✓') ? '#9ece6a' : installStatus.startsWith('⚠') ? '#e0af68' : '#565f89'}>
            {installStatus}
          </text>
        </box>
      )}
    </box>
  );
}

/**
 * Delete confirmation view.
 */
function ConfirmDeleteView({ skillName }: { skillName: string }) {
  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#f7768e">
        <strong>Delete Skill</strong>
      </text>
      <text fg="#a9b1d6">
        Are you sure you want to delete "{skillName}"?
      </text>
      <text fg="#565f89">Press "y" to confirm or "n"/Escape to cancel</text>
    </box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SkillsPanel({
  skills,
  enabledSkillIds,
  error,
  onClose,
  onCreateSkill,
  onUpdateSkill,
  onDeleteSkill,
  onEnableSkill,
  onDisableSkill,
  onInstallFromGitHub,
}: SkillsPanelProps) {
  const [view, setView] = useState<SkillPanelView>('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [formData, setFormData] = useState<SkillFormData>({ name: '', description: '', instructions: '' });
  const [activeField, setActiveField] = useState(0);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [repoInput, setRepoInput] = useState('');
  const [installStatus, setInstallStatus] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedSkill = skills[selectedIndex];

  const handleCreate = useCallback(() => {
    const result = onCreateSkill(formData);
    if (result) {
      setStatusMessage(`✓ Created skill "${result.name}"`);
      setView('list');
      setFormData({ name: '', description: '', instructions: '' });
    }
  }, [formData, onCreateSkill]);

  const handleUpdate = useCallback(() => {
    if (!editingSkillId) return;
    const result = onUpdateSkill(editingSkillId, formData);
    if (result) {
      setStatusMessage(`✓ Updated skill "${result.name}"`);
      setView('list');
      setEditingSkillId(null);
      setFormData({ name: '', description: '', instructions: '' });
    }
  }, [editingSkillId, formData, onUpdateSkill]);

  const handleDelete = useCallback(() => {
    if (!selectedSkill) return;
    const success = onDeleteSkill(selectedSkill.id);
    if (success) {
      setStatusMessage(`✓ Deleted skill "${selectedSkill.name}"`);
      setView('list');
      if (selectedIndex >= skills.length - 1) {
        setSelectedIndex(Math.max(0, skills.length - 2));
      }
    }
  }, [selectedSkill, onDeleteSkill, selectedIndex, skills.length]);

  const handleInstall = useCallback(async () => {
    if (!repoInput.trim()) return;
    setInstallStatus('⠋ Installing...');
    const result = await onInstallFromGitHub(repoInput.trim());
    if (result.imported.length > 0) {
      setInstallStatus(`✓ Installed ${result.imported.length} skill(s)`);
      setTimeout(() => {
        setView('list');
        setRepoInput('');
        setInstallStatus(null);
      }, 1500);
    } else if (result.errors.length > 0) {
      setInstallStatus(`⚠ ${result.errors[0]}`);
    }
  }, [repoInput, onInstallFromGitHub]);

  const handleToggleEnable = useCallback(() => {
    if (!selectedSkill) return;
    const isEnabled = enabledSkillIds.has(selectedSkill.id);
    if (isEnabled) {
      onDisableSkill(selectedSkill.id);
      setStatusMessage(`○ Disabled "${selectedSkill.name}"`);
    } else {
      onEnableSkill(selectedSkill.id);
      setStatusMessage(`● Enabled "${selectedSkill.name}"`);
    }
  }, [selectedSkill, enabledSkillIds, onEnableSkill, onDisableSkill]);

  useKeyboard((key) => {
    // Global: Escape to go back
    if (key.name === 'escape') {
      if (view === 'list') {
        onClose();
      } else {
        setView('list');
        setEditingSkillId(null);
        setRepoInput('');
        setInstallStatus(null);
      }
      return;
    }

    if (view === 'list') {
      // Navigation
      if (key.name === 'up' && skills.length > 0) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        setStatusMessage(null);
      } else if (key.name === 'down' && skills.length > 0) {
        setSelectedIndex((prev) => Math.min(skills.length - 1, prev + 1));
        setStatusMessage(null);
      }
      // Actions
      else if (key.name === 'c') {
        setFormData({ name: '', description: '', instructions: '' });
        setActiveField(0);
        setView('create');
        setStatusMessage(null);
      } else if (key.name === 'e' && selectedSkill) {
        setFormData({
          name: selectedSkill.name,
          description: selectedSkill.description,
          instructions: selectedSkill.instructions,
        });
        setEditingSkillId(selectedSkill.id);
        setActiveField(0);
        setView('edit');
        setStatusMessage(null);
      } else if (key.name === 'd' && selectedSkill) {
        setView('confirm-delete');
        setStatusMessage(null);
      } else if (key.name === 'g') {
        setRepoInput('');
        setInstallStatus(null);
        setView('install');
        setStatusMessage(null);
      } else if (key.name === 'return' && selectedSkill) {
        handleToggleEnable();
      }
    } else if (view === 'create' || view === 'edit') {
      if (key.name === 'tab') {
        setActiveField((prev) => (prev + 1) % 3);
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
    } else if (view === 'install') {
      if (key.name === 'return') {
        void handleInstall();
      }
    }
  });

  return (
    <box flexDirection="column" width="100%" flexGrow={1}>
      {/* Header */}
      <box paddingX={1}>
        <text fg="#7aa2f7">
          <strong>Skills Management</strong>
        </text>
        <text fg="#565f89"> ({skills.length} skills)</text>
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
        <SkillListView
          skills={skills}
          enabledSkillIds={enabledSkillIds}
          selectedIndex={selectedIndex}
        />
      )}

      {(view === 'create' || view === 'edit') && (
        <SkillFormView
          formData={formData}
          activeField={activeField}
          isEdit={view === 'edit'}
        />
      )}

      {view === 'install' && (
        <GitHubInstallView
          repoInput={repoInput}
          installStatus={installStatus}
        />
      )}

      {view === 'confirm-delete' && selectedSkill && (
        <ConfirmDeleteView skillName={selectedSkill.name} />
      )}

      {/* Footer help text */}
      <box paddingX={1} marginTop={1}>
        <text fg="#565f89">
          {view === 'list'
            ? '↑/↓ navigate • Enter toggle • c create • e edit • d delete • g GitHub install • Esc close'
            : view === 'confirm-delete'
              ? 'y confirm • n/Esc cancel'
              : view === 'install'
                ? 'Enter install • Esc cancel'
                : 'Tab switch fields • Enter save • Esc cancel'}
        </text>
      </box>
    </box>
  );
}
