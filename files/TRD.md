# Technical Requirements Document (TRD)
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 2.0  
**Date:** June 2026  
**Status:** Final

---

## 1. Tech Stack Overview

| Layer | Technology | Cost | Justification |
|-------|-----------|------|---------------|
| Frontend Framework | React 18 (Vite) | Free | Fast build, large ecosystem, component reuse |
| Styling | Tailwind CSS v3 | Free | Utility-first, Adani theme via custom config |
| State Management | React Context API + useReducer | Free | Sufficient for single-user v1 |
| Routing | React Router v6 | Free | SPA navigation, protected routes |
| Local Database | Dexie.js (IndexedDB wrapper) | Free | Offline-first; survives cache clears when PWA installed |
| Cloud Database | Supabase (free tier — PostgreSQL) | Free | Auto-sync every 30s; 500MB storage |
| Authentication | Custom bcrypt via Supabase | Free | Username is not an email; no third-party auth needed |
| Version Control | GitHub | Free | Source code hosting, CI/CD trigger for Vercel |
| Hosting | Vercel (free tier) | Free | Auto-deploy on GitHub push; vercel.app subdomain |
| DNS | Cloudflare | Free | DNS management; fast CDN layer |
| Error Tracking | Sentry (free tier) | Free | Captures runtime errors silently; 5K errors/month free |
| Excel Export | SheetJS (xlsx) | Free | Industry standard, browser-compatible |
| PDF Export | jsPDF + jspdf-autotable | Free | Lightweight, no server needed |
| PWA | Vite PWA Plugin (vite-plugin-pwa) | Free | Service worker + manifest auto-generation |
| Offline Cache | Workbox + Dexie.js | Free | App shell cached; data in IndexedDB |
| Timezone | date-fns-tz | Free | IST conversions for all timestamps |
| Number Format | Intl.NumberFormat (en-IN) | Free | Indian number format |
| Password Hashing | bcryptjs | Free | Hashing before Supabase write |

---

## 2. Project Structure

```
dsr-manager/
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── dsr-icon-192.png
│       └── dsr-icon-512.png
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── SecuritySetup.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── SideDrawer.jsx
│   │   │   ├── SyncIndicator.jsx
│   │   │   └── ToastContainer.jsx
│   │   ├── shift/
│   │   │   ├── ShiftTabs.jsx
│   │   │   ├── ShiftGrid.jsx
│   │   │   ├── ShiftRow.jsx
│   │   │   ├── TotalRow.jsx
│   │   │   ├── DailySalesBar.jsx
│   │   │   ├── PriceHeader.jsx
│   │   │   └── AuditTrail.jsx
│   │   ├── calendar/
│   │   │   ├── CalendarPage.jsx
│   │   │   └── MonthlySummary.jsx
│   │   ├── settings/
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── NozzleManager.jsx
│   │   │   ├── EmployeeManager.jsx
│   │   │   └── SupabaseConfig.jsx
│   │   ├── export/
│   │   │   ├── ExportDSR.jsx
│   │   │   └── MonthlyReport.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── SearchDropdown.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       ├── Badge.jsx
│   │       └── WarningPopup.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── ShiftContext.jsx
│   │   ├── SettingsContext.jsx
│   │   └── SyncContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useShiftData.js
│   │   ├── useNozzles.js
│   │   ├── useEmployees.js
│   │   ├── useCarryover.js
│   │   ├── useOnlineStatus.js
│   │   ├── useSync.js
│   │   └── useDailyTotals.js
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── CalendarPage.jsx
│   │   └── SettingsPage.jsx
│   ├── db/
│   │   ├── localDB.js          ← Dexie.js schema + instance
│   │   └── supabaseClient.js   ← Supabase client init
│   ├── services/
│   │   ├── authService.js
│   │   ├── shiftService.js
│   │   ├── settingsService.js
│   │   ├── syncService.js
│   │   ├── exportService.js
│   │   └── cleanupService.js
│   ├── utils/
│   │   ├── calculations.js
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   ├── dateUtils.js
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 3. Local Database — Dexie.js Schema (`src/db/localDB.js`)

```javascript
import Dexie from 'dexie';

export const db = new Dexie('DSRManager');

db.version(1).stores({
  // Auth & settings
  auth:       '&id, username, passwordHash, securityQuestion, securityAnswerHash, isFirstLogin, updatedAt',
  settings:   '&id, stationName, supabaseUrl, supabaseKey, updatedAt',
  nozzles:    '++id, name, isActive, order, addedAt, syncedAt',
  employees:  '++id, name, isActive, order, addedAt, syncedAt',

  // Shift records
  shifts:     '&[date+shiftNumber], date, shiftNumber, price, rows, totals, savedAt, lastEditedAt, syncedAt, isSynced',

  // Parties (Cash Party names — like employees)
  parties:    '&id, name, isActive, order, addedAt, syncedAt',

  // Cash Party transactions (linked to shift rows)
  cashPartyEntries: '++id, date, shiftNumber, rowIndex, partyId, partyName, diffKg, salesRs, cashPartyAmount, status, amountPaid, paymentDate, billNumber, syncedAt',

  // Bill counter (for auto-incrementing bill numbers)
  billCounter: '&id, lastNumber, updatedAt',

  // Attendance settings (per shift wage)
  attendanceSettings: '&id, perShiftWage, updatedAt',

  // Attendance records (auto-marked per shift per employee)
  attendance: '&[date+shiftNumber+employeeId], date, shiftNumber, employeeId, employeeName, syncedAt',

  // Advances given to employees
  advances: '++id, employeeId, employeeName, amount, date, note, syncedAt',

  // Salary payments per employee per period
  salaryPayments: '++id, employeeId, employeeName, periodStart, periodEnd, totalShifts, totalWage, advanceGiven, deductionAmount, netPayable, status, paidAt, syncedAt',

  // Sync queue — tracks unsynced local changes
  syncQueue:  '++id, tableName, recordId, action, payload, createdAt',

  // Metadata
  calendar:   '&date, hasData, updatedAt',
});

export default db;
```

### Dexie Table Explanations

| Table | Purpose |
|-------|---------|
| `auth` | Single owner document (id = "owner") |
| `settings` | Station name + Supabase credentials |
| `nozzles` | Global nozzle list with order |
| `employees` | Global employee list with order |
| `shifts` | Compound key [date+shiftNumber]; all shift data including rows JSON |
| `syncQueue` | Queue of changes not yet synced to Supabase |
| `calendar` | Date metadata for calendar dot indicators |

---

## 4. Cloud Database — Supabase Schema

### 4.1 Supabase Setup (owner does once)
1. Create free account at supabase.com
2. Create new project
3. Copy Project URL + anon public key
4. Paste into DSR Manager Settings → Supabase Config
5. App runs the table creation SQL on first sync

### 4.2 SQL Schema (auto-run on first sync)

```sql
-- Auth table
CREATE TABLE IF NOT EXISTS auth (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  security_question TEXT,
  security_answer_hash TEXT,
  is_first_login BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  station_name TEXT DEFAULT 'Memnagar CNG',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nozzles table
CREATE TABLE IF NOT EXISTS nozzles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts table (main data table)
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

-- Parties (Cash Party names)
CREATE TABLE IF NOT EXISTS parties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash Party transactions
CREATE TABLE IF NOT EXISTS cash_party_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  shift_number INTEGER NOT NULL,
  row_index INTEGER NOT NULL,
  party_id TEXT NOT NULL,
  party_name TEXT NOT NULL,
  diff_kg DECIMAL(10,2) NOT NULL,
  sales_rs DECIMAL(10,2) NOT NULL,
  cash_party_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',        -- 'pending' | 'partial' | 'paid'
  amount_paid DECIMAL(10,2) DEFAULT 0,
  payment_date TIMESTAMPTZ,
  bill_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance settings
CREATE TABLE IF NOT EXISTS attendance_settings (
  id TEXT PRIMARY KEY,
  per_shift_wage DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance records (auto-marked on shift save)
CREATE TABLE IF NOT EXISTS attendance (
  date TEXT NOT NULL,
  shift_number INTEGER NOT NULL,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, shift_number, employee_id)
);

-- Advances
CREATE TABLE IF NOT EXISTS advances (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary payments
CREATE TABLE IF NOT EXISTS salary_payments (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  total_shifts INTEGER NOT NULL DEFAULT 0,
  total_wage DECIMAL(10,2) NOT NULL DEFAULT 0,
  advance_given DECIMAL(10,2) NOT NULL DEFAULT 0,
  deduction_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_payable DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'remaining',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill counter
CREATE TABLE IF NOT EXISTS bill_counter (
  id TEXT PRIMARY KEY,
  last_number INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar metadata
CREATE TABLE IF NOT EXISTS calendar (
  date TEXT PRIMARY KEY,
  has_data BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Sync Architecture (`src/services/syncService.js`)

### 5.1 Sync Flow
```
Every 30 seconds (when online):
  1. Read all records from syncQueue (isSynced = false)
  2. For each queued change:
     a. UPSERT to Supabase matching table
     b. On success: mark as synced in local Dexie table
     c. Remove from syncQueue
  3. Pull any remote changes newer than last sync timestamp
  4. Update sync status indicator
```

### 5.2 Sync Service Core
```javascript
import { db } from '../db/localDB';
import { supabase } from '../db/supabaseClient';

let syncInterval = null;

export const startSync = () => {
  if (syncInterval) return;
  syncInterval = setInterval(runSync, 30000); // 30 seconds
  runSync(); // immediate first sync
};

export const stopSync = () => {
  clearInterval(syncInterval);
  syncInterval = null;
};

export const runSync = async () => {
  if (!navigator.onLine) return;

  try {
    setSyncStatus('syncing');

    // Push local changes
    const queue = await db.syncQueue.toArray();
    for (const item of queue) {
      await pushToSupabase(item);
      await db.syncQueue.delete(item.id);
    }

    // Pull remote changes
    await pullFromSupabase();

    setSyncStatus('synced');
  } catch (err) {
    setSyncStatus('error');
    console.error('Sync failed:', err);
  }
};

const pushToSupabase = async (queueItem) => {
  const { tableName, payload } = queueItem;
  const { error } = await supabase.from(tableName).upsert(payload);
  if (error) throw error;
};

const pullFromSupabase = async () => {
  // Pull shifts updated since last pull
  const lastPull = localStorage.getItem('lastPullAt') || '1970-01-01';
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .gt('last_edited_at', lastPull);

  if (error) throw error;

  for (const row of data) {
    await db.shifts.put({
      date: row.date,
      shiftNumber: row.shift_number,
      price: row.price,
      rows: row.rows,
      totals: row.totals,
      savedAt: row.saved_at,
      lastEditedAt: row.last_edited_at,
      isSynced: true,
    });
  }

  localStorage.setItem('lastPullAt', new Date().toISOString());
};
```

### 5.3 Queue a Change (called after every local save)
```javascript
export const queueSync = async (tableName, recordId, payload) => {
  await db.syncQueue.add({
    tableName,
    recordId,
    action: 'upsert',
    payload,
    createdAt: new Date().toISOString(),
  });
};
```

---

## 6. Authentication Architecture (`src/services/authService.js`)

```javascript
import bcrypt from 'bcryptjs';
import { db } from '../db/localDB';
import { queueSync } from './syncService';

export const loginOwner = async (username, password) => {
  const owner = await db.auth.get('owner');
  if (!owner || owner.username !== username) throw new Error('Invalid credentials');
  const match = await bcrypt.compare(password, owner.passwordHash);
  if (!match) throw new Error('Invalid credentials');

  // Store session
  localStorage.setItem('dsr_session', JSON.stringify({
    isAuthenticated: true,
    sessionId: crypto.randomUUID(),
    loginTime: new Date().toISOString(),
  }));
  return owner;
};

export const updatePassword = async (newPassword) => {
  const hash = await bcrypt.hash(newPassword, 10);
  await db.auth.update('owner', { passwordHash: hash, updatedAt: new Date().toISOString() });
  await queueSync('auth', 'owner', { id: 'owner', password_hash: hash });
};

export const updateSecurityQuestion = async (question, answer) => {
  const answerHash = await bcrypt.hash(answer, 10);
  await db.auth.update('owner', {
    securityQuestion: question,
    securityAnswerHash: answerHash,
    isFirstLogin: false,
    updatedAt: new Date().toISOString(),
  });
  await queueSync('auth', 'owner', {
    id: 'owner',
    security_question: question,
    security_answer_hash: answerHash,
    is_first_login: false,
  });
};

export const verifySecurityAnswer = async (answer) => {
  const owner = await db.auth.get('owner');
  return bcrypt.compare(answer, owner.securityAnswerHash);
};
```

---

## 7. Shift Service (`src/services/shiftService.js`)

```javascript
import { db } from '../db/localDB';
import { queueSync } from './syncService';

export const saveShift = async (date, shiftNumber, shiftData) => {
  const now = new Date().toISOString();
  const record = {
    date,
    shiftNumber,
    price: shiftData.price,
    rows: shiftData.rows,
    totals: shiftData.totals,
    savedAt: now,
    lastEditedAt: now,
    isSynced: false,
  };

  // Save locally first (instant)
  await db.shifts.put(record);

  // Update calendar metadata
  await db.calendar.put({ date, hasData: true, updatedAt: now });

  // Queue for cloud sync
  await queueSync('shifts', `${date}_${shiftNumber}`, {
    date,
    shift_number: shiftNumber,
    price: shiftData.price,
    rows: shiftData.rows,
    totals: shiftData.totals,
    last_edited_at: now,
  });
};

export const getShift = async (date, shiftNumber) => {
  return db.shifts.get([date, shiftNumber]);
};

export const getAllShiftsForDate = async (date) => {
  return db.shifts.where('date').equals(date).toArray();
};

export const getDailyTotals = async (date) => {
  const shifts = await getAllShiftsForDate(date);
  return shifts.reduce((acc, shift) => ({
    totalDifference: acc.totalDifference + (shift.totals?.totalDifference || 0),
    totalSalesRs: acc.totalSalesRs + (shift.totals?.totalSalesRs || 0),
    totalCash: acc.totalCash + (shift.totals?.totalCash || 0),
    totalCC: acc.totalCC + (shift.totals?.totalCC || 0),
    totalUPI: acc.totalUPI + (shift.totals?.totalUPI || 0),
    totalCashParty: acc.totalCashParty + (shift.totals?.totalCashParty || 0),
  }), { totalDifference: 0, totalSalesRs: 0, totalCash: 0, totalCC: 0, totalUPI: 0, totalCashParty: 0 });
};
```

---

## 8. Calculation Engine (`src/utils/calculations.js`)

```javascript
// All triggered on field blur (not on keystroke)

export const calcDifference = (closing, opening) =>
  parseFloat((closing - opening).toFixed(2));

export const calcSales = (difference, price) =>
  parseFloat((difference * price).toFixed(2));

export const calcRowTotals = (rows) => ({
  totalDifference: rows.reduce((s, r) => s + (r.difference || 0), 0),
  totalSalesRs:    rows.reduce((s, r) => s + (r.salesRs || 0), 0),
  totalCash:       rows.reduce((s, r) => s + (r.cash || 0), 0),
  totalCC:         rows.reduce((s, r) => s + (r.cc || 0), 0),
  totalUPI:        rows.reduce((s, r) => s + (r.upi || 0), 0),
  totalCashParty:  rows.reduce((s, r) => s + (r.cashParty || 0), 0),
});

// Reconciliation: Cash + CC + UPI + CashParty = Sales
export const isReconciled = (row) => {
  const payments = parseFloat(
    (row.cash + row.cc + row.upi + row.cashParty).toFixed(2)
  );
  return payments === parseFloat(row.salesRs.toFixed(2));
};
```

---

## 9. Validation Engine (`src/utils/validators.js`)

```javascript
export const validateRow = (row, rowIndex) => {
  const errors = [];
  if (!row.nozzle) errors.push(`Row ${rowIndex + 1}: Nozzle is required`);
  if (!row.employee) errors.push(`Row ${rowIndex + 1}: Employee is required`);
  if (!row.openingReading || row.openingReading <= 0)
    errors.push(`Row ${rowIndex + 1}: Opening Reading must be > 0`);
  if (!row.closingReading || row.closingReading <= 0)
    errors.push(`Row ${rowIndex + 1}: Closing Reading must be > 0`);
  if (row.closingReading < row.openingReading)
    errors.push(`Row ${rowIndex + 1}: Closing must be ≥ Opening`);
  if ([row.cash, row.cc, row.upi, row.cashParty].some(v => v < 0))
    errors.push(`Row ${rowIndex + 1}: Payment fields cannot be negative`);
  if (!isReconciled(row))
    errors.push(`Row ${rowIndex + 1}: Cash + CC + UPI + Cash Party (${(row.cash+row.cc+row.upi+row.cashParty).toFixed(2)}) ≠ Sales (${row.salesRs.toFixed(2)})`);
  return errors;
};

export const validateShift = (shift) => {
  if (!shift.price || shift.price <= 0)
    return ["Today's Price must be greater than 0"];
  return shift.rows.flatMap((row, i) => validateRow(row, i));
};

export const validatePassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$])[A-Za-z\d@#$]{6,12}$/.test(password);
```

---

## 10. Carryover Engine (`src/hooks/useCarryover.js`)

```javascript
import { getShift } from '../services/shiftService';

// Get opening readings for shift N from shift N-1 closings (by row position index)
export const getCarryoverFromShift = (prevShiftRows) =>
  prevShiftRows.map((row) => ({
    nozzleId: row.nozzleId,
    openingReading: row.closingReading,
    isOpeningAutoFilled: true,
  }));

// Cascade update: when a shift is saved, update next shift's opening readings
export const cascadeCarryover = async (date, shiftNumber, savedRows) => {
  const nextShiftNum = shiftNumber + 1;
  let nextDate = date;

  // If editing Shift 3, carryover goes to next day Shift 1
  if (shiftNumber === 3) {
    nextDate = getNextDate(date);
    nextShiftNum = 1; // already declared above but override
  }

  const nextShift = await getShift(nextDate, nextShiftNum === 4 ? 1 : nextShiftNum);
  if (!nextShift) return; // No next shift to update

  const updatedRows = nextShift.rows.map((row, i) => ({
    ...row,
    openingReading: savedRows[i]?.closingReading ?? row.openingReading,
    isOpeningAutoFilled: true,
  }));

  await saveShift(nextDate, nextShiftNum === 4 ? 1 : nextShiftNum, {
    ...nextShift,
    rows: updatedRows,
  });
};
```

---

## 11. Sync Status Context (`src/context/SyncContext.jsx`)

```javascript
import { createContext, useContext, useState } from 'react';

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState('synced');
  // 'synced' | 'syncing' | 'offline' | 'error'

  return (
    <SyncContext.Provider value={{ syncStatus, setSyncStatus }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncStatus = () => useContext(SyncContext);
```

---

## 12. Online Status Hook (`src/hooks/useOnlineStatus.js`)

```javascript
import { useState, useEffect } from 'react';
import { startSync, stopSync } from '../services/syncService';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); startSync(); };
    const handleOffline = () => { setIsOnline(false); stopSync(); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) startSync();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
```

---

## 13. Tailwind Configuration (Adani Theme)

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        adani: {
          navy:      '#003087',
          navyDark:  '#001f5b',
          navyLight: '#0041b3',
          red:       '#E2231A',
          redDark:   '#b51813',
          white:     '#FFFFFF',
          lightGray: '#F4F5F7',
          gray:      '#6B7280',
          border:    '#D1D5DB',
        },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      boxShadow: { card: '0 2px 8px rgba(0,48,135,0.12)' },
    },
  },
  plugins: [],
};
```

---

## 14. PWA Configuration (`vite.config.js`)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co/,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache' },
          },
        ],
      },
      manifest: {
        name: 'DSR Manager',
        short_name: 'DSR',
        theme_color: '#003087',
        background_color: '#003087',
        display: 'standalone',
        icons: [
          { src: '/icons/dsr-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/dsr-icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

---

## 16. Attendance Service (`src/services/attendanceService.js`)

```javascript
import { db } from '../db/localDB';
import { queueSync } from './syncService';

// Auto-mark attendance when shift is saved
// Called from shiftService.saveShift() after validation passes
export const markAttendanceFromShift = async (date, shiftNumber, rows) => {
  // Get unique employee IDs from shift rows (dedup same employee in multiple rows)
  const uniqueEmployees = [...new Map(
    rows
      .filter(r => r.employeeId)
      .map(r => [r.employeeId, { employeeId: r.employeeId, employeeName: r.employeeName }])
  ).values()];

  for (const emp of uniqueEmployees) {
    const record = { date, shiftNumber, employeeId: emp.employeeId, employeeName: emp.employeeName };
    await db.attendance.put(record); // put = upsert (idempotent)
    await queueSync('attendance', `${date}_${shiftNumber}_${emp.employeeId}`, {
      date, shift_number: shiftNumber,
      employee_id: emp.employeeId, employee_name: emp.employeeName,
    });
  }
};

// Get attendance for a date range (for register view)
export const getAttendanceForRange = async (startDate, endDate) => {
  return db.attendance
    .where('date').between(startDate, endDate, true, true)
    .toArray();
};

// Get per shift wage setting
export const getPerShiftWage = async () => {
  const s = await db.attendanceSettings.get('main');
  return s?.perShiftWage || 0;
};

// Update per shift wage
export const updatePerShiftWage = async (wage) => {
  await db.attendanceSettings.put({ id: 'main', perShiftWage: wage, updatedAt: new Date().toISOString() });
  await queueSync('attendance_settings', 'main', { id: 'main', per_shift_wage: wage });
};

// Build monthly register data
export const buildAttendanceRegister = async (startDate, endDate, employees, wage) => {
  const records = await getAttendanceForRange(startDate, endDate);
  const advances = await db.advances.where('date').between(startDate, endDate, true, true).toArray();
  const payments = await db.salaryPayments
    .where('periodStart').equals(startDate).and(p => p.periodEnd === endDate).toArray();

  return employees.map(emp => {
    // Attendance per date
    const empRecords = records.filter(r => r.employeeId === emp.id);
    const byDate = {};
    empRecords.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r.shiftNumber);
    });

    // Count unique shifts (deduplicated per shift per day)
    const totalShifts = empRecords.length; // already unique per [date+shift+employee]

    const totalWage = parseFloat((totalShifts * wage).toFixed(2));
    const empAdvances = advances.filter(a => a.employeeId === emp.id);
    const advanceGiven = empAdvances.reduce((s, a) => s + a.amount, 0);

    const payment = payments.find(p => p.employeeId === emp.id);
    const deductionAmount = payment?.deductionAmount || 0;
    const netPayable = parseFloat((totalWage - deductionAmount).toFixed(2));
    const status = payment?.status || 'remaining';
    const paidAt = payment?.paidAt || null;

    return { employee: emp, byDate, totalShifts, totalWage, advanceGiven, deductionAmount, netPayable, status, paidAt };
  });
};
```

---

## 17. Advance Service (`src/services/advanceService.js`)

```javascript
import { db } from '../db/localDB';
import { queueSync } from './syncService';
import { v4 as uuidv4 } from 'uuid';

// Add advance for an employee
export const addAdvance = async (employeeId, employeeName, amount, date, note = '') => {
  const id = uuidv4();
  const record = { id, employeeId, employeeName, amount: parseFloat(amount), date, note, syncedAt: null };
  await db.advances.add(record);
  await queueSync('advances', id, { id, employee_id: employeeId, employee_name: employeeName, amount, date, note });
  return record;
};

// Get advance history for a specific employee
export const getEmployeeAdvances = async (employeeId) => {
  return db.advances.where('employeeId').equals(employeeId).sortBy('date');
};

// Get total advance given to employee in a date range
export const getAdvancesInRange = async (employeeId, startDate, endDate) => {
  return db.advances
    .where('employeeId').equals(employeeId)
    .and(a => a.date >= startDate && a.date <= endDate)
    .toArray();
};

// Record salary payment
export const recordSalaryPayment = async (paymentData) => {
  const id = uuidv4();
  const record = { id, ...paymentData, status: 'paid', paidAt: new Date().toISOString() };
  await db.salaryPayments.put(record);
  await queueSync('salary_payments', id, {
    id, employee_id: paymentData.employeeId, employee_name: paymentData.employeeName,
    period_start: paymentData.periodStart, period_end: paymentData.periodEnd,
    total_shifts: paymentData.totalShifts, total_wage: paymentData.totalWage,
    advance_given: paymentData.advanceGiven, deduction_amount: paymentData.deductionAmount,
    net_payable: paymentData.netPayable, status: 'paid', paid_at: record.paidAt,
  });
};

// Update deduction amount for employee for a period
export const updateDeduction = async (employeeId, periodStart, periodEnd, deductionAmount) => {
  const existing = await db.salaryPayments
    .where('[employeeId+periodStart]').equals([employeeId, periodStart]).first();
  if (existing) {
    await db.salaryPayments.update(existing.id, { deductionAmount });
  }
};
```

---

## 18. Bill Service (`src/services/billService.js`)

```javascript
import { db } from '../db/localDB';
import { queueSync } from './syncService';

// Generate next bill number (BILL-001, BILL-002 ...)
export const getNextBillNumber = async () => {
  const counter = await db.billCounter.get('main') || { id: 'main', lastNumber: 0 };
  const next = counter.lastNumber + 1;
  await db.billCounter.put({ id: 'main', lastNumber: next, updatedAt: new Date().toISOString() });
  return `BILL-${String(next).padStart(3, '0')}`;
};

// Save cash party entry when shift row is saved
export const saveCashPartyEntry = async (entry) => {
  const billNumber = await getNextBillNumber();
  const record = { ...entry, billNumber, status: 'pending', amountPaid: 0, paymentDate: null };
  await db.cashPartyEntries.add(record);
  await queueSync('cash_party_entries', record.id, record);
  return record;
};

// Get all parties with their outstanding balance
export const getPartiesWithBalance = async () => {
  const parties = await db.parties.where('isActive').equals(1).toArray();
  const result = [];
  for (const party of parties) {
    const entries = await db.cashPartyEntries.where('partyId').equals(party.id).toArray();
    const totalAmount = entries.reduce((s, e) => s + e.cashPartyAmount, 0);
    const totalPaid = entries.reduce((s, e) => s + e.amountPaid, 0);
    const outstanding = totalAmount - totalPaid;
    const lastEntry = entries.sort((a,b) => b.date.localeCompare(a.date))[0];
    result.push({ ...party, totalAmount, totalPaid, outstanding, lastDate: lastEntry?.date });
  }
  return result;
};

// Get entries for daily bill (all parties, one day)
export const getDailyBillEntries = async (date) => {
  return db.cashPartyEntries.where('date').equals(date).toArray();
};

// Get entries for a party within a date range
export const getPartyBillEntries = async (partyId, startDate, endDate) => {
  return db.cashPartyEntries
    .where('partyId').equals(partyId)
    .and(e => e.date >= startDate && e.date <= endDate)
    .toArray();
};

// Mark transaction as paid (full or partial)
export const markAsPaid = async (entryId, amountPaid) => {
  const entry = await db.cashPartyEntries.get(entryId);
  const newPaid = parseFloat((entry.amountPaid + amountPaid).toFixed(2));
  const status = newPaid >= entry.cashPartyAmount ? 'paid' : 'partial';
  const paymentDate = new Date().toISOString();
  await db.cashPartyEntries.update(entryId, { amountPaid: newPaid, status, paymentDate });
  await queueSync('cash_party_entries', entryId, { id: entryId, amount_paid: newPaid, status, payment_date: paymentDate });
};
```

---

## 19. Export Services

### 15.1 DSR Excel Export
```javascript
import * as XLSX from 'xlsx';

export const exportDSR = (date, shifts, stationName) => {
  const wb = XLSX.utils.book_new();
  shifts.forEach((shift, i) => {
    const rows = [
      [stationName],
      [`Date: ${formatDisplayDate(date)}`],
      [],
      ['Nozzle','Employee','Opening','Closing','Diff (KG)','Sales (₹)','Cash','CC','UPI','Cash Party'],
      ...shift.rows.map(r => [
        r.nozzleName, r.employeeName, r.openingReading, r.closingReading,
        r.difference, r.salesRs, r.cash, r.cc, r.upi, r.cashParty
      ]),
      ['TOTAL','','','',
        shift.totals.totalDifference, shift.totals.totalSalesRs,
        shift.totals.totalCash, shift.totals.totalCC,
        shift.totals.totalUPI, shift.totals.totalCashParty
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, `SHIFT${i + 1}`);
  });
  XLSX.writeFile(wb, `${formatExportDate(date)}_DSR.xlsx`);
};
```

### 19.4 Bill PDF Export (Formal Invoice)
```javascript
export const exportBillPDF = (billData, stationName) => {
  const { party, entries, billNumber, dateRange, totalAmount, totalPaid, outstanding } = billData;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(0, 48, 135); // Adani Navy
  doc.text(stationName, 14, 20);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Bill No: ${billNumber}`, 14, 30);
  doc.text(`Date: ${formatDisplayDate(new Date())}`, 14, 37);
  doc.text(`Party: ${party.name}`, 14, 44);
  doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 51);

  // Table
  autoTable(doc, {
    startY: 60,
    head: [['Date', 'Diff (KG)', 'Sales (₹)', 'Cash Party (₹)', 'Status', 'Paid (₹)', 'Payment Date']],
    body: entries.map(e => [
      formatDisplayDate(e.date), e.diffKg, formatINR(e.salesRs),
      formatINR(e.cashPartyAmount), e.status.toUpperCase(),
      formatINR(e.amountPaid), e.paymentDate ? formatDisplayDate(e.paymentDate) : '—'
    ]),
    foot: [[
      'TOTAL', '', '',
      formatINR(totalAmount), '', formatINR(totalPaid), ''
    ]],
  });

  // Outstanding
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setTextColor(226, 35, 26); // Adani Red
  doc.text(`Outstanding Balance: ${formatINR(outstanding)}`, 14, finalY);

  const filename = `${billNumber.replace('-','')}_${party.name.replace(/\s+/g,'')}_DSR.pdf`;
  doc.save(filename);
};
```

### 19.5 Bill Excel Export
```javascript
export const exportBillExcel = (allPartyData, stationName) => {
  const wb = XLSX.utils.book_new();
  for (const { party, entries, totalAmount, totalPaid, outstanding } of allPartyData) {
    const rows = [
      [stationName],
      [`Party: ${party.name}`],
      [],
      ['Date','Diff (KG)','Sales (₹)','Cash Party (₹)','Status','Paid (₹)','Payment Date'],
      ...entries.map(e => [
        e.date, e.diffKg, e.salesRs, e.cashPartyAmount,
        e.status.toUpperCase(), e.amountPaid,
        e.paymentDate ? formatDisplayDate(e.paymentDate) : '—'
      ]),
      ['TOTAL','','',totalAmount,'',totalPaid,''],
      [],
      [`Outstanding: ${outstanding}`],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, party.name.slice(0, 31)); // Excel tab max 31 chars
  }
  XLSX.writeFile(wb, `PartyBills_${formatExportDate(new Date())}.xlsx`);
};
```

### 19.1 Attendance Register PDF Export
```javascript
export const exportAttendancePDF = (registerData, stationName, startDate, endDate, wage) => {
  const doc = new jsPDF('landscape');
  doc.setFontSize(16);
  doc.setTextColor(0, 48, 135);
  doc.text(stationName, 14, 15);
  doc.setFontSize(12);
  doc.setTextColor(0,0,0);
  doc.text(`Attendance Register: ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`, 14, 25);
  doc.text(`Per Shift Wage: ${formatINR(wage)}`, 14, 32);

  // Build date columns dynamically
  const dates = getDatesInRange(startDate, endDate);
  const head = [['Employee', ...dates.map(d => d.split('-')[2]), 'Shifts', 'Wage', 'Advance', 'Deduction', 'Net', 'Status']];
  const body = registerData.map(row => [
    row.employee.name,
    ...dates.map(d => row.byDate[d]?.sort().join(',') || ''),
    row.totalShifts,
    formatINR(row.totalWage),
    formatINR(row.advanceGiven),
    formatINR(row.deductionAmount),
    formatINR(row.netPayable),
    row.status.toUpperCase(),
  ]);

  autoTable(doc, { startY: 38, head, body, styles: { fontSize: 8 } });
  doc.save(`Attendance_${formatExportDate(startDate)}_${formatExportDate(endDate)}.pdf`);
};
```

### 19.2 Attendance Register Excel Export
```javascript
export const exportAttendanceExcel = (registerData, stationName, startDate, endDate, wage) => {
  const wb = XLSX.utils.book_new();
  const dates = getDatesInRange(startDate, endDate);

  const header = ['Employee', ...dates.map(d => d.split('-')[2]),
    'Total Shifts', 'Total Wage', 'Advance Given', 'Deduction', 'Net Payable', 'Status'];
  const rows = [
    [stationName],
    [`Period: ${startDate} to ${endDate} | Per Shift Wage: ₹${wage}`],
    [],
    header,
    ...registerData.map(row => [
      row.employee.name,
      ...dates.map(d => row.byDate[d]?.sort().join(',') || ''),
      row.totalShifts, row.totalWage, row.advanceGiven,
      row.deductionAmount, row.netPayable, row.status.toUpperCase(),
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
  XLSX.writeFile(wb, `Attendance_${formatExportDate(startDate)}.xlsx`);
};
```

### 19.7 Monthly DSR PDF Export
import autoTable from 'jspdf-autotable';

export const exportMonthlyPDF = (monthName, year, rows, stationName) => {
  const doc = new jsPDF('landscape');
  doc.setFontSize(16);
  doc.text(stationName, 14, 15);
  doc.setFontSize(12);
  doc.text(`Monthly DSR — ${monthName} ${year}`, 14, 25);
  autoTable(doc, {
    startY: 30,
    head: [['Date','Diff (KG)','Sales (₹)','Cash','CC','UPI','Cash Party']],
    body: rows.map(r => [r.date, r.totalDifference, r.totalSalesRs, r.totalCash, r.totalCC, r.totalUPI, r.totalCashParty]),
    foot: [['TOTAL', ...calculateMonthTotals(rows)]],
  });
  doc.save(`${monthName}_DSR.pdf`);
};
```

---

## 20. Dependencies (`package.json`)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "dexie": "^3.2.4",
    "@supabase/supabase-js": "^2.39.0",
    "bcryptjs": "^2.4.3",
    "xlsx": "^0.18.5",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "date-fns": "^3.3.1",
    "date-fns-tz": "^3.1.3",
    "react-hot-toast": "^2.4.1",
    "uuid": "^9.0.0",
    "@sentry/react": "^7.99.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.1.4",
    "vite-plugin-pwa": "^0.19.7",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35"
  }
}
```

---

## 21. Sentry Error Tracking Setup (`src/main.jsx`)

```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,         // 'development' or 'production'
  tracesSampleRate: 1.0,                      // 100% in production (adjust if volume grows)
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
});
```

**What Sentry captures automatically:**
- JavaScript runtime errors (uncaught exceptions)
- Failed Supabase sync operations (wrapped in try/catch + Sentry.captureException)
- Failed Dexie reads/writes
- React component render errors (via ErrorBoundary)

**Manual error reporting example:**
```javascript
try {
  await runSync();
} catch (err) {
  Sentry.captureException(err, {
    tags: { module: 'sync', action: 'push' },
    extra: { queueLength: queue.length },
  });
  setSyncStatus('error');
}
```

**Setup steps:**
1. Create free account at [sentry.io](https://sentry.io)
2. Create new project → select React
3. Copy DSN → paste into `.env` as `VITE_SENTRY_DSN`
4. Add DSN to Vercel environment variables

---

## 22. GitHub + Vercel CI/CD Setup

```
GitHub repo (main branch)
    │
    └── Push to main
            │
            └── Vercel auto-detects push
                    │
                    └── Runs: npm run build
                            │
                            └── Deploys to vercel.app
```

**Setup steps:**
1. Create GitHub repo: `github.com/yourname/dsr-manager`
2. Push code: `git init → git add . → git commit → git push`
3. In Vercel: Import GitHub repo → auto-deploy configured
4. Every `git push` to `main` → auto-deploys to production

**Cloudflare DNS** (if using custom domain in future):
- Add site to Cloudflare
- Point nameservers to Cloudflare from domain registrar
- Add CNAME record pointing to `cname.vercel-dns.com`
- Enable proxy (orange cloud) for CDN + DDoS protection

---

## 23. Environment Variables (`.env`)

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SENTRY_DSN=your_sentry_dsn_url
```

> Supabase anon key is safe to expose client-side (Supabase row-level security handles access control). Sentry DSN is also safe to expose publicly. All three must be added to Vercel's Environment Variables dashboard for production builds.
