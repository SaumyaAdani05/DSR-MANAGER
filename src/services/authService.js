import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { SESSION_KEY } from '../utils/constants';

const OWNER_KEY = 'dsr_owner';

// Helper to get or initialize owner (self-seeding)
const getOrInitializeOwner = () => {
  const owner = localStorage.getItem(OWNER_KEY);
  if (!owner) {
    // Seed default owner: username 'Adani0510', password 'Adani@mem0510'
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('Adani@mem0510', salt);
    const defaultOwner = {
      username: 'Adani0510',
      passwordHash,
      securityQuestion: '',
      securityAnswerHash: '',
      isFirstLogin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(OWNER_KEY, JSON.stringify(defaultOwner));
    return defaultOwner;
  }
  return JSON.parse(owner);
};

const saveOwner = (ownerData) => {
  localStorage.setItem(OWNER_KEY, JSON.stringify({
    ...ownerData,
    updatedAt: new Date().toISOString()
  }));
};

export const loginOwner = async (username, password) => {
  const ownerData = getOrInitializeOwner();

  if (ownerData.username !== username) {
    throw new Error('Invalid username or password');
  }

  const isMatch = await bcrypt.compare(password, ownerData.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid username or password');
  }

  const sessionId = uuidv4();
  const session = {
    isAuthenticated: true,
    sessionId,
    loginTime: new Date().toISOString(),
    isFirstLogin: ownerData.isFirstLogin || false,
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
  return getOrInitializeOwner();
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
  ownerData.passwordHash = newHash;
  saveOwner(ownerData);
};

export const resetPassword = async (newPassword) => {
  const ownerData = await getOwnerData();
  const newHash = await bcrypt.hash(newPassword, 10);
  ownerData.passwordHash = newHash;
  saveOwner(ownerData);
};

export const updateSecurityQuestion = async (question, answer) => {
  const answerHash = await bcrypt.hash(answer.toLowerCase().trim(), 10);
  const ownerData = await getOwnerData();
  ownerData.securityQuestion = question;
  ownerData.securityAnswerHash = answerHash;
  ownerData.isFirstLogin = false;
  saveOwner(ownerData);

  // Update session to reflect first login completed
  const session = getSession();
  if (session) {
    session.isFirstLogin = false;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
};

export const skipSecuritySetup = () => {
  const session = getSession();
  if (session) {
    session.isFirstLogin = false;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
};
