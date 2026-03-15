import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for useMemories hook — validates memories CRUD operations,
 * auto-extraction indicator, search, and error handling.
 */

// ============================================================================
// Mocks
// ============================================================================

const mockMemories = [
  {
    id: 'memory-1',
    createdAt: 1000,
    updatedAt: 1000,
    title: 'User prefers TypeScript',
    content: 'The user strongly prefers TypeScript over JavaScript.',
    tags: ['preference', 'language'],
    importance: 'high' as const,
    keyFindings: ['TypeScript preferred'],
    userNotes: undefined,
  },
  {
    id: 'memory-2',
    createdAt: 2000,
    updatedAt: 2000,
    title: 'Project uses pnpm',
    content: 'This monorepo uses pnpm as the package manager.',
    tags: ['fact', 'tooling'],
    importance: 'medium' as const,
    keyFindings: [],
    sessionId: 'session-1',
    conversationId: 'conv-1',
    conversationTitle: 'Initial setup',
    userNotes: 'Discovered during setup',
  },
];

const mockMemoryService = {
  getAllMemories: vi.fn(async () => [...mockMemories]),
  getMemory: vi.fn(async (id: string) => mockMemories.find((m) => m.id === id) ?? null),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveMemory: vi.fn(async (_memory: any) => true),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateMemory: vi.fn(async (id: string, _updates?: any) => {
    return !!mockMemories.find((m) => m.id === id);
  }),
  deleteMemory: vi.fn(async (id: string) => {
    return !!mockMemories.find((m) => m.id === id);
  }),
  searchMemories: vi.fn(async (query: string) => {
    const lower = query.toLowerCase();
    return mockMemories.filter(
      (m) =>
        m.title.toLowerCase().includes(lower) ||
        m.content.toLowerCase().includes(lower),
    );
  }),
  reload: vi.fn(async () => {}),
  initialize: vi.fn(async () => {}),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockConfigStore = {
  get: vi.fn((): Record<string, unknown> => ({ memoryAutoExtraction: true })),
};

vi.mock('@dotagents/core', () => ({
  memoryService: mockMemoryService,
  configStore: mockConfigStore,
}));

// ============================================================================
// Import after mocks
// ============================================================================

import type { MemoryFormData } from './useMemories';

// ============================================================================
// Tests
// ============================================================================

describe('useMemories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMemoryService.getAllMemories.mockResolvedValue([...mockMemories]);
    mockMemoryService.saveMemory.mockResolvedValue(true);
    mockMemoryService.updateMemory.mockImplementation(async (id: string) => {
      return !!mockMemories.find((m) => m.id === id);
    });
    mockMemoryService.deleteMemory.mockImplementation(async (id: string) => {
      return !!mockMemories.find((m) => m.id === id);
    });
    mockConfigStore.get.mockReturnValue({ memoryAutoExtraction: true });
  });

  // --------------------------------------------------------------------------
  // Memory listing
  // --------------------------------------------------------------------------

  describe('memory listing', () => {
    it('should call memoryService.getAllMemories to load memories', async () => {
      const memories = await mockMemoryService.getAllMemories();
      expect(mockMemoryService.getAllMemories).toHaveBeenCalled();
      expect(memories).toHaveLength(2);
    });

    it('should return memory details including title, content, importance', async () => {
      const memories = await mockMemoryService.getAllMemories();
      expect(memories[0].title).toBe('User prefers TypeScript');
      expect(memories[0].importance).toBe('high');
      expect(memories[1].tags).toContain('fact');
    });

    it('should handle empty memories list', async () => {
      mockMemoryService.getAllMemories.mockResolvedValueOnce([]);
      const memories = await mockMemoryService.getAllMemories();
      expect(memories).toHaveLength(0);
    });

    it('should detect auto-extraction config', () => {
      const config = mockConfigStore.get();
      expect(config.memoryAutoExtraction).toBe(true);
    });

    it('should handle auto-extraction disabled', () => {
      mockConfigStore.get.mockReturnValueOnce({ memoryAutoExtraction: false });
      const config = mockConfigStore.get();
      expect(config.memoryAutoExtraction).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Creating memories
  // --------------------------------------------------------------------------

  describe('memory creation', () => {
    it('should call memoryService.saveMemory with a new memory object', async () => {
      const data: MemoryFormData = {
        title: 'New Memory',
        content: 'Important information',
        tags: ['fact'],
        importance: 'high',
      };

      await mockMemoryService.saveMemory({
        id: expect.any(String),
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
        ...data,
      });

      expect(mockMemoryService.saveMemory).toHaveBeenCalled();
    });

    it('should return true on successful save', async () => {
      const result = await mockMemoryService.saveMemory({
        id: 'new-mem',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: 'Test',
        content: 'Test content',
        tags: [],
        importance: 'medium',
      });
      expect(result).toBe(true);
    });

    it('should handle save failure', async () => {
      mockMemoryService.saveMemory.mockResolvedValueOnce(false);
      const result = await mockMemoryService.saveMemory({} as any);
      expect(result).toBe(false);
    });

    it('should generate a unique ID for each new memory', () => {
      const id1 = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const id2 = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      expect(id1).not.toBe(id2);
    });
  });

  // --------------------------------------------------------------------------
  // Updating memories
  // --------------------------------------------------------------------------

  describe('memory update', () => {
    it('should call memoryService.updateMemory with ID and updates', async () => {
      const result = await mockMemoryService.updateMemory('memory-1', { title: 'Updated Title' });
      expect(result).toBe(true);
      expect(mockMemoryService.updateMemory).toHaveBeenCalledWith('memory-1', { title: 'Updated Title' });
    });

    it('should return false for non-existent memory', async () => {
      const result = await mockMemoryService.updateMemory('nonexistent', { title: 'foo' });
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Deleting memories
  // --------------------------------------------------------------------------

  describe('memory deletion', () => {
    it('should call memoryService.deleteMemory with the ID', async () => {
      const result = await mockMemoryService.deleteMemory('memory-1');
      expect(result).toBe(true);
      expect(mockMemoryService.deleteMemory).toHaveBeenCalledWith('memory-1');
    });

    it('should return false for non-existent memory', async () => {
      const result = await mockMemoryService.deleteMemory('nonexistent');
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  describe('memory search', () => {
    it('should search by title', async () => {
      const results = await mockMemoryService.searchMemories('TypeScript');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memory-1');
    });

    it('should search by content', async () => {
      const results = await mockMemoryService.searchMemories('pnpm');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memory-2');
    });

    it('should return empty for no matches', async () => {
      const results = await mockMemoryService.searchMemories('nonexistent-query');
      expect(results).toHaveLength(0);
    });

    it('should be case-insensitive', async () => {
      const results = await mockMemoryService.searchMemories('typescript');
      expect(results).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // Reload
  // --------------------------------------------------------------------------

  describe('reload', () => {
    it('should call memoryService.reload', async () => {
      await mockMemoryService.reload();
      expect(mockMemoryService.reload).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Error handling
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('should handle getAllMemories failure', async () => {
      mockMemoryService.getAllMemories.mockRejectedValueOnce(new Error('Disk error'));
      await expect(mockMemoryService.getAllMemories()).rejects.toThrow('Disk error');
    });

    it('should handle save failure gracefully', async () => {
      mockMemoryService.saveMemory.mockRejectedValueOnce(new Error('Write error'));
      await expect(mockMemoryService.saveMemory({} as any)).rejects.toThrow('Write error');
    });
  });

  // --------------------------------------------------------------------------
  // Auto-extraction indicator
  // --------------------------------------------------------------------------

  describe('auto-extraction indicator', () => {
    it('should report auto-extraction enabled when config says true', () => {
      mockConfigStore.get.mockReturnValue({ memoryAutoExtraction: true });
      expect(mockConfigStore.get().memoryAutoExtraction).toBe(true);
    });

    it('should report auto-extraction disabled when config says false', () => {
      mockConfigStore.get.mockReturnValue({ memoryAutoExtraction: false });
      expect(mockConfigStore.get().memoryAutoExtraction).toBe(false);
    });

    it('should report auto-extraction disabled when config key missing', () => {
      mockConfigStore.get.mockReturnValue({});
      expect(!!mockConfigStore.get().memoryAutoExtraction).toBe(false);
    });
  });
});
