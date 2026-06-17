import { db } from '../db/localDB.js';
import { queueSync } from './syncService.js';
import { v4 as uuidv4 } from 'uuid';

export const getNextBillNumber = async () => {
  const counter = await db.billCounter.get('main') || { id: 'main', lastNumber: 0 };
  const next = counter.lastNumber + 1;
  await db.billCounter.put({ id: 'main', lastNumber: next, updatedAt: new Date().toISOString() });
  return `BILL-${String(next).padStart(3, '0')}`;
};

export const saveCashPartyEntry = async (entry) => {
  const id = uuidv4();
  const billNumber = await getNextBillNumber();
  const record = {
    id,
    ...entry,
    billNumber,
    status: 'pending',
    amountPaid: 0,
    paymentDate: null,
    syncedAt: null,
  };
  await db.cashPartyEntries.add(record);
  
  // Map fields for Supabase (snake_case payload)
  await queueSync('cash_party_entries', id, {
    id,
    date: record.date,
    shift_number: parseInt(record.shiftNumber),
    row_index: parseInt(record.rowIndex),
    party_id: record.partyId,
    party_name: record.partyName,
    diff_kg: parseFloat(record.diffKg),
    sales_rs: parseFloat(record.salesRs),
    cash_party_amount: parseFloat(record.cashPartyAmount),
    status: record.status,
    amount_paid: record.amountPaid,
    payment_date: record.paymentDate,
    bill_number: record.billNumber,
  });
  return record;
};

export const getPartiesWithBalance = async () => {
  const parties = await db.parties.toArray();
  const result = [];
  for (const party of parties) {
    const entries = await db.cashPartyEntries.where('partyId').equals(party.id).toArray();
    const totalAmount = entries.reduce((s, e) => s + (parseFloat(e.cashPartyAmount) || 0), 0);
    const totalPaid = entries.reduce((s, e) => s + (parseFloat(e.amountPaid) || 0), 0);
    const outstanding = parseFloat((totalAmount - totalPaid).toFixed(2));
    const sortedEntries = entries.sort((a, b) => b.date.localeCompare(a.date));
    const lastEntry = sortedEntries[0];
    
    result.push({
      ...party,
      totalAmount,
      totalPaid,
      outstanding,
      lastDate: lastEntry?.date || null,
    });
  }
  return result;
};

export const getDailyBillEntries = async (date) => {
  return db.cashPartyEntries.where('date').equals(date).toArray();
};

export const getPartyBillEntries = async (partyId, startDate, endDate) => {
  const entries = await db.cashPartyEntries.where('partyId').equals(partyId).toArray();
  return entries.filter(e => e.date >= startDate && e.date <= endDate).sort((a, b) => a.date.localeCompare(b.date));
};

export const markAsPaid = async (entryId, amountPaid) => {
  const entry = await db.cashPartyEntries.get(entryId);
  if (!entry) throw new Error('Transaction entry not found');

  const newPaid = parseFloat(((parseFloat(entry.amountPaid) || 0) + parseFloat(amountPaid)).toFixed(2));
  const cashPartyAmount = parseFloat(entry.cashPartyAmount) || 0;
  const status = newPaid >= cashPartyAmount ? 'paid' : 'partial';
  const paymentDate = new Date().toISOString();

  await db.cashPartyEntries.update(entryId, {
    amountPaid: newPaid,
    status,
    paymentDate,
  });

  await queueSync('cash_party_entries', entryId, {
    id: entryId,
    date: entry.date,
    shift_number: parseInt(entry.shiftNumber),
    row_index: parseInt(entry.rowIndex),
    party_id: entry.partyId,
    party_name: entry.partyName,
    diff_kg: parseFloat(entry.diffKg),
    sales_rs: parseFloat(entry.salesRs),
    cash_party_amount: cashPartyAmount,
    status,
    amount_paid: newPaid,
    payment_date: paymentDate,
    bill_number: entry.billNumber,
  });
};
