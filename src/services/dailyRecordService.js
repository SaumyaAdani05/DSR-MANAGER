import { db } from '../db/localDB.js';
import { queueSync } from './syncService.js';
import { saveDebitCashPartyEntry, removeDebitEntriesForDate } from './billService.js';

/**
 * Fetch daily record (expenses, cms, debitedCash) for a given date
 * @param {string} date - Date in YYYY-MM-DD format
 */
export const getDailyRecord = async (date) => {
  const result = await db.dailyRecords.get(date);
  if (result) {
    return {
      ...result,
      debitedCash: result.debitedCash || [],
    };
  }
  return {
    date,
    expenses: [],
    cms: 0,
    debitedCash: [],
  };
};

/**
 * Save daily record (expenses, cms, debitedCash) for a given date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {{expenses: Array<{amount: number, note: string}>, cms: number, debitedCash: Array<{amount: number, partyId: string, partyName: string}>}} record
 */
export const saveDailyRecord = async (date, record) => {
  const now = new Date().toISOString();
  const debitedCash = Array.isArray(record.debitedCash)
    ? record.debitedCash.map(d => ({
        amount: parseFloat(d.amount || 0),
        partyId: d.partyId || '',
        partyName: d.partyName || '',
      }))
    : [];

  const payload = {
    date,
    expenses: Array.isArray(record.expenses)
      ? record.expenses.map(e => ({
          amount: parseFloat(e.amount || 0),
          note: (e.note || '').trim()
        }))
      : [],
    cms: parseFloat(record.cms || 0),
    debitedCash,
    updatedAt: now,
  };

  await db.dailyRecords.put(payload);

  // Sync daily record debit entries to cash_party_entries
  await removeDebitEntriesForDate(date);
  for (let i = 0; i < debitedCash.length; i++) {
    const d = debitedCash[i];
    if (d.amount > 0 && d.partyId) {
      await saveDebitCashPartyEntry({
        date,
        rowIndex: i,
        partyId: d.partyId,
        partyName: d.partyName,
        amount: d.amount,
      });
    }
  }

  // Queue to sync to Supabase
  await queueSync('daily_records', date, {
    date,
    expenses: payload.expenses,
    cms: payload.cms,
    debitedCash: payload.debitedCash,
    updatedAt: now,
  });

  return payload;
};
