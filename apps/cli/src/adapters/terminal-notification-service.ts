import type {
  NotificationService,
  NotificationOptions,
} from '@dotagents/core';

/**
 * Terminal-based NotificationService implementation.
 *
 * Uses terminal bell for urgent notifications and
 * simple console output for non-urgent ones.
 * Full desktop notifications are not available in terminal mode.
 */
export class TerminalNotificationService implements NotificationService {
  showNotification(title: string, body: string): void {
    // Terminal bell + console output
    process.stderr.write('\x07');
    console.log(`\x1b[35m[NOTIFICATION] ${title}: ${body}\x1b[0m`);
  }

  showNotificationWithOptions(options: NotificationOptions): void {
    if (options.urgency === 'critical') {
      // Terminal bell for critical notifications
      process.stderr.write('\x07');
    }
    console.log(
      `\x1b[35m[NOTIFICATION] ${options.title}: ${options.body}\x1b[0m`
    );
  }

  isSupported(): boolean {
    // Terminal notifications (bell + console) are always available
    return true;
  }
}
