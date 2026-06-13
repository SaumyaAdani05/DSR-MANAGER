import { createContext, useContext, useState, useEffect } from 'react';
import { getSession, loginOwner, logoutOwner } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    const existingSession = getSession();
    if (existingSession) {
      setSession(existingSession);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const newSession = await loginOwner(username, password);
    setSession(newSession);
    return newSession;
  };

  const logout = () => {
    logoutOwner();
    setSession(null);
  };

  const value = {
    session,
    isAuthenticated: !!session?.isAuthenticated,
    isFirstLogin: session?.isFirstLogin || false,
    isReadOnly,
    setIsReadOnly,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
