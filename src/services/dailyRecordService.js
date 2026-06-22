import { db } from '../db/localDB.js';
import { queueSync } from './syncService.js';

/**
 * Fetch daily record (expense, note, cms) for a given date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<{date: string, expense: number, expenseNote: string, cms: number}>}
 */
export const getDailyRecord = async (date) => {
  const result = await db.dailyRecords.get(date);
  if (result) {
    return result;
  }
  return {
    date,
    expenses: [],
    cms: 0,
  };
};

/**
 * Save daily record (expenses, cms) for a given date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {{expenses: Array<{amount: number, note: string}>, cms: number}} record
 */
export const saveDailyRecord = async (date, record) => {
  const now = new Date().toISOString();
  const payload = {
    date,
    expenses: Array.isArray(record.expenses)
      ? record.expenses.map(e => ({
          amount: parseFloat(e.amount || 0),
          note: (e.note || '').trim()
        }))
      : [],
    cms: parseFloat(record.cms || 0),
    updatedAt: now,
  };

  await db.dailyRecords.put(payload);

  // Queue to sync to Supabase
  await queueSync('daily_records', date, {
    date,
    expenses: payload.expenses,
    cms: payload.cms,
    updatedAt: now,
  });

  return payload;
};
