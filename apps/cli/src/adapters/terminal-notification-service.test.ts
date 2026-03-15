import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TerminalNotificationService } from './terminal-notification-service';

describe('TerminalNotificationService', () => {
  let service: TerminalNotificationService;

  beforeEach(() => {
    service = new TerminalNotificationService();
  });

  it('showNotification outputs to console', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const bellSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    service.showNotification('Test', 'Hello');

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Test')
    );
    expect(bellSpy).toHaveBeenCalledWith('\x07');

    spy.mockRestore();
    bellSpy.mockRestore();
  });

  it('showNotificationWithOptions outputs to console', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    service.showNotificationWithOptions({
      title: 'Alert',
      body: 'Something happened',
    });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Alert')
    );

    spy.mockRestore();
  });

  it('showNotificationWithOptions rings bell for critical urgency', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const bellSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    service.showNotificationWithOptions({
      title: 'Critical',
      body: 'Urgent message',
      urgency: 'critical',
    });

    expect(bellSpy).toHaveBeenCalledWith('\x07');

    spy.mockRestore();
    bellSpy.mockRestore();
  });

  it('showNotificationWithOptions does not ring bell for non-critical', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const bellSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    service.showNotificationWithOptions({
      title: 'Info',
      body: 'Just info',
      urgency: 'low',
    });

    expect(bellSpy).not.toHaveBeenCalled();

    spy.mockRestore();
    bellSpy.mockRestore();
  });

  it('isSupported returns true', () => {
    expect(service.isSupported()).toBe(true);
  });
});
