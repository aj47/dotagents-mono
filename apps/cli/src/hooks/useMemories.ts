/**
 * useMemories — React hook for managing agent memories in the CLI.
 *
 * Provides CRUD operations for memories via @dotagents/core's memoryService.
 * Supports auto-extraction indicator and importance-based filtering.
 *
 * Operations:
 * - List all memories (merged global + workspace layers)
 * - Create new memory with title, content, tags, importance
 * - Edit existing memory fields
 * - Delete memory
 * - Search memories by query
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { memoryService, configStore } from '@dotagents/core';
import type { AgentMemory } from '@dotagents/core';

// ============================================================================
// Types
// ============================================================================

export interface MemoryFormData {
  title: string;
  content: string;
  tags?: string[];
  importance?: AgentMemory['importance'];
  userNotes?: string;
}

export interface UseMemoriesReturn {
  /** All loaded memories */
  memories: AgentMemory[];
  /** Whether memories are being loaded */
  loading: boolean;
  /** Last error message, if any */
  error: string | null;
  /** Whether auto-extraction is enabled in config */
  autoExtractionEnabled: boolean;

  /** Reload memories from disk */
  reload: () => Promise<void>;
  /** Create a new memory */
  createMemory: (data: MemoryFormData) => Promise<AgentMemory | null>;
  /** Update an existing memory */
  updateMemory: (id: string, updates: Partial<MemoryFormData>) => Promise<boolean>;
  /** Delete a memory by ID */
  deleteMemory: (id: string) => Promise<boolean>;
  /** Search memories by query string */
  searchMemories: (query: string) => Promise<AgentMemory[]>;
}

// ============================================================================
// Hook
// ============================================================================

export function useMemories(): UseMemoriesReturn {
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoExtractionEnabled, setAutoExtractionEnabled] = useState(false);
  const initializedRef = useRef(false);

  /**
   * Load memories from the service and update state.
   */
  const loadMemories = useCallback(async () => {
    try {
      const all = await memoryService.getAllMemories();
      setMemories(all);
      setError(null);

      // Check auto-extraction config
      try {
        const config = configStore.get();
        setAutoExtractionEnabled(!!config?.memoryAutoExtraction);
      } catch {
        setAutoExtractionEnabled(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load memories';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      void loadMemories();
    }
  }, [loadMemories]);

  /**
   * Reload memories from disk (handles external changes).
   */
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await memoryService.reload();
    } catch {
      // reload() re-reads from disk, ignore errors
    }
    await loadMemories();
  }, [loadMemories]);

  /**
   * Create a new memory.
   */
  const createMemory = useCallback(
    async (data: MemoryFormData): Promise<AgentMemory | null> => {
      try {
        const now = Date.now();
        const memory: AgentMemory = {
          id: `memory_${now}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
          title: data.title,
          content: data.content,
          tags: data.tags ?? [],
          importance: data.importance ?? 'medium',
          userNotes: data.userNotes,
        };

        const success = await memoryService.saveMemory(memory);
        if (success) {
          await loadMemories();
          setError(null);
          return memory;
        }
        setError('Failed to save memory');
        return null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create memory';
        setError(msg);
        return null;
      }
    },
    [loadMemories],
  );

  /**
   * Update an existing memory.
   */
  const updateMemory = useCallback(
    async (id: string, updates: Partial<MemoryFormData>): Promise<boolean> => {
      try {
        const success = await memoryService.updateMemory(id, updates);
        if (success) {
          await loadMemories();
          setError(null);
        } else {
          setError('Memory not found');
        }
        return success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update memory';
        setError(msg);
        return false;
      }
    },
    [loadMemories],
  );

  /**
   * Delete a memory by ID.
   */
  const deleteMemory = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const success = await memoryService.deleteMemory(id);
        if (success) {
          await loadMemories();
          setError(null);
        } else {
          setError('Memory not found');
        }
        return success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete memory';
        setError(msg);
        return false;
      }
    },
    [loadMemories],
  );

  /**
   * Search memories by query string.
   */
  const searchMemories = useCallback(
    async (query: string): Promise<AgentMemory[]> => {
      try {
        return await memoryService.searchMemories(query);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to search memories';
        setError(msg);
        return [];
      }
    },
    [],
  );

  return {
    memories,
    loading,
    error,
    autoExtractionEnabled,
    reload,
    createMemory,
    updateMemory,
    deleteMemory,
    searchMemories,
  };
}
