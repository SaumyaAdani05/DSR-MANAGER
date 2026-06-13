export const APP_NAME = 'DSR Manager';
export const DEFAULT_STATION_NAME = 'Memnagar CNG';
export const DEFAULT_USERNAME = 'Adani0510';
export const DEFAULT_PASSWORD = 'Adani@mem0510';
export const SESSION_KEY = 'dsr_session';
export const MAX_NOZZLES = 15;
export const MAX_EMPLOYEES = 50;
export const MAX_SHIFTS = 3;
export const EDIT_WINDOW_HOURS = 48;
export const DATA_RETENTION_DAYS = 750;
export const BCRYPT_ROUNDS = 10;
export const CURRENCY = '₹';
export const TIMEZONE = 'Asia/Kolkata';
export const LOCALE = 'en-IN';

export const SHIFT_LABELS = ['SHIFT 1', 'SHIFT 2', 'SHIFT 3'];

export const PASSWORD_RULES = {
  minLength: 6,
  maxLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: '@#$',
};

export const COLLECTIONS = {
  AUTH: 'auth',
  CONFIG: 'config',
  METADATA: 'metadata',
  SESSIONS: 'sessions',
  RECORDS: 'records',
};

export const DOCS = {
  OWNER: 'owner',
  SETTINGS: 'settings',
  NOZZLES: 'nozzles',
  EMPLOYEES: 'employees',
  CALENDAR: 'calendar',
};
