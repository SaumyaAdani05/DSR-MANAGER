import bcrypt from 'bcryptjs';
import { db } from '../db/localDB.js';
import { queueSync } from './syncService.js';
import { getSupabaseClient } from '../db/supabaseClient.js';

export const loginWithGoogle = async () => {
  if (!navigator.onLine) {
    throw new Error('You must be online to log in with Google.');
  }
  const client = await getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Cannot log in with Google.');
  }

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/login',
    },
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const signUpOwner = async (email, password) => {
  if (!navigator.onLine) {
    throw new Error('You must be online to register.');
  }
  const client = await getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Cannot register.');
  }

  const { data, error } = await client.auth.signUp({ email, password });
  if (error) {
    throw new Error(error.message);
  }

  // Hash password locally for offline login capability
  const hash = await bcrypt.hash(password, 10);
  
  await db.auth.put({
    id: 'owner',
    username: email,
    passwordHash: hash,
    securityQuestion: '',
    securityAnswerHash: '',
    isFirstLogin: true,
    updatedAt: new Date().toISOString(),
  });

  const supabaseSession = data.session;
  if (supabaseSession) {
    const session = {
      isAuthenticated: true,
      sessionId: supabaseSession.access_token,
      loginTime: new Date().toISOString(),
      username: email,
      isFirstLogin: true,
    };
    localStorage.setItem('dsr_session', JSON.stringify(session));
    return { session, requiresVerification: false };
  } else {
    return { session: null, requiresVerification: true };
  }
};

export const loginOwner = async (username, password) => {
  const isEmail = username.includes('@');
  
  if (isEmail && navigator.onLine) {
    const client = await getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.signInWithPassword({
        email: username,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.session) {
        // Hash password locally so offline access works with these credentials
        const hash = await bcrypt.hash(password, 10);
        const owner = await db.auth.get('owner');
        
        await db.auth.put({
          id: 'owner',
          username,
          passwordHash: hash,
          securityQuestion: owner?.securityQuestion || '',
          securityAnswerHash: owner?.securityAnswerHash || '',
          isFirstLogin: owner ? owner.isFirstLogin : true,
          updatedAt: new Date().toISOString(),
        });

        const session = {
          isAuthenticated: true,
          sessionId: data.session.access_token,
          loginTime: new Date().toISOString(),
          username,
          isFirstLogin: owner ? owner.isFirstLogin : true,
        };

        localStorage.setItem('dsr_session', JSON.stringify(session));
        return session;
      }
    }
  }

  // Offline or legacy username login fallback
  const owner = await db.auth.get('owner');
  if (!owner || owner.username !== username) {
    throw new Error('Invalid username or password');
  }

  // Google OAuth users won't have local password hash if they haven't set one
  if (!owner.passwordHash) {
    throw new Error('This account is configured for Google Sign-In. Please sign in with Google.');
  }

  const match = await bcrypt.compare(password, owner.passwordHash);
  if (!match) {
    throw new Error('Invalid username or password');
  }

  const session = {
    isAuthenticated: true,
    sessionId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    loginTime: new Date().toISOString(),
    username: owner.username,
    isFirstLogin: owner.isFirstLogin,
  };

  localStorage.setItem('dsr_session', JSON.stringify(session));
  return session;
};

export const logoutOwner = async () => {
  localStorage.removeItem('dsr_session');
  try {
    const client = await getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
  } catch (err) {
    console.error('Error signing out from Supabase:', err);
  }
};

export const getSession = async () => {
  try {
    const sessionStr = localStorage.getItem('dsr_session');
    if (!sessionStr) return null;
    const session = JSON.parse(sessionStr);
    if (!session.isAuthenticated) return null;

    const owner = await db.auth.get('owner');
    if (!owner) return null;

    return {
      isAuthenticated: true,
      username: owner.username,
      isFirstLogin: owner.isFirstLogin,
    };
  } catch (err) {
    return null;
  }
};

export const getOwnerData = async () => {
  return db.auth.get('owner');
};

export const verifySecurityAnswer = async (answer) => {
  const owner = await db.auth.get('owner');
  if (!owner || !owner.securityAnswerHash) {
    throw new Error('Security question not set up');
  }
  const match = await bcrypt.compare(answer.trim().toLowerCase(), owner.securityAnswerHash);
  if (!match) {
    throw new Error('Incorrect answer');
  }
  return true;
};

export const updatePassword = async (currentPassword, newPassword) => {
  const owner = await db.auth.get('owner');
  const match = await bcrypt.compare(currentPassword, owner.passwordHash);
  if (!match) {
    throw new Error('Current password is incorrect');
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await db.auth.update('owner', { passwordHash: hash, updatedAt: new Date().toISOString() });
  await queueSync('auth', 'owner', { id: 'owner', password_hash: hash });
};

export const resetPassword = async (newPassword) => {
  const hash = await bcrypt.hash(newPassword, 10);
  await db.auth.update('owner', { passwordHash: hash, updatedAt: new Date().toISOString() });
  await queueSync('auth', 'owner', { id: 'owner', password_hash: hash });
};

export const updateSecurityQuestion = async (question, answer) => {
  const answerHash = await bcrypt.hash(answer.trim().toLowerCase(), 10);
  const updatedAt = new Date().toISOString();
  await db.auth.update('owner', {
    securityQuestion: question.trim(),
    securityAnswerHash: answerHash,
    isFirstLogin: false,
    updatedAt,
  });
  await queueSync('auth', 'owner', {
    id: 'owner',
    security_question: question.trim(),
    security_answer_hash: answerHash,
    is_first_login: false,
    updated_at: updatedAt,
  });
};

export const skipSecuritySetup = async () => {
  const updatedAt = new Date().toISOString();
  await db.auth.update('owner', { isFirstLogin: false, updatedAt });
  await queueSync('auth', 'owner', {
    id: 'owner',
    is_first_login: false,
    updated_at: updatedAt,
  });
};
