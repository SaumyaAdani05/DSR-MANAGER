import { useState, useEffect } from 'react';
import { startSync, stopSync } from '../services/syncService';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      startSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      stopSync();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Start background sync on boot if online
    if (navigator.onLine) {
      startSync();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
