import { db } from '../db/localDB.js';
import { getSupabaseClient } from '../db/supabaseClient.js';

let syncInterval = null;

// Dispatches status to React Context via DOM events
const setSyncStatus = (status) => {
  const event = new CustomEvent('sync-status-change', { detail: status });
  window.dispatchEvent(event);
};

const mapToSupabase = (tableName, payload, userId) => {
  if (tableName === 'auth') {
    return {
      id: payload.id,
      user_id: userId,
      username: payload.username,
      password_hash: payload.passwordHash || payload.password_hash,
      security_question: payload.securityQuestion || payload.security_question,
      security_answer_hash: payload.securityAnswerHash || payload.security_answer_hash,
      is_first_login: payload.isFirstLogin != null ? !!payload.isFirstLogin : payload.is_first_login,
      updated_at: payload.updatedAt || payload.updated_at || new Date().toISOString(),
    };
  }
  if (tableName === 'settings') {
    return {
      id: payload.id,
      user_id: userId,
      station_name: payload.stationName,
      updated_at: payload.updatedAt,
    };
  }
  if (tableName === 'nozzles') {
    return {
      id: payload.id,
      user_id: userId,
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
      user_id: userId,
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
      user_id: userId,
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
      user_id: userId,
      has_data: payload.hasData != null ? !!payload.hasData : undefined,
      updated_at: payload.updatedAt,
    };
  }
  if (tableName === 'parties') {
    return {
      id: payload.id,
      user_id: userId,
      name: payload.name,
      is_active: payload.isActive != null ? !!payload.isActive : payload.is_active,
      display_order: payload.order != null ? payload.order : payload.display_order,
      added_at: payload.addedAt || payload.added_at,
      updated_at: payload.updatedAt || payload.updated_at || new Date().toISOString(),
    };
  }
  if (tableName === 'cash_party_entries') {
    return {
      id: payload.id,
      user_id: userId,
      date: payload.date,
      shift_number: parseInt(payload.shiftNumber != null ? payload.shiftNumber : payload.shift_number),
      row_index: parseInt(payload.rowIndex != null ? payload.rowIndex : payload.row_index),
      party_id: payload.partyId || payload.party_id,
      party_name: payload.partyName || payload.party_name,
      diff_kg: parseFloat(payload.diffKg != null ? payload.diffKg : payload.diff_kg),
      sales_rs: parseFloat(payload.salesRs != null ? payload.salesRs : payload.sales_rs),
      cash_party_amount: parseFloat(payload.cashPartyAmount != null ? payload.cashPartyAmount : payload.cash_party_amount),
      status: payload.status,
      amount_paid: parseFloat(payload.amountPaid != null ? payload.amountPaid : payload.amount_paid),
      payment_date: payload.paymentDate || payload.payment_date,
      bill_number: payload.billNumber || payload.bill_number,
      created_at: payload.createdAt || payload.created_at,
      updated_at: payload.updatedAt || payload.updated_at || new Date().toISOString(),
    };
  }
  if (tableName === 'attendance_settings') {
    return {
      id: payload.id,
      user_id: userId,
      per_shift_wage: parseFloat(payload.perShiftWage != null ? payload.perShiftWage : payload.per_shift_wage),
      updated_at: payload.updatedAt || payload.updated_at || new Date().toISOString(),
    };
  }
  if (tableName === 'attendance') {
    return {
      date: payload.date,
      shift_number: parseInt(payload.shiftNumber != null ? payload.shiftNumber : payload.shift_number),
      employee_id: payload.employeeId || payload.employee_id,
      employee_name: payload.employeeName || payload.employee_name,
      user_id: userId,
      created_at: payload.createdAt || payload.created_at || new Date().toISOString(),
    };
  }
  if (tableName === 'advances') {
    return {
      id: payload.id,
      user_id: userId,
      employee_id: payload.employeeId || payload.employee_id,
      employee_name: payload.employeeName || payload.employee_name,
      amount: parseFloat(payload.amount),
      date: payload.date,
      note: payload.note || '',
      created_at: payload.createdAt || payload.created_at || new Date().toISOString(),
    };
  }
  if (tableName === 'salary_payments') {
    return {
      id: payload.id,
      user_id: userId,
      employee_id: payload.employeeId || payload.employee_id,
      employee_name: payload.employeeName || payload.employee_name,
      period_start: payload.periodStart || payload.period_start,
      period_end: payload.periodEnd || payload.period_end,
      total_shifts: parseInt(payload.totalShifts != null ? payload.totalShifts : payload.total_shifts),
      total_wage: parseFloat(payload.totalWage != null ? payload.totalWage : payload.total_wage),
      advance_given: parseFloat(payload.advanceGiven != null ? payload.advanceGiven : payload.advance_given),
      deduction_amount: parseFloat(payload.deductionAmount != null ? payload.deductionAmount : payload.deduction_amount),
      net_payable: parseFloat(payload.netPayable != null ? payload.netPayable : payload.net_payable),
      status: payload.status,
      paid_at: payload.paidAt || payload.paid_at,
      created_at: payload.createdAt || payload.created_at || new Date().toISOString(),
    };
  }
  if (tableName === 'bill_counter') {
    return {
      id: payload.id,
      user_id: userId,
      last_number: parseInt(payload.lastNumber != null ? payload.lastNumber : payload.last_number),
      updated_at: payload.updatedAt || payload.updated_at || new Date().toISOString(),
    };
  }
  return { ...payload, user_id: userId };
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
  if (tableName === 'parties') {
    return {
      id: row.id,
      name: row.name,
      isActive: row.is_active,
      order: row.display_order,
      addedAt: row.added_at,
      syncedAt: row.updated_at,
    };
  }
  if (tableName === 'cash_party_entries') {
    return {
      id: row.id,
      date: row.date,
      shiftNumber: row.shift_number,
      rowIndex: row.row_index,
      partyId: row.party_id,
      partyName: row.party_name,
      diffKg: parseFloat(row.diff_kg),
      salesRs: parseFloat(row.sales_rs),
      cashPartyAmount: parseFloat(row.cash_party_amount),
      status: row.status,
      amountPaid: parseFloat(row.amount_paid),
      paymentDate: row.payment_date,
      billNumber: row.bill_number,
      syncedAt: row.updated_at,
    };
  }
  if (tableName === 'attendance_settings') {
    return {
      id: row.id,
      perShiftWage: parseFloat(row.per_shift_wage),
      updatedAt: row.updated_at,
    };
  }
  if (tableName === 'attendance') {
    return {
      date: row.date,
      shiftNumber: row.shift_number,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      syncedAt: row.created_at,
    };
  }
  if (tableName === 'advances') {
    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      amount: parseFloat(row.amount),
      date: row.date,
      note: row.note,
      syncedAt: row.created_at,
    };
  }
  if (tableName === 'salary_payments') {
    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      totalShifts: row.total_shifts,
      totalWage: parseFloat(row.total_wage),
      advanceGiven: parseFloat(row.advance_given),
      deductionAmount: parseFloat(row.deduction_amount),
      netPayable: parseFloat(row.net_payable),
      status: row.status,
      paidAt: row.paid_at,
      syncedAt: row.created_at,
    };
  }
  if (tableName === 'bill_counter') {
    return {
      id: row.id,
      lastNumber: row.last_number,
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

export const runSync = async () => {
  if (!navigator.onLine) {
    setSyncStatus('offline');
    return;
  }

  const client = await getSupabaseClient();
  if (!client) {
    return;
  }

  // Get active session user_id to authorize requests
  const { data: { session } } = await client.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return;
  }

  try {
    setSyncStatus('syncing');

    // Push local changes (outbound queue)
    const queue = await db.syncQueue.toArray();
    for (const item of queue) {
      const payload = mapToSupabase(item.tableName, item.payload, userId);
      
      // If table is obsolete or skipped, remove from queue
      if (!payload && item.action !== 'delete') {
        await db.syncQueue.delete(item.id);
        continue;
      }

      let error = null;
      if (item.action === 'upsert') {
        const result = await client.from(item.tableName).upsert(payload);
        error = result.error;
      } else if (item.action === 'delete') {
        let query = client.from(item.tableName).delete().eq('user_id', userId);
        if (item.tableName === 'shifts') {
          const parts = item.recordId.split('_');
          query = query.eq('date', parts[0]).eq('shift_number', parseInt(parts[1]));
        } else if (item.tableName === 'calendar') {
          query = query.eq('date', item.recordId);
        } else if (item.tableName === 'attendance') {
          const parts = item.recordId.split('_');
          query = query.eq('date', parts[0]).eq('shift_number', parseInt(parts[1])).eq('employee_id', parts[2]);
        } else {
          query = query.eq('id', item.recordId);
        }
        const result = await query;
        error = result.error;
      }
      
      if (error) {
        throw error;
      }

      await db.syncQueue.delete(item.id);
    }

    // Pull remote changes (inbound pull)
    const tables = [
      'settings', 'nozzles', 'employees', 'shifts', 'calendar',
      'parties', 'cash_party_entries', 'attendance_settings', 'attendance', 'advances', 'salary_payments', 'bill_counter', 'auth'
    ];
    for (const table of tables) {
      const lastPull = localStorage.getItem(`lastPull_${table}`) || '1970-01-01T00:00:00.000Z';
      const remoteFieldName = 
        table === 'shifts' ? 'last_edited_at' :
        (table === 'attendance' || table === 'advances' || table === 'salary_payments') ? 'created_at' : 
        'updated_at';
      
      const { data, error } = await client
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .gt(remoteFieldName, lastPull);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        for (const row of data) {
          const localRow = mapFromSupabase(table, row);
          
          if (table === 'shifts') {
            // Conflict handling: check if local record is unsynced and has been modified
            const localRecord = await db.shifts.get([localRow.date, localRow.shiftNumber]);
            if (localRecord && !localRecord.isSynced) {
              const localTime = new Date(localRecord.lastEditedAt).getTime();
              const remoteTime = new Date(row.last_edited_at).getTime();

              if (remoteTime > localTime) {
                // Remote is newer: overwrite local, log conflict
                await db.shifts.put(localRow);
                await db.auditLogs.add({
                  action: 'conflict_overwrite_remote',
                  tableName: 'shifts',
                  recordId: `${localRow.date}_${localRow.shiftNumber}`,
                  createdAt: new Date().toISOString(),
                });
              } else {
                // Local is newer: reject overwrite, keep local unsynced edits (will sync in next cycle)
                continue;
              }
            } else {
              // No conflict: save remote record to Dexie
              await db.shifts.put(localRow);
            }
          } else if (table === 'nozzles') {
            await db.nozzles.put(localRow);
          } else if (table === 'employees') {
            await db.employees.put(localRow);
          } else if (table === 'calendar') {
            await db.calendar.put(localRow);
          } else if (table === 'settings') {
            await db.settings.put(localRow);
          } else if (table === 'parties') {
            await db.parties.put(localRow);
          } else if (table === 'cash_party_entries') {
            await db.cashPartyEntries.put(localRow);
          } else if (table === 'attendance_settings') {
            await db.attendanceSettings.put(localRow);
          } else if (table === 'attendance') {
            await db.attendance.put(localRow);
          } else if (table === 'advances') {
            await db.advances.put(localRow);
          } else if (table === 'salary_payments') {
            await db.salaryPayments.put(localRow);
          } else if (table === 'bill_counter') {
            await db.billCounter.put(localRow);
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

const triggerSync = () => {
  runSync().catch((err) => console.error('Failed sync execution:', err));
};

export const startSync = () => {
  if (syncInterval) return;
  syncInterval = setInterval(triggerSync, 30000); // 30 seconds
  triggerSync();
};

export const stopSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

export const queueSync = async (tableName, recordId, payload, action = 'upsert') => {
  try {
    await db.syncQueue.add({
      tableName,
      recordId,
      action,
      payload,
      createdAt: new Date().toISOString(),
    });
    // Trigger an immediate sync run in the background
    triggerSync();
  } catch (error) {
    console.error('Failed to queue sync:', error);
  }
};
