import { Notification } from "electron"
import type { NotificationService, NotificationOptions } from "@dotagents/core"

/**
 * Electron-specific NotificationService implementation.
 * Uses Electron's Notification API for system-level notifications.
 */
export class ElectronNotificationService implements NotificationService {
  showNotification(title: string, body: string): void {
    if (!Notification.isSupported()) return
    const notification = new Notification({ title, body })
    notification.show()
  }

  showNotificationWithOptions(options: NotificationOptions): void {
    if (!Notification.isSupported()) return
    const notification = new Notification({
      title: options.title,
      body: options.body,
      silent: options.silent,
      urgency: options.urgency,
    })
    notification.show()
  }

  isSupported(): boolean {
    return Notification.isSupported()
  }
}
