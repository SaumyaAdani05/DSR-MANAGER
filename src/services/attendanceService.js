import { db } from '../db/localDB.js';
import { queueSync } from './syncService.js';

export const markAttendanceFromShift = async (date, shiftNumber, rows) => {
  const uniqueEmployees = [...new Map(
    rows
      .filter(r => r.employeeId)
      .map(r => [r.employeeId, { employeeId: r.employeeId, employeeName: r.employeeName }])
  ).values()];

  const existing = await db.attendance
    .where('date').equals(date)
    .and(a => a.shiftNumber === shiftNumber)
    .toArray();

  for (const record of existing) {
    if (!uniqueEmployees.some(emp => emp.employeeId === record.employeeId)) {
      await db.attendance.delete([date, shiftNumber, record.employeeId]);
      await queueSync('attendance', `${date}_${shiftNumber}_${record.employeeId}`, null, 'delete');
    }
  }

  for (const emp of uniqueEmployees) {
    const record = {
      date,
      shiftNumber,
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      syncedAt: null,
    };
    await db.attendance.put(record);
    await queueSync('attendance', `${date}_${shiftNumber}_${emp.employeeId}`, {
      date,
      shift_number: shiftNumber,
      employee_id: emp.employeeId,
      employee_name: emp.employeeName,
    });
  }
};

export const getAttendanceForRange = async (startDate, endDate) => {
  return db.attendance
    .where('date').between(startDate, endDate, true, true)
    .toArray();
};

export const getPerShiftWage = async () => {
  const s = await db.attendanceSettings.get('main');
  return s?.perShiftWage || 0;
};

export const updatePerShiftWage = async (wage) => {
  const updatedAt = new Date().toISOString();
  await db.attendanceSettings.put({ id: 'main', perShiftWage: parseFloat(wage), updatedAt });
  await queueSync('attendance_settings', 'main', { id: 'main', per_shift_wage: parseFloat(wage), updated_at: updatedAt });
};

export const buildAttendanceRegister = async (startDate, endDate, employees, wage) => {
  const records = await getAttendanceForRange(startDate, endDate);
  const advances = await db.advances.where('date').between(startDate, endDate, true, true).toArray();
  const payments = await db.salaryPayments
    .where('periodStart').equals(startDate)
    .and(p => p.periodEnd === endDate)
    .toArray();

  return employees.map(emp => {
    const empRecords = records.filter(r => r.employeeId === emp.id);
    const byDate = {};
    empRecords.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r.shiftNumber);
    });

    const totalShifts = empRecords.length;
    const totalWage = parseFloat((totalShifts * wage).toFixed(2));
    
    const empAdvances = advances.filter(a => a.employeeId === emp.id);
    const advanceGiven = parseFloat(empAdvances.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0).toFixed(2));

    const payment = payments.find(p => p.employeeId === emp.id);
    const deductionAmount = payment ? parseFloat(payment.deductionAmount) || 0 : 0;
    const netPayable = parseFloat((totalWage - deductionAmount).toFixed(2));
    const status = payment?.status || 'remaining';
    const paidAt = payment?.paidAt || null;

    return {
      employee: emp,
      byDate,
      totalShifts,
      totalWage,
      advanceGiven,
      deductionAmount,
      netPayable,
      status,
      paidAt,
    };
  });
};
