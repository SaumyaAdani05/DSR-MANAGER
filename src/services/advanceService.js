import { db } from '../db/localDB.js';
import { queueSync } from './syncService.js';
import { v4 as uuidv4 } from 'uuid';

export const addAdvance = async (employeeId, employeeName, amount, date, note = '') => {
  const id = uuidv4();
  const record = {
    id,
    employeeId,
    employeeName,
    amount: parseFloat(amount),
    date,
    note: note.trim(),
    syncedAt: null,
  };
  await db.advances.add(record);
  await queueSync('advances', id, {
    id,
    employee_id: employeeId,
    employee_name: employeeName,
    amount: parseFloat(amount),
    date,
    note: note.trim(),
  });
  return record;
};

export const getEmployeeAdvances = async (employeeId) => {
  return db.advances.where('employeeId').equals(employeeId).sortBy('date');
};

export const getEmployeeSalaryPayments = async (employeeId) => {
  return db.salaryPayments.where('employeeId').equals(employeeId).toArray();
};

export const getAdvancesInRange = async (employeeId, startDate, endDate) => {
  const list = await db.advances.where('employeeId').equals(employeeId).toArray();
  return list.filter(a => a.date >= startDate && a.date <= endDate);
};

export const recordSalaryPayment = async (paymentData) => {
  const existing = await db.salaryPayments
    .where('employeeId').equals(paymentData.employeeId)
    .and(p => p.periodStart === paymentData.periodStart && p.periodEnd === paymentData.periodEnd)
    .first();

  const id = existing?.id || uuidv4();
  const record = {
    id,
    ...paymentData,
    status: 'paid',
    paidAt: new Date().toISOString(),
    syncedAt: null,
  };

  await db.salaryPayments.put(record);

  await queueSync('salary_payments', id, {
    id,
    employee_id: paymentData.employeeId,
    employee_name: paymentData.employeeName,
    period_start: paymentData.periodStart,
    period_end: paymentData.periodEnd,
    total_shifts: parseInt(paymentData.totalShifts),
    total_wage: parseFloat(paymentData.totalWage),
    advance_given: parseFloat(paymentData.advanceGiven),
    deduction_amount: parseFloat(paymentData.deductionAmount),
    net_payable: parseFloat(paymentData.netPayable),
    status: 'paid',
    paid_at: record.paidAt,
  });
};

export const updateDeduction = async (employeeId, employeeName, periodStart, periodEnd, deductionAmount) => {
  const existing = await db.salaryPayments
    .where('employeeId').equals(employeeId)
    .and(p => p.periodStart === periodStart && p.periodEnd === periodEnd)
    .first();

  if (existing) {
    const val = parseFloat(deductionAmount);
    await db.salaryPayments.update(existing.id, { deductionAmount: val });
    await queueSync('salary_payments', existing.id, {
      id: existing.id,
      employee_id: existing.employeeId,
      employee_name: existing.employeeName,
      period_start: existing.periodStart,
      period_end: existing.periodEnd,
      total_shifts: parseInt(existing.totalShifts),
      total_wage: parseFloat(existing.totalWage),
      advance_given: parseFloat(existing.advanceGiven),
      deduction_amount: val,
      net_payable: parseFloat((existing.totalWage - val).toFixed(2)),
      status: existing.status,
      paid_at: existing.paidAt,
    });
  } else {
    const id = uuidv4();
    const val = parseFloat(deductionAmount);
    const newRecord = {
      id,
      employeeId,
      employeeName,
      periodStart,
      periodEnd,
      totalShifts: 0,
      totalWage: 0,
      advanceGiven: 0,
      deductionAmount: val,
      netPayable: parseFloat((-val).toFixed(2)),
      status: 'remaining',
      paidAt: null,
      syncedAt: null,
    };
    await db.salaryPayments.add(newRecord);
    await queueSync('salary_payments', id, {
      id,
      employee_id: employeeId,
      employee_name: employeeName,
      period_start: periodStart,
      period_end: periodEnd,
      total_shifts: 0,
      total_wage: 0,
      advance_given: 0,
      deduction_amount: val,
      net_payable: parseFloat((-val).toFixed(2)),
      status: 'remaining',
      paid_at: null,
    });
  }
};
