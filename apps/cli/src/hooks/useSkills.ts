/**
 * useSkills — React hook for managing agent skills in the CLI.
 *
 * Provides CRUD operations for skills via @dotagents/core's skillsService.
 * Supports enable/disable (via profile skills config), GitHub import,
 * and global + workspace layer merging.
 *
 * Operations:
 * - List all skills (merged global + workspace layers)
 * - Create new skill with name, description, instructions
 * - Edit existing skill fields
 * - Delete skill
 * - Enable/disable skill (excluded from agent context when disabled)
 * - Install skill from GitHub repository
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  skillsService,
  agentProfileService,
} from '@dotagents/core';
import type { AgentSkill, AgentProfile, ProfileSkillsConfig } from '@dotagents/core';

// ============================================================================
// Types
// ============================================================================

export interface SkillFormData {
  name: string;
  description: string;
  instructions: string;
}

export interface UseSkillsReturn {
  /** All loaded skills (global + workspace overlay merged) */
  skills: AgentSkill[];
  /** Set of skill IDs that are enabled for the current profile */
  enabledSkillIds: Set<string>;
  /** Whether skills are being loaded */
  loading: boolean;
  /** Last error message, if any */
  error: string | null;

  /** Reload skills from disk */
  reload: () => void;
  /** Create a new skill */
  createSkill: (data: SkillFormData) => AgentSkill | null;
  /** Update an existing skill */
  updateSkill: (id: string, updates: Partial<SkillFormData>) => AgentSkill | null;
  /** Delete a skill by ID */
  deleteSkill: (id: string) => boolean;
  /** Enable a skill for the current profile */
  enableSkill: (id: string) => boolean;
  /** Disable a skill for the current profile */
  disableSkill: (id: string) => boolean;
  /** Check if a skill is enabled */
  isSkillEnabled: (id: string) => boolean;
  /** Install skill from GitHub repo URL or owner/repo format */
  installFromGitHub: (repoIdentifier: string) => Promise<{
    imported: AgentSkill[];
    errors: string[];
  }>;
}

// ============================================================================
// Hook
// ============================================================================

export function useSkills(): UseSkillsReturn {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [enabledSkillIds, setEnabledSkillIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  /**
   * Load the enabled skill IDs from the current profile's skills config.
   */
  const loadEnabledSkillIds = useCallback((): Set<string> => {
    try {
      const profile = agentProfileService.getCurrentProfile();
      if (!profile) return new Set();

      const skillsConfig = (profile as AgentProfile & { skillsConfig?: ProfileSkillsConfig }).skillsConfig;
      if (!skillsConfig?.enabledSkillIds) return new Set();

      return new Set(skillsConfig.enabledSkillIds);
    } catch {
      return new Set();
    }
  }, []);

  /**
   * Load skills from the service and update state.
   */
  const loadSkills = useCallback(() => {
    try {
      const all = skillsService.getSkills();
      const enabled = loadEnabledSkillIds();
      setSkills(all);
      setEnabledSkillIds(enabled);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load skills';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [loadEnabledSkillIds]);

  // Load on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      loadSkills();
    }
  }, [loadSkills]);

  /**
   * Reload skills from disk (handles external changes).
   */
  const reload = useCallback(() => {
    setLoading(true);
    try {
      skillsService.scanSkillsFolder();
    } catch {
      // scanSkillsFolder re-reads from disk, ignore errors
    }
    loadSkills();
  }, [loadSkills]);

  /**
   * Create a new skill.
   */
  const createSkill = useCallback(
    (data: SkillFormData): AgentSkill | null => {
      try {
        const newSkill = skillsService.createSkill(
          data.name,
          data.description,
          data.instructions,
          { source: 'local' },
        );
        loadSkills();
        setError(null);
        return newSkill;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create skill';
        setError(msg);
        return null;
      }
    },
    [loadSkills],
  );

  /**
   * Update an existing skill.
   */
  const updateSkill = useCallback(
    (id: string, updates: Partial<SkillFormData>): AgentSkill | null => {
      try {
        const updated = skillsService.updateSkill(id, updates);
        loadSkills();
        setError(null);
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update skill';
        setError(msg);
        return null;
      }
    },
    [loadSkills],
  );

  /**
   * Delete a skill by ID.
   */
  const deleteSkill = useCallback(
    (id: string): boolean => {
      try {
        const success = skillsService.deleteSkill(id);
        if (success) {
          loadSkills();
          setError(null);
        } else {
          setError('Skill not found');
        }
        return success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete skill';
        setError(msg);
        return false;
      }
    },
    [loadSkills],
  );

  /**
   * Update the current profile's enabledSkillIds and persist it.
   */
  const updateProfileSkillsConfig = useCallback(
    (newEnabledIds: Set<string>): boolean => {
      try {
        const profile = agentProfileService.getCurrentProfile();
        if (!profile) {
          setError('No active profile');
          return false;
        }

        const skillsConfig: ProfileSkillsConfig = {
          ...((profile as AgentProfile & { skillsConfig?: ProfileSkillsConfig }).skillsConfig ?? {}),
          enabledSkillIds: Array.from(newEnabledIds),
        };

        agentProfileService.update(profile.id, { skillsConfig } as Partial<AgentProfile>);
        setEnabledSkillIds(new Set(newEnabledIds));
        setError(null);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update profile skills config';
        setError(msg);
        return false;
      }
    },
    [],
  );

  /**
   * Enable a skill for the current profile.
   */
  const enableSkill = useCallback(
    (id: string): boolean => {
      const skill = skillsService.getSkill(id);
      if (!skill) {
        setError('Skill not found');
        return false;
      }
      const newEnabled = new Set(enabledSkillIds);
      newEnabled.add(id);
      return updateProfileSkillsConfig(newEnabled);
    },
    [enabledSkillIds, updateProfileSkillsConfig],
  );

  /**
   * Disable a skill for the current profile.
   */
  const disableSkill = useCallback(
    (id: string): boolean => {
      const skill = skillsService.getSkill(id);
      if (!skill) {
        setError('Skill not found');
        return false;
      }
      const newEnabled = new Set(enabledSkillIds);
      newEnabled.delete(id);
      return updateProfileSkillsConfig(newEnabled);
    },
    [enabledSkillIds, updateProfileSkillsConfig],
  );

  /**
   * Check if a skill is enabled for the current profile.
   */
  const isSkillEnabled = useCallback(
    (id: string): boolean => enabledSkillIds.has(id),
    [enabledSkillIds],
  );

  /**
   * Install skill(s) from a GitHub repository.
   */
  const installFromGitHub = useCallback(
    async (repoIdentifier: string): Promise<{ imported: AgentSkill[]; errors: string[] }> => {
      try {
        const result = await skillsService.importSkillFromGitHub(repoIdentifier);
        if (result.imported.length > 0) {
          loadSkills();
        }
        if (result.errors.length > 0) {
          setError(result.errors.join('; '));
        } else {
          setError(null);
        }
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to install from GitHub';
        setError(msg);
        return { imported: [], errors: [msg] };
      }
    },
    [loadSkills],
  );

  return {
    skills,
    enabledSkillIds,
    loading,
    error,
    reload,
    createSkill,
    updateSkill,
    deleteSkill,
    enableSkill,
    disableSkill,
    isSkillEnabled,
    installFromGitHub,
  };
}
