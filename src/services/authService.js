import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { SESSION_KEY } from '../utils/constants';
import { db } from '../db/localDB';
import { queueSync } from './syncService';

export const loginOwner = async (username, password) => {
  // Try to load owner details from Dexie. If Dexie hasn't finished seeding, retry
  let owner = await db.auth.get('owner');
  if (!owner) {
    // Wait briefly and try again, in case db populate is in progress
    await new Promise(resolve => setTimeout(resolve, 300));
    owner = await db.auth.get('owner');
  }
  
  if (!owner || owner.username !== username) {
    throw new Error('Invalid username or password');
  }

  const isMatch = await bcrypt.compare(password, owner.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid username or password');
  }

  const sessionId = uuidv4();
  const session = {
    isAuthenticated: true,
    sessionId,
    loginTime: new Date().toISOString(),
    isFirstLogin: owner.isFirstLogin || false,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const logoutOwner = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    return session?.isAuthenticated ? session : null;
  } catch {
    return null;
  }
};

export const getOwnerData = async () => {
  return db.auth.get('owner');
};

export const verifyUsername = async (username) => {
  const ownerData = await getOwnerData();
  if (!ownerData || ownerData.username !== username) {
    throw new Error('Username not found');
  }
  return {
    securityQuestion: ownerData.securityQuestion,
    hasSecurityQuestion: !!ownerData.securityQuestion,
  };
};

export const verifySecurityAnswer = async (answer) => {
  const ownerData = await getOwnerData();
  if (!ownerData || !ownerData.securityAnswerHash) {
    throw new Error('Security question not set up');
  }

  const isMatch = await bcrypt.compare(answer.toLowerCase().trim(), ownerData.securityAnswerHash);
  if (!isMatch) {
    throw new Error('Incorrect answer');
  }

  return {
    username: ownerData.username,
    passwordHash: ownerData.passwordHash,
  };
};

export const updatePassword = async (currentPassword, newPassword) => {
  const ownerData = await getOwnerData();
  const isMatch = await bcrypt.compare(currentPassword, ownerData.passwordHash);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  const updatedAt = new Date().toISOString();
  await db.auth.update('owner', { passwordHash: newHash, updatedAt });
  await queueSync('auth', 'owner', { id: 'owner', password_hash: newHash, updated_at: updatedAt });
};

export const resetPassword = async (newPassword) => {
  const newHash = await bcrypt.hash(newPassword, 10);
  const updatedAt = new Date().toISOString();
  await db.auth.update('owner', { passwordHash: newHash, updatedAt });
  await queueSync('auth', 'owner', { id: 'owner', password_hash: newHash, updated_at: updatedAt });
};

export const updateSecurityQuestion = async (question, answer) => {
  const answerHash = await bcrypt.hash(answer.toLowerCase().trim(), 10);
  const updatedAt = new Date().toISOString();
  await db.auth.update('owner', {
    securityQuestion: question,
    securityAnswerHash: answerHash,
    isFirstLogin: false,
    updatedAt,
  });

  await queueSync('auth', 'owner', {
    id: 'owner',
    security_question: question,
    security_answer_hash: answerHash,
    is_first_login: false,
    updated_at: updatedAt,
  });

  // Update session to reflect first login completed
  const session = getSession();
  if (session) {
    session.isFirstLogin = false;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
};

export const skipSecuritySetup = async () => {
  const updatedAt = new Date().toISOString();
  await db.auth.update('owner', { isFirstLogin: false, updatedAt });
  await queueSync('auth', 'owner', { id: 'owner', is_first_login: false, updated_at: updatedAt });

  const session = getSession();
  if (session) {
    session.isFirstLogin = false;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
};
