# Implementation Plan
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 2.0  
**Date:** June 2026  
**Stack:** React 18 + Tailwind CSS + Dexie.js + Supabase + Vercel

---

## 1. Pre-Development Checklist

### 1.1 Supabase Setup (free)
- [ ] Create free account at [supabase.com](https://supabase.com)
- [ ] Create a new project (free tier — 500MB storage)
- [ ] Copy Project URL + anon public key
- [ ] Paste into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Also paste into DSR Manager → Settings → Supabase Config on first use
- [ ] App will auto-create all tables on first successful sync

### 1.2 GitHub Setup (free)
- [ ] Create free account at [github.com](https://github.com)
- [ ] Create new repository: `dsr-manager` (private recommended)
- [ ] Initialize git in project: `git init && git add . && git commit -m "initial commit"`
- [ ] Push to GitHub: `git remote add origin https://github.com/yourname/dsr-manager.git && git push -u origin main`

### 1.3 Vercel Setup (free)
- [ ] Create free account at [vercel.com](https://vercel.com)
- [ ] Import GitHub repo `dsr-manager` → Vercel auto-detects Vite
- [ ] Set environment variables in Vercel dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SENTRY_DSN`
- [ ] Every `git push` to `main` → auto-deploys to production

### 1.4 Sentry Setup (free)
- [ ] Create free account at [sentry.io](https://sentry.io)
- [ ] Create new project → select **React**
- [ ] Copy DSN URL → paste into `.env` as `VITE_SENTRY_DSN`
- [ ] Install SDK: `npm install @sentry/react`
- [ ] Initialize in `src/main.jsx` (see TRD Section 17)

### 1.5 Cloudflare Setup (free — for future custom domain use)
- [ ] Create free account at [cloudflare.com](https://cloudflare.com)
- [ ] No action needed in v1 (app uses vercel.app subdomain)
- [ ] When adding a custom domain later: add site → update nameservers → add CNAME to Vercel

### 1.6 Development Environment
- [ ] Install Node.js v18+
- [ ] Scaffold project: `npm create vite@latest dsr-manager -- --template react`
- [ ] Install all dependencies (see TRD Section 16)
- [ ] Create `.env` with Supabase URL, anon key, and Sentry DSN
- [ ] Set up folder structure (see TRD Section 2)

### 1.4 Seed Initial Data (run once in browser console after first load)
```javascript
// Seed owner credentials into Dexie on first launch
import bcrypt from 'bcryptjs';
import { db } from './src/db/localDB';

const hash = await bcrypt.hash('Adani@mem0510', 10);
await db.auth.put({
  id: 'owner',
  username: 'Adani0510',
  passwordHash: hash,
  securityQuestion: '',
  securityAnswerHash: '',
  isFirstLogin: true,
  updatedAt: new Date().toISOString(),
});
await db.settings.put({
  id: 'main',
  stationName: 'Memnagar CNG',
  supabaseUrl: '',
  supabaseKey: '',
  updatedAt: new Date().toISOString(),
});
```

---

## 3. Development Phases Overview

| Phase | Name | Effort | Priority |
|-------|------|--------|---------|
| 0 | Project Setup & Config | 1 day | Critical |
| 1 | Dexie Local DB Setup | 1 day | Critical |
| 2 | Authentication | 2 days | Critical |
| 3 | Settings & Config | 2 days | Critical |
| 4 | Shift Entry Grid (core) | 3 days | Critical |
| 5 | Cash Party + Reconciliation | 1 day | Critical |
| 6 | Carryover & Validation Logic | 2 days | Critical |
| 7 | Save & Edit Flow (no locking) | 1 day | Critical |
| 8 | Daily Sales Bar | 1 day | High |
| 9 | Calendar Page | 2 days | High |
| 10 | Supabase Sync Service | 2 days | High |
| 11 | Party Management | 1 day | High |
| 12 | Bills Section | 3 days | High |
| 13 | Attendance & Payroll | 3 days | High |
| 14 | Export (DSR Excel + PDF) | 2 days | High |
| 15 | Monthly Report | 1 day | High |
| 16 | PWA & Offline | 1 day | Medium |
| 17 | UI Polish & Adani Theme | 2 days | Medium |
| 18 | Testing & Bug Fixes | 3 days | Critical |
| 19 | Deployment | 1 day | Critical |

**Total Estimated: ~35 development days**

---

## 3. Phase 0 — Project Setup & Configuration

### Tasks
- [ ] Scaffold Vite + React: `npm create vite@latest dsr-manager -- --template react`
- [ ] Install dependencies:
```bash
npm install dexie @supabase/supabase-js bcryptjs react-router-dom react-hot-toast xlsx jspdf jspdf-autotable date-fns date-fns-tz uuid @sentry/react
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npx tailwindcss init -p
```
- [ ] Configure `tailwind.config.js` with Adani color tokens
- [ ] Configure `vite.config.js` with PWA plugin
- [ ] Set up folder structure as per TRD
- [ ] Create `.env` with Supabase URL + anon key
- [ ] Set up global CSS (Inter font import, Tailwind directives)
- [ ] Create placeholder PWA icons (192 + 512px)
- [ ] Set up React Router in `App.jsx` with all routes

### Deliverables
- Blank app running on `localhost:5173`
- Tailwind working with Adani theme
- Router working

---

## 4. Phase 1 — Dexie Local DB Setup

### Tasks
- [ ] Create `src/db/localDB.js` with full Dexie schema (all tables from Backend Schema)
- [ ] Create `src/db/supabaseClient.js`:
```javascript
import { createClient } from '@supabase/supabase-js';
import { db } from './localDB';

export const getSupabaseClient = async () => {
  const settings = await db.settings.get('main');
  if (!settings?.supabaseUrl || !settings?.supabaseKey) return null;
  return createClient(settings.supabaseUrl, settings.supabaseKey);
};
```
- [ ] Write seed script (see Section 1.4 above)
- [ ] Test Dexie CRUD: write a test record, read it back, delete it
- [ ] Verify IndexedDB persists across browser refresh

### Deliverables
- All Dexie tables created and verified
- Supabase client initializes from settings table

---

## 5. Phase 2 — Authentication

### Tasks
- [ ] Build `AuthContext.jsx` with `isAuthenticated`, `isFirstLogin`, `logout`
- [ ] Build `authService.js` (login, logout, updatePassword, updateSecurityQuestion, verifySecurityAnswer)
- [ ] Build `ProtectedRoute.jsx` (checks localStorage session)
- [ ] Build `LoginPage.jsx`:
  - Username + password fields
  - Show/hide toggle
  - Error toast on failure
  - "Forgot Password?" link
- [ ] Build `ForgotPassword.jsx`:
  - Step 1: enter username → verify in Dexie
  - Step 2: show question → verify answer (bcrypt)
  - Step 3: show credentials + set new password option
  - Password rule validation display
- [ ] Build `SecuritySetup.jsx` (first login mandatory setup)
- [ ] Wire session to localStorage
- [ ] Second device read-only detection (Dexie `sessions` or localStorage flag)

### Deliverables
- Login, logout, forgot password all working
- First login security setup working
- Protected routes block unauthenticated access

---

## 6. Phase 3 — Settings & Config

### Tasks
- [ ] Build `settingsService.js`:
  - `getSettings()`, `updateStationName()`, `updateSupabaseConfig()`
  - `addNozzle()`, `removeNozzle()` (soft delete, isActive: false)
  - `addEmployee()`, `removeEmployee()`
  - All write to Dexie + queue Supabase sync
- [ ] Build `SettingsContext.jsx` — global nozzles + employees state
- [ ] Build `NozzleManager.jsx` — list (X/15), add field, remove with confirmation
- [ ] Build `EmployeeManager.jsx` — list (X/50), add field, remove with confirmation
- [ ] Build `SupabaseConfig.jsx` — URL + key inputs + "Save & Test Connection" button
- [ ] Build `SettingsPage.jsx` — compose all setting sections
- [ ] Nozzle removal: check if in unsaved shift → show warning → greyed row

### Deliverables
- All settings CRUD working
- Supabase config testable from settings
- Nozzle/employee add/remove working with warnings

---

## 7. Phase 4 — Shift Entry Grid (Core)

### Tasks
- [ ] Build `PriceHeader.jsx` — Date display, Shift label, Today's Price input (editable inline)
- [ ] Build `SearchDropdown.jsx` (reusable):
  - Search text input at top
  - Filtered option list
  - Greyed-out disabled options (used nozzles, inactive items)
  - Keyboard navigable
- [ ] Build `ShiftRow.jsx`:
  - Nozzle dropdown (with search; deduplication)
  - Employee dropdown (with search; repeats allowed)
  - Opening Reading (number only, grey italic if auto-filled)
  - Closing Reading (number only)
  - Difference (read-only, auto-calc on blur)
  - Sales (read-only, auto-calc on blur)
  - Cash, CC, UPI, Cash Party (number only, ≥ 0)
  - Tab navigation: Nozzle → Employee → Opening → Closing → Cash → CC → UPI → CashParty → next row
- [ ] Block letter input in all number fields (keydown event handler)
- [ ] Right-align all number values in cells
- [ ] Apply Indian number format (Intl.NumberFormat en-IN) to display values
- [ ] Build `TotalRow.jsx` — auto-sum all columns, updates on every row change
- [ ] Build `ShiftGrid.jsx` — wraps header row + ShiftRow × N + TotalRow
- [ ] Build `AuditTrail.jsx` — "Last saved: DD/MM/YYYY HH:MM" grey text below tabs
- [ ] Build `ShiftTabs.jsx` — SHIFT 1/2/3 tabs with saved status dots
- [ ] Render only configured nozzle rows (not all 15 slots)

### Deliverables
- Full shift grid renders with all 10 columns
- Dropdowns with search working
- Tab key navigation working
- Auto-calculations on blur working
- Total row auto-updating

---

## 8. Phase 5 — Cash Party + Reconciliation

### Tasks
- [ ] Add `cashParty` field to all row schemas and total calculations
- [ ] Update `calculations.js` — include cashParty in totals
- [ ] Update `validators.js` — reconciliation: Cash + CC + UPI + CashParty = Sales
- [ ] Show per-row inline error indicator (red left border + `#FEF2F2` bg) when reconciliation fails
- [ ] Block save with popup listing all failing rows with their calculated vs expected values
- [ ] Include Cash Party in Total Row sum
- [ ] Include Cash Party in Daily Sales Bar

### Deliverables
- Cash Party column fully functional
- Reconciliation with 4 payment types working
- Validation blocks save on mismatch

---

## 9. Phase 6 — Carryover & Validation

### Tasks
- [ ] Build `useCarryover.js` hook:
  - `getCarryoverForShift(date, shiftNum)` → fetch previous shift data from Dexie
  - `applyCarryover(rows, prevShiftRows)` → map by row index
  - `cascadeCarryover(date, shiftNum, savedRows)` → update next shift + queue sync
- [ ] Day-boundary carryover: check previous day Shift 3 on new date open
- [ ] Missing Shift 3 popup: redirect button to previous day
- [ ] Auto-fill Today's Price from previous shift/day (fallback to `0.00`)
- [ ] Auto-fill visual: grey italic on opening; removed on manual edit
- [ ] Cascade warning: generic popup before saving if next shift already has data
- [ ] Build all validation rules in `validators.js`
- [ ] Inline error display: red border + error text below field

### Deliverables
- Carryover fully working between shifts and across day boundary
- Auto-fill italic indicator working
- Cascade warning showing before save
- All validation rules enforced

---

## 10. Phase 7 — Save & Edit Flow

### Tasks
- [ ] Build `shiftService.js`: `saveShift()`, `getShift()`, `getAllShiftsForDate()`
- [ ] Save button per shift:
  - Run `validateShift()` first
  - If next shift has saved data → show cascade warning popup
  - Write to Dexie → queue Supabase sync
  - Update `lastEditedAt`
  - Show audit trail update
  - Call `cascadeCarryover()`
  - Update Daily Sales Bar
  - Show success toast
- [ ] No locking: any saved shift always shows Save button
- [ ] Re-editing: all fields always editable; no Edit button needed

### Deliverables
- Save flow working end-to-end
- Any past shift editable at any time
- Cascade carryover triggers on every save

---

## 11. Phase 8 — Daily Sales Bar

### Tasks
- [ ] Build `DailySalesBar.jsx`:
  - Highlighted card below shift grid
  - "DAILY TOTAL" label (navy bold)
  - Shows: Diff (KG) | Sales (₹) | Cash | CC | UPI | Cash Party
  - Indian number format
  - Light navy tint background (`#EFF6FF`)
- [ ] Build `useDailyTotals.js` hook:
  - Subscribes to current date's shifts in Dexie state
  - Recomputes on every shift save
  - Shows partial totals from whatever shifts are filled
- [ ] Smooth number transition animation on value change

### Deliverables
- Daily Sales Bar always visible regardless of shift tab
- Updates in real-time after each shift save
- Partial totals shown correctly

---

## 12. Phase 9 — Calendar Page

### Tasks
- [ ] Build `CalendarPage.jsx`:
  - Month grid (Mon–Sun headers)
  - Month navigation (prev/next arrows)
  - Today: Adani Red circle
  - Dates with data: small red dot below date number (from Dexie calendar table)
  - Past 60 days: selectable
  - Future + older than 60 days: gray, disabled
  - Click date → navigate to `/dashboard/:date`
- [ ] Build `MonthlySummary.jsx`:
  - Appears at bottom of Calendar page
  - Updates as owner navigates months
  - Aggregates all shifts for displayed month from Dexie
  - Shows: Diff (KG) | Sales (₹) | Cash | CC | UPI | Cash Party
- [ ] Wire Calendar link in hamburger menu
- [ ] Remove any date picker from Dashboard (Calendar is now the navigation)

### Deliverables
- Full calendar page with dot indicators
- Monthly summary updates on month navigation
- Clicking dates navigates to correct dashboard view

---

## 13. Phase 10 — Supabase Sync Service

### Tasks
- [ ] Build `syncService.js` (from TRD Section 5):
  - `startSync()`, `stopSync()`, `runSync()`
  - Push: iterate syncQueue → upsert to Supabase → mark as done
  - Pull: fetch changes newer than `lastPullAt` → write to Dexie
  - 30-second interval when online
- [ ] Build `SyncContext.jsx` — syncStatus state (`synced/syncing/offline/error`)
- [ ] Build `SyncIndicator.jsx` — colored dot + text in header top-left
- [ ] Wire `useOnlineStatus.js` to start/stop sync
- [ ] Auto-create Supabase tables on first successful sync:
  - Run `CREATE TABLE IF NOT EXISTS` SQL statements
- [ ] Handle Supabase not configured (no URL/key): skip sync, no errors
- [ ] Handle sync errors gracefully: retry on next interval

### Deliverables
- Auto-sync every 30 seconds when online
- Sync indicator showing live status
- Offline → online triggers immediate sync
- Supabase tables auto-created on first sync

---

## 14. Phase 11 — Party Management

### Tasks
- [ ] Build `partyService.js`:
  - `getParties()` → fetch all active parties from Dexie
  - `addParty(name)` → validate not empty/duplicate → save to Dexie + queue sync
  - `removeParty(id)` → check for pending dues → soft delete (`isActive: false`) + queue sync
- [ ] Build `PartyManagementPage.jsx`:
  - Ordered list of all parties
  - Add party: text input + "Add" button
  - Remove party: × button + confirmation popup
  - Warning if party has pending/partial dues: "This party has outstanding dues. Delete anyway?"
  - Deleted parties: greyed in history; removed from Cash Party popup
- [ ] Wire "Party Management" in hamburger menu → `/parties`
- [ ] Party appears in Cash Party popup immediately after adding

### Deliverables
- Party list CRUD fully working
- Soft delete with outstanding dues warning
- Party list synced to Supabase

---

## 15. Phase 12 — Bills Section

### Tasks — Cash Party Popup
- [ ] Build `CashPartyPopup.jsx`:
  - Searchable party dropdown
  - "Add New Party" shortcut at bottom
  - Auto-closes on party selection
  - Party name shown as badge below Cash Party cell in shift row
- [ ] Trigger popup when Cash Party amount > 0 on blur
- [ ] Party name mandatory when Cash Party > 0 — block save if missing
- [ ] On shift save: call `saveCashPartyEntry()` for each row with Cash Party > 0

### Tasks — Bill Service
- [ ] Build `billService.js` (from TRD Section 15):
  - `getNextBillNumber()` — auto-increment BILL-001, BILL-002...
  - `saveCashPartyEntry(entry)` — save to Dexie + queue sync
  - `getPartiesWithBalance()` — aggregate outstanding per party
  - `getDailyBillEntries(date)` — all entries for a date
  - `getPartyBillEntries(partyId, startDate, endDate)` — filtered entries
  - `markAsPaid(entryId, amountPaid)` — update status + paymentDate

### Tasks — Bills Landing Page
- [ ] Build `BillsPage.jsx`:
  - Table: Party | Outstanding (₹) | Last Txn | [View Bill]
  - Outstanding = 0 → green ✓; > 0 → red
  - "Daily Bill" button + "Generate Bill" button at top

### Tasks — Daily Bill View
- [ ] Build `DailyBillView.jsx`:
  - Date picker
  - Fetch all entries for that date grouped by party
  - Columns: Party | Diff (KG) | Sales (₹) | Cash Party (₹) | Status
  - Export PDF + Export Excel + Print buttons

### Tasks — Party Bill Detail
- [ ] Build `PartyBillDetail.jsx`:
  - Back button; Party name + Bill number in header
  - Date range picker (start → end)
  - Day-by-day table: Date | Diff (KG) | Sales (₹) | Cash Party | Status | Paid | Payment Date
  - Grand total row + Outstanding balance in red
- [ ] Build `MarkAsPaidPopup.jsx`:
  - Shows: total due, already paid, outstanding
  - Amount paid input (pre-filled with outstanding, editable)
  - Payment date picker (default today IST)
  - Validate: amount ≤ outstanding
  - On confirm → `markAsPaid()` → status badge updates live

### Tasks — Bill Exports
- [ ] `exportBillPDF()` — formal invoice (from TRD 16.3):
  - Navy station name header, bill number, party, date range
  - Table with all columns + status + paid amounts
  - Outstanding balance in red at bottom
  - Filename: `BILLNUMBER_PartyName_DSR.pdf`
- [ ] `exportBillExcel()` — one sheet per party (from TRD 16.4):
  - Filename: `PartyBills_DDMMYYYY.xlsx`
- [ ] Print CSS: `@media print { .no-print { display: none; } }` — clean white output

### Deliverables
- Cash Party popup mandatory and working in shift grid
- Bills landing with outstanding balances working
- Daily bill view working
- Party bill detail + date range working
- Full and partial payment marking working
- PDF formal invoice export working
- Excel one-sheet-per-party export working
- Print layout working

---

## 16. Phase 13 — Attendance & Payroll

### Tasks — Auto-Mark Attendance
- [ ] Update `shiftService.saveShift()` to call `attendanceService.markAttendanceFromShift()` after every save
- [ ] `markAttendanceFromShift()` deduplicates employees per shift (same employee in multiple rows = 1 entry)
- [ ] Uses Dexie `put()` (upsert) so re-saving same shift doesn't duplicate attendance
- [ ] Queues each attendance record for Supabase sync

### Tasks — Attendance Settings
- [ ] Per Shift Wage input (editable inline on attendance page)
- [ ] `getPerShiftWage()` + `updatePerShiftWage()` in `attendanceService.js`
- [ ] Saved to Dexie `attendanceSettings` table + queued for sync

### Tasks — Attendance Register Page
- [ ] Build `AttendancePage.jsx`:
  - Per Shift Wage editable input at top
  - Date range picker (start → end) with "This Month" shortcut button
  - "Load Register" button → call `buildAttendanceRegister()`
  - Traditional register table (employees × dates)
  - Cell content: shift numbers worked (e.g., "1", "1,2", "1,2,3") or blank
  - Rightmost columns: Shifts | Wage | Advance | Deduction (editable) | Net | Status | Pay
  - Deduction column: inline editable input per employee → updates net payable live
  - Net Payable: red text if negative
  - "➕ Advance" button per employee row
  - "Pay Now" button (red) or "✓ PAID [date]" (green) per employee
  - Employee name clickable → navigate to `/attendance/employee/:id`
  - Export PDF + Export Excel buttons

### Tasks — Add Advance Popup
- [ ] Build `AddAdvancePopup.jsx`:
  - Employee name (pre-filled, read-only)
  - Amount input (> 0, number only)
  - Date picker (default today)
  - Optional note text input
  - Save → `advanceService.addAdvance()` → update register totals live
  - Validate amount > 0

### Tasks — Pay Salary Popup
- [ ] Build `PaySalaryPopup.jsx`:
  - Shows: employee name, period, total shifts, wage, deduction, net payable
  - Net payable in red if negative
  - Payment date picker (default today IST)
  - Confirm → `advanceService.recordSalaryPayment()` → status → "PAID ✓"

### Tasks — Employee Profile Page
- [ ] Build `EmployeeProfilePage.jsx` (`/attendance/employee/:id`):
  - Back button
  - Outstanding advance balance (total given − total deducted so far)
  - Advance History table: Date | Amount | Note | Running Total
  - Salary History table: Period | Shifts | Wage | Deduction | Net | Status | Paid Date

### Tasks — Attendance Export
- [ ] `exportAttendancePDF()` (from TRD Section 19.1):
  - Landscape PDF, station name header, per shift wage shown
  - Filename: `Attendance_DDMMYYYY_DDMMYYYY.pdf`
- [ ] `exportAttendanceExcel()` (from TRD Section 19.2):
  - Traditional register layout, employees × dates
  - Summary columns at end
  - Filename: `Attendance_DDMMYYYY.xlsx`

### Deliverables
- Attendance auto-marked correctly on every shift save
- Per shift wage editable and saved
- Register builds correctly for any date range
- Advance add/view working per employee
- Deduction editable per employee per period
- Net payable calculates correctly (including negatives)
- Pay Now flow working with payment date
- Employee profile with full advance + salary history
- PDF + Excel attendance export working

---

## 17. Phase 14 — Export (DSR Excel + PDF)

### Tasks — DSR Excel
- [ ] Build `ExportDSR.jsx`:
  - Date picker modal
  - Check all 3 shifts complete (all rows filled)
  - If not: popup listing which shifts are incomplete
- [ ] Build `exportService.js → exportDSR()`:
  - SheetJS workbook with 3 tabs (SHIFT1, SHIFT2, SHIFT3)
  - Each tab: station name, date, 10 columns including Cash Party, grand total row
  - Filename: `DDMMYYYY_DSR.xlsx`

### Tasks — Monthly PDF
- [ ] Build `MonthlyReport.jsx` modal:
  - Dropdown of complete months
  - On-screen table with all columns + Cash Party + grand total
- [ ] `exportService.js → exportMonthlyPDF()`:
  - jsPDF landscape + autoTable
  - Station name header
  - Filename: `MonthName_DSR.pdf`

### Deliverables
- DSR export with Cash Party working
- Export blocked if shifts incomplete
- Monthly PDF with Cash Party working

---

## 18. Phase 15 — Monthly Report

### Tasks
- [ ] Complete month validation: every day in the calendar month has all 3 shifts saved
- [ ] Dropdown populates only qualifying months within 60-day window
- [ ] Grand total row at bottom of on-screen table
- [ ] Month navigation updates on-screen table + summary

### Deliverables
- Only fully complete months in dropdown
- On-screen and PDF monthly reports correct

---

## 19. Phase 16 — PWA & Offline

### Tasks
- [ ] Configure `vite-plugin-pwa` (auto-update, Workbox caching)
- [ ] PWA manifest: name "DSR Manager", navy theme, icons
- [ ] Verify IndexedDB preserved when PWA installed (test by clearing browser cache while PWA installed)
- [ ] Install prompt banner (30 seconds after first visit)
- [ ] Test offline mode: disconnect → all data entry works → reconnect → sync

### Deliverables
- Installable as desktop PWA
- Full offline data entry working via Dexie
- Auto-update on new deployment

---

## 20. Phase 17 — UI Polish & Adani Theme

### Tasks
- [ ] Apply full Adani color palette across all components
- [ ] Header: navy, sync indicator top-left, hamburger top-right
- [ ] Side drawer: dark navy, slide animation
- [ ] Shift tabs: correct active/inactive/saved states, audit trail below
- [ ] Data grid: column widths, row heights (50px), alternating colors, hover states
- [ ] Error rows: red left border + pink tint
- [ ] Daily Sales Bar: blue tint card, bold label
- [ ] All buttons: correct states (default/hover/active/disabled)
- [ ] Search dropdowns: clean filter UI
- [ ] Toast notifications: 4 color variants, top-right
- [ ] Calendar page: red dot indicators, navy today highlight
- [ ] Login page: navy bg, white card, centered
- [ ] Empty state messages: friendly, helpful text
- [ ] All microinteractions: drawer slide, modal fade, toast slide, sync pulse
- [ ] Inter font applied throughout

### Deliverables
- Full Adani-themed professional UI
- All states visually distinct
- Consistent design system throughout

---

## 21. Phase 18 — Testing & Bug Fixes

### Manual Test Scenarios

**Authentication**
- [ ] Login correct credentials → dashboard
- [ ] Login wrong password → error toast
- [ ] Forgot password flow end-to-end
- [ ] First login → security setup → settings
- [ ] Change password (valid rules + invalid rules)

**Shift Entry**
- [ ] Fill all rows correctly → save
- [ ] Tab through all cells in correct order (skip Diff + Sales)
- [ ] Leave employee empty → block save
- [ ] Closing < Opening → block save
- [ ] Cash + CC + UPI + CashParty ≠ Sales → popup with row numbers
- [ ] Cash Party zero + others correct → saves fine
- [ ] Today's Price = 0 → block save

**Carryover**
- [ ] Shift 1 save → Shift 2 opening auto-fills (grey italic)
- [ ] Shift 2 save → Shift 3 opening auto-fills
- [ ] Shift 3 save → next day Shift 1 opening auto-fills
- [ ] Edit Shift 1 → cascade warning → confirm → Shift 2 opening updates
- [ ] New date without previous day Shift 3 → redirect popup

**Daily Sales Bar**
- [ ] Shows partial totals after Shift 1 saved
- [ ] Updates after Shift 2 saved
- [ ] Correct grand total after all 3 shifts saved
- [ ] Visible regardless of which shift tab is active

**Calendar Page**
- [ ] Red dots on dates with saved data
- [ ] Today highlighted in navy/red
- [ ] Future dates not selectable
- [ ] 60+ day old dates not selectable
- [ ] Click date → navigates to correct dashboard view
- [ ] Monthly summary updates on month navigation
- [ ] Monthly summary shows partial data for current month

**Settings**
- [ ] Add nozzle → appears immediately in open shift
- [ ] Remove nozzle in use → warning → greyed row
- [ ] Deleted nozzle shows greyed in history
- [ ] Add employee past 50 → blocked
- [ ] Add nozzle past 15 → blocked
- [ ] Supabase config → test connection → success/fail

**Sync**
- [ ] Go offline → sync indicator shows "Offline — Local Only"
- [ ] Save offline → data in Dexie → reconnect → syncs to Supabase
- [ ] Clear browser cache while PWA installed → data still present (IndexedDB preserved)
- [ ] Sync indicator: Syncing (amber pulse) → Synced (green)

**Export**
- [ ] DSR: all 3 shifts filled → Excel downloads with 3 tabs + Cash Party
- [ ] DSR: Shift 2 missing → popup lists Shift 2 as incomplete
- [ ] Monthly: only complete months in dropdown
- [ ] Monthly PDF downloads with Cash Party column

**Bills & Cash Party**
- [ ] Enter Cash Party > 0 → popup appears immediately on blur
- [ ] Select party → badge shown below Cash Party cell in row
- [ ] Save shift with Cash Party > 0 but no party selected → blocked with error
- [ ] Save shift with party → cashPartyEntry created with BILL-XXX auto number
- [ ] Bill numbers are sequential globally (BILL-001, BILL-002...)
- [ ] Bills landing shows correct outstanding balance per party
- [ ] Party with all paid entries shows ₹0 outstanding with green ✓
- [ ] Daily bill view shows all parties for selected date with correct totals
- [ ] Party bill detail shows correct day-by-day breakdown for date range
- [ ] Grand total row at bottom of party bill detail is correct
- [ ] Mark as paid (full amount) → status badge → "Paid", outstanding = 0
- [ ] Mark as paid (partial) → status badge → "Partial", outstanding reduces
- [ ] Payment amount > outstanding → inline error blocks confirm
- [ ] Delete party with pending dues → warning → confirm → soft deleted
- [ ] Deleted party still shows greyed in historical bill entries
- [ ] Bill PDF exports correctly: bill number, party name, table, outstanding in red
- [ ] Bill Excel: one sheet per party, correct data
- [ ] Print layout removes header, sidebar, buttons (print CSS works)
- [ ] Same party in multiple rows same shift → separate bill entries, separate numbers
- [ ] Cash Party popup cancelled → field resets to 0 (no orphan entry saved)

**Attendance & Payroll**
- [ ] Save Shift 1 with Ramesh in 2 rows → attendance marked once for Ramesh in Shift 1
- [ ] Save Shift 1 and Shift 2 with same employee → 2 attendance records (one per shift)
- [ ] Re-save same shift → attendance not duplicated (upsert works)
- [ ] Register loads correctly for full month (employees × dates grid)
- [ ] Cell shows "1,2" when employee worked Shift 1 and Shift 2 on same day
- [ ] Add advance → Advance Given column updates immediately
- [ ] Enter deduction → Net Payable recalculates live
- [ ] Net Payable negative → shows in red (not blocked)
- [ ] Pay Now → popup shows correct breakdown → confirm → status → "✓ PAID"
- [ ] Employee profile shows full advance history with running totals
- [ ] Employee profile shows salary payment history
- [ ] Outstanding advance balance correct (total given − total deducted)
- [ ] Attendance PDF exports correctly in landscape with all columns
- [ ] Attendance Excel has correct register layout (employees × dates)
- [ ] Per shift wage change → recalculates all wages in register

### Edge Cases
- [ ] First-ever Day 1 Shift 1 (no carryover, no price history)
- [ ] Skipped shift (closing = opening, all payments = 0) → carryover still works
- [ ] Same employee in multiple rows of same shift
- [ ] Edit very old shift → cascade warning → carryover updates correctly
- [ ] 60-day cleanup runs on login → old records gone from both Dexie + Supabase queue

---

## 22. Phase 19 — Deployment

### Tasks
- [ ] Ensure GitHub repo is up to date: `git push origin main`
- [ ] Verify all 3 env vars set in Vercel dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SENTRY_DSN`
- [ ] Vercel auto-deploys on push — confirm build passes in Vercel dashboard
- [ ] Verify live app at `dsr-manager.vercel.app` (or chosen subdomain)
- [ ] Confirm Supabase tables auto-created on first sync
- [ ] Verify Sentry receives a test error (temporarily throw one, check Sentry dashboard)
- [ ] Run seed script in browser console on first open (create owner credentials in Dexie)
- [ ] Test Supabase sync in production (save a shift → check Supabase table viewer)
- [ ] Test PWA install on Chrome desktop
- [ ] Full end-to-end test on production URL

---

## 23. File-by-File Build Order (75 files)

```
1.  src/db/localDB.js
2.  src/db/supabaseClient.js
3.  src/utils/constants.js
4.  src/utils/formatters.js
5.  src/utils/calculations.js
6.  src/utils/validators.js
7.  src/utils/dateUtils.js
8.  src/services/authService.js
9.  src/context/AuthContext.jsx
10. src/context/SyncContext.jsx
11. src/hooks/useOnlineStatus.js
12. src/services/syncService.js
13. src/services/cleanupService.js
14. src/services/settingsService.js
15. src/services/partyService.js
16. src/services/billService.js
17. src/services/attendanceService.js
18. src/services/advanceService.js
19. src/context/SettingsContext.jsx
20. src/services/shiftService.js
21. src/hooks/useCarryover.js
22. src/hooks/useDailyTotals.js
23. src/hooks/useShiftData.js
24. src/components/ui/Button.jsx
25. src/components/ui/Input.jsx
26. src/components/ui/SearchDropdown.jsx
27. src/components/ui/Modal.jsx
28. src/components/ui/Toast.jsx
29. src/components/ui/WarningPopup.jsx
30. src/components/ui/StatusBadge.jsx
31. src/components/auth/LoginForm.jsx
32. src/components/auth/ForgotPassword.jsx
33. src/components/auth/SecuritySetup.jsx
34. src/components/layout/SyncIndicator.jsx
35. src/components/layout/Header.jsx
36. src/components/layout/SideDrawer.jsx
37. src/components/layout/ToastContainer.jsx
38. src/components/shift/AuditTrail.jsx
39. src/components/shift/PriceHeader.jsx
40. src/components/shift/CashPartyPopup.jsx
41. src/components/shift/ShiftRow.jsx
42. src/components/shift/TotalRow.jsx
43. src/components/shift/DailySalesBar.jsx
44. src/components/shift/ShiftGrid.jsx
45. src/components/shift/ShiftTabs.jsx
46. src/components/calendar/MonthlySummary.jsx
47. src/components/calendar/CalendarPage.jsx
48. src/components/settings/NozzleManager.jsx
49. src/components/settings/EmployeeManager.jsx
50. src/components/settings/SupabaseConfig.jsx
51. src/components/settings/SettingsPage.jsx
52. src/components/bills/MarkAsPaidPopup.jsx
53. src/components/bills/DailyBillView.jsx
54. src/components/bills/PartyBillDetail.jsx
55. src/components/bills/BillsPage.jsx
56. src/components/attendance/AddAdvancePopup.jsx
57. src/components/attendance/PaySalaryPopup.jsx
58. src/components/attendance/AttendanceRegister.jsx
59. src/components/attendance/EmployeeProfilePage.jsx
60. src/services/exportService.js
61. src/components/export/ExportDSR.jsx
62. src/components/export/MonthlyReport.jsx
63. src/pages/LoginPage.jsx
64. src/pages/DashboardPage.jsx
65. src/pages/CalendarPage.jsx
66. src/pages/BillsPage.jsx
67. src/pages/PartyManagementPage.jsx
68. src/pages/AttendancePage.jsx
69. src/pages/EmployeeProfilePage.jsx
70. src/pages/SettingsPage.jsx
71. src/App.jsx
72. vite.config.js (PWA plugin)
73. public/manifest.json + icons
```

```
1.  src/db/localDB.js
2.  src/db/supabaseClient.js
3.  src/utils/constants.js
4.  src/utils/formatters.js
5.  src/utils/calculations.js
6.  src/utils/validators.js
7.  src/utils/dateUtils.js
8.  src/services/authService.js
9.  src/context/AuthContext.jsx
10. src/context/SyncContext.jsx
11. src/hooks/useOnlineStatus.js
12. src/services/syncService.js
13. src/services/cleanupService.js
14. src/services/settingsService.js
15. src/services/partyService.js
16. src/services/billService.js
17. src/context/SettingsContext.jsx
18. src/services/shiftService.js
19. src/hooks/useCarryover.js
20. src/hooks/useDailyTotals.js
21. src/hooks/useShiftData.js
22. src/components/ui/Button.jsx
23. src/components/ui/Input.jsx
24. src/components/ui/SearchDropdown.jsx
25. src/components/ui/Modal.jsx
26. src/components/ui/Toast.jsx
27. src/components/ui/WarningPopup.jsx
28. src/components/ui/StatusBadge.jsx
29. src/components/auth/LoginForm.jsx
30. src/components/auth/ForgotPassword.jsx
31. src/components/auth/SecuritySetup.jsx
32. src/components/layout/SyncIndicator.jsx
33. src/components/layout/Header.jsx
34. src/components/layout/SideDrawer.jsx
35. src/components/layout/ToastContainer.jsx
36. src/components/shift/AuditTrail.jsx
37. src/components/shift/PriceHeader.jsx
38. src/components/shift/CashPartyPopup.jsx
39. src/components/shift/ShiftRow.jsx
40. src/components/shift/TotalRow.jsx
41. src/components/shift/DailySalesBar.jsx
42. src/components/shift/ShiftGrid.jsx
43. src/components/shift/ShiftTabs.jsx
44. src/components/calendar/MonthlySummary.jsx
45. src/components/calendar/CalendarPage.jsx
46. src/components/settings/NozzleManager.jsx
47. src/components/settings/EmployeeManager.jsx
48. src/components/settings/SupabaseConfig.jsx
49. src/components/settings/SettingsPage.jsx
50. src/components/bills/MarkAsPaidPopup.jsx
51. src/components/bills/DailyBillView.jsx
52. src/components/bills/PartyBillDetail.jsx
53. src/components/bills/BillsPage.jsx
54. src/services/exportService.js
55. src/components/export/ExportDSR.jsx
56. src/components/export/MonthlyReport.jsx
57. src/pages/LoginPage.jsx
58. src/pages/DashboardPage.jsx
59. src/pages/CalendarPage.jsx
60. src/pages/BillsPage.jsx
61. src/pages/PartyManagementPage.jsx
62. src/pages/SettingsPage.jsx
63. src/App.jsx
64. vite.config.js (PWA plugin)
65. public/manifest.json + icons
```

```
1.  src/db/localDB.js
2.  src/db/supabaseClient.js
3.  src/utils/constants.js
4.  src/utils/formatters.js
5.  src/utils/calculations.js
6.  src/utils/validators.js
7.  src/utils/dateUtils.js
8.  src/services/authService.js
9.  src/context/AuthContext.jsx
10. src/context/SyncContext.jsx
11. src/hooks/useOnlineStatus.js
12. src/services/syncService.js
13. src/services/cleanupService.js
14. src/services/settingsService.js
15. src/context/SettingsContext.jsx
16. src/services/shiftService.js
17. src/hooks/useCarryover.js
18. src/hooks/useDailyTotals.js
19. src/hooks/useShiftData.js
20. src/components/ui/Button.jsx
21. src/components/ui/Input.jsx
22. src/components/ui/SearchDropdown.jsx
23. src/components/ui/Modal.jsx
24. src/components/ui/Toast.jsx
25. src/components/ui/WarningPopup.jsx
26. src/components/auth/LoginForm.jsx
27. src/components/auth/ForgotPassword.jsx
28. src/components/auth/SecuritySetup.jsx
29. src/components/layout/SyncIndicator.jsx
30. src/components/layout/Header.jsx
31. src/components/layout/SideDrawer.jsx
32. src/components/layout/ToastContainer.jsx
33. src/components/shift/AuditTrail.jsx
34. src/components/shift/PriceHeader.jsx
35. src/components/shift/ShiftRow.jsx
36. src/components/shift/TotalRow.jsx
37. src/components/shift/DailySalesBar.jsx
38. src/components/shift/ShiftGrid.jsx
39. src/components/shift/ShiftTabs.jsx
40. src/components/calendar/MonthlySummary.jsx
41. src/components/calendar/CalendarPage.jsx
42. src/components/settings/NozzleManager.jsx
43. src/components/settings/EmployeeManager.jsx
44. src/components/settings/SupabaseConfig.jsx
45. src/components/settings/SettingsPage.jsx
46. src/services/exportService.js
47. src/components/export/ExportDSR.jsx
48. src/components/export/MonthlyReport.jsx
49. src/pages/LoginPage.jsx
50. src/pages/DashboardPage.jsx
51. src/pages/CalendarPage.jsx
52. src/pages/SettingsPage.jsx
53. src/App.jsx
54. vite.config.js (PWA plugin)
55. public/manifest.json + icons
```

---

## 24. Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| IndexedDB cleared despite PWA | Data loss | Supabase cloud sync as backup; pull on every login |
| Supabase free tier limit (500MB) | Sync fails | 60-day cleanup keeps data small; ~2MB/month estimated |
| Supabase not configured by owner | No cloud sync | App works fully offline; warn in settings if not configured |
| bcryptjs slow on weak hardware | Login delay 2-3s | Add loading spinner; use cost factor 10 |
| SheetJS column widths off | Poor export | Set `wscols` manually in export service |
| Sync conflict (unlikely, single device) | Data mismatch | Last-write-wins policy; acceptable for single user |
| Large syncQueue builds up offline | Sync takes time after reconnect | Process queue in batches of 10; show sync progress |

---

## 25. Approved Tech Stack & Cost Summary

| Tool | Purpose | Cost |
|------|---------|------|
| React 18 + Vite | Frontend framework | Free |
| Tailwind CSS | Styling (Adani theme) | Free |
| Dexie.js | Local offline database (IndexedDB) | Free |
| Supabase | Cloud database + sync (PostgreSQL) | Free (500MB) |
| GitHub | Version control + CI/CD trigger | Free |
| Vercel | Hosting + auto-deploy on push | Free (vercel.app subdomain) |
| Cloudflare | DNS (ready for future custom domain) | Free |
| Sentry | Silent error tracking in production | Free (5K errors/month) |
| SheetJS | Excel DSR export | Free |
| jsPDF + autoTable | Monthly PDF export | Free |
| bcryptjs | Password hashing | Free |
| vite-plugin-pwa | PWA + service worker | Free |
| **Total v1 cost** | | **₹0 / month** |

> **V2 additions** (when going multi-user): Resend for emails (free tier), custom domain via any registrar.

---

## 26. V2 Roadmap

| Feature | Tool/Approach | Notes |
|---------|--------------|-------|
| Multi-user / Multi-station | Supabase RLS | Row Level Security per station; separate data namespaces |
| Self-registration + email verification | Supabase Auth + Resend | Free email verification flow |
| Role-based access (Admin + Staff) | Supabase RLS + Context | Permission checks at app + DB level |
| Mobile-responsive UI | Tailwind breakpoints | Tablet/mobile layout |
| Weekly summary report | Dexie query | Same pattern as monthly |
| Automated email reports | Supabase Edge Functions + Resend | Free tier sufficient |
| CNG price API | Government data API | Auto-fetch daily price |
| Audit log | Supabase table | Track all edits with old/new values |
| Multi-device real-time sync | Supabase Realtime | WebSocket subscriptions |
| Custom domain | Any registrar + Cloudflare | Cloudflare DNS already set up |
| Full data export | JSZip | All 60 days as single ZIP archive |
