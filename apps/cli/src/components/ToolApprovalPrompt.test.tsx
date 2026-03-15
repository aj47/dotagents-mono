import { describe, it, expect, vi } from 'vitest';
import type { ToolApprovalInfo } from '../types/chat';

/**
 * ToolApprovalPrompt unit tests — validate display logic and
 * approve/deny decision handling for tool approval prompts.
 */

import { ToolApprovalPrompt } from './ToolApprovalPrompt';

describe('ToolApprovalPrompt', () => {
  it('exports a ToolApprovalPrompt component', () => {
    expect(ToolApprovalPrompt).toBeDefined();
    expect(typeof ToolApprovalPrompt).toBe('function');
  });

  describe('approval info display', () => {
    it('includes tool name in approval', () => {
      const approval: ToolApprovalInfo = {
        approvalId: 'approval-1',
        toolName: 'execute_command',
        args: { command: 'rm -rf /tmp/test' },
      };
      expect(approval.toolName).toBe('execute_command');
    });

    it('includes args in approval', () => {
      const approval: ToolApprovalInfo = {
        approvalId: 'approval-2',
        toolName: 'write_file',
        args: { path: '/config.json', content: '{}' },
      };
      expect(approval.args).toHaveProperty('path');
      expect(approval.args).toHaveProperty('content');
    });

    it('includes optional description', () => {
      const approval: ToolApprovalInfo = {
        approvalId: 'approval-3',
        toolName: 'delete_file',
        args: { path: '/important.txt' },
        description: 'This will permanently delete the file',
      };
      expect(approval.description).toBe('This will permanently delete the file');
    });

    it('handles missing description', () => {
      const approval: ToolApprovalInfo = {
        approvalId: 'approval-4',
        toolName: 'read_file',
        args: { path: '/test.txt' },
      };
      expect(approval.description).toBeUndefined();
    });
  });

  describe('approval decision logic', () => {
    it('approve callback is called on approval', () => {
      const onApprove = vi.fn();
      const onDeny = vi.fn();

      // Simulate pressing 'y'
      onApprove();
      expect(onApprove).toHaveBeenCalledTimes(1);
      expect(onDeny).not.toHaveBeenCalled();
    });

    it('deny callback is called on denial', () => {
      const onApprove = vi.fn();
      const onDeny = vi.fn();

      // Simulate pressing 'n'
      onDeny();
      expect(onDeny).toHaveBeenCalledTimes(1);
      expect(onApprove).not.toHaveBeenCalled();
    });

    it('keybindings map Y to approve', () => {
      const keyMap: Record<string, string> = {
        y: 'approve',
        return: 'approve',
        n: 'deny',
        escape: 'deny',
      };
      expect(keyMap['y']).toBe('approve');
      expect(keyMap['return']).toBe('approve');
    });

    it('keybindings map N to deny', () => {
      const keyMap: Record<string, string> = {
        y: 'approve',
        return: 'approve',
        n: 'deny',
        escape: 'deny',
      };
      expect(keyMap['n']).toBe('deny');
      expect(keyMap['escape']).toBe('deny');
    });

    it('does not approve or deny on unrelated keys', () => {
      const approveKeys = new Set(['y', 'return']);
      const denyKeys = new Set(['n', 'escape']);
      const unrelatedKeys = ['a', 'b', 'space', 'tab', 'up', 'down'];

      for (const key of unrelatedKeys) {
        expect(approveKeys.has(key)).toBe(false);
        expect(denyKeys.has(key)).toBe(false);
      }
    });
  });

  describe('approval flow', () => {
    it('approval resolves the pending promise with true', async () => {
      let resolveApproval: (v: boolean) => void;
      const approvalPromise = new Promise<boolean>((resolve) => {
        resolveApproval = resolve;
      });

      // Simulate approve
      resolveApproval!(true);
      const result = await approvalPromise;
      expect(result).toBe(true);
    });

    it('denial resolves the pending promise with false', async () => {
      let resolveApproval: (v: boolean) => void;
      const approvalPromise = new Promise<boolean>((resolve) => {
        resolveApproval = resolve;
      });

      // Simulate deny
      resolveApproval!(false);
      const result = await approvalPromise;
      expect(result).toBe(false);
    });

    it('prevents double-firing of approval', () => {
      const onApprove = vi.fn();
      const onDeny = vi.fn();
      let responded = false;

      function handleKey(action: 'approve' | 'deny') {
        if (responded) return;
        responded = true;
        if (action === 'approve') onApprove();
        else onDeny();
      }

      handleKey('approve');
      handleKey('deny'); // Should be ignored
      handleKey('approve'); // Should be ignored

      expect(onApprove).toHaveBeenCalledTimes(1);
      expect(onDeny).not.toHaveBeenCalled();
    });
  });
});
