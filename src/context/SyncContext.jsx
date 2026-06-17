import { createContext, useContext, useState, useEffect } from 'react';

const SyncContext = createContext(null);

export const SyncProvider = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState('synced');
  // 'synced' | 'syncing' | 'offline' | 'error'

  useEffect(() => {
    const handleSyncChange = (e) => {
      if (e.detail) {
        setSyncStatus(e.detail);
      }
    };
    window.addEventListener('sync-status-change', handleSyncChange);
    return () => {
      window.removeEventListener('sync-status-change', handleSyncChange);
    };
  }, []);

  return (
    <SyncContext.Provider value={{ syncStatus, setSyncStatus }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncStatus = () => {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSyncStatus must be used within SyncProvider');
  return ctx;
};
