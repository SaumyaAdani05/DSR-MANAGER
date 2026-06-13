# Technical Requirements Document (TRD)
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 2.0  
**Date:** June 2026  
**Status:** Final

---

## 1. Tech Stack Overview

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend Framework | React 18 (Vite) | Fast build, large ecosystem, component reuse |
| Styling | Tailwind CSS v3 | Utility-first, Adani theme via custom config |
| State Management | React Context API + useReducer | Sufficient for single-user v1 |
| Routing | React Router v6 | SPA navigation, protected routes |
| Local Database | Dexie.js (IndexedDB wrapper) | Offline-first; survives cache clears when PWA installed |
| Cloud Sync | Supabase (free tier — PostgreSQL) | Auto-sync every 30s; owner sets up free account |
| Auth Storage | Supabase (custom table, bcrypt) | Not Firebase Auth; username is not email |
| Excel Export | SheetJS (xlsx) | Industry standard, browser-compatible |
| PDF Export | jsPDF + jspdf-autotable | Lightweight, no server needed |
| Hosting | Vercel (free tier) | Continuous deployment, vercel.app subdomain |
| PWA | Vite PWA Plugin (vite-plugin-pwa) | Service worker + manifest auto-generation |
| Offline Cache | Workbox + Dexie.js | App shell cached; data in IndexedDB |
| Timezone | date-fns-tz | IST conversions for all timestamps |
| Number Format | Intl.NumberFormat (en-IN) | Indian format |
| Password Hashing | bcryptjs | Client-side hashing before Supabase write |

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

## 15. Export Services

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

### 15.2 Monthly PDF Export
```javascript
import jsPDF from 'jspdf';
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

## 16. Dependencies (`package.json`)

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
    "uuid": "^9.0.0"
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

## 17. Environment Variables (`.env`)

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> These are stored in `.env` and also saved to Dexie `settings` table via the Settings page for runtime use. Supabase anon key is safe to expose client-side (row-level security handles access).
