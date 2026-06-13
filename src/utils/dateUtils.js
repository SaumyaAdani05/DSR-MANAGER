import { TIMEZONE, DATA_RETENTION_DAYS } from './constants';

export const getNowIST = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
};

export const getTodayStr = () => {
  const now = getNowIST();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getPreviousDateStr = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() - 1);
  return formatDateStr(d);
};

export const getNextDateStr = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + 1);
  return formatDateStr(d);
};

export const formatDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCutoffDate = () => {
  const now = getNowIST();
  now.setDate(now.getDate() - DATA_RETENTION_DAYS);
  return formatDateStr(now);
};

export const isWithinRetention = (dateStr) => {
  return dateStr >= getCutoffDate();
};

export const isFutureDate = (dateStr) => {
  return dateStr > getTodayStr();
};

export const isToday = (dateStr) => {
  return dateStr === getTodayStr();
};

export const calcEditExpiry = (savedAt) => {
  const expiry = new Date(savedAt);
  expiry.setHours(expiry.getHours() + 48);
  return expiry;
};

export const isEditable = (shift) => {
  if (!shift || !shift.isSaved) return true;
  const now = Date.now();
  const expiry = shift.editWindowExpiry instanceof Date
    ? shift.editWindowExpiry.getTime()
    : shift.editWindowExpiry?.toMillis?.() || 0;
  return now < expiry;
};

export const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month - 1, 1).getDay();
};
