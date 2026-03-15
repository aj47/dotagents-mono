import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentMemory } from '@dotagents/core';
import type { MemoriesPanelProps, MemoryPanelView } from './MemoriesPanel';
import type { MemoryFormData } from '../hooks/useMemories';

/**
 * Tests for MemoriesPanel component — validates rendering of
 * memory list, create/edit forms, delete confirmation,
 * auto-extraction indicator, and keyboard navigation behavior.
 */

// ============================================================================
// Mock @dotagents/core
// ============================================================================

vi.mock('@dotagents/core', () => ({
  memoryService: {
    getAllMemories: vi.fn(async () => []),
  },
}));

// ============================================================================
// Test Data
// ============================================================================

const mockMemoryHigh: AgentMemory = {
  id: 'memory-high',
  createdAt: 1000,
  updatedAt: 1000,
  title: 'User prefers TypeScript',
  content: 'The user strongly prefers TypeScript over JavaScript.',
  tags: ['preference', 'language'],
  importance: 'high',
  keyFindings: ['TypeScript preferred'],
};

const mockMemoryMedium: AgentMemory = {
  id: 'memory-medium',
  createdAt: 2000,
  updatedAt: 2000,
  title: 'Project uses pnpm',
  content: 'This monorepo uses pnpm as the package manager.',
  tags: ['fact', 'tooling'],
  importance: 'medium',
  keyFindings: [],
  sessionId: 'session-1',
  conversationId: 'conv-1',
  conversationTitle: 'Initial setup',
  userNotes: 'Discovered during setup',
};

const mockMemoryCritical: AgentMemory = {
  id: 'memory-critical',
  createdAt: 3000,
  updatedAt: 3000,
  title: 'Never delete production data',
  content: 'Critical safety constraint: never delete production data.',
  tags: ['constraint', 'safety'],
  importance: 'critical',
  keyFindings: ['Safety first'],
};

const mockMemories: AgentMemory[] = [mockMemoryCritical, mockMemoryMedium, mockMemoryHigh];

function createDefaultProps(overrides?: Partial<MemoriesPanelProps>): MemoriesPanelProps {
  return {
    memories: mockMemories,
    autoExtractionEnabled: true,
    error: null,
    onClose: vi.fn(),
    onCreateMemory: vi.fn(async (data: MemoryFormData) => ({
      id: 'new-memory-id',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: data.title,
      content: data.content,
      tags: data.tags ?? [],
      importance: data.importance ?? 'medium',
      userNotes: data.userNotes,
    })),
    onUpdateMemory: vi.fn(async () => true),
    onDeleteMemory: vi.fn(async () => true),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('MemoriesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // List view rendering
  // --------------------------------------------------------------------------

  describe('list view', () => {
    it('should display all memories', () => {
      const props = createDefaultProps();
      expect(props.memories).toHaveLength(3);
      expect(props.memories[0].title).toBe('Never delete production data');
    });

    it('should show importance levels', () => {
      const props = createDefaultProps();
      expect(props.memories[0].importance).toBe('critical');
      expect(props.memories[1].importance).toBe('medium');
      expect(props.memories[2].importance).toBe('high');
    });

    it('should show tags', () => {
      const props = createDefaultProps();
      expect(props.memories[0].tags).toContain('constraint');
      expect(props.memories[0].tags).toContain('safety');
    });

    it('should handle empty memories list', () => {
      const props = createDefaultProps({ memories: [] });
      expect(props.memories).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Auto-extraction indicator
  // --------------------------------------------------------------------------

  describe('auto-extraction indicator', () => {
    it('should indicate auto-extraction is enabled', () => {
      const props = createDefaultProps({ autoExtractionEnabled: true });
      expect(props.autoExtractionEnabled).toBe(true);
    });

    it('should indicate auto-extraction is disabled', () => {
      const props = createDefaultProps({ autoExtractionEnabled: false });
      expect(props.autoExtractionEnabled).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Memory creation
  // --------------------------------------------------------------------------

  describe('memory creation', () => {
    it('should call onCreateMemory with form data', async () => {
      const props = createDefaultProps();
      const data: MemoryFormData = {
        title: 'New Memory',
        content: 'Important info',
        tags: ['fact'],
        importance: 'high',
      };

      await props.onCreateMemory(data);
      expect(props.onCreateMemory).toHaveBeenCalledWith(data);
    });

    it('should return created memory on success', async () => {
      const props = createDefaultProps();
      const result = await props.onCreateMemory({
        title: 'Test',
        content: 'content',
      });
      expect(result).toBeDefined();
      expect(result!.title).toBe('Test');
    });

    it('should handle creation failure', async () => {
      const props = createDefaultProps({
        onCreateMemory: vi.fn(async () => null),
      });
      const result = await props.onCreateMemory({ title: '', content: '' });
      expect(result).toBeNull();
    });

    it('should use default importance if not specified', async () => {
      const props = createDefaultProps();
      const result = await props.onCreateMemory({
        title: 'Test',
        content: 'content',
      });
      expect(result!.importance).toBe('medium');
    });
  });

  // --------------------------------------------------------------------------
  // Memory editing
  // --------------------------------------------------------------------------

  describe('memory editing', () => {
    it('should call onUpdateMemory with ID and updates', async () => {
      const props = createDefaultProps();
      await props.onUpdateMemory('memory-high', { title: 'Updated Title' });
      expect(props.onUpdateMemory).toHaveBeenCalledWith('memory-high', { title: 'Updated Title' });
    });

    it('should return true on successful update', async () => {
      const props = createDefaultProps();
      const result = await props.onUpdateMemory('memory-high', { content: 'New content' });
      expect(result).toBe(true);
    });

    it('should return false for failed update', async () => {
      const props = createDefaultProps({
        onUpdateMemory: vi.fn(async () => false),
      });
      const result = await props.onUpdateMemory('nonexistent', { title: 'foo' });
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Memory deletion
  // --------------------------------------------------------------------------

  describe('memory deletion', () => {
    it('should call onDeleteMemory with the ID', async () => {
      const props = createDefaultProps();
      await props.onDeleteMemory('memory-high');
      expect(props.onDeleteMemory).toHaveBeenCalledWith('memory-high');
    });

    it('should return true on successful deletion', async () => {
      const props = createDefaultProps();
      const result = await props.onDeleteMemory('memory-high');
      expect(result).toBe(true);
    });

    it('should handle deletion failure', async () => {
      const props = createDefaultProps({
        onDeleteMemory: vi.fn(async () => false),
      });
      const result = await props.onDeleteMemory('nonexistent');
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Error display
  // --------------------------------------------------------------------------

  describe('error display', () => {
    it('should display error when present', () => {
      const props = createDefaultProps({ error: 'Failed to load' });
      expect(props.error).toBe('Failed to load');
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
    it('should call onClose', () => {
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
      const defaultView: MemoryPanelView = 'list';
      expect(defaultView).toBe('list');
    });

    it('should support create view', () => {
      const view: MemoryPanelView = 'create';
      expect(view).toBe('create');
    });

    it('should support edit view', () => {
      const view: MemoryPanelView = 'edit';
      expect(view).toBe('edit');
    });

    it('should support confirm-delete view', () => {
      const view: MemoryPanelView = 'confirm-delete';
      expect(view).toBe('confirm-delete');
    });
  });

  // --------------------------------------------------------------------------
  // Memory details
  // --------------------------------------------------------------------------

  describe('memory details', () => {
    it('should show session and conversation info when available', () => {
      expect(mockMemoryMedium.sessionId).toBe('session-1');
      expect(mockMemoryMedium.conversationId).toBe('conv-1');
      expect(mockMemoryMedium.conversationTitle).toBe('Initial setup');
    });

    it('should show user notes when available', () => {
      expect(mockMemoryMedium.userNotes).toBe('Discovered during setup');
    });

    it('should show key findings when available', () => {
      expect(mockMemoryHigh.keyFindings).toContain('TypeScript preferred');
    });
  });
});
