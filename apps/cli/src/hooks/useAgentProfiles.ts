/**
 * useAgentProfiles — React hook for managing agent profiles in the CLI.
 *
 * Provides CRUD operations for agent profiles via @dotagents/core's
 * agentProfileService. Supports global + workspace overlay with
 * active profile switching that affects subsequent chat sessions.
 *
 * Operations:
 * - List all profiles (merged global + workspace layers)
 * - Create new profile with name, role, system prompt, model/tool config
 * - Edit existing profile fields
 * - Switch active profile
 * - Delete profile (prevents deleting built-in profiles)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { agentProfileService } from '@dotagents/core';
import type { AgentProfile, AgentProfileRole } from '@dotagents/core';

// ============================================================================
// Types
// ============================================================================

export interface ProfileFormData {
  displayName: string;
  description?: string;
  systemPrompt?: string;
  guidelines?: string;
  role?: AgentProfileRole;
}

export interface UseAgentProfilesReturn {
  /** All loaded profiles (global + workspace overlay merged) */
  profiles: AgentProfile[];
  /** The currently active profile */
  activeProfile: AgentProfile | undefined;
  /** Whether profiles are being loaded */
  loading: boolean;
  /** Last error message, if any */
  error: string | null;

  /** Reload profiles from disk */
  reload: () => void;
  /** Create a new profile */
  createProfile: (data: ProfileFormData) => AgentProfile | null;
  /** Update an existing profile */
  updateProfile: (id: string, updates: Partial<ProfileFormData>) => AgentProfile | null;
  /** Delete a profile by ID (cannot delete built-in profiles) */
  deleteProfile: (id: string) => boolean;
  /** Switch the active profile */
  switchProfile: (id: string) => boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useAgentProfiles(): UseAgentProfilesReturn {
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<AgentProfile | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  /**
   * Load profiles from the service and update state.
   */
  const loadProfiles = useCallback(() => {
    try {
      const all = agentProfileService.getAll();
      const current = agentProfileService.getCurrentProfile();
      setProfiles(all);
      setActiveProfile(current);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load profiles';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      loadProfiles();
    }
  }, [loadProfiles]);

  /**
   * Reload profiles from disk (handles external changes).
   */
  const reload = useCallback(() => {
    setLoading(true);
    try {
      agentProfileService.reload();
    } catch {
      // reload() re-reads from disk, ignore errors and load what we can
    }
    loadProfiles();
  }, [loadProfiles]);

  /**
   * Create a new agent profile.
   */
  const createProfile = useCallback(
    (data: ProfileFormData): AgentProfile | null => {
      try {
        const newProfile = agentProfileService.create({
          name: data.displayName,
          displayName: data.displayName,
          description: data.description,
          systemPrompt: data.systemPrompt ?? '',
          guidelines: data.guidelines ?? '',
          connection: { type: 'internal' },
          role: data.role ?? 'user-profile',
          enabled: true,
          isUserProfile: data.role === 'user-profile' || data.role === undefined,
          isAgentTarget: data.role === 'delegation-target',
        });
        loadProfiles();
        setError(null);
        return newProfile;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create profile';
        setError(msg);
        return null;
      }
    },
    [loadProfiles],
  );

  /**
   * Update an existing profile.
   */
  const updateProfile = useCallback(
    (id: string, updates: Partial<ProfileFormData>): AgentProfile | null => {
      try {
        const updatePayload: Partial<AgentProfile> = {};
        if (updates.displayName !== undefined) {
          updatePayload.displayName = updates.displayName;
          updatePayload.name = updates.displayName;
        }
        if (updates.description !== undefined) updatePayload.description = updates.description;
        if (updates.systemPrompt !== undefined) updatePayload.systemPrompt = updates.systemPrompt;
        if (updates.guidelines !== undefined) updatePayload.guidelines = updates.guidelines;
        if (updates.role !== undefined) updatePayload.role = updates.role;

        const updated = agentProfileService.update(id, updatePayload);
        if (!updated) {
          setError('Profile not found');
          return null;
        }
        loadProfiles();
        setError(null);
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update profile';
        setError(msg);
        return null;
      }
    },
    [loadProfiles],
  );

  /**
   * Delete a profile by ID.
   */
  const deleteProfile = useCallback(
    (id: string): boolean => {
      try {
        const profile = agentProfileService.getById(id);
        if (!profile) {
          setError('Profile not found');
          return false;
        }
        if (profile.isBuiltIn) {
          setError('Cannot delete built-in profiles');
          return false;
        }

        const success = agentProfileService.delete(id);
        if (success) {
          loadProfiles();
          setError(null);
        } else {
          setError('Failed to delete profile');
        }
        return success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete profile';
        setError(msg);
        return false;
      }
    },
    [loadProfiles],
  );

  /**
   * Switch the active profile.
   */
  const switchProfile = useCallback(
    (id: string): boolean => {
      try {
        const profile = agentProfileService.getById(id);
        if (!profile) {
          setError('Profile not found');
          return false;
        }
        agentProfileService.setCurrentProfile(id);
        loadProfiles();
        setError(null);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to switch profile';
        setError(msg);
        return false;
      }
    },
    [loadProfiles],
  );

  return {
    profiles,
    activeProfile,
    loading,
    error,
    reload,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
  };
}
