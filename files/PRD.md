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
| Hosting | Vercel (free tier, vercel.app subdomain) |
| Local Database | Dexie.js (IndexedDB — offline storage) |
| Cloud Database | Supabase (free tier — PostgreSQL sync) |
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

### 6.12 Monthly Report

- Accessible from hamburger menu → "Monthly Report"
- Opens as popup modal
- Dropdown: list of fully completed months (every day of month has data)
- On-screen table: Date | Diff (KG) | Sales (₹) | Cash | CC | UPI | Cash Party
- Grand Total row at bottom
- Export to PDF: `MonthName_DSR.pdf`
- PDF includes station name header and Cash Party column

---

### 6.13 Data Retention

- Records older than 60 days auto-deleted silently from both local (Dexie) and cloud (Supabase)
- Deletion runs on every login

---

### 6.14 PWA

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
