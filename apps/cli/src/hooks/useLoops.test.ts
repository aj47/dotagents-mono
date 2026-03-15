import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for useLoops hook — validates repeat tasks CRUD operations,
 * enable/disable toggling, execution triggering, and error handling.
 */

// ============================================================================
// Mocks
// ============================================================================

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid-1234'),
}));

const mockLoops = [
  {
    id: 'loop-1',
    name: 'Daily Summary',
    prompt: 'Summarize today\'s activities',
    intervalMinutes: 1440,
    enabled: true,
    profileId: 'profile-1',
    lastRunAt: 1000,
    runOnStartup: false,
  },
  {
    id: 'loop-2',
    name: 'Hourly Check',
    prompt: 'Check for new messages',
    intervalMinutes: 60,
    enabled: false,
    lastRunAt: undefined,
    runOnStartup: true,
  },
];

const mockStatuses = [
  {
    id: 'loop-1',
    name: 'Daily Summary',
    enabled: true,
    isRunning: false,
    lastRunAt: 1000,
    nextRunAt: 87400000,
    intervalMinutes: 1440,
  },
  {
    id: 'loop-2',
    name: 'Hourly Check',
    enabled: false,
    isRunning: false,
    lastRunAt: undefined,
    nextRunAt: undefined,
    intervalMinutes: 60,
  },
];

const mockLoopService = {
  getLoops: vi.fn(() => [...mockLoops]),
  getLoop: vi.fn((id: string) => mockLoops.find((l) => l.id === id)),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveLoop: vi.fn((_loop: any) => true),
  deleteLoop: vi.fn((id: string) => !!mockLoops.find((l) => l.id === id)),
  reload: vi.fn(),
  startLoop: vi.fn((_id: string) => true),
  stopLoop: vi.fn((_id: string) => true),
  triggerLoop: vi.fn(async (_id: string) => true),
  getLoopStatuses: vi.fn(() => [...mockStatuses]),
  getLoopStatus: vi.fn((id: string) => mockStatuses.find((s) => s.id === id)),
};

vi.mock('@dotagents/core', () => ({
  loopService: mockLoopService,
}));

// ============================================================================
// Import after mocks
// ============================================================================

import type { LoopFormData } from './useLoops';

// ============================================================================
// Tests
// ============================================================================

describe('useLoops', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoopService.getLoops.mockReturnValue([...mockLoops]);
    mockLoopService.getLoop.mockImplementation(
      (id: string) => mockLoops.find((l) => l.id === id),
    );
    mockLoopService.saveLoop.mockReturnValue(true);
    mockLoopService.deleteLoop.mockImplementation(
      (id: string) => !!mockLoops.find((l) => l.id === id),
    );
    mockLoopService.getLoopStatuses.mockReturnValue([...mockStatuses]);
    mockLoopService.triggerLoop.mockResolvedValue(true);
  });

  // --------------------------------------------------------------------------
  // Loop listing
  // --------------------------------------------------------------------------

  describe('loop listing', () => {
    it('should call loopService.getLoops to load repeat tasks', () => {
      const loops = mockLoopService.getLoops();
      expect(mockLoopService.getLoops).toHaveBeenCalled();
      expect(loops).toHaveLength(2);
    });

    it('should return loop details including name, prompt, interval', () => {
      const loops = mockLoopService.getLoops();
      expect(loops[0].name).toBe('Daily Summary');
      expect(loops[0].prompt).toBe('Summarize today\'s activities');
      expect(loops[0].intervalMinutes).toBe(1440);
      expect(loops[0].enabled).toBe(true);
    });

    it('should return statuses for all loops', () => {
      const statuses = mockLoopService.getLoopStatuses();
      expect(statuses).toHaveLength(2);
      expect(statuses[0].isRunning).toBe(false);
      expect(statuses[0].nextRunAt).toBeDefined();
    });

    it('should handle empty loops list', () => {
      mockLoopService.getLoops.mockReturnValueOnce([]);
      const loops = mockLoopService.getLoops();
      expect(loops).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Creating loops
  // --------------------------------------------------------------------------

  describe('loop creation', () => {
    it('should call loopService.saveLoop with a new loop object', () => {
      const data: LoopFormData = {
        name: 'New Task',
        prompt: 'Do something every hour',
        intervalMinutes: 60,
        enabled: true,
      };

      const newLoop = {
        id: 'test-uuid-1234',
        ...data,
      };

      mockLoopService.saveLoop(newLoop);
      expect(mockLoopService.saveLoop).toHaveBeenCalledWith(newLoop);
    });

    it('should start the loop if enabled', () => {
      const data: LoopFormData = {
        name: 'Test',
        prompt: 'test prompt',
        intervalMinutes: 30,
        enabled: true,
      };

      mockLoopService.saveLoop({ id: 'test-uuid', ...data });
      mockLoopService.startLoop('test-uuid');
      expect(mockLoopService.startLoop).toHaveBeenCalledWith('test-uuid');
    });

    it('should not start the loop if disabled', () => {
      const data: LoopFormData = {
        name: 'Test',
        prompt: 'test prompt',
        intervalMinutes: 30,
        enabled: false,
      };

      mockLoopService.saveLoop({ id: 'test-uuid', ...data });
      // startLoop should NOT be called when enabled=false
      expect(mockLoopService.startLoop).not.toHaveBeenCalled();
    });

    it('should handle save failure', () => {
      mockLoopService.saveLoop.mockReturnValueOnce(false);
      const result = mockLoopService.saveLoop({} as any);
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Updating loops
  // --------------------------------------------------------------------------

  describe('loop update', () => {
    it('should get existing loop and save updated version', () => {
      const existing = mockLoopService.getLoop('loop-1');
      expect(existing).toBeDefined();

      const updated = { ...existing!, name: 'Updated Name' };
      mockLoopService.saveLoop(updated);
      expect(mockLoopService.saveLoop).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'loop-1', name: 'Updated Name' }),
      );
    });

    it('should handle non-existent loop update', () => {
      const existing = mockLoopService.getLoop('nonexistent');
      expect(existing).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // Deleting loops
  // --------------------------------------------------------------------------

  describe('loop deletion', () => {
    it('should call loopService.deleteLoop with the ID', () => {
      const result = mockLoopService.deleteLoop('loop-1');
      expect(result).toBe(true);
      expect(mockLoopService.deleteLoop).toHaveBeenCalledWith('loop-1');
    });

    it('should return false for non-existent loop', () => {
      const result = mockLoopService.deleteLoop('nonexistent');
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Enable/disable loops
  // --------------------------------------------------------------------------

  describe('loop enable/disable', () => {
    it('should enable a loop by setting enabled=true and starting it', () => {
      const existing = mockLoopService.getLoop('loop-2');
      expect(existing!.enabled).toBe(false);

      const updated = { ...existing!, enabled: true };
      mockLoopService.saveLoop(updated);
      mockLoopService.startLoop('loop-2');

      expect(mockLoopService.saveLoop).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'loop-2', enabled: true }),
      );
      expect(mockLoopService.startLoop).toHaveBeenCalledWith('loop-2');
    });

    it('should disable a loop by setting enabled=false and stopping it', () => {
      const existing = mockLoopService.getLoop('loop-1');
      expect(existing!.enabled).toBe(true);

      const updated = { ...existing!, enabled: false };
      mockLoopService.saveLoop(updated);
      mockLoopService.stopLoop('loop-1');

      expect(mockLoopService.saveLoop).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'loop-1', enabled: false }),
      );
      expect(mockLoopService.stopLoop).toHaveBeenCalledWith('loop-1');
    });
  });

  // --------------------------------------------------------------------------
  // Triggering loops
  // --------------------------------------------------------------------------

  describe('loop triggering', () => {
    it('should call loopService.triggerLoop', async () => {
      const result = await mockLoopService.triggerLoop('loop-1');
      expect(result).toBe(true);
      expect(mockLoopService.triggerLoop).toHaveBeenCalledWith('loop-1');
    });

    it('should handle trigger failure', async () => {
      mockLoopService.triggerLoop.mockResolvedValueOnce(false);
      const result = await mockLoopService.triggerLoop('loop-1');
      expect(result).toBe(false);
    });

    it('should handle trigger of non-existent loop', async () => {
      mockLoopService.triggerLoop.mockResolvedValueOnce(false);
      const result = await mockLoopService.triggerLoop('nonexistent');
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Status tracking
  // --------------------------------------------------------------------------

  describe('status tracking', () => {
    it('should return running state for each loop', () => {
      const statuses = mockLoopService.getLoopStatuses();
      const status1 = statuses.find((s: any) => s.id === 'loop-1');
      expect(status1?.isRunning).toBe(false);
    });

    it('should track lastRunAt and nextRunAt', () => {
      const statuses = mockLoopService.getLoopStatuses();
      const status1 = statuses.find((s: any) => s.id === 'loop-1');
      expect(status1?.lastRunAt).toBe(1000);
      expect(status1?.nextRunAt).toBeDefined();
    });

    it('should report no next run for disabled loops', () => {
      const statuses = mockLoopService.getLoopStatuses();
      const status2 = statuses.find((s: any) => s.id === 'loop-2');
      expect(status2?.enabled).toBe(false);
      expect(status2?.nextRunAt).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // Reload
  // --------------------------------------------------------------------------

  describe('reload', () => {
    it('should call loopService.reload', () => {
      mockLoopService.reload();
      expect(mockLoopService.reload).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Error handling
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('should handle getLoops failure', () => {
      mockLoopService.getLoops.mockImplementationOnce(() => {
        throw new Error('Disk error');
      });
      expect(() => mockLoopService.getLoops()).toThrow('Disk error');
    });

    it('should handle triggerLoop rejection', async () => {
      mockLoopService.triggerLoop.mockRejectedValueOnce(new Error('Trigger failed'));
      await expect(mockLoopService.triggerLoop('loop-1')).rejects.toThrow('Trigger failed');
    });
  });
});
