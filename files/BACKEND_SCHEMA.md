# Backend Schema Document
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 1.0  
**Date:** June 2026  
**Database:** Firebase Firestore (NoSQL)

---

## 1. Overview

Firestore is a document-based NoSQL database. All data is organized into **collections** (like tables) containing **documents** (like rows), which can contain sub-collections or nested fields.

### Design Principles
- **One document per shift** → single read loads all row data for a shift
- **Lightweight metadata document** → calendar highlighting without reading all records
- **Batch writes** → save shift data + update metadata in one atomic operation
- **Offline persistence** → Firestore IndexedDB cache enabled for read-only offline mode
- **IST timestamps** → all `savedAt`, `editWindowExpiry`, `createdAt` stored as Firestore Timestamps in UTC, converted to IST in UI

---

## 2. Collection Structure Map

```
Firestore Root
├── /auth
│   └── owner                        (document)
│
├── /config
│   ├── settings                     (document)
│   ├── nozzles                      (document)
│   └── employees                    (document)
│
├── /metadata
│   └── calendar                     (document)
│
├── /sessions
│   └── {sessionId}                  (document)
│
└── /records
    └── {YYYY-MM-DD}                 (document — one per date)
        └── /shifts                  (sub-collection)
            ├── shift1               (document)
            ├── shift2               (document)
            └── shift3               (document)
```

---

## 3. Collection: `/auth`

### Document: `owner`

Stores the single owner's login credentials and security question.

```
/auth/owner
```

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `username` | String | Owner's login username | `"Adani0510"` |
| `passwordHash` | String | bcrypt hash of password (10 rounds) | `"$2a$10$..."` |
| `securityQuestion` | String | Custom security question text | `"What is my dog's name?"` |
| `securityAnswerHash` | String | bcrypt hash of security answer | `"$2a$10$..."` |
| `isFirstLogin` | Boolean | True until security question is set | `true` |
| `createdAt` | Timestamp | Account creation time (IST→UTC) | `Timestamp` |
| `updatedAt` | Timestamp | Last password/security update | `Timestamp` |

**Full Document Example:**
```json
{
  "username": "Adani0510",
  "passwordHash": "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghij",
  "securityQuestion": "What is the name of my first nozzle?",
  "securityAnswerHash": "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghij",
  "isFirstLogin": false,
  "createdAt": "2026-06-09T06:00:00.000Z",
  "updatedAt": "2026-06-09T06:30:00.000Z"
}
```

**Firestore Path:** `/auth/owner`  
**Access:** Read on login attempt; Write on password/security update  
**Security:** Readable by all (needed for login); writable only from trusted app code

---

## 4. Collection: `/config`

### Document: `settings`

Global station settings.

```
/config/settings
```

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `stationName` | String | Display name of the station | `"Memnagar CNG"` |
| `lastUpdatedAt` | Timestamp | Last time settings were changed | `Timestamp` |

**Full Document Example:**
```json
{
  "stationName": "Memnagar CNG",
  "lastUpdatedAt": "2026-06-09T07:00:00.000Z"
}
```

---

### Document: `nozzles`

Ordered list of all nozzles. Order of array = display order in grid.

```
/config/nozzles
```

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `list` | Array\<NozzleObject\> | Ordered list of nozzles | See below |
| `updatedAt` | Timestamp | Last modification time | `Timestamp` |

**NozzleObject:**
```json
{
  "id": "nozzle_uuid_1",
  "name": "N1",
  "isActive": true,
  "addedAt": "2026-06-09T06:00:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | UUID (generated on creation) |
| `name` | String | Display name (e.g., "N1", "CNG-01") |
| `isActive` | Boolean | `false` = deleted, still shown in history as greyed |
| `addedAt` | Timestamp | When nozzle was added |

**Full Document Example:**
```json
{
  "list": [
    { "id": "abc-001", "name": "N1", "isActive": true, "addedAt": "2026-06-09T06:00:00Z" },
    { "id": "abc-002", "name": "N2", "isActive": true, "addedAt": "2026-06-09T06:00:00Z" },
    { "id": "abc-003", "name": "N3", "isActive": false, "addedAt": "2026-06-09T06:00:00Z" }
  ],
  "updatedAt": "2026-06-10T10:00:00.000Z"
}
```

> Note: Nozzles are never hard-deleted from the list. `isActive: false` marks deletion. This preserves historical references.

---

### Document: `employees`

Ordered list of all employees.

```
/config/employees
```

| Field | Type | Description |
|-------|------|-------------|
| `list` | Array\<EmployeeObject\> | Ordered list of employees |
| `updatedAt` | Timestamp | Last modification time |

**EmployeeObject:**
```json
{
  "id": "emp_uuid_1",
  "name": "Ramesh Kumar",
  "isActive": true,
  "addedAt": "2026-06-09T06:00:00.000Z"
}
```

**Full Document Example:**
```json
{
  "list": [
    { "id": "emp-001", "name": "Ramesh Kumar", "isActive": true, "addedAt": "2026-06-09T06:00:00Z" },
    { "id": "emp-002", "name": "Suresh Patel", "isActive": true, "addedAt": "2026-06-09T06:00:00Z" },
    { "id": "emp-003", "name": "Mahesh Shah", "isActive": false, "addedAt": "2026-06-09T06:00:00Z" }
  ],
  "updatedAt": "2026-06-10T10:00:00.000Z"
}
```

---

## 5. Collection: `/metadata`

### Document: `calendar`

Lightweight document used to highlight dates on the calendar UI without loading all records.

```
/metadata/calendar
```

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `datesWithData` | Array\<String\> | ISO dates (YYYY-MM-DD) that have at least one saved shift | `["2026-06-09", "2026-06-10"]` |
| `updatedAt` | Timestamp | Last update | `Timestamp` |

**Full Document Example:**
```json
{
  "datesWithData": [
    "2026-06-09",
    "2026-06-10",
    "2026-06-11"
  ],
  "updatedAt": "2026-06-11T14:30:00.000Z"
}
```

> This single document is read on every dashboard load. Keeps calendar rendering fast (1 read instead of 60 reads).

---

## 6. Collection: `/sessions`

### Document: `{sessionId}`

Tracks active login sessions to detect second-device logins.

```
/sessions/{sessionId}
```

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `sessionId` | String | UUID generated on login | `"uuid-xyz-123"` |
| `loginAt` | Timestamp | Login time (IST→UTC) | `Timestamp` |
| `deviceInfo` | String | Browser user-agent (truncated) | `"Chrome/124 Windows"` |
| `isActive` | Boolean | True = current active session | `true` |

**Full Document Example:**
```json
{
  "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "loginAt": "2026-06-09T06:00:00.000Z",
  "deviceInfo": "Chrome/124 Windows NT 10.0",
  "isActive": true
}
```

**Logic:**
- On login: check all `/sessions` documents with `isActive: true`
  - If exists → second device → set that device to read-only
  - New session → write new session document
- On logout → set `isActive: false` on current session document

---

## 7. Collection: `/records`

### Document: `{YYYY-MM-DD}`

One document per calendar date. Contains only top-level metadata. Actual shift data lives in the `shifts` sub-collection.

```
/records/2026-06-09
```

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `date` | String | YYYY-MM-DD format (also the document ID) | `"2026-06-09"` |
| `createdAt` | Timestamp | When first shift was saved | `Timestamp` |
| `lastModifiedAt` | Timestamp | When any shift was last saved | `Timestamp` |
| `shiftsCompleted` | Array\<Number\> | Which shifts are saved (e.g., [1, 2]) | `[1, 2]` |

**Full Document Example:**
```json
{
  "date": "2026-06-09",
  "createdAt": "2026-06-09T06:30:00.000Z",
  "lastModifiedAt": "2026-06-09T18:45:00.000Z",
  "shiftsCompleted": [1, 2]
}
```

---

### Sub-collection: `/records/{date}/shifts`

#### Document: `shift1` / `shift2` / `shift3`

One document per shift per day. Contains all row data, price, totals, and lock metadata.

```
/records/2026-06-09/shifts/shift1
```

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `shiftNumber` | Number | 1, 2, or 3 | `1` |
| `date` | String | Parent date (YYYY-MM-DD) | `"2026-06-09"` |
| `price` | Number | Today's price per KG (₹, 2 decimal) | `96.50` |
| `rows` | Array\<RowObject\> | All data rows (max 15) | See below |
| `totals` | TotalsObject | Auto-calculated column sums | See below |
| `savedAt` | Timestamp | Last save time (UTC, shown as IST in UI) | `Timestamp` |
| `editWindowExpiry` | Timestamp | savedAt + 48 hours | `Timestamp` |
| `isLocked` | Boolean | True after edit window expires | `false` |
| `isSaved` | Boolean | True once saved for first time | `true` |
| `carryoverApplied` | Boolean | True if opening readings were auto-filled | `true` |
| `createdAt` | Timestamp | When shift document was first created | `Timestamp` |

---

#### RowObject Schema

| Field | Type | Description | Constraints |
|-------|------|-------------|------------|
| `rowIndex` | Number | Row position (0-based, fixed) | 0–14 |
| `nozzleId` | String | Reference to nozzle UUID | From `/config/nozzles` |
| `nozzleName` | String | Snapshot of nozzle name at save time | Stored for history display |
| `nozzleIsActive` | Boolean | Was nozzle active at save time | For greyed-out display |
| `employeeId` | String | Reference to employee UUID | From `/config/employees` |
| `employeeName` | String | Snapshot of employee name at save time | Stored for history display |
| `employeeIsActive` | Boolean | Was employee active at save time | For greyed-out display |
| `openingReading` | Number | Opening meter reading (2 decimal) | > 0 |
| `closingReading` | Number | Closing meter reading (2 decimal) | > 0, ≥ openingReading |
| `difference` | Number | closingReading - openingReading (2 decimal) | Auto-calculated |
| `salesRs` | Number | difference × price (2 decimal) | Auto-calculated |
| `cash` | Number | Cash payment amount (2 decimal) | ≥ 0 |
| `cc` | Number | Credit card payment amount (2 decimal) | ≥ 0 |
| `upi` | Number | UPI payment amount (2 decimal) | ≥ 0 |
| `isOpeningAutoFilled` | Boolean | True if opening was auto-carried from previous shift | For UI italic display |

---

#### TotalsObject Schema

| Field | Type | Description |
|-------|------|-------------|
| `totalDifference` | Number | Sum of all row differences (KG) |
| `totalSalesRs` | Number | Sum of all row sales amounts |
| `totalCash` | Number | Sum of all row cash amounts |
| `totalCC` | Number | Sum of all row CC amounts |
| `totalUPI` | Number | Sum of all row UPI amounts |

---

#### Complete Shift Document Example

```json
{
  "shiftNumber": 1,
  "date": "2026-06-09",
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
      "cc": 8000.00,
      "upi": 3447.13,
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
      "cash": 10000.00,
      "cc": 5000.00,
      "upi": 4253.25,
      "isOpeningAutoFilled": true
    }
  ],
  "totals": {
    "totalDifference": 421.75,
    "totalSalesRs": 40700.38,
    "totalCash": 20000.00,
    "totalCC": 13000.00,
    "totalUPI": 7700.38
  },
  "savedAt": "2026-06-09T08:30:00.000Z",
  "editWindowExpiry": "2026-06-11T23:59:00.000Z",
  "isLocked": false,
  "isSaved": true,
  "carryoverApplied": true,
  "createdAt": "2026-06-09T06:00:00.000Z"
}
```

---

## 8. Firestore Indexes

Firestore auto-indexes all single-field queries. The following **composite indexes** are needed:

| Collection | Fields | Order | Purpose |
|-----------|--------|-------|---------|
| `/records` | `date` ASC | ASC | Query records older than cutoff for cleanup |
| `/sessions` | `isActive` ASC, `loginAt` DESC | — | Find active sessions |

> Create these in Firebase Console → Firestore → Indexes tab, or via `firestore.indexes.json`.

---

## 9. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Auth — readable by all for login; not directly writable from client
    match /auth/owner {
      allow read: if true;
      allow write: if false; // Managed via Admin SDK or trusted function
    }

    // Config — only authenticated session can read/write
    match /config/{document} {
      allow read, write: if isValidSession();
    }

    // Metadata — only authenticated session
    match /metadata/{document} {
      allow read, write: if isValidSession();
    }

    // Sessions — allow create on login; allow update/read for session check
    match /sessions/{sessionId} {
      allow read, write: if true; // Controlled at app level
    }

    // Records — only authenticated session
    match /records/{date} {
      allow read, write: if isValidSession();

      match /shifts/{shiftId} {
        allow read, write: if isValidSession();
      }
    }

    // Helper: validate session via localStorage sessionId in request headers
    // Note: Full enforcement requires Firebase Auth in v2
    function isValidSession() {
      return true; // App-level session check handles this in v1
    }
  }
}
```

> **V2 Note:** Migrate to Firebase Auth (anonymous or email) for true server-side enforcement. In v1, the app-level session check in `ProtectedRoute` + `AuthContext` provides adequate security for single-user use.

---

## 10. Data Write Patterns

### 10.1 Save a Shift (Batch Write)
```javascript
const batch = writeBatch(db);

// 1. Write shift document
const shiftRef = doc(db, 'records', date, 'shifts', `shift${shiftNum}`);
batch.set(shiftRef, shiftData);

// 2. Update or create parent date document
const dateRef = doc(db, 'records', date);
batch.set(dateRef, {
  date,
  createdAt: serverTimestamp(),
  lastModifiedAt: serverTimestamp(),
  shiftsCompleted: arrayUnion(shiftNum),
}, { merge: true });

// 3. Update calendar metadata
const calendarRef = doc(db, 'metadata', 'calendar');
batch.set(calendarRef, {
  datesWithData: arrayUnion(date),
  updatedAt: serverTimestamp(),
}, { merge: true });

await batch.commit();
```

### 10.2 Force-Update Next Shift Carryover
```javascript
// Called after saving shiftN, to update shiftN+1 opening readings
const nextShiftRef = doc(db, 'records', date, 'shifts', `shift${shiftNum + 1}`);
const nextShiftSnap = await getDoc(nextShiftRef);

if (nextShiftSnap.exists()) {
  const nextShiftData = nextShiftSnap.data();
  const updatedRows = nextShiftData.rows.map((row, i) => ({
    ...row,
    openingReading: savedShiftRows[i]?.closingReading ?? row.openingReading,
    isOpeningAutoFilled: true,
  }));
  await updateDoc(nextShiftRef, { rows: updatedRows, lastModifiedAt: serverTimestamp() });
}
```

### 10.3 Read Shift Data (Lazy Load)
```javascript
// Only fetch when user selects a date/shift tab
const shiftRef = doc(db, 'records', date, 'shifts', `shift${shiftNum}`);
const shiftSnap = await getDoc(shiftRef);
return shiftSnap.exists() ? shiftSnap.data() : null;
```

### 10.4 Delete Old Records (Cleanup)
```javascript
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - 60);
const cutoffStr = cutoff.toISOString().split('T')[0];

const q = query(collection(db, 'records'), where('date', '<', cutoffStr));
const snap = await getDocs(q);

const batch = writeBatch(db);
snap.docs.forEach(d => batch.delete(d.ref));

// Also clean up shifts sub-collections
for (const dateDoc of snap.docs) {
  const shiftsSnap = await getDocs(collection(db, 'records', dateDoc.id, 'shifts'));
  shiftsSnap.docs.forEach(s => batch.delete(s.ref));
}

// Update calendar metadata
const calendarRef = doc(db, 'metadata', 'calendar');
const deletedDates = snap.docs.map(d => d.id);
batch.update(calendarRef, { datesWithData: arrayRemove(...deletedDates) });

await batch.commit();
```

---

## 11. Data Read Patterns Summary

| Operation | Documents Read | Frequency |
|-----------|---------------|-----------|
| App load / Login | `/metadata/calendar` | Every login |
| Open a date | `/records/{date}`, `/records/{date}/shifts/shift{N}` | On date select |
| Switch shift tab | `/records/{date}/shifts/shift{N}` | On tab click (if not cached) |
| Load settings | `/config/settings`, `/config/nozzles`, `/config/employees` | Once per session |
| Verify login | `/auth/owner` | On login attempt |
| Check carryover | `/records/{prevDate}/shifts/shift3` | On new date open |
| Monthly report | `/records/{date}` × ~30 docs | On month select |
| Session check | `/sessions/{id}` | On login |

**Estimated daily reads (typical usage):**
- Login: ~5 reads
- 3 shifts × 1 read each: 3 reads
- Calendar metadata: 1 read
- Settings: 3 reads
- **Total per day: ~12–15 reads** (well within free tier limit of 50,000/day)

---

## 12. Monthly Report Aggregation

Monthly report data is computed client-side by fetching all date documents for the selected month and summing their shift totals.

```javascript
// Fetch all dates in month
const startDate = `${year}-${month}-01`;
const endDate = `${year}-${month}-31`;

const q = query(
  collection(db, 'records'),
  where('date', '>=', startDate),
  where('date', '<=', endDate)
);
const snap = await getDocs(q);

// For each date, fetch all 3 shifts and sum totals
const monthlyRows = [];
for (const dateDoc of snap.docs) {
  const shifts = await Promise.all([1, 2, 3].map(n =>
    getDoc(doc(db, 'records', dateDoc.id, 'shifts', `shift${n}`))
  ));
  const dayTotals = shifts
    .filter(s => s.exists())
    .reduce((acc, s) => {
      const t = s.data().totals;
      return {
        totalDifference: acc.totalDifference + t.totalDifference,
        totalSalesRs: acc.totalSalesRs + t.totalSalesRs,
        totalCash: acc.totalCash + t.totalCash,
        totalCC: acc.totalCC + t.totalCC,
        totalUPI: acc.totalUPI + t.totalUPI,
      };
    }, { totalDifference: 0, totalSalesRs: 0, totalCash: 0, totalCC: 0, totalUPI: 0 });
  monthlyRows.push({ date: dateDoc.id, ...dayTotals });
}
```

---

## 13. Data Constraints Summary

| Entity | Constraint | Value |
|--------|-----------|-------|
| Nozzles per station | Maximum | 15 |
| Employees per station | Maximum | 50 |
| Rows per shift | Maximum | 15 (matches max nozzles) |
| Shifts per day | Fixed | 3 |
| Decimal places | Readings + Price + Calculations | 2 |
| Data retention | Auto-delete after | 60 days |
| Edit window | Hours from last save | 48 hours |
| Opening Reading | Minimum | > 0 |
| Closing Reading | Minimum | > 0 and ≥ Opening |
| Cash / CC / UPI | Minimum | ≥ 0 |
| Today's Price | Minimum | > 0 |
| Reconciliation | Per row | Cash + CC + UPI = Sales |

---

## 14. Backup & Recovery

- **Primary storage:** Firebase Firestore (managed, replicated by Google)
- **Offline cache:** Firestore IndexedDB persistence (browser-local)
- **Manual backup:** Owner can export daily DSR as Excel and monthly as PDF
- **No automated backup beyond Firestore** in v1
- **Recovery from accidental data loss:** Contact Firebase support (point-in-time recovery available on paid plans)

> **V2 Recommendation:** Enable Firestore PITR (Point-in-Time Recovery) on the Blaze plan for production use with critical financial data.
