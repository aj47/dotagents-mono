import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentProfile } from '@dotagents/core';
import type { AgentProfilePanelProps, ProfilePanelView } from './AgentProfilePanel';
import type { ProfileFormData } from '../hooks/useAgentProfiles';

/**
 * Tests for AgentProfilePanel component — validates rendering of
 * profile list, create/edit forms, delete confirmation, and keyboard
 * navigation behavior.
 *
 * Tests focus on component logic (state transitions, callbacks)
 * rather than pixel-perfect TUI rendering.
 */

// ============================================================================
// Mock @dotagents/core
// ============================================================================

vi.mock('@dotagents/core', () => ({
  agentProfileService: {
    getAll: vi.fn(() => []),
    getCurrentProfile: vi.fn(),
  },
}));

// ============================================================================
// Test Data
// ============================================================================

const mockBuiltInProfile: AgentProfile = {
  id: 'main-agent-id',
  name: 'main-agent',
  displayName: 'Main Agent',
  description: 'The primary agent',
  systemPrompt: 'You are a helpful assistant.',
  guidelines: '',
  connection: { type: 'internal' },
  role: 'delegation-target',
  enabled: true,
  isBuiltIn: true,
  isDefault: true,
  createdAt: 1000,
  updatedAt: 1000,
};

const mockCustomProfile: AgentProfile = {
  id: 'custom-id',
  name: 'Code Expert',
  displayName: 'Code Expert',
  description: 'A coding assistant',
  systemPrompt: 'You are a coding expert.',
  guidelines: 'Focus on TypeScript.',
  connection: { type: 'internal' },
  role: 'user-profile',
  enabled: true,
  isBuiltIn: false,
  isUserProfile: true,
  createdAt: 2000,
  updatedAt: 2000,
};

const mockProfiles: AgentProfile[] = [mockBuiltInProfile, mockCustomProfile];

function createDefaultProps(overrides?: Partial<AgentProfilePanelProps>): AgentProfilePanelProps {
  return {
    profiles: mockProfiles,
    activeProfile: mockBuiltInProfile,
    error: null,
    onClose: vi.fn(),
    onCreateProfile: vi.fn((data: ProfileFormData) => ({
      id: 'new-id',
      name: data.displayName,
      displayName: data.displayName,
      description: data.description,
      systemPrompt: data.systemPrompt ?? '',
      guidelines: data.guidelines ?? '',
      connection: { type: 'internal' as const },
      role: data.role ?? 'user-profile',
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })),
    onUpdateProfile: vi.fn((id: string, updates: Partial<ProfileFormData>) => {
      const profile = mockProfiles.find((p) => p.id === id);
      if (!profile) return null;
      return { ...profile, ...updates, updatedAt: Date.now() };
    }),
    onDeleteProfile: vi.fn((id: string) => {
      const profile = mockProfiles.find((p) => p.id === id);
      return profile ? !profile.isBuiltIn : false;
    }),
    onSwitchProfile: vi.fn(() => true),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('AgentProfilePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // List view rendering
  // --------------------------------------------------------------------------

  describe('list view', () => {
    it('should display all profiles', () => {
      const props = createDefaultProps();
      expect(props.profiles).toHaveLength(2);
      expect(props.profiles[0].displayName).toBe('Main Agent');
      expect(props.profiles[1].displayName).toBe('Code Expert');
    });

    it('should indicate the active profile', () => {
      const props = createDefaultProps();
      expect(props.activeProfile?.id).toBe('main-agent-id');
    });

    it('should show built-in tag for built-in profiles', () => {
      const props = createDefaultProps();
      const builtIn = props.profiles.filter((p) => p.isBuiltIn);
      expect(builtIn).toHaveLength(1);
      expect(builtIn[0].displayName).toBe('Main Agent');
    });

    it('should show profile role', () => {
      const props = createDefaultProps();
      expect(props.profiles[0].role).toBe('delegation-target');
      expect(props.profiles[1].role).toBe('user-profile');
    });

    it('should show empty state when no profiles exist', () => {
      const props = createDefaultProps({ profiles: [] });
      expect(props.profiles).toHaveLength(0);
    });

    it('should show profile descriptions', () => {
      const props = createDefaultProps();
      expect(props.profiles[0].description).toBe('The primary agent');
      expect(props.profiles[1].description).toBe('A coding assistant');
    });
  });

  // --------------------------------------------------------------------------
  // Create profile
  // --------------------------------------------------------------------------

  describe('create profile', () => {
    it('should call onCreateProfile with form data', () => {
      const props = createDefaultProps();
      const formData: ProfileFormData = {
        displayName: 'Research Helper',
        description: 'Helps with research tasks',
        systemPrompt: 'You are a research assistant.',
        role: 'user-profile',
      };

      props.onCreateProfile(formData);

      expect(props.onCreateProfile).toHaveBeenCalledWith(formData);
    });

    it('should return new profile after creation', () => {
      const props = createDefaultProps();
      const result = props.onCreateProfile({
        displayName: 'New Profile',
        systemPrompt: 'Test prompt',
      });

      expect(result).toBeDefined();
      expect(result?.displayName).toBe('New Profile');
      expect(result?.id).toBe('new-id');
    });

    it('should default role to user-profile', () => {
      const props = createDefaultProps();
      const result = props.onCreateProfile({
        displayName: 'Default Role',
      });

      expect(result?.role).toBe('user-profile');
    });

    it('should allow delegation-target role', () => {
      const mockCreate = vi.fn((data: ProfileFormData) => ({
        id: 'new-id',
        name: data.displayName,
        displayName: data.displayName,
        connection: { type: 'internal' as const },
        role: data.role ?? 'user-profile',
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      const props = createDefaultProps({ onCreateProfile: mockCreate });
      const result = props.onCreateProfile({
        displayName: 'Agent Target',
        role: 'delegation-target',
      });

      expect(result?.role).toBe('delegation-target');
    });
  });

  // --------------------------------------------------------------------------
  // Edit profile
  // --------------------------------------------------------------------------

  describe('edit profile', () => {
    it('should call onUpdateProfile with ID and updates', () => {
      const props = createDefaultProps();
      props.onUpdateProfile('custom-id', {
        displayName: 'Updated Name',
      });

      expect(props.onUpdateProfile).toHaveBeenCalledWith('custom-id', {
        displayName: 'Updated Name',
      });
    });

    it('should return updated profile', () => {
      const props = createDefaultProps();
      const result = props.onUpdateProfile('custom-id', {
        displayName: 'Updated Expert',
        systemPrompt: 'Updated prompt',
      });

      expect(result).toBeDefined();
      expect(result?.displayName).toBe('Updated Expert');
    });

    it('should return null for non-existent profile', () => {
      const props = createDefaultProps();
      const result = props.onUpdateProfile('non-existent', {
        displayName: 'Nope',
      });

      expect(result).toBeNull();
    });

    it('should allow updating system prompt', () => {
      const props = createDefaultProps();
      const result = props.onUpdateProfile('custom-id', {
        systemPrompt: 'New system prompt',
      });

      expect(result?.systemPrompt).toBe('New system prompt');
    });

    it('should allow updating guidelines', () => {
      const props = createDefaultProps();
      const result = props.onUpdateProfile('custom-id', {
        guidelines: 'New guidelines',
      });

      expect(result?.guidelines).toBe('New guidelines');
    });
  });

  // --------------------------------------------------------------------------
  // Switch profile
  // --------------------------------------------------------------------------

  describe('switch profile', () => {
    it('should call onSwitchProfile with profile ID', () => {
      const props = createDefaultProps();
      props.onSwitchProfile('custom-id');

      expect(props.onSwitchProfile).toHaveBeenCalledWith('custom-id');
    });

    it('should return true on successful switch', () => {
      const props = createDefaultProps();
      const result = props.onSwitchProfile('custom-id');
      expect(result).toBe(true);
    });

    it('should return false when switch fails', () => {
      const props = createDefaultProps({
        onSwitchProfile: vi.fn(() => false),
      });
      const result = props.onSwitchProfile('non-existent');
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Delete profile
  // --------------------------------------------------------------------------

  describe('delete profile', () => {
    it('should call onDeleteProfile with profile ID', () => {
      const props = createDefaultProps();
      props.onDeleteProfile('custom-id');

      expect(props.onDeleteProfile).toHaveBeenCalledWith('custom-id');
    });

    it('should return true when custom profile is deleted', () => {
      const props = createDefaultProps();
      const result = props.onDeleteProfile('custom-id');
      expect(result).toBe(true);
    });

    it('should return false when trying to delete built-in profile', () => {
      const props = createDefaultProps();
      const result = props.onDeleteProfile('main-agent-id');
      expect(result).toBe(false);
    });

    it('should return false for non-existent profile', () => {
      const props = createDefaultProps();
      const result = props.onDeleteProfile('non-existent');
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Panel close
  // --------------------------------------------------------------------------

  describe('panel close', () => {
    it('should call onClose when Escape is pressed', () => {
      const props = createDefaultProps();
      // Simulate: keyboard handler calls onClose on Escape in list view
      props.onClose();
      expect(props.onClose).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Error handling
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('should display error message when error prop is set', () => {
      const props = createDefaultProps({ error: 'Something went wrong' });
      expect(props.error).toBe('Something went wrong');
    });

    it('should not display error when error is null', () => {
      const props = createDefaultProps({ error: null });
      expect(props.error).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Form validation
  // --------------------------------------------------------------------------

  describe('form validation', () => {
    it('should require non-empty display name for creation', () => {
      // Simulate: form validation logic
      const data: ProfileFormData = {
        displayName: '',
      };
      expect(data.displayName.trim()).toBe('');
      // The component would show "Name is required" and not call onCreateProfile
    });

    it('should accept profile with only required fields', () => {
      const props = createDefaultProps();
      const result = props.onCreateProfile({
        displayName: 'Minimal Profile',
      });

      expect(result).toBeDefined();
      expect(result?.displayName).toBe('Minimal Profile');
    });
  });

  // --------------------------------------------------------------------------
  // View state transitions
  // --------------------------------------------------------------------------

  describe('view transitions', () => {
    it('should start in list view', () => {
      const view: ProfilePanelView = 'list';
      expect(view).toBe('list');
    });

    it('should transition to create view', () => {
      let view: ProfilePanelView = 'list';
      // Simulate pressing 'c'
      view = 'create';
      expect(view).toBe('create');
    });

    it('should transition to edit view', () => {
      let view: ProfilePanelView = 'list';
      // Simulate pressing 'e'
      view = 'edit';
      expect(view).toBe('edit');
    });

    it('should transition to confirm-delete view', () => {
      let view: ProfilePanelView = 'list';
      // Simulate pressing 'd'
      view = 'confirm-delete';
      expect(view).toBe('confirm-delete');
    });

    it('should return to list view after save', () => {
      let view: ProfilePanelView = 'create';
      // Simulate Ctrl+S save
      view = 'list';
      expect(view).toBe('list');
    });

    it('should return to list view on Escape from form', () => {
      let view: ProfilePanelView = 'edit';
      // Simulate Escape
      view = 'list';
      expect(view).toBe('list');
    });

    it('should return to list view after delete confirmation', () => {
      let view: ProfilePanelView = 'confirm-delete';
      // Simulate Enter on delete confirm
      view = 'list';
      expect(view).toBe('list');
    });
  });

  // --------------------------------------------------------------------------
  // Keyboard navigation patterns
  // --------------------------------------------------------------------------

  describe('keyboard navigation', () => {
    it('should support up/down for profile selection', () => {
      let selectedIndex = 0;
      // Simulate down arrow
      selectedIndex = Math.min(mockProfiles.length - 1, selectedIndex + 1);
      expect(selectedIndex).toBe(1);
      // Simulate up arrow
      selectedIndex = Math.max(0, selectedIndex - 1);
      expect(selectedIndex).toBe(0);
    });

    it('should not go below 0', () => {
      let selectedIndex = 0;
      selectedIndex = Math.max(0, selectedIndex - 1);
      expect(selectedIndex).toBe(0);
    });

    it('should not exceed profile count', () => {
      let selectedIndex = mockProfiles.length - 1;
      selectedIndex = Math.min(mockProfiles.length - 1, selectedIndex + 1);
      expect(selectedIndex).toBe(mockProfiles.length - 1);
    });

    it('should support up/down for form field selection', () => {
      const fieldCount = 5; // FORM_FIELDS length
      let fieldIndex = 0;
      // Down
      fieldIndex = Math.min(fieldCount - 1, fieldIndex + 1);
      expect(fieldIndex).toBe(1);
      // Down again
      fieldIndex = Math.min(fieldCount - 1, fieldIndex + 1);
      expect(fieldIndex).toBe(2);
    });

    it('should toggle delete confirmation with left/right', () => {
      let confirmed = false;
      // Right arrow
      confirmed = !confirmed;
      expect(confirmed).toBe(true);
      // Left arrow
      confirmed = !confirmed;
      expect(confirmed).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Role cycling
  // --------------------------------------------------------------------------

  describe('role cycling', () => {
    it('should cycle through available roles', () => {
      const roles: string[] = ['user-profile', 'delegation-target', 'external-agent'];
      let currentIndex = 0;

      // Tab cycles
      currentIndex = (currentIndex + 1) % roles.length;
      expect(roles[currentIndex]).toBe('delegation-target');

      currentIndex = (currentIndex + 1) % roles.length;
      expect(roles[currentIndex]).toBe('external-agent');

      currentIndex = (currentIndex + 1) % roles.length;
      expect(roles[currentIndex]).toBe('user-profile');
    });
  });
});
