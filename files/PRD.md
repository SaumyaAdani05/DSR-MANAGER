# Product Requirements Document (PRD)
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 1.0  
**Date:** June 2026  
**Owner:** Memnagar CNG  
**Status:** Final

---

## 1. Executive Summary

DSR Manager is a web-based Progressive Web App (PWA) built for gas station owners to record, manage, and export daily sales data per shift and per nozzle. The app replaces manual register-keeping with a structured digital system that enforces data integrity, automates calculations, carries forward meter readings, and generates exportable reports.

---

## 2. Goals

- Digitize daily CNG sales records (DSR) across 3 shifts per day
- Automate meter reading carryover between shifts and days
- Auto-calculate Difference (KG), Sales (₹), and Totals
- Enforce financial reconciliation (Cash + CC + UPI = Sales per row)
- Provide a historical view of past records (up to 60 days)
- Enable daily DSR export to Excel and monthly summary export to PDF
- Secure the app behind a single-owner login with account recovery

---

## 3. Non-Goals (v1.0)

- Multi-user / multi-station support (designed for future scaling, not built now)
- Mobile-optimized UI (PC-first design)
- Email or SMS notifications
- Automated backups beyond Firestore
- Integration with accounting software
- Fuel inventory or stock management beyond meter readings

---

## 4. User Persona

| Field | Details |
|-------|---------|
| Role | Gas Station Owner |
| Name | Single owner (Memnagar CNG) |
| Device | Desktop / Laptop PC |
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
| Database | Firebase Firestore |
| Currency | Indian Rupee (₹) |
| Number Format | Indian (e.g., ₹1,23,456.78) |
| Date Format | DD/MM/YYYY |
| Timezone | IST (UTC+5:30) |
| Data Retention | 60 days (auto-deleted silently) |

---

## 6. Feature Requirements

### 6.1 Authentication

#### 6.1.1 Login
- Custom username + password login (stored securely in Firestore, not Firebase Auth)
- Password field has show/hide toggle
- Default credentials: `Adani0510` / `Adani@mem0510`
- No auto-logout; manual logout from hamburger menu

#### 6.1.2 First-Time Login Setup
- On very first login, before entering the app, a mandatory setup screen appears:
  - Prompt: "Set up your Security Question for account recovery"
  - Two text fields: custom security question + answer
  - Option to skip and keep later (but must be set before using Forgot Password)
  - Redirect to Settings page after setup

#### 6.1.3 Forgot Password / Username
- Link on login screen
- Owner enters their username → system verifies → shows their security question
- Owner enters the answer → if correct, display both username and current password on screen
- Provide option to set a new password immediately
- New password rules:
  - 6–12 characters
  - Must contain at least one uppercase letter
  - Must contain at least one lowercase letter
  - Must contain at least one number
  - Must contain at least one special character (@, #, $)
- On password set: redirect to login screen

#### 6.1.4 Session
- Session persists until manual logout
- Same credentials cannot be used on two devices simultaneously in write mode; second device gets read-only access

---

### 6.2 Navigation & Layout

#### 6.2.1 Header
- Left: Station Name (e.g., "Memnagar CNG")
- Center: App Name "DSR Manager"
- Right: Hamburger icon → opens Side Drawer

#### 6.2.2 Side Drawer (right side)
Contains:
- Export DSR
- Monthly Report
- Settings
- Logout

#### 6.2.3 Main Area
- Date picker to select/open a date
- Three shift tabs: SHIFT 1 | SHIFT 2 | SHIFT 3
- Active shift tab shows data entry grid
- Past dates open in read-only mode

---

### 6.3 Date Management

#### 6.3.1 Date Picker
- Calendar-style date picker
- Default: today's date
- Can navigate back up to 60 days only
- Future dates are disabled and unselectable
- Dates that have any saved data are visually highlighted (colored dot/indicator)
- Manually opened by owner (no auto-creation of new day)

#### 6.3.2 Opening a New Date
- Owner selects a date from calendar
- If no data exists for that date, blank sheet opens with 3 empty shift tabs
- Before Shift 1 can be filled, check: Did Shift 3 of the previous day have data?
  - If yes → Shift 1 opening readings auto-fill from previous day Shift 3 closing (by nozzle row position)
  - If no → popup appears: "Day [date] Shift 3 is not yet filled. Please complete it before entering data for [new date]." → redirects owner to that shift

---

### 6.4 Shift Entry Grid

#### 6.4.1 Header Fields (per shift)
| Field | Details |
|-------|---------|
| Today's Price | Editable per shift, ₹/KG, 2 decimal places, auto-filled from previous shift/day. First ever entry defaults to ₹0.00 (blocked from saving if 0) |
| Date | Display only, from calendar selection |
| Shift | Display only (SHIFT 1 / 2 / 3) |

#### 6.4.2 Data Grid Columns
| Column | Type | Rules |
|--------|------|-------|
| Nozzle | Dropdown | From global nozzle list; no duplicates within same shift; row position is fixed |
| Employee | Dropdown | From global employee list; mandatory; same employee can appear multiple times |
| Opening Reading | Number input | > 0; auto-filled from previous shift closing (grey/italic); first entry manual |
| Closing Reading | Number input | > 0; ≥ Opening Reading |
| Difference (KG) | Auto (read-only) | Closing − Opening; 2 decimal places; calculated on field blur |
| Sales in Rs. | Auto (read-only) | Difference × Today's Price; Indian format; 2 decimal places |
| Cash | Number input | ≥ 0; numbers only |
| CC | Number input | ≥ 0; numbers only |
| UPI | Number input | ≥ 0; numbers only |

#### 6.4.3 Total Row
- Appears at the bottom of the grid
- Auto-calculated (not editable)
- Sums: Difference (KG), Sales in Rs., Cash, CC, UPI

#### 6.4.4 Rows
- Only configured nozzles appear as rows (not all 15 slots)
- Rows appear in order nozzles were added in Settings
- Starts with 10 rows (as configured); configurable up to max 15
- Minimum 1 row

#### 6.4.5 Auto-Fill Visual Indicator
- Auto-filled Opening Reading shown in grey italic text
- Once owner manually edits the field, the grey italic style is removed

#### 6.4.6 If Shift Is Skipped
- Owner must still enter Closing Reading (can equal Opening Reading)
- Difference will be 0, Sales will be 0, Cash/CC/UPI all 0
- This allows carryover to continue to next shift

---

### 6.5 Validation Rules

| Rule | Action |
|------|--------|
| Opening Reading = 0 | Block save, show inline error |
| Closing Reading = 0 | Block save, show inline error |
| Closing < Opening | Block save, show inline error |
| Today's Price = 0 | Block save, show toast error |
| Cash / CC / UPI < 0 | Block input (number-only, positive or zero) |
| Cash + CC + UPI ≠ Sales (per row) | Block save, show popup warning identifying the row |
| Employee not selected | Block save, show inline error |
| Any field empty | Block save, show toast listing empty fields |

---

### 6.6 Save & Edit Rules

#### 6.6.1 Save
- Each shift has its own Save button
- All validation must pass before save is allowed
- On save: data written to Firestore; timestamp recorded (IST)
- Auto-fill next shift's opening readings from this shift's closing readings (by nozzle row position)
- If next shift already has data, force-update its opening readings
- Show banner on current shift: "Shift [N+1]'s opening readings have been updated"

#### 6.6.2 Edit Window
- Edit window: 48 hours from **last save time** (e.g., saved June 9 → editable until June 11 11:59 PM IST)
- Within window: "Edit" button appears on saved shift
- Clicking Edit unlocks entire shift for editing
- On re-save: 48-hour window resets from new save time
- After 48 hours: shift is completely locked, read-only, no override

#### 6.6.3 Edit Cascade
- When re-saving an edited shift:
  - Next shift's opening readings are force-updated (even if next shift is locked)
  - Banner displayed: "Shift [N+1]'s opening readings have been updated due to your edits"

---

### 6.7 Reading Carryover Logic

| From | To | Method |
|------|----|--------|
| Shift 1 Closing | Shift 2 Opening | Auto-fill by nozzle row position |
| Shift 2 Closing | Shift 3 Opening | Auto-fill by nozzle row position |
| Shift 3 Closing | Next Day Shift 1 Opening | Auto-fill by nozzle row position |

- Nozzle row position is fixed (Nozzle in Row 3 Shift 1 = Row 3 Shift 2 = Row 3 Shift 3)
- If a nozzle appears in Shift 1 Row 3, its closing value carries to Shift 2 Row 3 regardless of shift structure changes

---

### 6.8 Employee Management (Settings)

- Global list of employees (up to 50)
- Add employee: enter name → saved to global list
- Remove employee: confirmation popup → if employee is in an unsaved shift row, row shows greyed-out name until shift saved or row cleared
- Same employee can appear in multiple rows within same shift
- Same employee can be assigned to multiple nozzles
- Order: employees appear in the order they were added

---

### 6.9 Nozzle Management (Settings)

- Global list of nozzles (max 15; owner adds from blank)
- Add nozzle: enter name → saved to global list → immediately appears in any open unsaved shift
- Remove nozzle: warning popup if nozzle is in an unsaved shift row → row shows greyed-out nozzle name until shift saved or cleared
- Deleted nozzles still display in historical records (greyed-out text)
- Order: nozzles appear in the order they were added in Settings
- One nozzle per row per shift (no duplicates in same shift)
- Same nozzle can appear across different shifts

---

### 6.10 Settings Page

Accessible from hamburger menu at any time. Contains:

| Setting | Description |
|---------|-------------|
| Station Name | Editable text field (default: "Memnagar CNG") |
| Today's Price | Shown for reference; editable per shift on entry sheet |
| Nozzle Management | Add / Remove nozzles (max 15) |
| Employee Management | Add / Remove employees (max 50) |
| Change Password | Enforce password rules; requires current password |
| Change Security Question | Enter new question + answer |
| Account Info | Display username (read-only) |

---

### 6.11 History View

- Select any past date (up to 60 days) from calendar
- Page opens in read-only mode
- Three shift tabs visible; opens on last saved shift
- All fields, totals, and carryover indicators visible
- No editing allowed for dates beyond 48-hour window
- Dates with no data show empty state message

---

### 6.12 DSR Export (Excel)

- Accessible from hamburger menu → "Export DSR"
- Owner selects a date from a date picker
- System checks: all 3 shifts must have all fields fully filled
  - If not: popup listing which shifts are incomplete (e.g., "Shift 2 and Shift 3 are not yet filled")
  - Export blocked until all shifts are complete
- Excel file structure:
  - 3 tabs: SHIFT1, SHIFT2, SHIFT3
  - Each tab header: "Memnagar CNG" | Date: DD/MM/YYYY
  - Columns: Nozzle | Employee | Opening Reading | Closing Reading | Difference (KG) | Sales in Rs. | Cash | CC | UPI
  - Grand Total row at the bottom of each tab
- Filename format: `DDMMYYYY_DSR.xlsx` (e.g., `09062026_DSR.xlsx`)
- Library: SheetJS (xlsx)

---

### 6.13 Monthly Report

- Accessible from hamburger menu → "Monthly Report"
- Opens as a popup/modal over current screen
- Dropdown: list of fully completed months (every day of that month has data), within 60-day retention window
- Displays on-screen table:
  - Columns: Date | Total Diff (KG) | Total Sales (₹) | Total Cash | Total CC | Total UPI
  - One row per day
  - Grand Total row at the bottom
- Export to PDF:
  - Filename: `MonthName_DSR.pdf` (e.g., `June_DSR.pdf`)
  - Includes station name header
  - Library: jsPDF + autoTable

---

### 6.14 Offline Behaviour

- If internet connection is lost, a top banner displays: "No Internet Connection — Read-Only Mode"
- All interactions are disabled; app shows cached (last loaded) data in read-only mode
- On reconnection: banner disappears, full access restored

---

### 6.15 Data Retention

- All records older than 60 days are automatically deleted from Firestore silently (no warning to user)
- Deletion runs via a scheduled Cloud Function or client-side check on login

---

### 6.16 PWA

| Property | Value |
|----------|-------|
| App Name | DSR Manager |
| Short Name | DSR |
| Icon | Placeholder (navy blue square with "DSR" text) |
| Display Mode | Standalone |
| Offline | Cached data in read-only mode |
| Auto-Update | Silent update on new deployment |
| Install Prompt | "Add to Desktop" banner on first visit |

---

## 7. Non-Functional Requirements

| Requirement | Details |
|-------------|---------|
| Performance | Page load < 2 seconds on standard broadband |
| Firestore Reads | Aggressively optimized; lazy-load history; paginate past records |
| Browser Support | Chrome, Firefox, Edge (latest 2 versions) |
| Screen Size | Responsive for all PC screen sizes (no minimum) |
| Timezone | All timestamps in IST (UTC+5:30) |
| Number Format | Indian format (₹1,23,456.78) |
| Decimal Places | 2 decimal places for readings, prices, calculations |
| Security | Firestore rules restrict all data to authenticated owner's UID |
| Future Scalability | Architecture designed to support multi-user/multi-station in v2 |
