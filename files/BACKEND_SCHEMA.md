# Backend Schema Document
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 2.0  
**Date:** June 2026  
**Local DB:** Dexie.js (IndexedDB) | **Cloud DB:** Supabase (PostgreSQL)

---

## 1. Architecture Overview

DSR Manager uses a **local-first** architecture:
- All reads and writes go to **Dexie.js (IndexedDB)** first — instant, offline-capable
- A background sync service pushes changes to **Supabase (PostgreSQL)** every 30 seconds when online
- On app load, the latest cloud data is pulled to local (handles fresh installs or new devices)
- PWA installation ensures IndexedDB data is preserved by the OS (not cleared with browser cache)

```
User Action
    │
    ▼
Dexie.js (IndexedDB) ──► Instant response to user
    │
    ▼
syncQueue table ──► Background sync every 30s ──► Supabase (cloud)
```

---

## 2. Local Database — Dexie.js Schema

### 2.1 Table: `auth`
Stores single owner credentials.

| Field | Type | Description |
|-------|------|-------------|
| id | String (PK) | Always `"owner"` |
| username | String | Login username (`"Adani0510"`) |
| passwordHash | String | bcrypt hash (10 rounds) |
| securityQuestion | String | Custom security question |
| securityAnswerHash | String | bcrypt hash of answer |
| isFirstLogin | Boolean | True until security setup done |
| updatedAt | String (ISO) | Last update timestamp (IST) |

**Example:**
```json
{
  "id": "owner",
  "username": "Adani0510",
  "passwordHash": "$2a$10$...",
  "securityQuestion": "What is the name of my first nozzle?",
  "securityAnswerHash": "$2a$10$...",
  "isFirstLogin": false,
  "updatedAt": "2026-06-09T06:30:00.000+05:30"
}
```

---

### 2.2 Table: `settings`
Stores station settings and Supabase credentials.

| Field | Type | Description |
|-------|------|-------------|
| id | String (PK) | Always `"main"` |
| stationName | String | Display name (default: "Memnagar CNG") |
| supabaseUrl | String | Owner's Supabase project URL |
| supabaseKey | String | Supabase anon key |
| updatedAt | String (ISO) | Last update timestamp |

**Example:**
```json
{
  "id": "main",
  "stationName": "Memnagar CNG",
  "supabaseUrl": "https://xyz.supabase.co",
  "supabaseKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "updatedAt": "2026-06-09T06:00:00.000+05:30"
}
```

---

### 2.3 Table: `nozzles`
Ordered list of all nozzles (auto-increment id).

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Unique identifier |
| name | String | Display name (e.g., "N1", "CNG-02") |
| isActive | Boolean | False = soft deleted |
| order | Number | Display order (index in list) |
| addedAt | String (ISO) | When added |
| syncedAt | String (ISO) | Last sync to Supabase |

**Example:**
```json
[
  { "id": "abc-001", "name": "N1", "isActive": true, "order": 0, "addedAt": "2026-06-09T06:00:00Z" },
  { "id": "abc-002", "name": "N2", "isActive": true, "order": 1, "addedAt": "2026-06-09T06:00:00Z" },
  { "id": "abc-003", "name": "N3", "isActive": false, "order": 2, "addedAt": "2026-06-09T06:00:00Z" }
]
```

> Nozzles are never hard deleted. `isActive: false` preserves history.

---

### 2.4 Table: `employees`
Same structure as nozzles (max 50).

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Unique identifier |
| name | String | Employee name |
| isActive | Boolean | False = soft deleted |
| order | Number | Display order |
| addedAt | String (ISO) | When added |
| syncedAt | String (ISO) | Last sync |

---

### 2.5 Table: `shifts` ← Main Data Table
Compound primary key: `[date + shiftNumber]`

| Field | Type | Description |
|-------|------|-------------|
| date | String (PK1) | YYYY-MM-DD |
| shiftNumber | Number (PK2) | 1, 2, or 3 |
| price | Number | Today's price per KG (₹, 2 decimal) |
| rows | Array (JSON) | All row data (see RowObject below) |
| totals | Object (JSON) | Auto-calculated column totals |
| savedAt | String (ISO) | First save timestamp |
| lastEditedAt | String (ISO) | Most recent save timestamp |
| isSynced | Boolean | False if pending cloud sync |

#### RowObject Schema (inside `rows` array)

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| rowIndex | Number | Fixed position (0-based) | 0–14 |
| nozzleId | String | Nozzle UUID reference | From nozzles table |
| nozzleName | String | Snapshot at save time | For history display |
| nozzleIsActive | Boolean | Was nozzle active at save | For greyed display |
| employeeId | String | Employee UUID reference | From employees table |
| employeeName | String | Snapshot at save time | For history display |
| employeeIsActive | Boolean | Was employee active at save | For greyed display |
| openingReading | Number | Meter opening reading | > 0, 2 decimal |
| closingReading | Number | Meter closing reading | > 0, ≥ opening, 2 decimal |
| difference | Number | closingReading - openingReading | Auto-calculated |
| salesRs | Number | difference × price | Auto-calculated |
| cash | Number | Cash payment | ≥ 0, 2 decimal |
| cc | Number | Credit card payment | ≥ 0, 2 decimal |
| upi | Number | UPI payment | ≥ 0, 2 decimal |
| cashParty | Number | Cash Party (credit/deferred) | ≥ 0, 2 decimal |
| isOpeningAutoFilled | Boolean | True if auto-carried from prev shift | UI italic display |

#### TotalsObject Schema (inside `totals` field)

| Field | Type | Description |
|-------|------|-------------|
| totalDifference | Number | Sum of all row differences |
| totalSalesRs | Number | Sum of all row sales |
| totalCash | Number | Sum of all row cash |
| totalCC | Number | Sum of all row CC |
| totalUPI | Number | Sum of all row UPI |
| totalCashParty | Number | Sum of all row cash party |

#### Complete Shift Document Example

```json
{
  "date": "2026-06-09",
  "shiftNumber": 1,
  "price": 96.50,
  "rows": [
    {
      "rowIndex": 0,
      "nozzleId": "abc-001",
      "nozzleName": "N1",
      "nozzleIsActive": true,
      "employeeId": "emp-001",
      "employeeName": "Ramesh Kumar",
      "employeeIsActive": true,
      "openingReading": 15234.50,
      "closingReading": 15456.75,
      "difference": 222.25,
      "salesRs": 21447.13,
      "cash": 10000.00,
      "cc": 5000.00,
      "upi": 3447.13,
      "cashParty": 3000.00,
      "isOpeningAutoFilled": true
    },
    {
      "rowIndex": 1,
      "nozzleId": "abc-002",
      "nozzleName": "N2",
      "nozzleIsActive": true,
      "employeeId": "emp-002",
      "employeeName": "Suresh Patel",
      "employeeIsActive": true,
      "openingReading": 8901.00,
      "closingReading": 9100.50,
      "difference": 199.50,
      "salesRs": 19253.25,
      "cash": 9000.00,
      "cc": 5000.00,
      "upi": 3253.25,
      "cashParty": 2000.00,
      "isOpeningAutoFilled": true
    }
  ],
  "totals": {
    "totalDifference": 421.75,
    "totalSalesRs": 40700.38,
    "totalCash": 19000.00,
    "totalCC": 10000.00,
    "totalUPI": 6700.38,
    "totalCashParty": 5000.00
  },
  "savedAt": "2026-06-09T08:30:00.000+05:30",
  "lastEditedAt": "2026-06-09T08:30:00.000+05:30",
  "isSynced": true
}
```

---

### 2.6 Table: `syncQueue`
Tracks all local changes pending Supabase sync.

| Field | Type | Description |
|-------|------|-------------|
| id | Auto-increment | Queue entry ID |
| tableName | String | Target Supabase table name |
| recordId | String | Record identifier |
| action | String | `"upsert"` or `"delete"` |
| payload | Object (JSON) | Full record data to sync |
| createdAt | String (ISO) | When queued |

**Example:**
```json
{
  "id": 47,
  "tableName": "shifts",
  "recordId": "2026-06-09_1",
  "action": "upsert",
  "payload": {
    "date": "2026-06-09",
    "shift_number": 1,
    "price": 96.50,
    "rows": [...],
    "totals": {...},
    "last_edited_at": "2026-06-09T08:30:00.000Z"
  },
  "createdAt": "2026-06-09T08:30:00.000+05:30"
}
```

---

### 2.7 Table: `calendar`
Lightweight metadata for calendar dot indicators.

| Field | Type | Description |
|-------|------|-------------|
| date | String (PK) | YYYY-MM-DD |
| hasData | Boolean | True if any shift saved for this date |
| updatedAt | String (ISO) | Last update |

**Example:**
```json
[
  { "date": "2026-06-09", "hasData": true, "updatedAt": "2026-06-09T08:30:00Z" },
  { "date": "2026-06-10", "hasData": true, "updatedAt": "2026-06-10T08:15:00Z" }
]
```

---

## 3. Cloud Database — Supabase Schema (PostgreSQL)

Mirrors the local Dexie schema. Auto-created on first successful sync.

```sql
-- Auth
CREATE TABLE IF NOT EXISTS auth (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  security_question TEXT DEFAULT '',
  security_answer_hash TEXT DEFAULT '',
  is_first_login BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  station_name TEXT DEFAULT 'Memnagar CNG',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nozzles
CREATE TABLE IF NOT EXISTS nozzles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts (main data)
CREATE TABLE IF NOT EXISTS shifts (
  date TEXT NOT NULL,
  shift_number INTEGER NOT NULL CHECK (shift_number IN (1,2,3)),
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  rows JSONB NOT NULL DEFAULT '[]',
  totals JSONB NOT NULL DEFAULT '{}',
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_last_edited ON shifts(last_edited_at);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar(date);
```

---

## 4. Reconciliation Constraint

Per-row validation (enforced in app, not in DB):
```
Cash + CC + UPI + Cash Party = Sales in Rs.
```

Enforced in `validators.js` before every save. Blocks save if any row fails.

---

## 5. Carryover Data Flow

```
Shift 1 saved (rows[0..N] each have closingReading)
    │
    ▼
Shift 2 opening readings = Shift 1 closing readings (by rowIndex)
    │ rows[0].openingReading = Shift1.rows[0].closingReading
    │ rows[1].openingReading = Shift1.rows[1].closingReading
    │ ...
    ▼
Shift 3 opening readings = Shift 2 closing readings (same logic)
    │
    ▼
Next Day Shift 1 opening readings = Today Shift 3 closing readings (same logic)
```

Carryover is stored in the `isOpeningAutoFilled: true` flag in each row.

---

## 6. Daily Sales Aggregation

Daily totals are computed client-side in real-time:

```javascript
// getDailyTotals(date) — called after every shift save
const shifts = await db.shifts.where('date').equals(date).toArray();
const daily = shifts.reduce((acc, shift) => ({
  totalDifference: acc.totalDifference + shift.totals.totalDifference,
  totalSalesRs:    acc.totalSalesRs    + shift.totals.totalSalesRs,
  totalCash:       acc.totalCash       + shift.totals.totalCash,
  totalCC:         acc.totalCC         + shift.totals.totalCC,
  totalUPI:        acc.totalUPI        + shift.totals.totalUPI,
  totalCashParty:  acc.totalCashParty  + shift.totals.totalCashParty,
}), { totalDifference:0, totalSalesRs:0, totalCash:0, totalCC:0, totalUPI:0, totalCashParty:0 });
```

---

## 7. Monthly Summary Aggregation

```javascript
// getMonthlyTotals(year, month)
const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
const endDate   = `${year}-${String(month).padStart(2,'0')}-31`;

const shifts = await db.shifts
  .where('date')
  .between(startDate, endDate, true, true)
  .toArray();

// Group by date, sum all shifts per day, then collect per-day rows
```

---

## 8. Data Cleanup (`cleanupService.js`)

```javascript
export const cleanOldRecords = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().split('T')[0]; // YYYY-MM-DD

  // Delete from Dexie
  await db.shifts.where('date').below(cutoffStr).delete();
  await db.calendar.where('date').below(cutoffStr).delete();

  // Queue deletions for Supabase
  const toDelete = await db.shifts.where('date').below(cutoffStr).primaryKeys();
  for (const key of toDelete) {
    await db.syncQueue.add({
      tableName: 'shifts',
      recordId: `${key[0]}_${key[1]}`,
      action: 'delete',
      payload: { date: key[0], shift_number: key[1] },
      createdAt: new Date().toISOString(),
    });
  }
};
```

---

## 9. Data Constraints Summary

| Entity | Constraint | Value |
|--------|-----------|-------|
| Nozzles per station | Max | 15 |
| Employees per station | Max | 50 |
| Rows per shift | Max | 15 |
| Shifts per day | Fixed | 3 |
| Decimal places | All numeric fields | 2 |
| Data retention | Auto-delete after | 60 days |
| Opening Reading | Min | > 0 |
| Closing Reading | Min | > 0, ≥ Opening |
| Cash / CC / UPI / Cash Party | Min | ≥ 0 |
| Today's Price | Min | > 0 |
| Reconciliation | Per row | Cash + CC + UPI + CashParty = Sales |
| Sync frequency | When online | Every 30 seconds |
| No edit lock | Policy | Any record editable at any time |
