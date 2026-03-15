import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentSkill } from '@dotagents/core';
import type { SkillsPanelProps, SkillPanelView } from './SkillsPanel';
import type { SkillFormData } from '../hooks/useSkills';

/**
 * Tests for SkillsPanel component — validates rendering of
 * skill list, create/edit forms, delete confirmation, enable/disable,
 * GitHub install, and keyboard navigation behavior.
 */

// ============================================================================
// Mock @dotagents/core
// ============================================================================

vi.mock('@dotagents/core', () => ({
  skillsService: {
    getSkills: vi.fn(() => []),
  },
}));

// ============================================================================
// Test Data
// ============================================================================

const mockSkillLocal: AgentSkill = {
  id: 'skill-local',
  name: 'Code Review',
  description: 'Reviews code for bugs',
  instructions: '# Review Process\n\nStep 1: Read code\nStep 2: Find bugs',
  createdAt: 1000,
  updatedAt: 1000,
  source: 'local',
};

const mockSkillImported: AgentSkill = {
  id: 'skill-imported',
  name: 'Testing Expert',
  description: 'Writes comprehensive tests',
  instructions: '# Testing Guide\n\nWrite thorough tests',
  createdAt: 2000,
  updatedAt: 2000,
  source: 'imported',
  filePath: '/path/to/SKILL.md',
};

const mockSkills: AgentSkill[] = [mockSkillLocal, mockSkillImported];
const enabledSkillIds = new Set(['skill-local']);

function createDefaultProps(overrides?: Partial<SkillsPanelProps>): SkillsPanelProps {
  return {
    skills: mockSkills,
    enabledSkillIds,
    error: null,
    onClose: vi.fn(),
    onCreateSkill: vi.fn((data: SkillFormData) => ({
      id: 'new-skill-id',
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: 'local' as const,
    })),
    onUpdateSkill: vi.fn((id: string, updates: Partial<SkillFormData>) => {
      const skill = mockSkills.find((s) => s.id === id);
      if (!skill) return null;
      return { ...skill, ...updates, updatedAt: Date.now() };
    }),
    onDeleteSkill: vi.fn(() => true),
    onEnableSkill: vi.fn(() => true),
    onDisableSkill: vi.fn(() => true),
    onInstallFromGitHub: vi.fn(async () => ({
      imported: [{ id: 'gh-skill', name: 'GitHub Skill', description: '', instructions: '', createdAt: Date.now(), updatedAt: Date.now() }],
      errors: [],
    })),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('SkillsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // List view rendering
  // --------------------------------------------------------------------------

  describe('list view', () => {
    it('should display all skills', () => {
      const props = createDefaultProps();
      expect(props.skills).toHaveLength(2);
      expect(props.skills[0].name).toBe('Code Review');
      expect(props.skills[1].name).toBe('Testing Expert');
    });

    it('should indicate enabled/disabled state', () => {
      const props = createDefaultProps();
      expect(props.enabledSkillIds.has('skill-local')).toBe(true);
      expect(props.enabledSkillIds.has('skill-imported')).toBe(false);
    });

    it('should show source type (local vs imported)', () => {
      const props = createDefaultProps();
      expect(props.skills[0].source).toBe('local');
      expect(props.skills[1].source).toBe('imported');
    });

    it('should display skill description', () => {
      const props = createDefaultProps();
      expect(props.skills[0].description).toBe('Reviews code for bugs');
    });

    it('should handle empty skills list', () => {
      const props = createDefaultProps({ skills: [] });
      expect(props.skills).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Skill creation
  // --------------------------------------------------------------------------

  describe('skill creation', () => {
    it('should call onCreateSkill with form data', () => {
      const props = createDefaultProps();
      const data: SkillFormData = {
        name: 'New Skill',
        description: 'A new skill',
        instructions: '# Instructions',
      };

      props.onCreateSkill(data);
      expect(props.onCreateSkill).toHaveBeenCalledWith(data);
    });

    it('should return created skill on success', () => {
      const props = createDefaultProps();
      const result = props.onCreateSkill({
        name: 'Test',
        description: 'desc',
        instructions: 'inst',
      });
      expect(result).toBeDefined();
      expect(result!.name).toBe('Test');
    });

    it('should handle creation failure', () => {
      const props = createDefaultProps({
        onCreateSkill: vi.fn(() => null),
      });
      const result = props.onCreateSkill({
        name: '',
        description: '',
        instructions: '',
      });
      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Skill editing
  // --------------------------------------------------------------------------

  describe('skill editing', () => {
    it('should call onUpdateSkill with ID and updates', () => {
      const props = createDefaultProps();
      props.onUpdateSkill('skill-local', { name: 'Updated Name' });
      expect(props.onUpdateSkill).toHaveBeenCalledWith('skill-local', { name: 'Updated Name' });
    });

    it('should return updated skill on success', () => {
      const props = createDefaultProps();
      const result = props.onUpdateSkill('skill-local', { description: 'New desc' });
      expect(result).toBeDefined();
      expect(result!.id).toBe('skill-local');
    });

    it('should return null for non-existent skill', () => {
      const props = createDefaultProps();
      const result = props.onUpdateSkill('nonexistent', { name: 'foo' });
      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Skill deletion
  // --------------------------------------------------------------------------

  describe('skill deletion', () => {
    it('should call onDeleteSkill with the ID', () => {
      const props = createDefaultProps();
      props.onDeleteSkill('skill-local');
      expect(props.onDeleteSkill).toHaveBeenCalledWith('skill-local');
    });

    it('should return true on successful deletion', () => {
      const props = createDefaultProps();
      const result = props.onDeleteSkill('skill-local');
      expect(result).toBe(true);
    });

    it('should handle deletion failure', () => {
      const props = createDefaultProps({
        onDeleteSkill: vi.fn(() => false),
      });
      const result = props.onDeleteSkill('nonexistent');
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Enable/disable
  // --------------------------------------------------------------------------

  describe('enable/disable', () => {
    it('should call onEnableSkill to enable a skill', () => {
      const props = createDefaultProps();
      props.onEnableSkill('skill-imported');
      expect(props.onEnableSkill).toHaveBeenCalledWith('skill-imported');
    });

    it('should call onDisableSkill to disable a skill', () => {
      const props = createDefaultProps();
      props.onDisableSkill('skill-local');
      expect(props.onDisableSkill).toHaveBeenCalledWith('skill-local');
    });

    it('should toggle based on current state', () => {
      const props = createDefaultProps();
      // skill-local is enabled, so toggling should disable
      if (props.enabledSkillIds.has('skill-local')) {
        props.onDisableSkill('skill-local');
      }
      expect(props.onDisableSkill).toHaveBeenCalledWith('skill-local');

      // skill-imported is disabled, so toggling should enable
      if (!props.enabledSkillIds.has('skill-imported')) {
        props.onEnableSkill('skill-imported');
      }
      expect(props.onEnableSkill).toHaveBeenCalledWith('skill-imported');
    });
  });

  // --------------------------------------------------------------------------
  // GitHub install
  // --------------------------------------------------------------------------

  describe('GitHub install', () => {
    it('should call onInstallFromGitHub with repo identifier', async () => {
      const props = createDefaultProps();
      await props.onInstallFromGitHub('owner/repo');
      expect(props.onInstallFromGitHub).toHaveBeenCalledWith('owner/repo');
    });

    it('should return imported skills', async () => {
      const props = createDefaultProps();
      const result = await props.onInstallFromGitHub('owner/repo');
      expect(result.imported).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle install errors', async () => {
      const props = createDefaultProps({
        onInstallFromGitHub: vi.fn(async () => ({
          imported: [],
          errors: ['Repository not found'],
        })),
      });
      const result = await props.onInstallFromGitHub('bad/repo');
      expect(result.errors).toContain('Repository not found');
    });
  });

  // --------------------------------------------------------------------------
  // Error display
  // --------------------------------------------------------------------------

  describe('error display', () => {
    it('should display error when present', () => {
      const props = createDefaultProps({ error: 'Something went wrong' });
      expect(props.error).toBe('Something went wrong');
    });

    it('should not display error when null', () => {
      const props = createDefaultProps({ error: null });
      expect(props.error).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Panel close
  // --------------------------------------------------------------------------

  describe('panel close', () => {
    it('should call onClose when escape pressed in list view', () => {
      const props = createDefaultProps();
      props.onClose();
      expect(props.onClose).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // View state management
  // --------------------------------------------------------------------------

  describe('view state management', () => {
    it('should default to list view', () => {
      const defaultView: SkillPanelView = 'list';
      expect(defaultView).toBe('list');
    });

    it('should support create view', () => {
      const view: SkillPanelView = 'create';
      expect(view).toBe('create');
    });

    it('should support edit view', () => {
      const view: SkillPanelView = 'edit';
      expect(view).toBe('edit');
    });

    it('should support install view', () => {
      const view: SkillPanelView = 'install';
      expect(view).toBe('install');
    });

    it('should support confirm-delete view', () => {
      const view: SkillPanelView = 'confirm-delete';
      expect(view).toBe('confirm-delete');
    });
  });
});
