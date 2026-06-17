import bcrypt from 'bcryptjs';
import { db } from '../db/localDB.js';
import { queueSync } from './syncService.js';

export const loginOwner = async (username, password) => {
  const owner = await db.auth.get('owner');
  if (!owner || owner.username !== username) {
    throw new Error('Invalid username or password');
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
