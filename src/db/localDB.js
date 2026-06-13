import Dexie from 'dexie';
import bcrypt from 'bcryptjs';

export const db = new Dexie('DSRManager');

db.version(1).stores({
  // Auth & settings
  auth:       '&id, username, passwordHash, securityQuestion, securityAnswerHash, isFirstLogin, updatedAt',
  settings:   '&id, stationName, supabaseUrl, supabaseKey, updatedAt',
  nozzles:    '++id, name, isActive, displayOrder, addedAt, syncedAt',
  employees:  '++id, name, isActive, displayOrder, addedAt, syncedAt',

  // Shift records
  shifts:     '[date+shiftNumber], date, shiftNumber, price, rows, totals, savedAt, lastEditedAt, syncedAt, isSynced',

  // Sync queue — tracks unsynced local changes
  syncQueue:  '++id, tableName, recordId, action, payload, createdAt',

  // Metadata
  calendar:   '&date, hasData, updatedAt',
});

// Seed default owner credentials & settings on creation
db.on('populate', (tx) => {
  // Note: Dexie transactions inside populate need to use target tables in transaction scope
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
});

export default db;
