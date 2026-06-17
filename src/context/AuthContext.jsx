import { createContext, useContext, useState, useEffect } from 'react';
import { getSession, loginOwner, logoutOwner } from '../services/authService.js';

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
    const initAuth = async () => {
      try {
        const existingSession = await getSession();
        if (existingSession) {
          setSession(existingSession);
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const newSession = await loginOwner(username, password);
    setSession(newSession);
    return newSession;
  };

  const logout = async () => {
    await logoutOwner();
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
