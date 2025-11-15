import { useEffect } from 'react';
import { showError, showSuccess } from '../utils/toast';

/**
 * Custom hook to detect and handle network status changes
 * Shows toast notifications when user goes online/offline
 */
export function useNetworkStatus() {
  useEffect(() => {
    const handleOnline = () => {
      showSuccess('Connection restored');
      console.log('Network status: Online');
    };

    const handleOffline = () => {
      showError('You are offline. Please check your connection.');
      console.log('Network status: Offline');
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      console.log('Network status: Offline (initial)');
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}
