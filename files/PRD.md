# Product Requirements Document (PRD)
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 2.0  
**Date:** June 2026  
**Owner:** Memnagar CNG  
**Status:** Final

---

## 1. Executive Summary

DSR Manager is a web-based Progressive Web App (PWA) built for gas station owners to record, manage, and export daily sales data per shift and per nozzle. The app works fully offline when installed as a PWA, storing all data locally using Dexie.js (IndexedDB), and automatically syncs to Supabase cloud every 30 seconds when online — ensuring no data loss even if the browser cache is cleared or the PWA is reinstalled.

---

## 2. Goals

- Digitize daily CNG sales records (DSR) across 3 shifts per day
- Work fully offline as an installed PWA; sync to cloud automatically when online
- Automate meter reading carryover between shifts and days
- Auto-calculate Difference (KG), Sales (₹), and Totals
- Enforce financial reconciliation: Cash + CC + UPI + Cash Party = Sales (per row)
- Provide a dedicated Calendar page for navigating and accessing historical records
- Enable daily DSR export to Excel and monthly summary export to PDF
- Secure the app with a single-owner login and account recovery

---

## 3. Non-Goals (v1.0)

- Multi-user / multi-station support (designed for future scaling, not built now)
- Mobile-optimized UI (PC-first design)
- Email or SMS notifications
- Integration with accounting software
- Fuel inventory or stock management beyond meter readings
- Manual sync button (sync is always automatic)

---

## 4. User Persona

| Field | Details |
|-------|---------|
| Role | Gas Station Owner |
| Device | Desktop / Laptop PC (PWA installed) |
| Browser | Chrome, Firefox, Edge (all modern browsers) |
| Tech Level | Moderate — familiar with Excel, basic web apps |
| Pain Point | Manual DSR registers are error-prone, not auditable, not searchable |

---

## 5. App Overview

| Property | Value |
|----------|-------|
| App Name | DSR Manager |
| Station Name | Memnagar CNG (editable in Settings) |
| Default Login | Username: `Adani0510` / Password: `Adani@mem0510` |
| Platform | Web (PWA — installable on PC desktop) |
| Hosting | Vercel (free tier — vercel.app subdomain) |
| Local Database | Dexie.js (IndexedDB — offline storage) |
| Cloud Database | Supabase (free tier — PostgreSQL + cloud sync) |
| Authentication | Custom (bcrypt via Supabase — no third-party auth needed) |
| Version Control | GitHub (free) |
| DNS | Cloudflare (free) |
| Error Tracking | Sentry (free tier) |
| Currency | Indian Rupee (₹) |
| Number Format | Indian (e.g., ₹1,23,456.78) |
| Date Format | DD/MM/YYYY |
| Timezone | IST (UTC+5:30) |
| Data Retention | 60 days (auto-deleted silently) |

---

## 6. Feature Requirements

### 6.1 Authentication

#### 6.1.1 Login
- Custom username + password login (stored in Supabase, bcrypt hashed)
- Password field has show/hide toggle
- Default credentials: `Adani0510` / `Adani@mem0510`
- No auto-logout; manual logout from hamburger menu

#### 6.1.2 First-Time Login Setup
- On very first login, mandatory security question setup screen:
  - Two text fields: custom security question + custom answer
  - Option to skip (must be set before using Forgot Password)
  - Redirect to Settings page after setup

#### 6.1.3 Forgot Password / Username
- Link on login screen
- Owner enters username → system verifies → shows security question
- Owner enters answer → if correct → display username + current password on screen
- Option to set a new password immediately
- Password rules: 6–12 characters, at least one uppercase, one lowercase, one number, one special character (@, #, $)
- On password set: redirect to login screen

#### 6.1.4 Session
- Session persists until manual logout (localStorage)
- Same credentials on second device → read-only mode on second device

---

### 6.2 Navigation & Layout

#### 6.2.1 Header
- Top-left: Sync status indicator ("Synced ✓" / "Syncing..." / "Offline — Local Only")
- Center: Station Name + App Name "DSR Manager"
- Top-right: Hamburger icon → opens Side Drawer

#### 6.2.2 Side Drawer (slides from right)
Contains:
- Calendar
- Bills
- Party Management
- Attendance
- Export DSR
- Monthly Report
- Settings
- Logout

#### 6.2.3 Default Landing Page
- Today's dashboard (shift entry for today)
- No date picker on dashboard; owner uses Calendar page to navigate dates

---

### 6.3 Offline & Sync Architecture

#### 6.3.1 Local Storage (Dexie.js / IndexedDB)
- All data written to local IndexedDB first (instant, offline-capable)
- Data persists across browser sessions and cache clears when PWA is installed
- PWA installation ensures IndexedDB is preserved by the OS (not cleared with browser cache)

#### 6.3.2 Cloud Sync (Supabase)
- Automatic background sync every 30 seconds when internet is available
- Sync pushes all unsynced local changes to Supabase
- On app load: pull latest cloud data to local (in case another session wrote data)
- Conflict resolution: last-write-wins (single device use)

#### 6.3.3 Sync Status Indicator (top-left header)
| Status | Text | Color |
|--------|------|-------|
| Fully synced | "Synced ✓" | Green |
| Currently syncing | "Syncing..." | Amber (animated) |
| Offline | "Offline — Local Only" | Red |
| Sync error | "Sync Failed — Retrying" | Red |

#### 6.3.4 Offline Mode
- All data entry and saving works fully offline
- No "read-only" restriction offline (unlike v1 — data is local)
- Offline banner shown in header sync indicator only
- Data saved offline syncs automatically when connection is restored

---

### 6.4 Calendar Page

- Accessible from hamburger menu → "Calendar"
- Full dedicated page
- Displays current month by default
- Month navigation: prev/next arrows
- Today's date: highlighted in Adani Red
- Dates with saved data: colored dot indicator
- Past 60 days: selectable
- Future dates + older than 60 days: disabled
- Clicking a date → navigates directly to dashboard with that date loaded
- **Monthly Summary** at bottom of page:
  - Shows totals for currently displayed month
  - Updates as owner navigates between months
  - Columns: Diff (KG) | Sales (₹) | Cash | CC | UPI | Cash Party
  - Only counts days that have data

---

### 6.5 Shift Entry Grid

#### 6.5.1 Shift Header Bar
| Field | Details |
|-------|---------|
| Date | Display only (DD/MM/YYYY) |
| Shift | Display only (SHIFT 1 / 2 / 3) |
| Today's Price | Editable directly in header, ₹/KG, 2 decimal places |
| Last Edited | Small grey text below shift tabs ("Last saved: DD/MM/YYYY HH:MM") |

#### 6.5.2 Data Grid Columns
| Column | Type | Rules |
|--------|------|-------|
| Nozzle | Dropdown (with search) | From global nozzle list; no duplicates per shift; fixed row position |
| Employee | Dropdown (with search) | From global employee list; mandatory; repeats allowed |
| Opening Reading | Number | > 0; auto-filled from previous shift (grey italic); first entry manual |
| Closing Reading | Number | > 0; ≥ Opening Reading |
| Difference (KG) | Auto read-only | Closing − Opening; 2 decimal places; calculated on blur |
| Sales in Rs. | Auto read-only | Difference × Today's Price; Indian format; 2 decimal places |
| Cash | Number | ≥ 0 |
| CC | Number | ≥ 0 |
| UPI | Number | ≥ 0 |
| Cash Party | Number | ≥ 0; credit/deferred payment type |

#### 6.5.3 Reconciliation Rule (Per Row)
```
Cash + CC + UPI + Cash Party = Sales in Rs.
```
- Validated per row on save
- Warning popup listing failing rows; blocks save until fixed

#### 6.5.4 Tab Navigation Order (keyboard)
Row: Nozzle → Employee → Opening → Closing → Cash → CC → UPI → Cash Party → (next row Nozzle)
- Skips auto-calculated fields (Difference, Sales)

#### 6.5.5 Total Row (per shift)
- Auto-calculated, not editable
- Sums: Difference (KG), Sales (₹), Cash, CC, UPI, Cash Party
- Shown at bottom of shift grid

#### 6.5.6 Daily Sales Row (separate highlighted card)
- Appears below the shift grid, outside the table
- Always visible regardless of which shift tab is active
- Updates in real-time as shifts are saved
- Shows partial totals from whichever shifts are filled
- Displays ALL columns: Diff (KG) | Sales (₹) | Cash | CC | UPI | Cash Party
- Visually distinct from shift total (different background, bold label "DAILY TOTAL")

#### 6.5.7 Rows
- Only configured nozzles appear (not all 15 slots)
- Order: same as order added in Settings
- Max 15 rows
- No row delete button on grid

---

### 6.6 No Locking Policy

- Shifts are **never locked**
- Any shift from any past date can be edited at any time (within 60-day retention)
- When editing a shift that has subsequent saved shifts:
  - Show generic warning popup: "Editing this shift will update the opening readings of the next shift. Do you want to continue?"
  - On confirm: cascade carryover update through subsequent shifts automatically
- Audit trail: "Last saved: DD/MM/YYYY HH:MM" shown in grey below shift tabs

---

### 6.7 Validation Rules

| Rule | Action |
|------|--------|
| Opening Reading = 0 or empty | Block save, inline error |
| Closing Reading = 0 or empty | Block save, inline error |
| Closing < Opening | Block save, inline error |
| Today's Price = 0 | Block save, toast error |
| Cash / CC / UPI / Cash Party < 0 | Block input (positive only) |
| Cash + CC + UPI + Cash Party ≠ Sales (per row) | Block save, popup listing failing rows |
| Employee not selected | Block save, inline error |
| Nozzle not selected | Block save, inline error |

---

### 6.8 Carryover Logic

| From | To | Method |
|------|----|--------|
| Shift 1 Closing | Shift 2 Opening | Auto-fill by row position index |
| Shift 2 Closing | Shift 3 Opening | Auto-fill by row position index |
| Shift 3 Closing | Next Day Shift 1 Opening | Auto-fill by row position index |

- Nozzle row position is fixed (Row 3 Shift 1 → Row 3 Shift 2 always)
- Opening auto-filled values shown in grey italic
- Manual edit removes italic styling
- Edit cascade: editing any saved shift triggers carryover update for next shift (with warning)
- If previous day Shift 3 not filled: popup to redirect owner before opening new date

---

### 6.9 Employee & Nozzle Management (Settings)

**Nozzles:**
- Global list (max 15); start blank; owner adds
- Dropdown in grid has search/filter box
- Deleted nozzle: `isActive: false`; shows greyed in history; row shows greyed until saved
- New nozzle: appears immediately in open unsaved shift

**Employees:**
- Global list (max 50); start blank; owner adds
- Dropdown in grid has search/filter box
- Same rules as nozzle for deletion/greyed display

---

### 6.10 Settings Page

| Setting | Description |
|---------|-------------|
| Station Name | Editable text field |
| Nozzle Management | Add / Remove (max 15) |
| Employee Management | Add / Remove (max 50) |
| Change Password | Enforce rules; requires current password |
| Change Security Question | Enter new question + answer |
| Account Info | Display username (read-only) |
| Supabase Config | Input fields for Supabase URL + anon key (one-time setup) |

---

### 6.11 DSR Export (Excel)

- Accessible from hamburger menu → "Export DSR"
- Owner selects a date
- All 3 shifts must be fully filled to export (popup lists incomplete shifts if not)
- Excel file: 3 tabs (SHIFT1, SHIFT2, SHIFT3)
- Each tab: station name header, date, columns including Cash Party
- Column order: Nozzle | Employee | Opening | Closing | Diff (KG) | Sales (₹) | Cash | CC | UPI | Cash Party
- Grand Total row at bottom of each tab
- Filename: `DDMMYYYY_DSR.xlsx`

---

### 6.12 Cash Party & Party Management

#### 6.12.1 Party List
- Global list of parties (like employees — add/remove from Settings)
- Accessible as a **separate section** in the hamburger menu: "Party Management"
- Max parties: no hard limit (reasonable use)
- Soft delete: `isActive: false` — historical records still show party name (greyed)
- Deleted party name still appears in old bills (greyed text)

#### 6.12.2 Party Name Popup (in Shift Grid)
- When owner enters a Cash Party amount > 0 in any row, a popup appears immediately
- Popup contains a searchable dropdown of active parties
- Party name is **mandatory** when Cash Party > 0 — cannot save without it
- Same party can be assigned to multiple rows in the same shift
- Popup auto-closes after party is selected
- Selected party name shown as a small badge/label below the Cash Party amount in the row

#### 6.12.3 Party Column in Grid
- Cash Party column shows: amount + party name badge below it
- If no Cash Party amount: party name field hidden

---

### 6.13 Bill Section (Hamburger Menu → "Bills")

#### 6.13.1 Landing View
- Lists all parties with:
  - Party name
  - Total outstanding (unpaid) Cash Party amount
  - Last transaction date
  - Quick "View Bill" button per party

#### 6.13.2 Daily Bill
- Owner selects a date
- Shows **all parties** who had Cash Party entries on that day
- Per party: total Diff (KG), total Sales (₹), total Cash Party amount for the day
- Paid/Unpaid status per party for that day

#### 6.13.3 Monthly / Date Range Bill (per party)
- Owner selects a specific party from dropdown
- Owner selects date range (start date → end date) or full month
- Shows **day-by-day breakdown**:
  - Columns: Date | Diff (KG) | Sales (₹) | Cash Party (₹) | Status | Payment Date
- Grand total row at bottom
- Partial payments shown per row

#### 6.13.4 Payment Status
- Each Cash Party transaction has a status: **Pending** or **Paid**
- Owner can mark individual transactions as **Paid** with a button
- Partial payment supported: owner enters amount paid → system records partial payment
- Payment date recorded when marked as paid
- Outstanding balance shown per transaction and in total

#### 6.13.5 Bill Number
- Auto-generated on bill creation: `BILL-001`, `BILL-002` etc. (sequential, global)
- Shown on all exported bills

#### 6.13.6 Bill Export — PDF (Formal Invoice)
- Formal invoice layout includes:
  - Station name + "Memnagar CNG" header
  - Bill number (e.g., BILL-042)
  - Bill date (generated date)
  - Date range covered
  - Party name
  - Table: Date | Diff (KG) | Sales (₹) | Cash Party (₹) | Status | Payment Date
  - Grand total row
  - Outstanding balance
  - Print-friendly layout (clean white bg, no colored UI elements)
- Filename: `BILLNUMBER_PartyName_DSR.pdf` (e.g., `BILL042_RameshTrucking_DSR.pdf`)

#### 6.13.7 Bill Export — Excel
- One sheet per party
- Same columns as PDF table
- Grand total row at bottom
- Filename: `PartyName_Bills_DDMMYYYY.xlsx`

#### 6.13.8 Printable Layout
- "Print" button on bill view
- Opens browser print dialog with print-optimized CSS
- No UI chrome (no header, sidebar, nav) in print output

---

### 6.15 Monthly Report

- Accessible from hamburger menu → "Monthly Report"
- Opens as popup modal
- Dropdown: list of fully completed months (every day of month has data)
- On-screen table: Date | Diff (KG) | Sales (₹) | Cash | CC | UPI | Cash Party
- Grand Total row at bottom
- Export to PDF: `MonthName_DSR.pdf`
- PDF includes station name header and Cash Party column

---

### 6.20 Data Retention

- Records older than 60 days auto-deleted silently from both local (Dexie) and cloud (Supabase)
- Deletion runs on every login

---

### 6.17 Attendance System

#### 6.17.1 How Attendance is Marked
- Attendance is **auto-marked** when an employee is assigned to any shift row and that shift is saved
- Only **present** employees are tracked — no manual absent marking
- If an employee appears in **multiple rows of the same shift** (e.g., assigned to N1 and N2 in Shift 1) → counted as **1 shift attendance** for that shift
- If an employee works **multiple shifts in the same day** (e.g., Shift 1 and Shift 2) → counted as **2 shift attendances**
- Attendance is **editable** by the owner at any time (no locking)

#### 6.17.2 Per Shift Wage
- A single global **Per Shift Wage** input (₹) applies to all employees equally
- Set and editable in the **Attendance section** directly
- Used for all payroll calculations

#### 6.17.3 Attendance Section (Hamburger → "Attendance")
- Landing view shows a **date range picker** (start → end date, or select full month)
- Displays monthly attendance register:
  - **Rows:** Employee names
  - **Columns:** Dates (1–31)
  - **Each cell:** Shift numbers worked that day (e.g., "1", "1,2", "1,2,3", blank if absent)
- At the end of each row (rightmost columns):
  - Total Shifts Worked
  - Total Wage (Shifts × Per Shift Wage)
  - Total Advance Given
  - Deduction Amount (owner-controlled per month)
  - Net Payable (Total Wage − Deduction)
  - Status: **Paid / Remaining**

#### 6.17.4 Payroll Calculation
- Formula: **Net Payable = (Total Shifts × Per Shift Wage) − Deduction Amount**
- If Net Payable is negative → show negative value in red (allowed, not blocked)
- Payroll calculable for any custom date range owner selects
- "Pay Now" button per employee row → records payment with date
- Shows **Remaining** if not yet paid

#### 6.17.5 Salary Payment Tracking
- Each employee has a **payment status** per month/period: Paid / Remaining
- "Pay Now" button → popup to confirm payment → records payment date
- Net Payable after deduction is what gets paid
- Payment date stored per employee per period

#### 6.17.6 Attendance Reports
- **Monthly report:** Traditional register layout (exportable as PDF + Excel)
- **Custom date range report:** Same register layout for selected range
- PDF: clean print-friendly format with station name header
- Excel: traditional register (employees as rows, dates as columns, totals at end)

---

### 6.18 Advance Management

#### 6.18.1 Recording Advances
- Owner manually enters advances in the **Attendance section**
- "Add Advance" button per employee → popup:
  - Amount (₹)
  - Date advance was given
  - Note (optional)
- Multiple advances allowed per employee per month
- Advance can be given **any day**, independent of whether employee worked that day

#### 6.18.2 Advance Deduction
- Each month/period, owner sets a **Deduction Amount** per employee:
  - How much of the advance to deduct from this period's salary
  - Remaining advance carries over to next period if not fully deducted
- Formula: **Net Payable = (Shifts × Wage) − Deduction Amount**
- If Deduction > Earned Wage → Net Payable goes negative (shown in red)

#### 6.18.3 Advance History (per employee)
- Clicking an employee name in the attendance register opens their **profile view**:
  - All advances given (date, amount, note)
  - All salary payments made (date, amount)
  - Total advance outstanding (total given − total deducted so far)
  - Running balance

#### 6.18.4 Monthly Register Columns
| Column | Description |
|--------|-------------|
| Employee Name | Employee name |
| Date 1–31 | Shift numbers worked (e.g., "1,2") or blank |
| Total Shifts | Count of all shifts worked in period |
| Total Wage | Total Shifts × Per Shift Wage |
| Advance Given | Total advances given in this period |
| Deduction | Owner-entered deduction amount for this period |
| Net Payable | Total Wage − Deduction |
| Status | Paid / Remaining |
| Pay Button | "Pay Now" or ✓ (if paid) |

---

### 6.19 PWA

| Property | Value |
|----------|-------|
| App Name | DSR Manager |
| Offline | Full data entry + saving (local IndexedDB) |
| Sync | Auto every 30 seconds when online |
| Auto-Update | Silent on new deployment |
| Install | "Add to Desktop" prompt after 30 seconds |

---

## 7. Non-Functional Requirements

| Requirement | Details |
|-------------|---------|
| Performance | Page load < 2 seconds; calculations instantaneous |
| Browser Support | Chrome, Firefox, Edge (latest 2 versions) |
| Screen Size | Responsive for all PC screen sizes |
| Timezone | All timestamps in IST (UTC+5:30) |
| Number Format | Indian format (₹1,23,456.78) |
| Decimal Places | 2 decimal places for all readings, prices, calculations |
| Future Scalability | Architecture supports multi-user/multi-station in v2 |
