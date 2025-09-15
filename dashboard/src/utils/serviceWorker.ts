/**
 * Service Worker Registration Utility
 * Handles PWA installation and service worker lifecycle
 * Epic 21.5.2 - Mobile Experience Enhancement
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

class PWAManager {
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private installStateListeners: ((state: PWAInstallState) => void)[] = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Check if already installed
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('[PWA] Install prompt available');
      event.preventDefault();
      this.installPrompt = event;
      this.notifyStateChange();
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.installPrompt = null;
      this.notifyStateChange();
    });

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (event) => {
      this.isInstalled = event.matches;
      this.notifyStateChange();
    });
  }

  public getInstallState(): PWAInstallState {
    return {
      isInstallable: 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window,
      isInstalled: this.isInstalled,
      canInstall: !!this.installPrompt,
      installPrompt: this.installPrompt
    };
  }

  public async install(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('[PWA] No install prompt available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choice = await this.installPrompt.userChoice;

      console.log('[PWA] User choice:', choice.outcome);

      if (choice.outcome === 'accepted') {
        console.log('[PWA] User accepted installation');
        this.installPrompt = null;
        this.notifyStateChange();
        return true;
      } else {
        console.log('[PWA] User dismissed installation');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Installation failed:', error);
      return false;
    }
  }

  public onStateChange(callback: (state: PWAInstallState) => void) {
    this.installStateListeners.push(callback);
    // Immediately call with current state
    callback(this.getInstallState());
  }

  public removeStateChangeListener(callback: (state: PWAInstallState) => void) {
    const index = this.installStateListeners.indexOf(callback);
    if (index > -1) {
      this.installStateListeners.splice(index, 1);
    }
  }

  private notifyStateChange() {
    const state = this.getInstallState();
    this.installStateListeners.forEach(callback => callback(state));
  }
}

// Global PWA manager instance
const pwaManager = new PWAManager();

/**
 * Register service worker
 */
export async function registerSW(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      console.log('[SW] Registering service worker...');

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW] Service worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('[SW] New version available, consider refreshing');
              // You could show a notification to the user here
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_INFO') {
          console.log('[SW] Cache info:', event.data.caches);
        }
      });

      return true;
    } catch (error) {
      console.error('[SW] Service worker registration failed:', error);
      return false;
    }
  } else {
    console.warn('[SW] Service workers not supported');
    return false;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterSW(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const unregisterPromises = registrations.map(registration => registration.unregister());

      await Promise.all(unregisterPromises);
      console.log('[SW] Service worker unregistered');
      return true;
    } catch (error) {
      console.error('[SW] Service worker unregistration failed:', error);
      return false;
    }
  }
  return true;
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

/**
 * Get PWA installation state
 */
export function getPWAState(): PWAInstallState {
  return pwaManager.getInstallState();
}

/**
 * Install PWA
 */
export async function installPWA(): Promise<boolean> {
  return pwaManager.install();
}

/**
 * Listen for PWA state changes
 */
export function onPWAStateChange(callback: (state: PWAInstallState) => void) {
  pwaManager.onStateChange(callback);
}

/**
 * Remove PWA state change listener
 */
export function removePWAStateChangeListener(callback: (state: PWAInstallState) => void) {
  pwaManager.removeStateChangeListener(callback);
}

/**
 * Check online status
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onNetworkChange(callback: (online: boolean) => void) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Request background sync
 */
export async function requestBackgroundSync(tag: string = 'background-sync'): Promise<boolean> {
  if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration?.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log('[SW] Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[SW] Background sync registration failed:', error);
      return false;
    }
  }
  return false;
}

/**
 * Send message to service worker
 */
export async function sendSWMessage(message: any): Promise<any> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const messageChannel = new MessageChannel();

      return new Promise((resolve, reject) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.error) {
            reject(event.data.error);
          } else {
            resolve(event.data);
          }
        };

        registration.active?.postMessage(message, [messageChannel.port2]);
      });
    } catch (error) {
      console.error('[SW] Message sending failed:', error);
      throw error;
    }
  }
  throw new Error('Service workers not supported');
}

export default {
  registerSW,
  unregisterSW,
  isStandalone,
  getPWAState,
  installPWA,
  onPWAStateChange,
  removePWAStateChangeListener,
  isOnline,
  onNetworkChange,
  requestBackgroundSync,
  sendSWMessage
};