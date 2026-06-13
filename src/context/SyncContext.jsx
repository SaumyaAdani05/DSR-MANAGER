import { createContext, useContext, useState } from 'react';

const SyncContext = createContext(null);

export const SyncProvider = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState('synced');
  // 'synced' | 'syncing' | 'offline' | 'error'

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
