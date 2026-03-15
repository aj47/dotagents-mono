import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TerminalUserInteraction } from './terminal-user-interaction';

describe('TerminalUserInteraction', () => {
  let interaction: TerminalUserInteraction;

  beforeEach(() => {
    interaction = new TerminalUserInteraction();
  });

  it('showError logs to stderr', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    interaction.showError('Test Error', 'Something went wrong');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Test Error')
    );
    spy.mockRestore();
  });

  it('showWarning logs a warning', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    interaction.showWarning('Test Warning', 'Be careful');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Test Warning')
    );
    spy.mockRestore();
  });

  it('showInfo logs an info message', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    interaction.showInfo('Test Info', 'FYI');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Test Info')
    );
    spy.mockRestore();
  });

  it('pickFile returns null (not yet implemented)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await interaction.pickFile({});
    expect(result).toBeNull();
  });

  it('saveFile returns null (not yet implemented)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await interaction.saveFile({});
    expect(result).toBeNull();
  });

  it('requestApproval auto-approves and returns true', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await interaction.requestApproval({
      toolName: 'test-tool',
      args: { path: '/test' },
    });
    expect(result).toBe(true);
  });

  it('confirm auto-confirms and returns true', async () => {
    const result = await interaction.confirm('Confirm?', 'Are you sure?');
    expect(result).toBe(true);
  });
});
