import { db } from '../db/localDB';
import { getSupabaseClient } from '../db/supabaseClient';

let syncInterval = null;

// Dispatches status to React Context via DOM events
const setSyncStatus = (status) => {
  const event = new CustomEvent('sync-status-change', { detail: status });
  window.dispatchEvent(event);
};

const mapToSupabase = (tableName, payload) => {
  if (tableName === 'auth') {
    return {
      id: payload.id,
      username: payload.username,
      password_hash: payload.passwordHash,
      security_question: payload.securityQuestion,
      security_answer_hash: payload.securityAnswerHash,
      is_first_login: payload.isFirstLogin != null ? !!payload.isFirstLogin : undefined,
      updated_at: payload.updatedAt,
    };
  }
  if (tableName === 'settings') {
    return {
      id: payload.id,
      station_name: payload.stationName,
      updated_at: payload.updatedAt,
    };
  }
  if (tableName === 'nozzles') {
    return {
      id: payload.id,
      name: payload.name,
      is_active: payload.isActive != null ? !!payload.isActive : undefined,
      display_order: payload.displayOrder,
      added_at: payload.addedAt,
      updated_at: payload.syncedAt || new Date().toISOString(),
    };
  }
  if (tableName === 'employees') {
    return {
      id: payload.id,
      name: payload.name,
      is_active: payload.isActive != null ? !!payload.isActive : undefined,
      display_order: payload.displayOrder,
      added_at: payload.addedAt,
      updated_at: payload.syncedAt || new Date().toISOString(),
    };
  }
  if (tableName === 'shifts') {
    return {
      date: payload.date,
      shift_number: parseInt(payload.shiftNumber),
      price: parseFloat(payload.price || 0),
      rows: payload.rows,
      totals: payload.totals,
      saved_at: payload.savedAt,
      last_edited_at: payload.lastEditedAt,
    };
  }
  if (tableName === 'calendar') {
    return {
      date: payload.date,
      has_data: payload.hasData != null ? !!payload.hasData : undefined,
      updated_at: payload.updatedAt,
    };
  }
  return payload;
};

const mapFromSupabase = (tableName, row) => {
  if (tableName === 'shifts') {
    return {
      date: row.date,
      shiftNumber: row.shift_number,
      price: parseFloat(row.price),
      rows: row.rows,
      totals: row.totals,
      savedAt: row.saved_at,
      lastEditedAt: row.last_edited_at,
      isSynced: true,
    };
  }
  if (tableName === 'nozzles') {
    return {
      id: row.id,
      name: row.name,
      isActive: row.is_active,
      displayOrder: row.display_order,
      addedAt: row.added_at,
      syncedAt: row.updated_at,
    };
  }
  if (tableName === 'employees') {
    return {
      id: row.id,
      name: row.name,
      isActive: row.is_active,
      displayOrder: row.display_order,
      addedAt: row.added_at,
      syncedAt: row.updated_at,
    };
  }
  if (tableName === 'calendar') {
    return {
      date: row.date,
      hasData: row.has_data,
      updatedAt: row.updated_at,
    };
  }
  if (tableName === 'settings') {
    return {
      id: row.id,
      stationName: row.station_name,
      updatedAt: row.updated_at,
    };
  }
  if (tableName === 'auth') {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      securityQuestion: row.security_question,
      securityAnswerHash: row.security_answer_hash,
      isFirstLogin: row.is_first_login,
      updatedAt: row.updated_at,
    };
  }
  return row;
};

// SQL Schema for Auto-Setup in Supabase
const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS auth (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  security_question TEXT,
  security_answer_hash TEXT,
  is_first_login BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  station_name TEXT DEFAULT 'Memnagar CNG',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS nozzles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS shifts (
  date TEXT NOT NULL,
  shift_number INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  rows JSONB NOT NULL,
  totals JSONB NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  last_edited_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, shift_number)
);
CREATE TABLE IF NOT EXISTS calendar (
  date TEXT PRIMARY KEY,
  has_data BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

const autoCreateTables = async (client) => {
  try {
    // Attempt executing via custom RPC function (exec_sql) if configured on Supabase
    await client.rpc('exec_sql', { sql: TABLE_SQL });
  } catch (e) {
    // Fail silently, tables should already exist or owner can run SQL script manually
    console.warn('Auto table creation function not available on Supabase. Setup database manually using schema in TRD.');
  }
};

export const runSync = async () => {
  if (!navigator.onLine) {
    setSyncStatus('offline');
    return;
  }

  const client = await getSupabaseClient();
  if (!client) {
    // Supabase credentials are not configured yet, skip silently
    return;
  }

  try {
    setSyncStatus('syncing');

    // Run auto-creation on first sync
    const isFirstSync = !localStorage.getItem('first_sync_done');
    if (isFirstSync) {
      await autoCreateTables(client);
      localStorage.setItem('first_sync_done', 'true');
    }

    // Push local changes (outbound queue)
    const queue = await db.syncQueue.toArray();
    for (const item of queue) {
      const payload = mapToSupabase(item.tableName, item.payload);
      
      let error = null;
      if (item.action === 'upsert') {
        const result = await client.from(item.tableName).upsert(payload);
        error = result.error;
      }
      
      if (error) {
        throw error;
      }

      await db.syncQueue.delete(item.id);
    }

    // Pull remote changes (inbound pull)
    const tables = ['auth', 'settings', 'nozzles', 'employees', 'shifts', 'calendar'];
    for (const table of tables) {
      const lastPull = localStorage.getItem(`lastPull_${table}`) || '1970-01-01T00:00:00.000Z';
      const remoteFieldName = table === 'shifts' ? 'last_edited_at' : 'updated_at';
      
      const { data, error } = await client
        .from(table)
        .select('*')
        .gt(remoteFieldName, lastPull);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        for (const row of data) {
          const localRow = mapFromSupabase(table, row);
          
          if (table === 'shifts') {
            await db.shifts.put(localRow);
          } else if (table === 'nozzles') {
            await db.nozzles.put(localRow);
          } else if (table === 'employees') {
            await db.employees.put(localRow);
          } else if (table === 'calendar') {
            await db.calendar.put(localRow);
          } else if (table === 'settings') {
            await db.settings.put(localRow);
          } else if (table === 'auth') {
            await db.auth.put(localRow);
          }
        }
      }
      
      localStorage.setItem(`lastPull_${table}`, new Date().toISOString());
    }

    setSyncStatus('synced');
  } catch (error) {
    setSyncStatus('error');
    console.error('Database sync failed:', error);
  }
};

export const startSync = () => {
  if (syncInterval) return;
  syncInterval = setInterval(runSync, 30000); // 30 seconds
  runSync(); // Immediate initial sync trigger
};

export const stopSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

export const queueSync = async (tableName, recordId, payload) => {
  try {
    await db.syncQueue.add({
      tableName,
      recordId,
      action: 'upsert',
      payload,
      createdAt: new Date().toISOString(),
    });
    // Trigger an immediate sync run in the background
    runSync();
  } catch (error) {
    console.error('Failed to queue sync:', error);
  }
};
