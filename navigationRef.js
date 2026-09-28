/**
 * Central navigation ref shared between App.js (NavigationContainer) and
 * the push-notification response listener.
 *
 * Usage:
 *   import { navigationRef, navigateWhenReady } from './navigationRef';
 *
 *   // In App.js:
 *   <NavigationContainer ref={navigationRef} ...>
 *
 *   // From anywhere:
 *   navigateWhenReady('ReportDetail', { reportId: '...' });
 */
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Safe navigate: defers until the NavigationContainer is mounted and ready.
 * Uses a 50 ms polling loop that abandons after 3 s to avoid infinite loops
 * in edge cases (e.g., app never fully mounts due to an error).
 */
export function navigateWhenReady(screen, params, attempts = 0) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(screen, params);
    return;
  }

  if (attempts > 60) {
    // 60 × 50 ms = 3 s max wait — abandon silently.
    console.warn('[navigationRef] NavigationContainer not ready after 3 s; dropping navigation.');
    return;
  }

  setTimeout(() => navigateWhenReady(screen, params, attempts + 1), 50);
}
