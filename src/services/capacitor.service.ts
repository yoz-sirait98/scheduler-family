import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type BackButtonHandler = () => boolean; // Returns true if handled, false to continue default

class CapacitorService {
  private backButtonHandlers: BackButtonHandler[] = [];
  private isInitialized = false;

  /**
   * Check if running on native mobile (iOS or Android)
   */
  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Get current platform: 'android' | 'ios' | 'web'
   */
  get platform(): 'android' | 'ios' | 'web' {
    const p = Capacitor.getPlatform();
    if (p === 'android') return 'android';
    if (p === 'ios') return 'ios';
    return 'web';
  }

  /**
   * Initialize native features, status bar, splash screen, and hardware back button
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.isNative) {
      return;
    }

    try {
      // 1. Hide splash screen smoothly after app mounts
      await SplashScreen.hide();
    } catch (e) {
      console.warn('Capacitor splash screen hide error:', e);
    }

    try {
      // 2. Configure status bar
      await this.updateThemeStatusBar(document.documentElement.classList.contains('dark'));
    } catch (e) {
      console.warn('Capacitor status bar init error:', e);
    }

    try {
      // 3. Register hardware back button listener for Android
      App.addListener('backButton', ({ canGoBack }) => {
        // Run registered custom handlers from newest to oldest
        for (let i = this.backButtonHandlers.length - 1; i >= 0; i--) {
          const handler = this.backButtonHandlers[i];
          if (handler && handler()) {
            return; // Handled (e.g. closed a modal)
          }
        }

        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
    } catch (e) {
      console.warn('Capacitor back button listener error:', e);
    }
  }

  /**
   * Register a custom back-button handler (e.g. for closing open modals/sheets)
   * Returns an unregister function
   */
  registerBackButtonHandler(handler: BackButtonHandler): () => void {
    this.backButtonHandlers.push(handler);
    return () => {
      const idx = this.backButtonHandlers.indexOf(handler);
      if (idx !== -1) {
        this.backButtonHandlers.splice(idx, 1);
      }
    };
  }

  /**
   * Update status bar style according to light/dark mode
   */
  async updateThemeStatusBar(isDark: boolean): Promise<void> {
    if (!this.isNative) return;
    try {
      if (isDark) {
        await StatusBar.setStyle({ style: Style.Dark });
        if (this.platform === 'android') {
          await StatusBar.setBackgroundColor({ color: '#0f172a' });
        }
      } else {
        await StatusBar.setStyle({ style: Style.Light });
        if (this.platform === 'android') {
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
        }
      }
    } catch (e) {
      console.warn('Failed to update native status bar:', e);
    }
  }

  /**
   * Tactile Haptic Feedback
   */
  async triggerHaptic(type: 'selection' | 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' = 'selection'): Promise<void> {
    if (!this.isNative) return;
    try {
      switch (type) {
        case 'selection':
          await Haptics.selectionStart();
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'medium':
        default:
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
      }
    } catch {
      // Haptics not available or suppressed
    }
  }

  /**
   * Listen for app state changes (e.g. resumed from background)
   */
  onAppStateChange(callback: (isActive: boolean) => void): () => void {
    if (!this.isNative) return () => {};

    let removeHandle: any = null;
    App.addListener('appStateChange', (state) => {
      callback(state.isActive);
    }).then((handle) => {
      removeHandle = handle;
    });

    return () => {
      if (removeHandle) {
        removeHandle.remove();
      }
    };
  }
}

export const capacitorService = new CapacitorService();
