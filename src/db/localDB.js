import Dexie from 'dexie';
import bcrypt from 'bcryptjs';

export const db = new Dexie('DSRManager');

db.version(1).stores({
  // Auth & settings
  auth:       '&id, securityQuestion, securityAnswerHash, isFirstLogin, updatedAt',
  settings:   '&id, stationName, supabaseUrl, supabaseKey, updatedAt',
  nozzles:    '++id, name, isActive, displayOrder, addedAt, syncedAt',
  employees:  '++id, name, isActive, displayOrder, addedAt, syncedAt',

  // Shift records
  shifts:     '[date+shiftNumber], date, shiftNumber, price, rows, totals, savedAt, lastEditedAt, syncedAt, isSynced',

  // Sync queue — tracks unsynced local changes
  syncQueue:  '++id, tableName, recordId, action, payload, createdAt',

  // Metadata
  calendar:   '&date, hasData, updatedAt',
  auditLogs:  '++id, action, tableName, recordId, createdAt',
});

db.version(2).stores({
  // Auth & settings
  auth:       '&id, username, passwordHash, securityQuestion, securityAnswerHash, isFirstLogin, updatedAt',
  settings:   '&id, stationName, supabaseUrl, supabaseKey, updatedAt',
  nozzles:    '++id, name, isActive, displayOrder, order, addedAt, syncedAt',
  employees:  '++id, name, isActive, displayOrder, order, addedAt, syncedAt',

  // Shift records
  shifts:     '[date+shiftNumber], date, shiftNumber, price, rows, totals, savedAt, lastEditedAt, syncedAt, isSynced',

  // Parties (Cash Party names — like employees)
  parties:    '&id, name, isActive, order, addedAt, syncedAt',

  // Cash Party transactions (linked to shift rows)
  cashPartyEntries: '++id, date, shiftNumber, rowIndex, partyId, partyName, diffKg, salesRs, cashPartyAmount, status, amountPaid, paymentDate, billNumber, syncedAt',

  // Bill counter (for auto-incrementing bill numbers)
  billCounter: '&id, lastNumber, updatedAt',

  // Attendance settings (per shift wage)
  attendanceSettings: '&id, perShiftWage, updatedAt',

  // Attendance records (auto-marked per shift per employee)
  attendance: '[date+shiftNumber+employeeId], date, shiftNumber, employeeId, employeeName, syncedAt',

  // Advances given to employees
  advances: '++id, employeeId, employeeName, amount, date, note, syncedAt',

  // Salary payments per employee per period
  salaryPayments: '++id, employeeId, employeeName, periodStart, periodEnd, totalShifts, totalWage, advanceGiven, deductionAmount, netPayable, status, paidAt, syncedAt',

  // Sync queue — tracks unsynced local changes
  syncQueue:  '++id, tableName, recordId, action, payload, createdAt',

  // Metadata
  calendar:   '&date, hasData, updatedAt',
  auditLogs:  '++id, action, tableName, recordId, createdAt',
}).upgrade(async (tx) => {
  const defaultHash = bcrypt.hashSync('Adani@mem0510', 10);
  
  const count = await tx.table('auth').count();
  if (count === 0) {
    await tx.table('auth').put({
      id: 'owner',
      username: 'Adani0510',
      passwordHash: defaultHash,
      securityQuestion: '',
      securityAnswerHash: '',
      isFirstLogin: true,
      updatedAt: new Date().toISOString(),
    });
  }

  const billCount = await tx.table('billCounter').count();
  if (billCount === 0) {
    await tx.table('billCounter').put({
      id: 'main',
      lastNumber: 0,
      updatedAt: new Date().toISOString(),
    });
  }

  const attCount = await tx.table('attendanceSettings').count();
  if (attCount === 0) {
    await tx.table('attendanceSettings').put({
      id: 'main',
      perShiftWage: 0,
      updatedAt: new Date().toISOString(),
    });
  }
});

// Seed default owner settings on creation
db.on('populate', (tx) => {
  const defaultHash = bcrypt.hashSync('Adani@mem0510', 10);
  tx.table('auth').add({
    id: 'owner',
    username: 'Adani0510',
    passwordHash: defaultHash,
    securityQuestion: '',
    securityAnswerHash: '',
    isFirstLogin: true,
    updatedAt: new Date().toISOString(),
  });

  tx.table('settings').add({
    id: 'main',
    stationName: 'Memnagar CNG',
    supabaseUrl: '',
    supabaseKey: '',
    updatedAt: new Date().toISOString(),
  });

  tx.table('billCounter').add({
    id: 'main',
    lastNumber: 0,
    updatedAt: new Date().toISOString(),
  });

  tx.table('attendanceSettings').add({
    id: 'main',
    perShiftWage: 0,
    updatedAt: new Date().toISOString(),
  });
});

export default db;
