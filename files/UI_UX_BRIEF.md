# UI/UX Brief
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 2.0  
**Date:** June 2026

---

## 1. Design Philosophy

DSR Manager follows the Adani Enterprise visual identity — authoritative, trustworthy, and structured. The interface prioritizes clarity, speed of data entry, and instant error visibility. Every design decision serves accuracy and operational efficiency.

**Core Principles:**
- **Speed of entry** — keyboard tab navigation across all cells like a spreadsheet
- **Clarity first** — numbers always legible; errors impossible to miss
- **Friendly, not cold** — professional but approachable; clear labels, helpful messages
- **No unnecessary clicks** — common actions within one tap/click

---

## 2. Brand & Color Palette (Adani Enterprise)

| Name | Hex | Usage |
|------|-----|-------|
| Adani Navy | `#003087` | Headers, sidebar, active tabs, primary bg |
| Adani Navy Dark | `#001f5b` | Side drawer background |
| Adani Navy Light | `#0041b3` | Hover on nav items |
| Adani Red | `#E2231A` | CTA buttons, active tab indicator, today on calendar |
| Adani Red Dark | `#b51813` | Button hover state |
| White | `#FFFFFF` | Cards, input fields, table rows |
| Light Gray | `#F4F5F7` | Page background, alternate rows |
| Gray | `#6B7280` | Secondary text, placeholders, audit trail |
| Border Gray | `#D1D5DB` | Input borders, dividers |
| Success Green | `#16A34A` | Success toasts, "Synced ✓" indicator |
| Amber | `#D97706` | "Syncing..." indicator, warning banners |
| Error Red | `#DC2626` | Validation errors, offline indicator |
| Greyed Out | `#9CA3AF` + italic | Deleted nozzles/employees in history/grid |
| Auto-fill | `#6B7280` + italic | Auto-carried opening readings |
| Daily Total Card | `#EFF6FF` | Daily Sales Bar background |

---

## 3. Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| App Title | 20px | 700 Bold | White |
| Station Name | 15px | 600 Semi | White |
| Page Headings | 18px | 700 Bold | Navy |
| Section Labels | 13px | 600 Semi | Navy |
| Table Headers | 13px | 600 Semi | White (on navy) |
| Body / Input | 14px | 400 Regular | `#111827` |
| Placeholder | 14px | 400 Regular | `#9CA3AF` |
| Total Row | 14px | 700 Bold | `#111827` |
| Daily Total Label | 15px | 700 Bold | Navy |
| Auto-fill text | 14px | 400 Italic | `#6B7280` |
| Audit trail | 12px | 400 Regular | `#9CA3AF` |
| Error text | 12px | 500 Medium | `#DC2626` |
| Sync indicator | 13px | 500 Medium | (color varies) |

Font: **Inter** (Google Fonts — Regular, Medium, SemiBold, Bold, Italic)

---

## 4. Spacing

- Base unit: 4px
- Card padding: 20px 24px
- Input padding: 10px 12px
- Table cell padding: 10px 12px
- Section gap: 24px
- Content max-width: 1400px (centered)

---

## 5. Component Specs

### 5.1 Header
```
┌──────────────────────────────────────────────────────────────────────┐
│ [● Synced ✓]        Memnagar CNG · DSR Manager              [☰]     │
└──────────────────────────────────────────────────────────────────────┘
```
- Height: 60px
- Background: Adani Navy `#003087`
- Sync indicator: top-left, colored dot + text (13px medium)
- Center: Station name + App name (white)
- Right: Hamburger (white, 40×40 touch target)

---

### 5.2 Sync Status Indicator (top-left header)
| State | Dot Color | Text | Text Color |
|-------|-----------|------|------------|
| Synced | Green | "Synced ✓" | `#16A34A` |
| Syncing | Amber (pulse) | "Syncing..." | `#D97706` |
| Offline | Red | "Offline — Local Only" | `#DC2626` |
| Error | Red | "Sync Failed — Retrying" | `#DC2626` |

---

### 5.3 Side Drawer
```
┌──────────────────────┐
│  DSR Manager    [×]  │
│ ─────────────────    │
│  📅 Calendar         │
│  📤 Export DSR       │
│  📊 Monthly Report   │
│  ⚙️  Settings        │
│  🚪 Logout           │
└──────────────────────┘
```
- Slides from right; 260px wide
- Background: `#001f5b`
- Items: white, 15px medium, 48px height, hover → `#0041b3`
- Backdrop: `rgba(0,0,0,0.4)`

---

### 5.4 Shift Tabs
```
┌─────────────┬─────────────┬─────────────┐
│   SHIFT 1   │   SHIFT 2   │   SHIFT 3   │
└─────────────┴─────────────┴─────────────┘
  Last saved: 09/06/2026 08:30   ← grey, 12px, below tabs
```
- Active: navy bg, white text, 3px red bottom border
- Inactive: light gray bg, gray text
- Saved: small green dot on tab label
- Height: 44px
- Audit trail: 12px gray text below tabs ("Last saved: DD/MM/YYYY HH:MM")
- Never saved: audit trail hidden

---

### 5.5 Shift Header Bar
```
┌────────────────────────────────────────────────────────────────────┐
│  Date: 09/06/2026        Shift: 1        Price: ₹ [ 96.50 ] /KG   │
└────────────────────────────────────────────────────────────────────┘
```
- Background: `#F4F5F7`
- Price: editable inline input (navy border on focus), right-aligned
- "₹" prefix + "/KG" suffix shown as static labels flanking the input

---

### 5.6 Data Grid

#### Column Layout (approx widths, total ~1350px with Cash Party)
| Column | Width | Notes |
|--------|-------|-------|
| Nozzle | 120px | Dropdown with search |
| Employee | 150px | Dropdown with search |
| Opening | 120px | Number, grey italic if auto-filled |
| Closing | 120px | Number |
| Diff (KG) | 110px | Read-only, auto-calc |
| Sales (₹) | 140px | Read-only, auto-calc |
| Cash | 100px | Number |
| CC | 100px | Number |
| UPI | 100px | Number |
| Cash Party | 110px | Number |

#### Grid Styling
- Header row: navy bg, white text, 13px semibold, 44px height
- Data rows: white, alternating `#F9FAFB`
- Row hover: `#EFF6FF`
- Row with reconciliation error: left border 3px red, bg `#FEF2F2`
- Read-only cells (Diff, Sales): bg `#F3F4F6`, no border, muted text
- Auto-filled opening: gray italic text
- Row height: 50px (slightly taller for ease of use)
- Horizontal scroll below 1400px

#### Input Fields in Grid
- Border: 1px `#D1D5DB`, border-radius 6px
- Focus: 2px navy ring
- Error: 2px red ring
- Number inputs: right-aligned text, no spinner arrows
- All letters blocked in number fields

---

### 5.7 Search Dropdown (Nozzle & Employee)
```
┌─────────────────────┐
│ 🔍 Search...        │
│─────────────────────│
│  N1                 │
│  N2  (greyed - used)│
│  N3                 │
│  CNG-04             │
└─────────────────────┘
```
- Search input at top of dropdown list
- Already-selected nozzles: greyed, not selectable
- Inactive (deleted) items: italic gray, not selectable
- Max visible: 8 items, scrollable
- Keyboard navigable

---

### 5.8 Total Row (per shift)
```
┌──────────┬───────────┬──────────┬───────────┬──────────────┬────────┬─────┬─────┬───────────┐
│  TOTAL   │           │          │           │  421.75 KG   │₹40,700 │20,000│5,000│ 10,700  │  5,000  │
└──────────┴───────────┴──────────┴───────────┴──────────────┴────────┴─────┴─────┴───────────┘
```
- "TOTAL" label in Nozzle cell (bold, navy)
- Calculated cells: bold, navy text
- Background: `#EFF6FF`
- Top border: 2px solid navy

---

### 5.9 Daily Sales Bar (outside table, below grid)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📊 DAILY TOTAL   Diff: 1,234 KG   Sales: ₹1,18,512   Cash: ₹80,000   CC: ₹20,000   UPI: ₹10,000   Cash Party: ₹8,512  │
└─────────────────────────────────────────────────────────────────────────────────┘
```
- Highlighted card: bg `#EFF6FF`, border 1px `#BFDBFE`, border-radius 10px
- "DAILY TOTAL" label: navy, 15px bold, left side
- Values: dark text, Indian format
- Updates live as shifts are saved
- Margin: 16px below shift grid, above page bottom

---

### 5.10 Buttons

| Type | Background | Text | Hover | Use Case |
|------|-----------|------|-------|---------|
| Primary | Adani Red | White | `#b51813` | Save, Export, Confirm |
| Secondary | White | Navy | Navy bg 8% | Cancel, Edit, Back |
| Danger | `#FEF2F2` | `#DC2626` | `#FEE2E2` | Remove, Delete |
| Ghost | Transparent | Navy | Light gray | Minor actions |

- Border-radius: 8px, padding: 10px 20px, font: 14px semibold
- Disabled: 50% opacity, not-allowed cursor, no hover effect

---

### 5.11 Input Fields (General / Settings)
- Height: 42px
- Border: 1px `#D1D5DB`, border-radius: 8px
- Focus: 2px navy outline
- Error: 2px red outline + 12px error text below in red
- Show/hide password: eye icon inside input (right)

---

### 5.12 Modals / Popups
- Backdrop: `rgba(0,0,0,0.5)`
- Card: white, border-radius 12px, padding 32px, max-width 480px, centered
- Title: 18px bold navy
- Body: 14px gray
- Footer: buttons right-aligned
- Animation: fade + scale from 95%→100%, 200ms

---

### 5.13 Toast Notifications (top-right)
- Width: 320px, border-radius 8px, auto-dismiss 4s
- Stack: newest on top (max 3)

| Type | Background | Left Border | Icon |
|------|-----------|-------------|------|
| Success | `#F0FDF4` | 4px `#16A34A` | ✓ |
| Error | `#FEF2F2` | 4px `#DC2626` | ✕ |
| Warning | `#FFFBEB` | 4px `#D97706` | ⚠ |
| Info | `#EFF6FF` | 4px `#003087` | ℹ |

---

### 5.14 Inline Banners
```
┌──────────────────────────────────────────────────────────────────────┐
│  ⚠️  Next shift's opening readings have been updated   [✕]          │
└──────────────────────────────────────────────────────────────────────┘
```
- Background: `#FFFBEB`, border 1px `#D97706`, text amber, dismissible

---

## 6. Page Layouts

### 6.1 Login Page
```
┌───────────────────────────── navy bg ───────────────────────────────┐
│                                                                     │
│              DSR Manager                                            │
│           Memnagar CNG                                              │
│                                                                     │
│       ┌─────────────────────────────────────┐                      │
│       │  Username                           │                      │
│       │─────────────────────────────────────│                      │
│       │  Password                      👁   │                      │
│       │─────────────────────────────────────│                      │
│       │         [ LOGIN ]                   │                      │
│       │                                     │                      │
│       │    Forgot Password / Username?      │                      │
│       └─────────────────────────────────────┘                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```
- Full-page navy background
- White centered card (max 400px, border-radius 16px, shadow)
- Large "DSR Manager" title above card (white, 30px bold)

---

### 6.2 Dashboard Page
```
┌──────── Header (navy 60px) ─────────────────────────────────────────┐
│                                                                     │
│  ┌─ SHIFT 1 ─┬─ SHIFT 2 ─┬─ SHIFT 3 ──────────────────────────┐   │
│  │  Last saved: 09/06/2026 08:30 (grey, 12px)                  │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Date: 09/06/2026    Shift: 1    Price: ₹ [96.50] /KG       │   │
│  ├──────┬──────────┬─────────┬─────────┬────────┬──────┬──────┤   │
│  │Nozzle│ Employee │ Opening │ Closing │Diff KG │ ... │ CashP│   │
│  ├──────┼──────────┼─────────┼─────────┼────────┼──────┼──────┤   │
│  │[N1▼] │[Ramesh▼] │ 1234.50 │ 1456.75 │ 222.25 │ ... │      │   │
│  │[N2▼] │[Suresh▼] │ 8901.00 │ 9100.50 │ 199.50 │ ... │      │   │
│  ├──────┴──────────┴─────────┴─────────┴────────┴──────┴──────┤   │
│  │ TOTAL │         │         │         │ 421.75 │ ... │       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌── 📊 DAILY TOTAL ─────────────────────────────────────────────┐  │
│  │  Diff: 1,234 KG  Sales: ₹1,18,512  Cash: ₹80,000  CC: ...   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│                              [ SAVE SHIFT 1 ]                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 6.3 Calendar Page
```
┌──────── Header ─────────────────────────────────────────────────────┐
│                                                                     │
│  ◀ May 2026           June 2026            July 2026 ▶              │
│                                                                     │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun                                  │
│   1    2    3    4    5    6    7                                    │
│   ●    ●    ●    ●    ●    ●    ●   ← dots = has data               │
│   8    9   [10]  11  12   13   14                                   │
│   ●    ●    ●    ●    ●    ●    ●                                    │
│  ...                                                                │
│                                                                     │
│  ┌── June 2026 Monthly Summary ─────────────────────────────────┐   │
│  │  Diff(KG) │ Sales(₹) │ Cash │ CC │ UPI │ Cash Party         │   │
│  │  6,234.50 │5,98,512  │4,00K │50K │80K  │ 68,512             │   │
│  └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```
- Today: navy circle highlight
- Data dots: small Adani Red dot below date number
- Selected date: red bg, white text
- Disabled dates: gray, cursor not-allowed

---

### 6.4 Settings Page
```
┌──────── Settings ────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─ Station Name ─────────────────────────────────────────────────┐  │
│  │  [ Memnagar CNG                                            ]   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Nozzle Management (5/15) ─────────────────────────────────────┐  │
│  │  N1  [×]   N2  [×]   N3  [×]           [+ Add Nozzle]         │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Employee Management (8/50) ───────────────────────────────────┐  │
│  │  Ramesh [×]   Suresh [×]   Mahesh [×]   [+ Add Employee]       │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Supabase Config ──────────────────────────────────────────────┐  │
│  │  URL  [                                    ] [Save & Test]     │  │
│  │  Key  [                                    ]                   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Change Password ──────────────────────────────────────────────┐  │
│  │  Current  [          ] 👁   New  [          ] 👁  [Update]     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Security Question ────────────────────────────────────────────┐  │
│  │  Question [                              ]                     │  │
│  │  Answer   [                              ]   [Update]          │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Interaction States

### 7.1 Input States
| State | Visual |
|-------|--------|
| Default | 1px gray border |
| Focus | 2px navy ring, snap-in feel |
| Filled | Dark text |
| Error | 2px red border + red error text below |
| Disabled / Read-only | `#F3F4F6` bg, gray text, no cursor |
| Auto-filled | Gray italic |

### 7.2 Row States
| State | Visual |
|-------|--------|
| Empty | White |
| Partially filled | White |
| Reconciliation error | Left 3px red border, `#FEF2F2` bg |
| Saved / viewed | Normal (no locking in v2) |
| Greyed nozzle/employee | `#9CA3AF` italic text |

---

## 8. Microinteractions

| Element | Animation |
|---------|-----------|
| Side drawer | Slide from right, 250ms ease |
| Modal | Fade + scale 95%→100%, 200ms |
| Toast | Slide down top-right, 250ms; auto-dismiss with fade |
| Auto-fill applied | Brief yellow flash → settles to gray italic |
| Save button loading | Spinner for 300ms while writing to Dexie |
| Daily Sales Bar update | Smooth number transition on value change |
| Sync dot | Amber pulse animation while syncing |
| Error input | Horizontal shake, 300ms |

---

## 9. Empty States

| Screen | Message |
|--------|---------|
| No shifts saved today | "No data yet. Start entering Shift 1 above." |
| Calendar — date with no data | "No records for this date." |
| Monthly report — no complete months | "No complete months available yet." |
| No nozzles in settings | "Add your first nozzle to get started." |
| No employees in settings | "Add your first employee to begin." |

---

## 10. PWA Install Prompt

```
┌──────────────────────────────────────────────────────────────────────┐
│  📲  Install DSR Manager on your desktop for offline access   [Install]  [✕]  │
└──────────────────────────────────────────────────────────────────────┘
```
- Appears after 30 seconds on first visit
- Navy bg, white text, Red install button
- Dismissible; re-shown on next visit if dismissed

---

## 11. Accessibility

- All inputs have labels or aria-label
- Error messages use role="alert"
- Color never the only state indicator (icon + text added)
- Focus ring always visible for keyboard navigation
- Minimum 40×40px touch targets
- Tab key order matches logical data entry flow
