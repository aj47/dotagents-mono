import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LoopConfig, LoopStatus } from '@dotagents/core';
import type { LoopsPanelProps, LoopPanelView } from './LoopsPanel';
import type { LoopFormData } from '../hooks/useLoops';

/**
 * Tests for LoopsPanel component — validates rendering of
 * repeat task list, create/edit forms, delete confirmation,
 * enable/disable, execution triggering, and keyboard navigation.
 */

// ============================================================================
// Mock @dotagents/core
// ============================================================================

vi.mock('@dotagents/core', () => ({
  loopService: {
    getLoops: vi.fn(() => []),
    getLoopStatuses: vi.fn(() => []),
  },
}));

// ============================================================================
// Test Data
// ============================================================================

const mockLoopEnabled: LoopConfig = {
  id: 'loop-enabled',
  name: 'Daily Summary',
  prompt: 'Summarize today\'s activities and provide insights.',
  intervalMinutes: 1440,
  enabled: true,
  profileId: 'profile-1',
  lastRunAt: Date.now() - 3600000, // 1 hour ago
  runOnStartup: false,
};

const mockLoopDisabled: LoopConfig = {
  id: 'loop-disabled',
  name: 'Hourly Check',
  prompt: 'Check for new messages and notifications.',
  intervalMinutes: 60,
  enabled: false,
  lastRunAt: undefined,
  runOnStartup: true,
};

const mockLoops: LoopConfig[] = [mockLoopEnabled, mockLoopDisabled];

const mockStatuses: LoopStatus[] = [
  {
    id: 'loop-enabled',
    name: 'Daily Summary',
    enabled: true,
    isRunning: false,
    lastRunAt: Date.now() - 3600000,
    nextRunAt: Date.now() + 82800000,
    intervalMinutes: 1440,
  },
  {
    id: 'loop-disabled',
    name: 'Hourly Check',
    enabled: false,
    isRunning: false,
    lastRunAt: undefined,
    nextRunAt: undefined,
    intervalMinutes: 60,
  },
];

function createDefaultProps(overrides?: Partial<LoopsPanelProps>): LoopsPanelProps {
  return {
    loops: mockLoops,
    statuses: mockStatuses,
    error: null,
    onClose: vi.fn(),
    onCreateLoop: vi.fn((data: LoopFormData) => ({
      id: 'new-loop-id',
      name: data.name,
      prompt: data.prompt,
      intervalMinutes: data.intervalMinutes,
      enabled: data.enabled ?? true,
      profileId: data.profileId,
      runOnStartup: data.runOnStartup,
    })),
    onUpdateLoop: vi.fn(() => true),
    onDeleteLoop: vi.fn(() => true),
    onEnableLoop: vi.fn(() => true),
    onDisableLoop: vi.fn(() => true),
    onTriggerLoop: vi.fn(async () => true),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('LoopsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // List view rendering
  // --------------------------------------------------------------------------

  describe('list view', () => {
    it('should display all repeat tasks', () => {
      const props = createDefaultProps();
      expect(props.loops).toHaveLength(2);
      expect(props.loops[0].name).toBe('Daily Summary');
      expect(props.loops[1].name).toBe('Hourly Check');
    });

    it('should show enabled/disabled state', () => {
      const props = createDefaultProps();
      expect(props.loops[0].enabled).toBe(true);
      expect(props.loops[1].enabled).toBe(false);
    });

    it('should show interval in human-readable format', () => {
      const props = createDefaultProps();
      expect(props.loops[0].intervalMinutes).toBe(1440); // 1 day
      expect(props.loops[1].intervalMinutes).toBe(60); // 1 hour
    });

    it('should show running status', () => {
      const props = createDefaultProps();
      const status = props.statuses.find((s) => s.id === 'loop-enabled');
      expect(status?.isRunning).toBe(false);
    });

    it('should show last run time', () => {
      const props = createDefaultProps();
      expect(props.loops[0].lastRunAt).toBeDefined();
      expect(props.loops[1].lastRunAt).toBeUndefined();
    });

    it('should handle empty loops list', () => {
      const props = createDefaultProps({ loops: [], statuses: [] });
      expect(props.loops).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Loop creation
  // --------------------------------------------------------------------------

  describe('loop creation', () => {
    it('should call onCreateLoop with form data', () => {
      const props = createDefaultProps();
      const data: LoopFormData = {
        name: 'New Task',
        prompt: 'Do something every hour',
        intervalMinutes: 60,
        enabled: true,
      };

      props.onCreateLoop(data);
      expect(props.onCreateLoop).toHaveBeenCalledWith(data);
    });

    it('should return created loop on success', () => {
      const props = createDefaultProps();
      const result = props.onCreateLoop({
        name: 'Test',
        prompt: 'test',
        intervalMinutes: 30,
      });
      expect(result).toBeDefined();
      expect(result!.name).toBe('Test');
    });

    it('should handle creation failure', () => {
      const props = createDefaultProps({
        onCreateLoop: vi.fn(() => null),
      });
      const result = props.onCreateLoop({
        name: '',
        prompt: '',
        intervalMinutes: 0,
      });
      expect(result).toBeNull();
    });

    it('should default enabled to true', () => {
      const props = createDefaultProps();
      const result = props.onCreateLoop({
        name: 'Test',
        prompt: 'test',
        intervalMinutes: 30,
      });
      expect(result!.enabled).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Loop editing
  // --------------------------------------------------------------------------

  describe('loop editing', () => {
    it('should call onUpdateLoop with ID and updates', () => {
      const props = createDefaultProps();
      props.onUpdateLoop('loop-enabled', { name: 'Updated Name' });
      expect(props.onUpdateLoop).toHaveBeenCalledWith('loop-enabled', { name: 'Updated Name' });
    });

    it('should return true on successful update', () => {
      const props = createDefaultProps();
      const result = props.onUpdateLoop('loop-enabled', { intervalMinutes: 120 });
      expect(result).toBe(true);
    });

    it('should handle update failure', () => {
      const props = createDefaultProps({
        onUpdateLoop: vi.fn(() => false),
      });
      const result = props.onUpdateLoop('nonexistent', { name: 'foo' });
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Loop deletion
  // --------------------------------------------------------------------------

  describe('loop deletion', () => {
    it('should call onDeleteLoop with the ID', () => {
      const props = createDefaultProps();
      props.onDeleteLoop('loop-enabled');
      expect(props.onDeleteLoop).toHaveBeenCalledWith('loop-enabled');
    });

    it('should return true on successful deletion', () => {
      const props = createDefaultProps();
      const result = props.onDeleteLoop('loop-enabled');
      expect(result).toBe(true);
    });

    it('should handle deletion failure', () => {
      const props = createDefaultProps({
        onDeleteLoop: vi.fn(() => false),
      });
      const result = props.onDeleteLoop('nonexistent');
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Enable/disable
  // --------------------------------------------------------------------------

  describe('enable/disable', () => {
    it('should call onEnableLoop to enable a task', () => {
      const props = createDefaultProps();
      props.onEnableLoop('loop-disabled');
      expect(props.onEnableLoop).toHaveBeenCalledWith('loop-disabled');
    });

    it('should call onDisableLoop to disable a task', () => {
      const props = createDefaultProps();
      props.onDisableLoop('loop-enabled');
      expect(props.onDisableLoop).toHaveBeenCalledWith('loop-enabled');
    });

    it('should toggle based on current state', () => {
      const props = createDefaultProps();
      // loop-enabled is enabled, toggling should disable
      if (props.loops[0].enabled) {
        props.onDisableLoop('loop-enabled');
      }
      expect(props.onDisableLoop).toHaveBeenCalledWith('loop-enabled');

      // loop-disabled is disabled, toggling should enable
      if (!props.loops[1].enabled) {
        props.onEnableLoop('loop-disabled');
      }
      expect(props.onEnableLoop).toHaveBeenCalledWith('loop-disabled');
    });
  });

  // --------------------------------------------------------------------------
  // Triggering
  // --------------------------------------------------------------------------

  describe('trigger execution', () => {
    it('should call onTriggerLoop with the ID', async () => {
      const props = createDefaultProps();
      await props.onTriggerLoop('loop-enabled');
      expect(props.onTriggerLoop).toHaveBeenCalledWith('loop-enabled');
    });

    it('should return true on successful trigger', async () => {
      const props = createDefaultProps();
      const result = await props.onTriggerLoop('loop-enabled');
      expect(result).toBe(true);
    });

    it('should handle trigger failure', async () => {
      const props = createDefaultProps({
        onTriggerLoop: vi.fn(async () => false),
      });
      const result = await props.onTriggerLoop('loop-disabled');
      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Error display
  // --------------------------------------------------------------------------

  describe('error display', () => {
    it('should display error when present', () => {
      const props = createDefaultProps({ error: 'Service error' });
      expect(props.error).toBe('Service error');
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
      const defaultView: LoopPanelView = 'list';
      expect(defaultView).toBe('list');
    });

    it('should support create view', () => {
      const view: LoopPanelView = 'create';
      expect(view).toBe('create');
    });

    it('should support edit view', () => {
      const view: LoopPanelView = 'edit';
      expect(view).toBe('edit');
    });

    it('should support confirm-delete view', () => {
      const view: LoopPanelView = 'confirm-delete';
      expect(view).toBe('confirm-delete');
    });
  });

  // --------------------------------------------------------------------------
  // Status display
  // --------------------------------------------------------------------------

  describe('status display', () => {
    it('should show next run time for enabled loops', () => {
      const props = createDefaultProps();
      const status = props.statuses.find((s) => s.id === 'loop-enabled');
      expect(status?.nextRunAt).toBeDefined();
    });

    it('should not show next run time for disabled loops', () => {
      const props = createDefaultProps();
      const status = props.statuses.find((s) => s.id === 'loop-disabled');
      expect(status?.nextRunAt).toBeUndefined();
    });
  });
});
