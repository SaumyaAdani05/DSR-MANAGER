# UI/UX Brief
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 1.0  
**Date:** June 2026

---

## 1. Design Philosophy

DSR Manager follows the **Adani Enterprise visual identity** — authoritative, trustworthy, and structured. The interface prioritises clarity over decoration: the owner must be able to enter data quickly, spot errors immediately, and navigate records without confusion. Every UI decision serves data accuracy and operational efficiency.

**Core Principles:**
- **Clarity first** — numbers and inputs are always legible and large enough to use without squinting
- **Error visibility** — validation failures are impossible to miss
- **Minimal clicks** — common tasks (fill shift, save, navigate) require minimum interaction
- **Professional tone** — no playful elements; this is a financial record tool

---

## 2. Brand & Color Palette

Inspired by Adani Group's visual identity.

### 2.1 Primary Palette

| Name | Hex | Usage |
|------|-----|-------|
| Adani Navy | `#003087` | Primary background, headers, sidebar, active tabs |
| Adani Navy Dark | `#001f5b` | Sidebar background, hover states on dark surfaces |
| Adani Navy Light | `#0041b3` | Hover on nav items, secondary buttons |
| Adani Red | `#E2231A` | CTA buttons (Save, Export), active indicators, alerts |
| Adani Red Dark | `#b51813` | Button hover/press state |
| White | `#FFFFFF` | Card backgrounds, input fields, table rows |
| Light Gray | `#F4F5F7` | Page background, alternate table rows |
| Gray | `#6B7280` | Secondary text, placeholder text |
| Border Gray | `#D1D5DB` | Input borders, table dividers |
| Success Green | `#16A34A` | Success toasts, saved indicators |
| Warning Amber | `#D97706` | Warning toasts, auto-fill banners |
| Error Red | `#DC2626` | Validation errors, error toasts |
| Greyed Out | `#9CA3AF` | Deleted nozzles/employees in history |
| Auto-fill Italic | `#6B7280` + italic | Auto-carried opening readings |

---

## 3. Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| App Title | Inter | 20px | 700 Bold | White |
| Station Name | Inter | 16px | 600 SemiBold | White |
| Page Headings | Inter | 18px | 700 Bold | Navy `#003087` |
| Section Headings | Inter | 14px | 600 SemiBold | Navy `#003087` |
| Table Headers | Inter | 13px | 600 SemiBold | White (on navy) |
| Body Text | Inter | 14px | 400 Regular | `#374151` |
| Input Text | Inter | 14px | 400 Regular | `#111827` |
| Placeholder | Inter | 14px | 400 Regular | `#9CA3AF` |
| Total Row | Inter | 14px | 700 Bold | `#111827` |
| Auto-fill | Inter | 14px | 400 Italic | `#6B7280` |
| Error Text | Inter | 12px | 500 Medium | `#DC2626` |
| Small Labels | Inter | 12px | 500 Medium | `#6B7280` |

Font import: `Inter` from Google Fonts (regular, medium, semibold, bold, italic variants)

---

## 4. Spacing & Grid

- Base unit: 4px
- Card padding: 24px
- Input padding: 10px 12px
- Table cell padding: 10px 12px
- Section gap: 24px
- Row gap: 8px
- Content max-width: 1280px (centered on large screens)
- Full-width layout on screens below 1280px

---

## 5. Component Library

### 5.1 Header
```
┌─────────────────────────────────────────────────────────────────────┐
│  [Station Name]         DSR Manager              [☰ Hamburger]      │
│  Memnagar CNG                                                        │
└─────────────────────────────────────────────────────────────────────┘
```
- Background: Adani Navy `#003087`
- Height: 64px
- Station name: white, 16px semibold (left)
- App name: white, 20px bold (center)
- Hamburger: white icon, 40×40px touch target (right)

---

### 5.2 Side Drawer
```
┌────────────────────┐
│   DSR Manager      │  ← Title
│ ─────────────────  │
│  📤 Export DSR     │
│  📊 Monthly Report │
│  ⚙️  Settings      │
│  🚪 Logout         │
└────────────────────┘
```
- Slides in from right
- Width: 260px
- Background: Adani Navy Dark `#001f5b`
- Items: white text, 15px medium, 48px height each
- Hover: Adani Navy Light `#0041b3` background
- Overlay: semi-transparent dark backdrop on rest of screen
- Close: click outside drawer or × button

---

### 5.3 Date Picker & Calendar
- Displays current month
- Navigation: prev/next month arrows
- Today's date: Adani Red circle highlight
- Dates with saved data: small Adani Red dot beneath date number
- Past 60 days: selectable (normal color)
- Future dates + older than 60 days: disabled (muted gray, cursor not-allowed)
- Selected date: Adani Navy background

---

### 5.4 Shift Tabs
```
┌──────────┬──────────┬──────────┐
│  SHIFT 1 │  SHIFT 2 │  SHIFT 3 │
└──────────┴──────────┴──────────┘
```
- Active tab: Adani Navy background, white text, bottom border Adani Red
- Inactive tab: Light Gray background, Gray text
- Saved + within 48hr: small green dot on tab
- Saved + locked: small lock icon on tab
- Tab height: 44px

---

### 5.5 Shift Header Bar
```
┌──────────────────────────────────────────────────────────────────────┐
│  Date: 09/06/2026      Shift: 1      Today's Price: ₹ [  96.50  ]   │
└──────────────────────────────────────────────────────────────────────┘
```
- Background: Light Gray `#F4F5F7`
- Border-bottom: 1px Border Gray
- Today's Price: editable input, right-aligned, navy border on focus
- Label: "₹/KG" displayed next to price input

---

### 5.6 Data Grid (Shift Entry Table)

#### Column Widths (approximate, total ~1200px)
| Column | Width | Notes |
|--------|-------|-------|
| Nozzle | 120px | Dropdown |
| Employee | 160px | Dropdown |
| Opening Reading | 130px | Number, auto-fill italic |
| Closing Reading | 130px | Number |
| Difference (KG) | 120px | Read-only, auto-calc |
| Sales in Rs. | 140px | Read-only, auto-calc |
| Cash | 110px | Number |
| CC | 110px | Number |
| UPI | 110px | Number |

#### Table Styling
- Header row: Adani Navy background, white text, 13px semibold
- Data rows: white background, alternating with `#F9FAFB`
- Row hover: `#EFF6FF` (light blue)
- Total row: Light Gray background, bold text, top border 2px Adani Navy
- Row with error: left border 3px `#DC2626`, background `#FEF2F2`
- Row height: 48px minimum

#### Input Fields in Grid
- Border: 1px `#D1D5DB`
- Border-radius: 6px
- Focus border: 2px Adani Navy `#003087`
- Error border: 2px `#DC2626`
- Read-only fields (Difference, Sales): background `#F3F4F6`, no border, cursor not-allowed
- Auto-filled opening: text gray italic `#6B7280`
- Manually entered opening: text normal `#111827`

---

### 5.7 Total Row
```
┌─────────┬──────────┬──────────┬──────────────┬──────────┬──────────┬──────────┐
│  TOTAL  │          │          │  1,234.50 KG │ ₹1,18,... │  80,000 │  20,000 │  18,000 │
└─────────┴──────────┴──────────┴──────────────┴──────────┴──────────┴──────────┘
```
- Nozzle + Employee + Opening + Closing cells: empty (merged label "TOTAL" in nozzle cell)
- All calculated cells: bold, navy text
- Background: `#EFF6FF` (light navy tint)

---

### 5.8 Buttons

| Type | Background | Text | Hover | Usage |
|------|-----------|------|-------|-------|
| Primary | Adani Red `#E2231A` | White | `#b51813` | Save, Export, Confirm |
| Secondary | White | Adani Navy | Navy bg 10% | Cancel, Edit, Back |
| Danger | `#FEF2F2` | `#DC2626` | `#FEE2E2` | Delete, Remove |
| Ghost | Transparent | Navy | Light gray bg | Minor actions |

- Border-radius: 8px
- Padding: 10px 20px
- Font: 14px semibold
- Disabled: 50% opacity, cursor not-allowed

---

### 5.9 Dropdown (Nozzle & Employee)
- Height: 40px
- Border: 1px `#D1D5DB`
- Border-radius: 6px
- Focus: 2px Adani Navy ring
- Dropdown list: white bg, max 8 visible items, scrollable
- Disabled/greyed option: `#9CA3AF` text, cursor not-allowed
- Selected: Navy text, checkmark icon

---

### 5.10 Input Fields (General)
- Height: 40px
- Border: 1px `#D1D5DB`
- Border-radius: 6px
- Focus: 2px Adani Navy outline
- Error: 2px `#DC2626` outline + error message below in 12px red
- Show/hide password: eye icon inside input (right side)
- Number inputs: text right-aligned, no spinner arrows (appearance: none)

---

### 5.11 Modals / Popups
- Backdrop: `rgba(0,0,0,0.5)` overlay
- Card: white, border-radius 12px, padding 32px, max-width 480px
- Header: 18px bold navy
- Body: 14px gray
- Footer: buttons right-aligned
- Close: × icon top-right, or click outside
- Animation: fade in + scale up (200ms)

---

### 5.12 Toast Notifications
- Position: top-right corner, 16px from edges
- Width: 320px
- Border-radius: 8px
- Auto-dismiss: 4 seconds
- Stack: newest on top (max 3 visible)

| Type | Background | Left Border | Icon |
|------|-----------|-------------|------|
| Success | `#F0FDF4` | 4px `#16A34A` | ✓ |
| Error | `#FEF2F2` | 4px `#DC2626` | ✕ |
| Warning | `#FFFBEB` | 4px `#D97706` | ⚠ |
| Info | `#EFF6FF` | 4px `#003087` | ℹ |

---

### 5.13 Banners (Inline Alerts)
Used for: "Opening readings updated", "Offline mode", "Edit window closing"
```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️  Shift 2's opening readings have been updated due to your edits │
└─────────────────────────────────────────────────────────────────────┘
```
- Background: `#FFFBEB` (amber tint)
- Border: 1px `#D97706`
- Text: 14px amber `#92400E`
- Dismissible via × icon

---

## 6. Page Layouts

### 6.1 Login Page
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    DSR Manager                                      │
│                                                                     │
│           ┌─────────────────────────────┐                          │
│           │  Username                   │                          │
│           ├─────────────────────────────┤                          │
│           │  Password              👁   │                          │
│           └─────────────────────────────┘                          │
│                                                                     │
│                  [ LOGIN ]                                          │
│                                                                     │
│             Forgot Password / Username?                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```
- Background: Adani Navy `#003087`
- Card: white, centered, max-width 400px, border-radius 16px, shadow
- Title: white, 28px bold (above card)
- Subtle bottom text in white: "Memnagar CNG · DSR Manager"

---

### 6.2 Dashboard Page
```
┌─────────────────────────────────────────────────────── Header ──────┐
│                                                                     │
│  [Calendar Date Picker]                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SHIFT 1  │  SHIFT 2  │  SHIFT 3                            │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Date: 09/06/2026     Shift: 1     Price: ₹ [96.50] /KG    │   │
│  ├──────────┬────────────┬─────────┬──────────┬──────────────┤   │
│  │ Nozzle   │ Employee   │ Opening │ Closing  │ Diff...      │   │
│  ├──────────┼────────────┼─────────┼──────────┼──────────────┤   │
│  │ [drop ▼] │ [drop  ▼]  │ [     ] │ [      ] │   auto       │   │
│  │ [drop ▼] │ [drop  ▼]  │ [     ] │ [      ] │   auto       │   │
│  │ ...                                                         │   │
│  ├──────────────────────────────────────────────────────────── │   │
│  │ TOTAL    │            │         │          │   1234.50      │   │
│  └──────────────────────────────────────────────────────────── │   │
│                                          [ SAVE SHIFT 1 ]      │   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 6.3 Settings Page
```
┌──────────────── Settings ───────────────────────────────────────────┐
│                                                                     │
│  ┌─ Station Name ────────────────────────────────────────────────┐  │
│  │  [Memnagar CNG                                            ]   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ Nozzle Management ───────────────────────────────────────────┐  │
│  │  N1  [Remove]   N2  [Remove]   ...         [+ Add Nozzle]    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ Employee Management ─────────────────────────────────────────┐  │
│  │  Ramesh  [Remove]   Suresh  [Remove]   [+ Add Employee]       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ Change Password ─────────────────────────────────────────────┐  │
│  │  Current Password  [           ] 👁                            │  │
│  │  New Password      [           ] 👁                            │  │
│  │  Confirm Password  [           ] 👁    [Update Password]       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ Security Question ───────────────────────────────────────────┐  │
│  │  Question  [                                               ]  │  │
│  │  Answer    [                                               ]  │  │
│  │                                              [Update]         │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 6.4 Monthly Report Modal
```
┌─────────────────────────────────────────────────────────────────────┐
│  Monthly DSR Report                                           [×]  │
│  ─────────────────────────────────────────────────────────────────  │
│  Select Month: [ June 2026 ▼ ]                                      │
│                                                                     │
│  ┌───────────┬──────────┬──────────────┬─────────┬──────────────┐  │
│  │ Date      │ Diff(KG) │ Sales (₹)    │ Cash    │ CC    │ UPI  │  │
│  ├───────────┼──────────┼──────────────┼─────────┼───────┼──────┤  │
│  │ 01/06/26  │ 234.50   │ 22,512.25   │ 15,000 │ 5,000 │ 2,512│  │
│  │ 02/06/26  │ ...      │ ...         │ ...    │ ...   │ ...  │  │
│  ├───────────┼──────────┼──────────────┼─────────┼───────┼──────┤  │
│  │ TOTAL     │ 6,234.50 │ 5,98,512.25 │ 4,00,000│ ...   │ ... │  │
│  └───────────┴──────────┴──────────────┴─────────┴───────┴──────┘  │
│                                                                     │
│                                         [ Export PDF ]             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Interaction States

### 7.1 Input States
| State | Visual |
|-------|--------|
| Default | 1px gray border |
| Focus | 2px navy ring, navy border |
| Filled | Dark text, gray border |
| Error | 2px red border, red error text below |
| Disabled / Read-only | Gray background, gray text, no focus ring |
| Auto-filled | Gray italic text |

### 7.2 Button States
| State | Visual |
|-------|--------|
| Default | Solid red fill, white text |
| Hover | Darker red fill |
| Active/Press | Darkest red + scale(0.98) |
| Disabled | 50% opacity, not-allowed cursor |
| Loading | Spinner icon, text hidden |

### 7.3 Row States
| State | Visual |
|-------|--------|
| Empty | Default white |
| Partially filled | Default white |
| Reconciliation error | Left red border, pink tint background |
| Saved (read-only) | Light gray background, all inputs disabled |
| Greyed-out nozzle/employee | Text `#9CA3AF`, italic |

---

## 8. Responsive Design Notes

- Designed primarily for PC (1280px+ screens)
- Layout is fluid (not fixed-width) down to 900px
- Below 900px: horizontal scrolling on the data grid table
- No breakpoint-based mobile redesign in v1
- PWA installable on PC desktop as standalone window

---

## 9. Accessibility

- All inputs have `<label>` associations or `aria-label`
- Error messages have `role="alert"` for screen readers
- Color is never the only indicator of state (icons + text added)
- Focus indicators always visible (keyboard navigation supported)
- Minimum touch target 40×40px for buttons and icons

---

## 10. Microinteractions & Animations

| Element | Animation |
|---------|-----------|
| Side drawer open/close | Slide-in from right, 250ms ease |
| Modal appear | Fade + scale from 95% to 100%, 200ms |
| Toast appear | Slide down from top-right, 250ms |
| Toast dismiss | Slide up + fade out, 200ms |
| Tab switch | Instant (no animation, snappy feel) |
| Auto-fill applied | Brief yellow flash on input → settles to gray italic |
| Save success | Checkmark on save button → returns to normal, 500ms |
| Error shake | Input shakes horizontally, 300ms |

---

## 11. Empty States

| Screen | Empty State Message |
|--------|-------------------|
| No shifts saved for today | "No data entered yet. Start with Shift 1 above." |
| History — date with no data | "No records found for this date." |
| Monthly report — no complete months | "No complete months available yet." |
| Nozzle list empty | "No nozzles added. Add your first nozzle to get started." |
| Employee list empty | "No employees added. Add your first employee to begin." |

---

## 12. PWA Install Prompt

- Displayed as a dismissible bottom banner on first visit (after 30 seconds)
```
┌────────────────────────────────────────────────────────────────────┐
│  📲 Install DSR Manager on your desktop for quick access  [Install] [✕] │
└────────────────────────────────────────────────────────────────────┘
```
- Background: Adani Navy, white text, Red install button
