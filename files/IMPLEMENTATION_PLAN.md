# Implementation Plan
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 1.0  
**Date:** June 2026  
**Stack:** React 18 + Tailwind CSS + Firebase Firestore + Vercel

---

## 1. Pre-Development Checklist

Before writing any code, complete the following:

### 1.1 Firebase Setup
- [ ] Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Enable **Firestore Database** (start in production mode)
- [ ] Copy Firebase config object (apiKey, projectId, etc.)
- [ ] Deploy initial Firestore Security Rules (from TRD Section 20)
- [ ] Create composite indexes (from Backend Schema Section 8)
- [ ] Enable **Firestore Offline Persistence** in code

### 1.2 Vercel Setup
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Have project folder ready to link

### 1.3 Development Environment
- [ ] Install Node.js v18+
- [ ] Install Git
- [ ] Create project: `npm create vite@latest dsr-manager -- --template react`
- [ ] Set up `.env` file with Firebase credentials
- [ ] Install all dependencies (see TRD Section 19)

### 1.4 Seed Initial Data
- [ ] Write a one-time seed script to create `/auth/owner` document with:
  - `username: "Adani0510"`
  - `passwordHash: bcrypt("Adani@mem0510", 10)`
  - `isFirstLogin: true`
- [ ] Run seed script before first deployment

---

## 2. Development Phases Overview

| Phase | Name | Estimated Effort | Priority |
|-------|------|-----------------|---------|
| 0 | Project Setup & Config | 1 day | Critical |
| 1 | Authentication | 2 days | Critical |
| 2 | Settings & Config | 2 days | Critical |
| 3 | Shift Entry Grid | 4 days | Critical |
| 4 | Carryover & Validation Logic | 2 days | Critical |
| 5 | Save, Edit & Lock System | 2 days | Critical |
| 6 | Calendar & History View | 2 days | High |
| 7 | Export (Excel + PDF) | 2 days | High |
| 8 | Monthly Report | 1 day | High |
| 9 | PWA & Offline Support | 1 day | Medium |
| 10 | UI Polish & Adani Theme | 2 days | Medium |
| 11 | Testing & Bug Fixes | 3 days | Critical |
| 12 | Deployment & Handoff | 1 day | Critical |

**Total Estimated: ~25 development days**

---

## 3. Phase 0 — Project Setup & Configuration

### Tasks
- [ ] Scaffold Vite + React project: `npm create vite@latest dsr-manager -- --template react`
- [ ] Install all dependencies:
```bash
npm install firebase bcryptjs xlsx jspdf jspdf-autotable date-fns date-fns-tz react-router-dom react-hot-toast uuid
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npx tailwindcss init -p
```
- [ ] Configure `tailwind.config.js` with Adani color tokens (from UI/UX Brief Section 2)
- [ ] Configure `vite.config.js` with PWA plugin (from TRD Section 15)
- [ ] Set up folder structure (from TRD Section 2)
- [ ] Create `.env` file and add to `.gitignore`
- [ ] Initialize Firebase in `src/services/firebase.js`
- [ ] Set up React Router in `App.jsx`
- [ ] Configure global CSS (Inter font, base styles, Tailwind directives)
- [ ] Create placeholder icons for PWA (192px + 512px)

### Deliverables
- Blank app running on `localhost:5173`
- Firebase connected (test with a manual Firestore write)
- Tailwind working with Adani theme

---

## 4. Phase 1 — Authentication

### 4.1 Seed Script (run once before Phase 1)
```javascript
// scripts/seedOwner.js
import { doc, setDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { db } from '../src/services/firebase.js';

const seedOwner = async () => {
  const passwordHash = await bcrypt.hash('Adani@mem0510', 10);
  await setDoc(doc(db, 'auth', 'owner'), {
    username: 'Adani0510',
    passwordHash,
    securityQuestion: '',
    securityAnswerHash: '',
    isFirstLogin: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Owner seeded successfully');
};
seedOwner();
```

### 4.2 Tasks
- [ ] Build `AuthContext.jsx` with session management (localStorage)
- [ ] Build `authService.js`:
  - `loginOwner(username, password)` → fetch `/auth/owner`, bcrypt compare
  - `logoutOwner()` → clear localStorage
  - `updatePassword(newPassword)` → hash + write to Firestore
  - `updateSecurityQuestion(question, answer)` → hash answer + write
  - `verifySecurityAnswer(answer)` → bcrypt compare
- [ ] Build `LoginPage.jsx`:
  - Username + password inputs
  - Show/hide password toggle
  - "Login" button with loading state
  - "Forgot Password?" link
  - Error toast on failure
- [ ] Build `ForgotPassword.jsx`:
  - Step 1: Enter username → verify
  - Step 2: Show security question → enter answer → verify
  - Step 3: Show username + password; option to set new password
  - Password validation with rules display
  - Redirect to login on completion
- [ ] Build `SecuritySetup.jsx` (first login):
  - Two inputs: question + answer
  - "Save & Continue" button → write to Firestore → redirect to Settings
  - "Skip for Now" button → redirect to Settings
- [ ] Build `ProtectedRoute.jsx` — check localStorage session
- [ ] Wire up session management in `sessions` Firestore collection
- [ ] Second device read-only detection via `onSnapshot` on sessions

### Deliverables
- Login flow working end-to-end
- Forgot password recovery working
- First login security setup working
- Protected routes blocking unauthenticated access

---

## 5. Phase 2 — Settings & Config

### Tasks
- [ ] Build `settingsService.js`:
  - `getSettings()` → read `/config/settings`, `/config/nozzles`, `/config/employees`
  - `updateStationName(name)` → write to `/config/settings`
  - `addNozzle(name)` → append to `/config/nozzles` list (validate max 15, no duplicate)
  - `removeNozzle(id)` → set `isActive: false` on nozzle (soft delete)
  - `addEmployee(name)` → append to `/config/employees` list (validate max 50)
  - `removeEmployee(id)` → set `isActive: false` on employee
- [ ] Build `SettingsContext.jsx` — global nozzle + employee state
- [ ] Build `SettingsPage.jsx` with 4 sections:
  - Station Name editor
  - Nozzle Manager (`NozzleManager.jsx`): list + add + remove with confirmation
  - Employee Manager (`EmployeeManager.jsx`): list + add + remove with confirmation
  - Change Password form
  - Security Question form
- [ ] Warning popup when deleting a nozzle/employee in use in unsaved shift

### Deliverables
- Settings page fully functional
- Nozzle + employee CRUD working
- Password + security question update working
- Global nozzle/employee state available to shift grid

---

## 6. Phase 3 — Shift Entry Grid

### 6.1 Tasks — Core Grid
- [ ] Build `ShiftTabs.jsx` — SHIFT 1 / 2 / 3 tabs with status indicators
- [ ] Build `PriceHeader.jsx` — Date display, Shift label, Today's Price input
- [ ] Build `ShiftGrid.jsx` — wrapper for table with header row + data rows + total row
- [ ] Build `ShiftRow.jsx` — single data entry row:
  - Nozzle dropdown (from SettingsContext, filter already-selected nozzles)
  - Employee dropdown (from SettingsContext, allow repeats)
  - Opening Reading input (number only, auto-fill from carryover)
  - Closing Reading input (number only)
  - Difference field (read-only, auto-calc on blur)
  - Sales field (read-only, auto-calc on blur)
  - Cash input (number only, ≥ 0)
  - CC input (number only, ≥ 0)
  - UPI input (number only, ≥ 0)
- [ ] Build `TotalRow.jsx` — auto-sum of all columns
- [ ] Implement number-only input enforcement (prevent letters, only digits + decimal)
- [ ] Implement Indian number format on display (Intl.NumberFormat en-IN)
- [ ] Implement auto-fill visual indicator (grey italic for auto-filled opening)
- [ ] Remove italic on manual edit of auto-filled field

### 6.2 Tasks — Dropdown Behavior
- [ ] Nozzle dropdown: show only active nozzles; grey-out inactive (deleted) ones
- [ ] Nozzle dropdown: prevent selecting same nozzle twice in same shift
- [ ] When new nozzle added in settings: immediately appear in open unsaved shift
- [ ] When nozzle/employee deleted: greyed-out in row until shift saved

### 6.3 Tasks — Calculation Engine
- [ ] `calculations.js`: `calcDifference()`, `calcSales()`, `calcRowTotals()`
- [ ] Trigger calculations `onBlur` of Closing Reading (not on every keystroke)
- [ ] Trigger recalculate totals whenever any row's values change

### Deliverables
- Fully functional shift data entry grid
- Dropdowns working with deduplication
- Auto-calculations working on blur
- Total row auto-updating

---

## 7. Phase 4 — Carryover & Validation Logic

### Tasks — Carryover
- [ ] Build `useCarryover.js` hook:
  - `getShiftCarryover(date, shiftNum)` → fetch previous shift/day's closing readings
  - `applyCarryover(rows, carryoverData)` → apply by row position index
- [ ] Day boundary carryover (Shift 3 → next day Shift 1):
  - On opening new date: check if previous day's Shift 3 exists
  - If not: show redirect popup (from `APP_FLOW.md` Section 3.2)
  - If yes: auto-fill Shift 1 opening readings
- [ ] Auto-fill Today's Price from previous shift/day price
- [ ] First-ever entry (no carryover exists): leave opening readings blank, price `₹0.00`

### Tasks — Validation
- [ ] Build `validators.js`:
  - `validateRow(row)` → all per-row rules
  - `validateShift(shift)` → price check + all row validation
  - `validatePassword(password)` → regex check
- [ ] Inline error display on individual inputs (red border + error text below)
- [ ] Reconciliation check (Cash + CC + UPI = Sales per row) → block save with popup
- [ ] Validation popup design: list errors by row number and field name
- [ ] Today's Price = 0 → toast error on save attempt

### Deliverables
- Carryover logic fully working between shifts and days
- All validation rules enforced
- Redirect popup for missing Shift 3 working

---

## 8. Phase 5 — Save, Edit & Lock System

### Tasks
- [ ] Build `shiftService.js`:
  - `saveShift(date, shiftNum, shiftData)` → batch write to Firestore
  - `updateShift(date, shiftNum, shiftData)` → update + reset edit expiry
  - `getShift(date, shiftNum)` → getDoc from Firestore
  - `lockCheck(shift)` → compare editWindowExpiry with current IST time
  - `forceUpdateCarryover(date, shiftNum, closingRows)` → update next shift's openings
- [ ] Save button behavior:
  - Run validation → on pass → batch write shift + update date doc + update calendar metadata
  - Show success toast: "Shift [N] saved successfully"
  - Calculate and store `editWindowExpiry = savedAt + 48 hours`
- [ ] Post-save carryover update:
  - Update next shift's opening readings in Firestore
  - Show banner on current shift if next shift was already saved
- [ ] Edit button behavior:
  - Check `editWindowExpiry > now` → show Edit button
  - On click: unlock all inputs in shift
- [ ] Lock state rendering:
  - `isLocked = true` → all inputs disabled, grey styling, no Edit/Save buttons
  - `isSaved + within 48hr` → read-only + Edit button visible
  - `never saved` → fully editable
- [ ] `useShiftData.js` hook managing shift state + load + save

### Deliverables
- Complete save flow with batch Firestore writes
- 48-hour edit window working
- Lock after expiry working
- Carryover auto-update after save working

---

## 9. Phase 6 — Calendar & History View

### Tasks
- [ ] Build `DatePicker.jsx` (custom calendar component):
  - Display current month
  - Month navigation (prev/next arrows)
  - Today's date: red circle highlight
  - Dates with data: red dot indicator (from `/metadata/calendar`)
  - Past 60 days: selectable
  - Future + older than 60 days: disabled
- [ ] Fetch `/metadata/calendar` on dashboard load (1 read for all date indicators)
- [ ] Date selection handler:
  - If past date → read-only mode → load history
  - If today → normal write mode
- [ ] Build `HistoryPage.jsx` (or integrate into Dashboard with read-only flag):
  - All inputs disabled
  - "Read-Only" badge on shift tabs
  - Grey italic auto-fill indicators still shown
  - Greyed-out deleted nozzles/employees shown
  - Opens on last saved shift tab
- [ ] Data cleanup on login: `cleanupService.js` → delete records older than 60 days

### Deliverables
- Calendar fully working with date indicators
- History view working in read-only mode
- Auto-cleanup of 60+ day records on login

---

## 10. Phase 7 — Export (Excel & PDF)

### Tasks — DSR Excel Export
- [ ] Build `ExportDSR.jsx` modal/page (accessible from hamburger menu)
- [ ] Date picker for selecting which day to export
- [ ] Check: all 3 shifts fully filled → if not, show popup with incomplete shift list
- [ ] Build `exportService.js` → `exportDSR(date, shifts, stationName)`:
  - Use SheetJS to create workbook
  - 3 tabs: SHIFT1, SHIFT2, SHIFT3
  - Each tab: station name header, date, column headers, row data, grand total row
  - Apply Indian number formatting in cells
  - Trigger browser download: `DDMMYYYY_DSR.xlsx`

### Tasks — Monthly PDF Export
- [ ] Build `MonthlyReport.jsx` popup modal
- [ ] Dropdown list of available completed months (within 60 days)
- [ ] Fetch all date records for selected month → sum shift totals per day
- [ ] Display on-screen table with per-day rows + grand total row
- [ ] "Export PDF" button → `exportMonthlyPDF()`:
  - Use jsPDF + autoTable
  - Station name header
  - Month/year title
  - Table: Date | Diff KG | Sales ₹ | Cash | CC | UPI
  - Grand total row
  - Trigger browser download: `MonthName_DSR.pdf`

### Deliverables
- DSR Excel export working with 3 tabs
- Export blocked if shifts incomplete (with explanatory popup)
- Monthly report on-screen table working
- Monthly PDF export working

---

## 11. Phase 8 — Monthly Report

### Tasks
- [ ] Determine "complete month" logic: every calendar day in month has all 3 shifts saved
- [ ] Build dropdown population: query records for each month within 60 days, validate completeness
- [ ] Grand total row calculation across all days of month
- [ ] Responsive popup modal with scrollable table for months with many days

### Deliverables
- Monthly report dropdown shows only fully complete months
- On-screen table with correct per-day data and grand totals
- PDF export clean and correctly formatted

---

## 12. Phase 9 — PWA & Offline Support

### Tasks
- [ ] Configure `vite-plugin-pwa` (from TRD Section 15):
  - `registerType: 'autoUpdate'` (silent updates)
  - Workbox caching for app shell + Firestore API calls
- [ ] Create PWA icons (192px, 512px) — navy blue square with "DSR" white text
- [ ] Build `useOnlineStatus.js` hook (from TRD Section 17)
- [ ] Build offline banner component:
  - Top of screen, amber/red background
  - "No Internet Connection — Read-Only Mode"
  - Dismiss when online
- [ ] When offline:
  - All Save/Edit/Export buttons disabled
  - All inputs disabled
  - Cached data from IndexedDB still shown
- [ ] Test PWA install prompt on Chrome desktop
- [ ] Install prompt banner (dismissible, after 30 seconds)

### Deliverables
- App installable as desktop PWA
- Offline mode working with cached data
- Auto-update on new deployment

---

## 13. Phase 10 — UI Polish & Adani Theme

### Tasks
- [ ] Apply full Adani theme across all components (from UI/UX Brief)
- [ ] Header: navy bg, white text, hamburger icon
- [ ] Side drawer: slide-in from right, dark navy bg, white menu items
- [ ] Shift tabs: proper active/inactive/saved/locked states
- [ ] Data grid: correct column widths, row heights, alternating row colors
- [ ] Total row: bold, light navy tint background
- [ ] Error states: red borders, pink row backgrounds
- [ ] Auto-fill grey italic on opening readings
- [ ] Toast notifications: top-right, 4 color variants
- [ ] Inline banners: amber for carryover update notices
- [ ] All buttons: correct states (default, hover, active, disabled)
- [ ] Modals: backdrop, fade+scale animation
- [ ] Empty states: friendly messages for empty data
- [ ] Login page: navy background, white card, clean minimal design
- [ ] PWA install prompt banner styling

### Deliverables
- Full Adani-themed professional UI
- All states (error, success, warning, disabled) visually distinct
- Consistent typography (Inter font) throughout

---

## 14. Phase 11 — Testing & Bug Fixes

### 14.1 Manual Test Scenarios

#### Authentication
- [ ] Login with correct credentials → dashboard
- [ ] Login with wrong password → error toast
- [ ] Login with wrong username → error toast
- [ ] Forgot password with correct answer → see credentials + change password
- [ ] Forgot password with wrong answer → error
- [ ] Change password (valid + invalid formats)
- [ ] First login → security setup prompt

#### Shift Entry
- [ ] Fill all 10 rows correctly → save → success
- [ ] Leave employee empty → block save with error
- [ ] Enter Closing < Opening → block save with error
- [ ] Enter Cash + CC + UPI ≠ Sales (per row) → block with popup
- [ ] Enter Opening = 0 → block save
- [ ] Enter Today's Price = 0 → block save
- [ ] Auto-fill verification: Shift 1 closing → Shift 2 opening (correct row positions)
- [ ] Auto-fill italic display → manually edit → italic removed
- [ ] Indian number format displays correctly on all calculated fields

#### Carryover
- [ ] Open new date with previous day Shift 3 filled → Shift 1 auto-fills
- [ ] Open new date with previous day Shift 3 NOT filled → redirect popup
- [ ] Shift 2 auto-fills from Shift 1 (after Shift 1 saved)
- [ ] Edit Shift 1 within 48hr → Shift 2 opening updates + banner shown
- [ ] Edit Shift 1 → Shift 2 already locked → still force-updates + banner

#### Settings
- [ ] Add nozzle → appears immediately in open unsaved shift
- [ ] Remove nozzle in use in unsaved shift → warning → greyed row
- [ ] Deleted nozzle shows greyed in history view
- [ ] Add employee up to 50 → 51st blocked
- [ ] Add nozzle up to 15 → 16th blocked

#### Calendar & History
- [ ] Saved dates show red dot on calendar
- [ ] Future dates not selectable
- [ ] Dates beyond 60 days not selectable
- [ ] History view is read-only (all inputs disabled)
- [ ] History opens on last saved shift tab

#### Export
- [ ] DSR export: all 3 shifts filled → Excel downloads correctly
- [ ] DSR export: Shift 2 missing → popup lists Shift 2 as incomplete
- [ ] Monthly report: only fully complete months appear in dropdown
- [ ] Monthly PDF exports correctly with station name + totals

#### PWA & Offline
- [ ] App installs on Chrome desktop
- [ ] Disconnect internet → offline banner appears → all writes blocked
- [ ] Reconnect → banner disappears → writes enabled

### 14.2 Edge Cases to Test
- [ ] First-ever Day 1 Shift 1 entry (no previous carryover)
- [ ] Skipped shift (closing = opening, rest = 0) → next shift still carries over correctly
- [ ] Same employee in multiple rows of same shift
- [ ] 60-day cleanup runs correctly and removes old records
- [ ] Edit window: saved June 9 → editable until June 11 11:59 PM IST → locked June 12 00:00
- [ ] Second device read-only mode

---

## 15. Phase 12 — Deployment

### Tasks
- [ ] Set all environment variables in Vercel dashboard
- [ ] Deploy to Vercel:
```bash
cd dsr-manager
vercel --prod
```
- [ ] Verify app loads at `dsr-manager.vercel.app` (or chosen name)
- [ ] Test Firebase connection in production
- [ ] Test PWA install in production
- [ ] Run seed script against production Firestore (create owner document)
- [ ] Verify Firestore security rules are deployed
- [ ] Verify composite indexes are built in Firestore console
- [ ] Final end-to-end test on production URL

### Deliverables
- Live app accessible at Vercel URL
- All features working in production
- Owner can log in with `Adani0510 / Adani@mem0510`

---

## 16. File-by-File Build Order

Build in this exact order to minimize re-work and dependency issues:

```
1. src/services/firebase.js
2. src/utils/constants.js
3. src/utils/formatters.js
4. src/utils/calculations.js
5. src/utils/validators.js
6. src/utils/dateUtils.js
7. src/services/authService.js
8. src/context/AuthContext.jsx
9. src/components/auth/LoginForm.jsx
10. src/components/auth/ForgotPassword.jsx
11. src/components/auth/SecuritySetup.jsx
12. src/pages/LoginPage.jsx
13. src/services/settingsService.js
14. src/context/SettingsContext.jsx
15. src/components/settings/NozzleManager.jsx
16. src/components/settings/EmployeeManager.jsx
17. src/components/settings/SettingsPage.jsx
18. src/pages/SettingsPage.jsx
19. src/hooks/useOnlineStatus.js
20. src/hooks/useCarryover.js
21. src/services/shiftService.js
22. src/hooks/useShiftData.js
23. src/components/shift/PriceHeader.jsx
24. src/components/shift/ShiftRow.jsx
25. src/components/shift/TotalRow.jsx
26. src/components/shift/ShiftGrid.jsx
27. src/components/shift/ShiftTabs.jsx
28. src/components/calendar/DatePicker.jsx
29. src/services/cleanupService.js
30. src/pages/DashboardPage.jsx
31. src/pages/HistoryPage.jsx
32. src/services/exportService.js
33. src/components/export/ExportDSR.jsx
34. src/components/export/MonthlyReport.jsx
35. src/components/layout/SideDrawer.jsx
36. src/components/layout/Header.jsx
37. src/components/layout/ToastContainer.jsx
38. src/components/ui/* (Button, Input, Dropdown, Modal, Toast, Badge)
39. src/App.jsx (wire all routes)
40. vite.config.js (add PWA plugin)
41. public/manifest.json + icons
```

---

## 17. Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Firebase free tier exceeded | App stops writing data | Optimize reads (see TRD Section 10); monitor usage in Firebase console |
| Firestore offline persistence conflicts | Stale data shown | Clear IndexedDB cache on version update; show "syncing" state |
| Custom auth weaker than Firebase Auth | Security risk | Acceptable for single-user v1; migrate to Firebase Auth in v2 |
| bcryptjs slow on old hardware | Login takes 2-3 seconds | Use cost factor 10 (acceptable); add loading spinner |
| Excel column widths incorrect | Poor export readability | Test SheetJS column width settings; manually set `wscols` |
| Monthly report Firestore reads spike | Free tier read limit | Month = max 30 days × 3 shifts = 90 reads; well within limits |
| PWA cache serving stale version | Owner uses outdated UI | `registerType: 'autoUpdate'` forces silent update on next visit |

---

## 18. Post-Launch Maintenance

| Task | Frequency | Action |
|------|-----------|--------|
| Monitor Firestore usage | Weekly | Firebase Console → Usage tab |
| Check Vercel deployment logs | On issues | Vercel Dashboard → Functions tab |
| Firestore security rules review | v2 upgrade | Migrate to Firebase Auth |
| Backup critical data | Monthly | Owner exports monthly PDFs |
| Update dependencies | Quarterly | `npm audit fix`; test before deploying |

---

## 19. V2 Roadmap (Future Enhancements)

Features explicitly excluded from v1 but designed for in the architecture:

| Feature | Notes |
|---------|-------|
| Multi-user / Multi-station | Each user has own Firestore path (`/stations/{stationId}/records/...`) |
| Firebase Auth migration | Replace custom auth with proper Firebase Auth |
| Email verification on registration | Firebase Auth supports this natively |
| Role-based access (Admin + Staff) | Context-level permission checks |
| Mobile-responsive UI | Add Tailwind breakpoints for tablet/mobile |
| Weekly summary report | Aggregate 7-day data; same pattern as monthly |
| Automated daily email report | Firebase Cloud Functions + SendGrid |
| Fuel price API integration | Auto-fetch daily CNG price from government API |
| Audit log | Track all edits with timestamp and old/new values |
| Data export (full CSV dump) | Export all 60 days at once |
