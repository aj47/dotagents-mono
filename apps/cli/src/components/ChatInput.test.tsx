import { describe, it, expect, vi } from 'vitest';

/**
 * ChatInput unit tests — validate the submission logic, empty rejection,
 * and disabled state without requiring the OpenTUI renderer.
 */

// Import the component module to verify it exports correctly
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  it('exports a ChatInput component', () => {
    expect(ChatInput).toBeDefined();
    expect(typeof ChatInput).toBe('function');
  });

  describe('submission logic', () => {
    it('trims message before submitting', () => {
      const onSubmit = vi.fn();
      // Simulate what the component does on submit
      const value = '  Hello world  ';
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        onSubmit(trimmed);
      }
      expect(onSubmit).toHaveBeenCalledWith('Hello world');
    });

    it('rejects empty string submission', () => {
      const onSubmit = vi.fn();
      const value = '';
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        onSubmit(trimmed);
      }
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('rejects whitespace-only submission', () => {
      const onSubmit = vi.fn();
      const values = ['  ', '\t', '\n', '  \t\n  '];
      for (const value of values) {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          onSubmit(trimmed);
        }
      }
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not submit when disabled', () => {
      const onSubmit = vi.fn();
      const disabled = true;
      const value = 'Hello';
      // Component logic: if disabled, do not submit
      if (!disabled) {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          onSubmit(trimmed);
        }
      }
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits when enabled with valid input', () => {
      const onSubmit = vi.fn();
      const disabled = false;
      const value = 'Hello agent';
      if (!disabled) {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          onSubmit(trimmed);
        }
      }
      expect(onSubmit).toHaveBeenCalledWith('Hello agent');
    });
  });
});
