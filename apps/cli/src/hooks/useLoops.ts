/**
 * useLoops — React hook for managing repeat tasks (loops) in the CLI.
 *
 * Provides CRUD operations for repeat tasks via @dotagents/core's loopService.
 * Supports enable/disable, execution at configured intervals, and status monitoring.
 *
 * Operations:
 * - List all repeat tasks (merged global + workspace layers)
 * - Create new task with name, prompt, interval, profileId
 * - Edit existing task fields
 * - Delete task
 * - Enable/disable task
 * - View task execution status
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { loopService } from '@dotagents/core';
import type { LoopConfig, LoopStatus } from '@dotagents/core';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface LoopFormData {
  name: string;
  prompt: string;
  intervalMinutes: number;
  enabled?: boolean;
  profileId?: string;
  runOnStartup?: boolean;
}

export interface UseLoopsReturn {
  /** All loaded repeat tasks */
  loops: LoopConfig[];
  /** Status of all loops (including running state, next run time) */
  statuses: LoopStatus[];
  /** Whether loops are being loaded */
  loading: boolean;
  /** Last error message, if any */
  error: string | null;

  /** Reload loops from disk */
  reload: () => void;
  /** Create a new repeat task */
  createLoop: (data: LoopFormData) => LoopConfig | null;
  /** Update an existing repeat task */
  updateLoop: (id: string, updates: Partial<LoopFormData>) => boolean;
  /** Delete a repeat task by ID */
  deleteLoop: (id: string) => boolean;
  /** Enable a repeat task */
  enableLoop: (id: string) => boolean;
  /** Disable a repeat task */
  disableLoop: (id: string) => boolean;
  /** Manually trigger a loop execution */
  triggerLoop: (id: string) => Promise<boolean>;
  /** Refresh statuses */
  refreshStatuses: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useLoops(): UseLoopsReturn {
  const [loops, setLoops] = useState<LoopConfig[]>([]);
  const [statuses, setStatuses] = useState<LoopStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  /**
   * Load loops from the service and update state.
   */
  const loadLoops = useCallback(() => {
    try {
      const all = loopService.getLoops();
      const allStatuses = loopService.getLoopStatuses();
      setLoops(all);
      setStatuses(allStatuses);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load repeat tasks';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      loadLoops();
    }
  }, [loadLoops]);

  /**
   * Reload loops from disk (handles external changes).
   */
  const reload = useCallback(() => {
    setLoading(true);
    try {
      loopService.reload();
    } catch {
      // reload() re-reads from disk, ignore errors
    }
    loadLoops();
  }, [loadLoops]);

  /**
   * Refresh statuses without full reload.
   */
  const refreshStatuses = useCallback(() => {
    try {
      setStatuses(loopService.getLoopStatuses());
    } catch {
      // best-effort
    }
  }, []);

  /**
   * Create a new repeat task.
   */
  const createLoop = useCallback(
    (data: LoopFormData): LoopConfig | null => {
      try {
        const newLoop: LoopConfig = {
          id: randomUUID(),
          name: data.name,
          prompt: data.prompt,
          intervalMinutes: data.intervalMinutes,
          enabled: data.enabled ?? true,
          profileId: data.profileId,
          runOnStartup: data.runOnStartup,
        };

        const success = loopService.saveLoop(newLoop);
        if (success) {
          // Start the loop if enabled
          if (newLoop.enabled) {
            loopService.startLoop(newLoop.id);
          }
          loadLoops();
          setError(null);
          return newLoop;
        }
        setError('Failed to save repeat task');
        return null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create repeat task';
        setError(msg);
        return null;
      }
    },
    [loadLoops],
  );

  /**
   * Update an existing repeat task.
   */
  const updateLoop = useCallback(
    (id: string, updates: Partial<LoopFormData>): boolean => {
      try {
        const existing = loopService.getLoop(id);
        if (!existing) {
          setError('Repeat task not found');
          return false;
        }

        const updated: LoopConfig = {
          ...existing,
          ...updates,
        };

        const success = loopService.saveLoop(updated);
        if (success) {
          loadLoops();
          setError(null);
        } else {
          setError('Failed to update repeat task');
        }
        return success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update repeat task';
        setError(msg);
        return false;
      }
    },
    [loadLoops],
  );

  /**
   * Delete a repeat task by ID.
   */
  const deleteLoop = useCallback(
    (id: string): boolean => {
      try {
        const success = loopService.deleteLoop(id);
        if (success) {
          loadLoops();
          setError(null);
        } else {
          setError('Repeat task not found');
        }
        return success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete repeat task';
        setError(msg);
        return false;
      }
    },
    [loadLoops],
  );

  /**
   * Enable a repeat task and start scheduling.
   */
  const enableLoop = useCallback(
    (id: string): boolean => {
      try {
        const existing = loopService.getLoop(id);
        if (!existing) {
          setError('Repeat task not found');
          return false;
        }

        const updated: LoopConfig = { ...existing, enabled: true };
        const success = loopService.saveLoop(updated);
        if (success) {
          loopService.startLoop(id);
          loadLoops();
          setError(null);
        }
        return success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to enable repeat task';
        setError(msg);
        return false;
      }
    },
    [loadLoops],
  );

  /**
   * Disable a repeat task and stop scheduling.
   */
  const disableLoop = useCallback(
    (id: string): boolean => {
      try {
        const existing = loopService.getLoop(id);
        if (!existing) {
          setError('Repeat task not found');
          return false;
        }

        const updated: LoopConfig = { ...existing, enabled: false };
        const success = loopService.saveLoop(updated);
        if (success) {
          loopService.stopLoop(id);
          loadLoops();
          setError(null);
        }
        return success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to disable repeat task';
        setError(msg);
        return false;
      }
    },
    [loadLoops],
  );

  /**
   * Manually trigger a loop execution.
   */
  const triggerLoop = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const success = await loopService.triggerLoop(id);
        if (success) {
          refreshStatuses();
          setError(null);
        } else {
          setError('Cannot trigger repeat task (not found or already running)');
        }
        return success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to trigger repeat task';
        setError(msg);
        return false;
      }
    },
    [refreshStatuses],
  );

  return {
    loops,
    statuses,
    loading,
    error,
    reload,
    createLoop,
    updateLoop,
    deleteLoop,
    enableLoop,
    disableLoop,
    triggerLoop,
    refreshStatuses,
  };
}
