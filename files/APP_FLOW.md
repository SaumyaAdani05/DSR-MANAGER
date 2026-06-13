# App Flow Document
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 2.0  
**Date:** June 2026

---

## 1. Top-Level App States

```
App Start
   │
   ├──► Not Authenticated ──► Login Page
   │
   └──► Authenticated
            │
            ├──► First Login ──► Security Setup ──► Settings Page
            │
            └──► Returning ──► Today's Dashboard
                                    │
                                    └── Start background sync (every 30s if online)
                                    └── Run 60-day cleanup
```

---

## 2. Authentication Flows

### 2.1 Login Flow
```
Login Page
   │
   ├── Enter Username + Password (show/hide toggle)
   ├── Click "Login"
   │
   ├──► Read /auth table from Dexie (local)
   │        │
   │        ├── Username match + bcrypt compare
   │        │        ├── MATCH ──► Store session in localStorage
   │        │        │              ├── First login? ──► Security Setup Page
   │        │        │              └── Returning? ──► Today's Dashboard
   │        │        └── NO MATCH ──► Toast error: "Invalid username or password"
   │        │
   │        └── No local data (fresh install) ──► Pull from Supabase first, then retry
```

### 2.2 Forgot Password Flow
```
Forgot Password Page
   │
   ├── Enter Username → Verify against local Dexie
   ├── Show Security Question
   ├── Enter Answer → bcrypt compare
   │        ├── MATCH ──► Show: Username + current password on screen
   │        │              Show: Set New Password section
   │        │              ├── Enter + confirm new password
   │        │              ├── Validate password rules
   │        │              ├── Hash + save to Dexie + queue Supabase sync
   │        │              └── Redirect to Login
   │        └── NO MATCH ──► Error: "Incorrect answer"
```

### 2.3 First Login Security Setup
```
Security Setup Page
   │
   ├── Custom security question (text input)
   ├── Answer (text input)
   ├── "Save & Continue" ──► Save to Dexie + queue sync ──► Settings Page
   └── "Skip for Now" ──► Settings Page
```

---

## 3. Dashboard Flow

### 3.1 Dashboard Load (Today)
```
Dashboard loads
   │
   ├── Run 60-day cleanup (Dexie + queue Supabase deletes)
   ├── Start background sync if online
   ├── Load today's date (IST)
   ├── Fetch all 3 shifts for today from Dexie
   ├── Determine active shift tab:
   │        ├── Has unsaved shifts → open first unsaved
   │        └── All saved or none → open Shift 1
   ├── Load Daily Sales Bar (real-time totals from all saved shifts today)
   └── Render shift grid
```

### 3.2 Loading a Past Date (from Calendar)
```
Owner clicks date on Calendar page
   │
   ├──► Is it today? → navigate to Dashboard (write mode)
   ├──► Is it within 60 days? → navigate to Dashboard with that date (full edit mode)
   └──► Is it older than 60 days or future? → disabled (cannot select)
   │
   On Dashboard with past date:
   ├── Check: Was previous day's Shift 3 filled?
   │        ├── YES ──► Auto-fill Shift 1 opening from Shift 3 closings (by row index)
   │        └── NO ──► Popup: "Day [date] Shift 3 not filled. Go there first?"
   │                   [Go to Shift 3] [Cancel]
   └── Render shift grid (editable — no locking)
```

---

## 4. Calendar Page Flow

```
Hamburger Menu → Calendar
   │
   ├── Open Calendar Page
   ├── Display current month
   ├── Highlighted dates: red dot for dates with saved data
   │
   ├── Owner navigates months (prev/next arrows)
   │        └── Monthly Summary at bottom updates to show that month's totals
   │
   ├── Owner clicks a date:
   │        ├── Date has data → navigate to Dashboard with that date
   │        ├── Date is today → navigate to Dashboard (today mode)
   │        ├── Empty date within 60 days → navigate to Dashboard (new entry)
   │        └── Disabled date → no action
   │
   └── Monthly Summary Section (bottom of page):
            ├── Shows: Diff (KG) | Sales (₹) | Cash | CC | UPI | Cash Party
            ├── Aggregates all saved shifts for displayed month
            └── Updates in real-time as month navigation changes
```

---

## 5. Shift Entry Flow

### 5.1 Shift Tab Selection
```
Owner clicks Shift tab (1, 2, or 3)
   │
   ├── Load shift data from Dexie (if not already in state)
   ├── Show audit trail below tabs: "Last saved: DD/MM/YYYY HH:MM" (grey, small)
   │        └── If never saved: hidden
   │
   ├── Check carryover:
   │        ├── Shift 2 or 3 selected → check if previous shift is saved
   │        │        ├── YES → Opening readings auto-filled (grey italic)
   │        │        └── NO → Owner enters manually
   │        └── Shift 1 of new date → check previous day Shift 3 (see 3.2)
   │
   └── Render grid (always editable — no locking in v2)
```

### 5.2 Row Data Entry
```
Nozzle Dropdown (with search box):
   ├── Type to filter nozzle list
   ├── Already-selected nozzles greyed out
   └── Select → assign to row

Employee Dropdown (with search box):
   ├── Type to filter employee list
   ├── Repeats allowed
   └── Select → assign to row

Opening Reading (number only):
   ├── Auto-filled → grey italic
   ├── Manual edit → removes italic
   └── On blur: validate > 0

Closing Reading (number only):
   └── On blur:
            ├── Validate > 0 and ≥ Opening
            ├── Calc Difference = Closing - Opening
            └── Calc Sales = Difference × Price

Cash / CC / UPI / Cash Party (number only, ≥ 0):
   └── On blur: check per-row reconciliation (Cash + CC + UPI + CashParty = Sales)
               ├── PASS → no error shown
               └── FAIL → inline warning on row (red border)

Tab key navigation:
   Nozzle → Employee → Opening → Closing → Cash → CC → UPI → Cash Party → next row Nozzle
   (skips Difference and Sales auto-calc fields)
```

### 5.3 Save Flow
```
Owner clicks "Save Shift [N]"
   │
   ├── Run validateShift():
   │        ├── Today's Price > 0?
   │        ├── All rows: fields filled, readings valid?
   │        └── All rows: Cash + CC + UPI + CashParty = Sales?
   │
   ├── FAILS:
   │        └── Popup listing all errors by row; block save
   │
   └── PASSES:
            │
            ├── Check: Does this edit affect already-saved next shift?
            │        ├── YES → Show generic warning popup:
            │        │         "Editing this shift will update the opening
            │        │          readings of the next shift. Continue?"
            │        │         [Yes, Save] [Cancel]
            │        └── NO → proceed directly
            │
            ├── Save to Dexie (instant, local)
            ├── Queue for Supabase sync
            ├── Update lastEditedAt timestamp
            ├── Show audit trail: "Last saved: [now]"
            │
            ├── Cascade carryover to next shift:
            │        ├── Update next shift's opening readings (by row index)
            │        └── Show banner: "Next shift's opening readings updated"
            │
            ├── Update Daily Sales Bar (real-time)
            └── Toast: "Shift [N] saved successfully"
```

---

## 6. Daily Sales Bar Flow

```
Daily Sales Bar (always visible below shift grid)
   │
   ├── Reads all saved shifts for current date from Dexie state
   ├── Sums: Diff (KG) + Sales (₹) + Cash + CC + UPI + Cash Party
   ├── Shows partial totals (from whatever shifts are saved)
   ├── Updates in real time after every shift save
   └── Visually distinct: highlighted card with "DAILY TOTAL" label
```

---

## 7. Settings Flow

### 7.1 Nozzle Management
```
Settings → Nozzle Management
   │
   ├── View ordered list of nozzles
   ├── Add: type name → validate (not empty, not duplicate, max 15) → save to Dexie + queue sync
   │         └── Immediately appears in open unsaved shift dropdown
   └── Remove: click Remove → confirm popup
               ├── If in unsaved shift → warn → greyed-out row until saved
               └── Soft delete (isActive: false) → historical records still show (greyed)
```

### 7.2 Employee Management
```
Same flow as Nozzle Management (max 50 employees)
```

### 7.3 Change Password
```
Settings → Change Password
   ├── Enter current password (verify via bcrypt)
   ├── Enter new password (show rules)
   ├── Confirm new password
   └── Update → hash → save to Dexie → queue sync → toast success
```

### 7.4 Supabase Config
```
Settings → Supabase Config
   ├── Input: Supabase Project URL
   ├── Input: Supabase Anon Key
   ├── Click "Save & Test Connection"
   │        ├── SUCCESS → "Connected ✓" green badge; start sync
   │        └── FAIL → "Connection failed" error; retry
   └── Credentials saved to Dexie settings table
```

---

## 8. Export Flows

### 8.1 DSR Excel Export
```
Hamburger → Export DSR
   │
   ├── Date picker to select export date
   ├── Check: all 3 shifts fully filled?
   │        ├── YES → generate + auto-download DDMMYYYY_DSR.xlsx
   │        └── NO → popup: "Shift 2 and Shift 3 are incomplete. Fill them first."
   └── File includes Cash Party column in each of the 3 tabs
```

### 8.2 Monthly Report
```
Hamburger → Monthly Report
   │
   ├── Open popup modal
   ├── Dropdown: available complete months (within 60 days)
   ├── Display table: Date | Diff KG | Sales ₹ | Cash | CC | UPI | Cash Party
   ├── Grand Total row at bottom
   └── "Export PDF" → auto-download MonthName_DSR.pdf
```

---

## 9. Sync Flow

```
App loads → check online status
   │
   ├── ONLINE → start 30-second sync interval
   │              Every 30s:
   │              ├── Push syncQueue items to Supabase
   │              ├── Pull remote changes newer than lastPullAt
   │              ├── Update sync indicator: "Synced ✓" (green)
   │              └── On error: "Sync Failed — Retrying" (red)
   │
   └── OFFLINE → sync indicator: "Offline — Local Only" (red)
                  All data entry still works (Dexie)
                  On reconnect → sync triggers immediately
```

---

## 10. Offline Flow

```
Internet connection lost
   │
   ├── Sync indicator → "Offline — Local Only" (red, top-left header)
   ├── All data entry continues to work (reads/writes to Dexie)
   ├── Save actions work locally; queued for sync on reconnect
   └── On reconnect:
            ├── Sync indicator → "Syncing..." (amber)
            ├── Push all queued changes to Supabase
            └── Sync indicator → "Synced ✓" (green)
```

---

## 11. Data Cleanup Flow

```
On every login:
   │
   ├── Calculate cutoff: today − 60 days
   ├── Query Dexie shifts table where date < cutoff
   ├── Delete from Dexie
   ├── Queue deletions for Supabase sync
   ├── Update calendar metadata
   └── Continue silently (no user notification)
```

---

## 12. Screen Map

```
/login                  → Login Page
/forgot-password        → Forgot Password Page
/setup                  → Security Setup (first login)
/                       → Dashboard (today's shift entry)
/dashboard/:date        → Dashboard (specific date — edit or history)
/calendar               → Calendar Page (date navigation + monthly summary)
/settings               → Settings Page
```

---

## 13. Error States Summary

| Scenario | Handling |
|----------|---------|
| Wrong login credentials | Toast error |
| Forgot password — wrong answer | Inline error |
| Validation fails on save | Popup with row-by-row error list |
| Cash+CC+UPI+CashParty ≠ Sales | Popup with failing row numbers |
| Export — shifts incomplete | Popup listing incomplete shifts |
| Previous day Shift 3 not filled | Popup with redirect button |
| Edit affects next shift | Generic warning popup before save |
| Nozzle deleted from unsaved shift | Warning + greyed row |
| Today's Price = 0 on save | Toast error |
| Supabase connection fails | "Sync Failed — Retrying" in header |
| Max 15 nozzles reached | Toast: "Maximum nozzle limit reached" |
| Max 50 employees reached | Toast: "Maximum employee limit reached" |
