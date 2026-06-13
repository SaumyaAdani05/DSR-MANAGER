# App Flow Document
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 1.0  
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
            ├──► First Login ──► Security Question Setup ──► Settings Page
            │
            └──► Returning Login ──► Dashboard (Today's Date, Active/Last Shift)
```

---

## 2. Authentication Flows

### 2.1 Login Flow
```
User opens app
   │
   ├──► Session exists in localStorage?
   │        │
   │        ├── YES ──► Go to Dashboard
   │        └── NO ──► Show Login Page
   │
Login Page
   │
   ├── Enter Username + Password
   ├── Toggle show/hide password
   ├── Click "Login"
   │
   ├──► Fetch /auth/owner from Firestore
   │        │
   │        ├── Username match + bcrypt compare password
   │        │        │
   │        │        ├── MATCH ──► Store session in localStorage
   │        │        │                  │
   │        │        │                  ├── First login? ──► Security Setup Page
   │        │        │                  └── Returning? ──► Dashboard
   │        │        │
   │        │        └── NO MATCH ──► Toast error: "Invalid username or password"
   │        │
   │        └── Network error ──► Toast: "No internet connection"
   │
   └── Click "Forgot Password?" ──► Forgot Password Flow
```

### 2.2 Forgot Password Flow
```
Forgot Password Page
   │
   ├── Enter Username
   ├── Click "Verify"
   │
   ├──► Fetch /auth/owner, check username
   │        │
   │        ├── EXISTS ──► Show Security Question
   │        └── NOT FOUND ──► Error: "Username not found"
   │
   ├── Enter Security Answer
   ├── Click "Verify Answer"
   │
   ├──► bcrypt compare answer
   │        │
   │        ├── MATCH ──► Show: Username + Password (unmasked)
   │        │              Show: "Set New Password" section
   │        │              │
   │        │              ├── Enter new password (validate rules)
   │        │              ├── Confirm new password
   │        │              ├── Click "Update Password"
   │        │              └── Redirect to Login Page
   │        │
   │        └── NO MATCH ──► Error: "Incorrect answer"
```

### 2.3 First Login Security Setup Flow
```
Security Setup Page (mandatory, shown once after first login)
   │
   ├── Prompt: "Set up your security question for account recovery"
   │
   ├── Text input: "Your Security Question" (custom text)
   ├── Text input: "Your Answer"
   │
   ├── Two options:
   │        ├── "Save & Continue" ──► Save to Firestore ──► Settings Page
   │        └── "Skip for Now" ──► Settings Page (can set later in Settings)
   │
   └── Settings Page ──► Shows nozzle/employee setup prompt for first-time users
```

---

## 3. Dashboard Flow

### 3.1 Main Dashboard Load
```
Dashboard Page loads
   │
   ├── Run cleanup: delete Firestore records older than 60 days
   ├── Fetch /metadata/calendar (list of dates with saved data)
   ├── Set selected date = Today (IST)
   ├── Fetch data for today's date
   │
   ├──► Load Shift Tabs
   │        │
   │        ├── Determine active tab:
   │        │     ├── If any shifts saved → open last saved shift tab
   │        │     └── If none saved → open Shift 1
   │        │
   │        └── Render active shift grid
   │
   └── Render calendar (today highlighted, saved dates marked)
```

### 3.2 Date Selection Flow
```
Owner clicks date on calendar
   │
   ├──► Is it today?
   │        ├── YES ──► Load today's data (write mode if within 48hr)
   │        └── NO ──► Is it within 60 days?
   │                       ├── YES ──► Load past date (read-only mode)
   │                       └── NO ──► Disabled (cannot select)
   │
   ├──► Is it a NEW date (no data)?
   │        │
   │        ├── Check: Was previous day's Shift 3 filled?
   │        │        │
   │        │        ├── YES ──► Auto-fill Shift 1 opening from Shift 3 closing
   │        │        │          Show blank sheet with auto-filled openings
   │        │        │
   │        │        └── NO ──► Show popup:
   │        │                   "Day [date] Shift 3 is not yet filled.
   │        │                    Please complete it before entering data for [new date]."
   │        │                   [Go to Shift 3] button ──► redirects to previous date Shift 3
   │        │
   │        └── Show blank entry sheet
   │
   └──► It's an EXISTING date ──► Load saved data for that date
```

---

## 4. Shift Entry Flow

### 4.1 Shift Tab Selection
```
Owner clicks Shift tab (1, 2, or 3)
   │
   ├── Is shift data already loaded?
   │        ├── YES ──► Render saved data (read-only or editable based on lock status)
   │        └── NO ──► Load from Firestore (or show empty grid)
   │
   ├──► Shift status check:
   │        ├── Never saved ──► Editable, Today's Price auto-filled
   │        ├── Saved + within 48hr ──► Read-only, "Edit" button visible
   │        ├── Saved + past 48hr ──► Read-only, locked (no Edit button)
   │        └── Past date ──► Read-only always
   │
   └──► Carryover check:
            ├── Is this Shift 2 or 3? → Check if previous shift is saved
            │        ├── YES → Opening readings auto-filled (grey italic)
            │        └── NO → Owner enters manually
            └── Render grid
```

### 4.2 Data Entry Row Flow
```
Owner fills a row:
   │
   [Nozzle Dropdown]
   ├── Shows only configured nozzles
   ├── Already-selected nozzles in other rows greyed out
   └── Select nozzle → set in row
   │
   [Employee Dropdown]
   ├── Shows all employees (repeats allowed)
   └── Select employee → set in row
   │
   [Opening Reading] (number only, auto-filled or manual)
   ├── Auto-filled from previous shift → grey italic
   ├── Owner edits → italic removed
   └── On blur → validate (> 0)
   │
   [Closing Reading] (number only)
   └── On blur:
            ├── Validate > 0
            ├── Validate ≥ Opening
            ├── Auto-calc Difference = Closing - Opening
            └── Auto-calc Sales = Difference × Price
   │
   [Cash / CC / UPI] (number only, ≥ 0)
   └── On blur:
            └── Check per-row: Cash + CC + UPI = Sales
                     ├── MATCH → no error
                     └── MISMATCH → inline warning on row
```

### 4.3 Save Flow
```
Owner clicks "Save" button
   │
   ├──► Run full shift validation:
   │        ├── Today's Price > 0?
   │        ├── All rows: all fields filled?
   │        ├── All rows: Opening > 0, Closing > 0, Closing ≥ Opening?
   │        ├── All rows: Cash/CC/UPI ≥ 0?
   │        └── All rows: Cash + CC + UPI = Sales?
   │
   ├── VALIDATION FAILS:
   │        └── Show popup listing all errors by row number + field
   │            Block save
   │
   └── VALIDATION PASSES:
            │
            ├── Write shift data to Firestore
            ├── Record savedAt timestamp (IST)
            ├── Set editWindowExpiry = savedAt + 48 hours
            ├── Update /metadata/calendar with this date
            │
            ├── Update next shift's opening readings (carryover):
            │        ├── Shift 1 saved → push closings to Shift 2 openings
            │        ├── Shift 2 saved → push closings to Shift 3 openings
            │        └── Shift 3 saved → push closings to next day Shift 1 openings
            │
            ├── If next shift already saved (even locked):
            │        ├── Force-update opening readings in Firestore
            │        └── Show banner on current shift:
            │            "Shift [N+1]'s opening readings have been updated"
            │
            └── Toast: "Shift [N] saved successfully"
```

### 4.4 Edit Flow
```
Owner clicks "Edit" button (within 48hr window only)
   │
   ├── Unlock entire shift grid (all fields become editable)
   ├── Edit button disappears, Save button appears
   │
   ├── Owner makes changes
   │
   └── Owner clicks "Save"
            │
            ├── Run full validation again
            ├── On pass:
            │        ├── Write updated data to Firestore
            │        ├── Reset editWindowExpiry = new savedAt + 48 hours
            │        ├── Force-update next shift's openings
            │        └── Show banner: "Shift [N+1]'s opening readings have been updated due to your edits"
            │
            └── On fail → show errors, block save
```

---

## 5. Settings Flow

### 5.1 Open Settings
```
Hamburger menu → Settings
   │
   └── Open Settings page (accessible anytime, no unsaved-change block)
```

### 5.2 Nozzle Management
```
Settings → Nozzle Management
   │
   ├── View list of current nozzles (in order added)
   │
   ├── Add Nozzle:
   │        ├── Type name → click "Add"
   │        ├── Validate: not empty, not duplicate, max 15
   │        ├── Save to Firestore /config/nozzles
   │        └── Immediately appears in any open unsaved shift's dropdown
   │
   └── Remove Nozzle:
            ├── Click "Remove" on nozzle
            ├── Check: Is this nozzle selected in any open unsaved shift?
            │        ├── YES → Warning popup:
            │        │        "This nozzle is used in an unsaved shift.
            │        │         The row will be greyed out until saved."
            │        │         [Confirm] / [Cancel]
            │        │         On Confirm → Remove from list, grey out row in shift
            │        └── NO → Confirmation popup → Remove from Firestore
            │
            └── Historical records still show nozzle name (greyed-out text)
```

### 5.3 Employee Management
```
Same flow as Nozzle Management
   │
   ├── Add Employee: name → validate → save → available in dropdown
   └── Remove Employee:
            ├── If in unsaved shift → warning → greyed-out row
            └── Historical records → greyed-out name
```

### 5.4 Change Password
```
Settings → Change Password
   │
   ├── Enter current password
   ├── Enter new password (show rules: 6-12 chars, upper+lower+number+@#$)
   ├── Confirm new password
   └── Click "Update"
            ├── Validate current password (bcrypt compare)
            ├── Validate new password regex
            ├── Validate new = confirm
            ├── Hash new password → save to Firestore
            └── Toast: "Password updated successfully"
```

### 5.5 Change Security Question
```
Settings → Security Question
   │
   ├── Enter current answer (verify identity)
   ├── Enter new question
   ├── Enter new answer
   └── Click "Update"
            ├── Verify current answer (bcrypt compare)
            ├── Hash new answer → save to Firestore
            └── Toast: "Security question updated"
```

---

## 6. Export Flows

### 6.1 DSR Excel Export
```
Hamburger → Export DSR
   │
   ├── Show date picker (select which day to export)
   ├── Owner selects date
   │
   ├──► Check: Are all 3 shifts for that date fully filled?
   │        │
   │        ├── YES → Generate Excel file → Auto-download
   │        │         Filename: DDMMYYYY_DSR.xlsx
   │        │
   │        └── NO → Show popup:
   │                 "The following shifts are incomplete:"
   │                 • Shift 2 — [list of empty fields]
   │                 • Shift 3 — Not started
   │                 "Complete all shifts before exporting."
   │
   └── Done
```

### 6.2 Monthly Report
```
Hamburger → Monthly Report
   │
   ├── Open popup/modal
   ├── Dropdown: list of available completed months (within 60 days, all days filled)
   ├── Owner selects month
   │
   ├── Fetch all daily total records for that month
   ├── Display on-screen table:
   │        Columns: Date | Diff (KG) | Sales (₹) | Cash | CC | UPI
   │        Rows: one per day
   │        Last row: Grand Total
   │
   ├── "Export PDF" button
   │        └── Generate PDF → Auto-download
   │            Filename: MonthName_DSR.pdf
   │
   └── Close modal
```

---

## 7. History View Flow

```
Owner selects a past date from calendar
   │
   ├──► Load date data from Firestore (or IndexedDB cache if offline)
   │
   ├── Open in read-only mode (all inputs disabled, styled differently)
   ├── Show 3 shift tabs
   ├── Auto-open on last saved shift tab
   │
   ├── Greyed-out nozzles/employees (if they were later deleted) visible
   ├── Auto-filled readings shown in grey italic
   │
   └── No Save, Edit, or Delete buttons visible
```

---

## 8. Offline Flow

```
Internet connection lost
   │
   ├── Banner appears at top: "No Internet Connection — Read-Only Mode"
   ├── All input fields disabled
   ├── All save/edit/export buttons disabled
   ├── App shows cached (IndexedDB) data from last Firestore sync
   │
   └── Internet restored
            ├── Banner disappears
            └── Full access restored (re-fetch latest data)
```

---

## 9. Second Device Flow

```
Owner logs in on Device 2 (same credentials)
   │
   ├──► Firestore checks activeSessions
   ├── Session ID mismatch detected
   │
   └── Device 2 → Read-Only Mode
            ├── Banner: "Another session is active. You are in read-only mode."
            └── All write operations blocked
```

---

## 10. Data Cleanup Flow

```
On every login:
   │
   ├── Calculate cutoff date: today − 60 days
   ├── Query Firestore /records where date < cutoff
   ├── Batch delete all matching documents
   ├── Update /metadata/calendar to remove deleted dates
   └── Continue to Dashboard (no notification to user)
```

---

## 11. Screen Map

```
/login                  → Login Page
/forgot-password        → Forgot Password Page
/setup                  → Security Question Setup (first login)
/                       → Dashboard (today's shift entry)
/history/:date          → History View (read-only past date)
/settings               → Settings Page
```

---

## 12. Error State Summary

| Scenario | Handling |
|----------|---------|
| Wrong login credentials | Toast error, stay on login |
| Forgot password — wrong answer | Inline error, stay on page |
| Validation fails on save | Popup with row-by-row errors, block save |
| Cash+CC+UPI ≠ Sales (per row) | Popup with row number, block save |
| Export — shifts incomplete | Popup listing incomplete shifts, block export |
| No internet on app open | Read-only mode with top banner |
| Previous day Shift 3 not filled | Popup with redirect button |
| Nozzle deleted while in unsaved shift | Warning popup, greyed-out row |
| Today's Price = 0 on save | Toast error, block save |
| Password too weak | Inline error with rules |
| New nozzle when max 15 reached | Toast: "Maximum nozzle limit reached" |
| New employee when max 50 reached | Toast: "Maximum employee limit reached" |
