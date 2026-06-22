import { createContext, useContext, useState, useEffect } from 'react';
import { getSession, loginOwner, logoutOwner, signUpOwner, loginWithGoogle } from '../services/authService.js';
import { getSupabaseClient } from '../db/supabaseClient.js';
import { db } from '../db/localDB.js';

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
    let authListener = null;

    const initAuth = async () => {
      try {
        const client = await getSupabaseClient();
        if (client) {
          // Listen for Supabase auth events
          const { data } = client.auth.onAuthStateChange(async (event, supabaseSession) => {
            if (supabaseSession) {
              const email = supabaseSession.user.email;
              const owner = await db.auth.get('owner');

              // If local auth table doesn't have an owner, or it doesn't match this user, update it
              if (!owner || owner.username !== email) {
                await db.auth.put({
                  id: 'owner',
                  username: email,
                  passwordHash: '', // Google users don't have local passwords by default
                  securityQuestion: '',
                  securityAnswerHash: '',
                  isFirstLogin: !owner, // If new db, set isFirstLogin to true for setup
                  updatedAt: new Date().toISOString(),
                });
              }

              const localOwner = await db.auth.get('owner');
              const newSession = {
                isAuthenticated: true,
                sessionId: supabaseSession.access_token,
                loginTime: new Date().toISOString(),
                username: email,
                isFirstLogin: localOwner ? localOwner.isFirstLogin : false,
              };

              localStorage.setItem('dsr_session', JSON.stringify(newSession));
              setSession(newSession);
            } else if (event === 'SIGNED_OUT') {
              localStorage.removeItem('dsr_session');
              setSession(null);
            }
          });
          authListener = data?.subscription;
        }

        // Always check if there's a cached local session to keep the user logged in offline
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

    return () => {
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const login = async (username, password) => {
    const newSession = await loginOwner(username, password);
    setSession(newSession);
    return newSession;
  };

  const register = async (email, password) => {
    const result = await signUpOwner(email, password);
    if (result.session) {
      setSession(result.session);
    }
    return result;
  };

  const loginGoogle = async () => {
    await loginWithGoogle();
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
    register,
    loginGoogle,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
