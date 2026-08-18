export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

class NotificationService {
  /**
   * Check if browser supports notifications
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Get current permission state
   */
  getPermissionState(): NotificationPermissionState {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      return result;
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
      return 'denied';
    }
  }

  /**
   * Show a browser notification
   */
  async showNotification(title: string, options: NotificationOptions = {}): Promise<boolean> {
    if (this.getPermissionState() !== 'granted') {
      return false;
    }

    const defaultOptions: any = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      tag: 'yjs-scheduler-reminder',
      renotify: true,
      ...options,
    };

    // If service worker is ready, use it for rich notification handling
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, defaultOptions);
          return true;
        }
      } catch (e) {
        console.warn('Service worker notification failed, falling back to window.Notification:', e);
      }
    }

    try {
      new Notification(title, defaultOptions);
      return true;
    } catch (e) {
      console.warn('Could not display window notification:', e);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
