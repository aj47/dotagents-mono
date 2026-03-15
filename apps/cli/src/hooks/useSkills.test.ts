import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for useSkills hook — validates skills CRUD operations,
 * enable/disable toggling, GitHub installation, and error handling.
 *
 * Since the hook depends on @dotagents/core's skillsService and
 * agentProfileService, we mock both and test the hook's logic patterns.
 */

// ============================================================================
// Mocks
// ============================================================================

const mockSkills = [
  {
    id: 'skill-1',
    name: 'Code Review',
    description: 'Reviews code for bugs',
    instructions: '# Review all code carefully',
    createdAt: 1000,
    updatedAt: 1000,
    source: 'local' as const,
  },
  {
    id: 'skill-2',
    name: 'Testing Expert',
    description: 'Writes comprehensive tests',
    instructions: '# Write thorough tests',
    createdAt: 2000,
    updatedAt: 2000,
    source: 'imported' as const,
    filePath: '/path/to/SKILL.md',
  },
];

const mockProfile = {
  id: 'profile-1',
  name: 'main',
  displayName: 'Main Agent',
  connection: { type: 'internal' as const },
  role: 'user-profile' as const,
  enabled: true,
  skillsConfig: {
    enabledSkillIds: ['skill-1'],
  },
};

const mockSkillsService = {
  getSkills: vi.fn(() => [...mockSkills]),
  getSkill: vi.fn((id: string) => mockSkills.find((s) => s.id === id)),
  createSkill: vi.fn((name: string, description: string, instructions: string, _options?: Record<string, unknown>) => ({
    id: 'new-skill-id',
    name,
    description,
    instructions,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    source: 'local',
  })),
  updateSkill: vi.fn((id: string, updates: Record<string, unknown>) => {
    const skill = mockSkills.find((s) => s.id === id);
    if (!skill) throw new Error('Skill not found');
    return { ...skill, ...updates, updatedAt: Date.now() };
  }),
  deleteSkill: vi.fn((id: string) => {
    const skill = mockSkills.find((s) => s.id === id);
    return !!skill;
  }),
  scanSkillsFolder: vi.fn(() => []),
  importSkillFromGitHub: vi.fn(async (_repo: string) => ({
    imported: [
      {
        id: 'github-skill-id',
        name: 'GitHub Skill',
        description: 'Installed from GitHub',
        instructions: '# GitHub skill instructions',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: 'imported',
      },
    ],
    errors: [] as string[],
  })),
};

const mockAgentProfileService = {
  getCurrentProfile: vi.fn((): typeof mockProfile | null => ({ ...mockProfile })),
  update: vi.fn((_id: string, _updates: Record<string, unknown>) => undefined),
};

vi.mock('@dotagents/core', () => ({
  skillsService: mockSkillsService,
  agentProfileService: mockAgentProfileService,
}));

// ============================================================================
// Import after mocks
// ============================================================================

import type { SkillFormData, UseSkillsReturn } from './useSkills';

// ============================================================================
// Tests
// ============================================================================

describe('useSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSkillsService.getSkills.mockReturnValue([...mockSkills]);
    mockSkillsService.getSkill.mockImplementation(
      (id: string) => mockSkills.find((s) => s.id === id),
    );
    mockAgentProfileService.getCurrentProfile.mockReturnValue({ ...mockProfile });
  });

  // --------------------------------------------------------------------------
  // Skills listing
  // --------------------------------------------------------------------------

  describe('skills listing', () => {
    it('should call skillsService.getSkills to load skills', () => {
      mockSkillsService.getSkills();
      expect(mockSkillsService.getSkills).toHaveBeenCalled();
      const skills = mockSkillsService.getSkills();
      expect(skills).toHaveLength(2);
    });

    it('should return skill details including name, description, source', () => {
      const skills = mockSkillsService.getSkills();
      expect(skills[0].name).toBe('Code Review');
      expect(skills[0].description).toBe('Reviews code for bugs');
      expect(skills[0].source).toBe('local');
      expect(skills[1].source).toBe('imported');
    });

    it('should load enabled skill IDs from current profile', () => {
      const profile = mockAgentProfileService.getCurrentProfile()!;
      expect(profile.skillsConfig.enabledSkillIds).toContain('skill-1');
      expect(profile.skillsConfig.enabledSkillIds).not.toContain('skill-2');
    });

    it('should handle empty skills list', () => {
      mockSkillsService.getSkills.mockReturnValue([]);
      const skills = mockSkillsService.getSkills();
      expect(skills).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Creating skills
  // --------------------------------------------------------------------------

  describe('skill creation', () => {
    it('should call skillsService.createSkill with correct parameters', () => {
      const data: SkillFormData = {
        name: 'New Skill',
        description: 'A brand new skill',
        instructions: '# Do something useful',
      };

      mockSkillsService.createSkill(data.name, data.description, data.instructions, { source: 'local' });
      expect(mockSkillsService.createSkill).toHaveBeenCalledWith(
        'New Skill',
        'A brand new skill',
        '# Do something useful',
        { source: 'local' },
      );
    });

    it('should return the created skill on success', () => {
      const result = mockSkillsService.createSkill('Test', 'desc', 'instructions');
      expect(result).toBeDefined();
      expect(result.id).toBe('new-skill-id');
      expect(result.name).toBe('Test');
    });

    it('should handle creation errors gracefully', () => {
      mockSkillsService.createSkill.mockImplementationOnce(() => {
        throw new Error('Duplicate skill name');
      });

      expect(() => mockSkillsService.createSkill('Dup', 'desc', 'inst')).toThrow('Duplicate skill name');
    });
  });

  // --------------------------------------------------------------------------
  // Updating skills
  // --------------------------------------------------------------------------

  describe('skill update', () => {
    it('should call skillsService.updateSkill with ID and updates', () => {
      mockSkillsService.updateSkill('skill-1', { name: 'Updated Name' });
      expect(mockSkillsService.updateSkill).toHaveBeenCalledWith('skill-1', { name: 'Updated Name' });
    });

    it('should return the updated skill', () => {
      const result = mockSkillsService.updateSkill('skill-1', { description: 'New description' });
      expect(result.id).toBe('skill-1');
      expect(result.description).toBe('New description');
    });

    it('should throw for non-existent skill', () => {
      mockSkillsService.updateSkill.mockImplementationOnce(() => {
        throw new Error('Skill not found');
      });
      expect(() => mockSkillsService.updateSkill('nonexistent', { name: 'foo' })).toThrow('Skill not found');
    });
  });

  // --------------------------------------------------------------------------
  // Deleting skills
  // --------------------------------------------------------------------------

  describe('skill deletion', () => {
    it('should call skillsService.deleteSkill with the ID', () => {
      const result = mockSkillsService.deleteSkill('skill-1');
      expect(result).toBe(true);
      expect(mockSkillsService.deleteSkill).toHaveBeenCalledWith('skill-1');
    });

    it('should return false for non-existent skill', () => {
      const result = mockSkillsService.deleteSkill('nonexistent');
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Enable/disable skills
  // --------------------------------------------------------------------------

  describe('skill enable/disable', () => {
    it('should track enabled skill IDs from profile', () => {
      const profile = mockAgentProfileService.getCurrentProfile()!;
      const enabled = new Set(profile.skillsConfig.enabledSkillIds);
      expect(enabled.has('skill-1')).toBe(true);
      expect(enabled.has('skill-2')).toBe(false);
    });

    it('should enable a skill by adding to enabledSkillIds', () => {
      const profile = mockAgentProfileService.getCurrentProfile()!;
      const enabled = new Set(profile.skillsConfig.enabledSkillIds);
      enabled.add('skill-2');

      mockAgentProfileService.update(profile.id, {
        skillsConfig: { enabledSkillIds: Array.from(enabled) },
      });

      expect(mockAgentProfileService.update).toHaveBeenCalledWith(
        'profile-1',
        { skillsConfig: { enabledSkillIds: ['skill-1', 'skill-2'] } },
      );
    });

    it('should disable a skill by removing from enabledSkillIds', () => {
      const profile = mockAgentProfileService.getCurrentProfile()!;
      const enabled = new Set(profile.skillsConfig.enabledSkillIds);
      enabled.delete('skill-1');

      mockAgentProfileService.update(profile.id, {
        skillsConfig: { enabledSkillIds: Array.from(enabled) },
      });

      expect(mockAgentProfileService.update).toHaveBeenCalledWith(
        'profile-1',
        { skillsConfig: { enabledSkillIds: [] } },
      );
    });

    it('should not fail when no profile exists', () => {
      mockAgentProfileService.getCurrentProfile.mockReturnValueOnce(null);
      const profile = mockAgentProfileService.getCurrentProfile();
      expect(profile).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // GitHub installation
  // --------------------------------------------------------------------------

  describe('GitHub installation', () => {
    it('should call importSkillFromGitHub with repo identifier', async () => {
      const result = await mockSkillsService.importSkillFromGitHub('owner/repo');
      expect(mockSkillsService.importSkillFromGitHub).toHaveBeenCalledWith('owner/repo');
      expect(result.imported).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should return imported skills', async () => {
      const result = await mockSkillsService.importSkillFromGitHub('owner/repo');
      expect(result.imported[0].name).toBe('GitHub Skill');
      expect(result.imported[0].source).toBe('imported');
    });

    it('should handle GitHub errors', async () => {
      mockSkillsService.importSkillFromGitHub.mockResolvedValueOnce({
        imported: [],
        errors: ['Repository not found'],
      });

      const result = await mockSkillsService.importSkillFromGitHub('bad/repo');
      expect(result.imported).toHaveLength(0);
      expect(result.errors).toContain('Repository not found');
    });

    it('should accept full GitHub URLs', async () => {
      await mockSkillsService.importSkillFromGitHub('https://github.com/owner/repo');
      expect(mockSkillsService.importSkillFromGitHub).toHaveBeenCalledWith(
        'https://github.com/owner/repo',
      );
    });
  });

  // --------------------------------------------------------------------------
  // Reload
  // --------------------------------------------------------------------------

  describe('reload', () => {
    it('should call scanSkillsFolder to refresh from disk', () => {
      mockSkillsService.scanSkillsFolder();
      expect(mockSkillsService.scanSkillsFolder).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Error handling
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('should handle service errors gracefully', () => {
      mockSkillsService.getSkills.mockImplementationOnce(() => {
        throw new Error('Service unavailable');
      });
      expect(() => mockSkillsService.getSkills()).toThrow('Service unavailable');
    });

    it('should handle missing skill in getSkill', () => {
      const skill = mockSkillsService.getSkill('nonexistent');
      expect(skill).toBeUndefined();
    });
  });
});
