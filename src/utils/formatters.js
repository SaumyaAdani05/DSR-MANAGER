import { LOCALE, TIMEZONE } from './constants';

export const formatINR = (value) =>
  new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const formatNumber = (value) =>
  new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const formatDisplayDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export const formatFirestoreDate = (date) => {
  const d = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatExportDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}${month}${year}`;
};

export const getTodayIST = () => {
  return formatFirestoreDate(new Date());
};

export const formatMonthYear = (dateStr) => {
  const [year, month] = dateStr.split('-');
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
};

export const getMonthName = (monthNum) => {
  const date = new Date(2026, monthNum - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long' });
};
