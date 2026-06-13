# Implementation Plan
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 2.0  
**Date:** June 2026  
**Stack:** React 18 + Tailwind CSS + Dexie.js + Supabase + Vercel

---

## 1. Pre-Development Checklist

### 1.1 Supabase Setup (owner does once)
- [ ] Create free account at [supabase.com](https://supabase.com)
- [ ] Create a new project (free tier)
- [ ] Copy Project URL + anon public key
- [ ] Paste into DSR Manager → Settings → Supabase Config on first use
- [ ] App will auto-create tables on first sync

### 1.2 Vercel Setup
- [ ] Create account at [vercel.com](https://vercel.com)
- [ ] Install Vercel CLI: `npm i -g vercel`

### 1.3 Development Environment
- [ ] Install Node.js v18+
- [ ] Scaffold project: `npm create vite@latest dsr-manager -- --template react`
- [ ] Install all dependencies (see TRD Section 16)
- [ ] Create `.env` with Supabase credentials
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

## 2. Development Phases Overview

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
| 11 | Export (Excel + PDF) | 2 days | High |
| 12 | Monthly Report | 1 day | High |
| 13 | PWA & Offline | 1 day | Medium |
| 14 | UI Polish & Adani Theme | 2 days | Medium |
| 15 | Testing & Bug Fixes | 3 days | Critical |
| 16 | Deployment | 1 day | Critical |

**Total Estimated: ~28 development days**

---

## 3. Phase 0 — Project Setup & Configuration

### Tasks
- [ ] Scaffold Vite + React: `npm create vite@latest dsr-manager -- --template react`
- [ ] Install dependencies:
```bash
npm install dexie @supabase/supabase-js bcryptjs react-router-dom react-hot-toast xlsx jspdf jspdf-autotable date-fns date-fns-tz uuid
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

## 14. Phase 11 — Export (Excel + PDF)

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

## 15. Phase 12 — Monthly Report

### Tasks
- [ ] Complete month validation: every day in the calendar month has all 3 shifts saved
- [ ] Dropdown populates only qualifying months within 60-day window
- [ ] Grand total row at bottom of on-screen table
- [ ] Month navigation updates on-screen table + summary

### Deliverables
- Only fully complete months in dropdown
- On-screen and PDF monthly reports correct

---

## 16. Phase 13 — PWA & Offline

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

## 17. Phase 14 — UI Polish & Adani Theme

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

## 18. Phase 15 — Testing & Bug Fixes

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

### Edge Cases
- [ ] First-ever Day 1 Shift 1 (no carryover, no price history)
- [ ] Skipped shift (closing = opening, all payments = 0) → carryover still works
- [ ] Same employee in multiple rows of same shift
- [ ] Edit very old shift → cascade warning → carryover updates correctly
- [ ] 60-day cleanup runs on login → old records gone from both Dexie + Supabase queue

---

## 19. Phase 16 — Deployment

### Tasks
- [ ] Set env vars in Vercel dashboard (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] Deploy: `vercel --prod`
- [ ] Verify app at vercel.app URL
- [ ] Test Supabase sync in production
- [ ] Run seed script in production (create owner in Dexie on first open)
- [ ] Test PWA install on Chrome desktop
- [ ] Full end-to-end test on production

---

## 20. File-by-File Build Order (40 files)

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

## 21. Known Risks & Mitigations

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

## 22. V2 Roadmap

| Feature | Notes |
|---------|-------|
| Multi-user / Multi-station | Supabase Row Level Security per station; separate data namespaces |
| Self-registration with email verification | Supabase Auth + email templates |
| Role-based access (Admin + Staff) | RLS policies; Context-level permission checks |
| Mobile-responsive UI | Tailwind breakpoints for tablet/mobile |
| Weekly summary report | Same pattern as monthly report |
| Automated email reports | Supabase Edge Functions + Resend/SendGrid |
| CNG price API | Auto-fetch daily price from government data source |
| Audit log | Track all field changes with old/new values + timestamps |
| Multi-device real-time sync | Supabase Realtime subscriptions |
| Full data export | Export all 60 days as single ZIP archive |
