/**
 * useSandbox — React hook for managing sandbox slots in the CLI.
 *
 * Provides CRUD operations for sandbox management via @dotagents/core's
 * sandbox-service. Supports listing, saving, switching, deleting, and
 * importing bundles into sandbox slots.
 *
 * Operations:
 * - List all sandbox slots with active indicator
 * - Save current config as a named sandbox slot
 * - Switch to a different sandbox slot
 * - Delete a sandbox slot (can't delete active)
 * - Import a bundle file into a new sandbox slot
 *
 * Uses safe-file atomic writes for concurrent write safety.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getSandboxState,
  saveCurrentAsSlot,
  switchToSlot,
  deleteSlot,
  createSlotFromCurrentState,
  importBundle,
  globalAgentsFolder,
} from '@dotagents/core';
import type {
  SandboxSlot,
  SandboxState,
  SwitchSlotResult,
  SaveSlotResult,
  DeleteSlotResult,
} from '@dotagents/core';

// ============================================================================
// Types
// ============================================================================

export interface UseSandboxReturn {
  /** Current sandbox state (slots + active slot) */
  state: SandboxState;
  /** Whether sandbox data is being loaded */
  loading: boolean;
  /** Last error message, if any */
  error: string | null;
  /** Last status/success message, if any */
  statusMessage: string | null;

  /** Reload sandbox state from disk */
  reload: () => void;
  /** Save current config as a named sandbox slot */
  saveSlot: (name: string) => SaveSlotResult;
  /** Switch to a sandbox slot by name */
  switchSlot: (name: string) => SwitchSlotResult;
  /** Delete a sandbox slot by name */
  deleteSlot: (name: string) => DeleteSlotResult;
  /** Import a bundle file into a new sandbox slot */
  importBundleToSlot: (bundlePath: string, slotName: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

// ============================================================================
// Hook
// ============================================================================

export function useSandbox(): UseSandboxReturn {
  const [state, setState] = useState<SandboxState>({ activeSlot: null, slots: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const initializedRef = useRef(false);

  /**
   * Load sandbox state from disk.
   */
  const loadState = useCallback(() => {
    try {
      const sandboxState = getSandboxState(globalAgentsFolder);
      setState(sandboxState);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load sandbox state';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      loadState();
    }
  }, [loadState]);

  /**
   * Reload sandbox state from disk.
   */
  const reload = useCallback(() => {
    setLoading(true);
    loadState();
  }, [loadState]);

  /**
   * Save current .agents config as a named sandbox slot.
   */
  const saveSlotFn = useCallback(
    (name: string): SaveSlotResult => {
      try {
        const result = createSlotFromCurrentState(globalAgentsFolder, name);
        if (result.success) {
          setStatusMessage(`✓ Saved sandbox slot "${result.slot?.name ?? name}"`);
          setError(null);
        } else {
          setError(result.error ?? 'Failed to save slot');
        }
        loadState();
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save slot';
        setError(msg);
        return { success: false, error: msg };
      }
    },
    [loadState],
  );

  /**
   * Switch to a sandbox slot by name.
   */
  const switchSlotFn = useCallback(
    (name: string): SwitchSlotResult => {
      try {
        const result = switchToSlot(globalAgentsFolder, name);
        if (result.success) {
          setStatusMessage(`✓ Switched to sandbox slot "${name}"`);
          setError(null);
        } else {
          setError(result.error ?? 'Failed to switch slot');
        }
        loadState();
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to switch slot';
        setError(msg);
        return {
          success: false,
          previousSlot: state.activeSlot,
          activeSlot: state.activeSlot,
          error: msg,
        };
      }
    },
    [loadState, state.activeSlot],
  );

  /**
   * Delete a sandbox slot by name. Cannot delete the active slot.
   */
  const deleteSlotFn = useCallback(
    (name: string): DeleteSlotResult => {
      try {
        const result = deleteSlot(globalAgentsFolder, name);
        if (result.success) {
          setStatusMessage(`✓ Deleted sandbox slot "${name}"`);
          setError(null);
        } else {
          setError(result.error ?? 'Failed to delete slot');
        }
        loadState();
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete slot';
        setError(msg);
        return { success: false, error: msg };
      }
    },
    [loadState],
  );

  /**
   * Import a bundle file into a new sandbox slot.
   * Creates a sandbox from the current config, then imports the bundle into it.
   */
  const importBundleToSlot = useCallback(
    async (
      bundlePath: string,
      slotName: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // 1. Save current config as the new slot first
        const saveResult = createSlotFromCurrentState(globalAgentsFolder, slotName, {
          sourceBundleName: slotName,
        });
        if (!saveResult.success) {
          setError(saveResult.error ?? 'Failed to create sandbox slot');
          return { success: false, error: saveResult.error };
        }

        // 2. Switch to the new slot
        const switchResult = switchToSlot(globalAgentsFolder, slotName);
        if (!switchResult.success) {
          setError(switchResult.error ?? 'Failed to switch to new sandbox slot');
          return { success: false, error: switchResult.error };
        }

        // 3. Import the bundle into the now-active slot config
        const importResult = await importBundle(bundlePath, globalAgentsFolder, {
          conflictStrategy: 'overwrite',
        });

        if (importResult.errors && importResult.errors.length > 0) {
          setError(`Bundle imported with warnings: ${importResult.errors.join('; ')}`);
        } else {
          setStatusMessage(`✓ Imported bundle into sandbox slot "${slotName}"`);
          setError(null);
        }

        // 4. Save the imported config into the slot snapshot
        saveCurrentAsSlot(globalAgentsFolder, slotName, {
          sourceBundleName: slotName,
        });

        loadState();
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to import bundle into sandbox';
        setError(msg);
        loadState();
        return { success: false, error: msg };
      }
    },
    [loadState],
  );

  return {
    state,
    loading,
    error,
    statusMessage,
    reload,
    saveSlot: saveSlotFn,
    switchSlot: switchSlotFn,
    deleteSlot: deleteSlotFn,
    importBundleToSlot,
  };
}
