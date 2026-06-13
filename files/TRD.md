# Technical Requirements Document (TRD)
## DSR Manager — Gas Station Daily Sales Record Web App
**Version:** 1.0  
**Date:** June 2026  
**Status:** Final

---

## 1. Tech Stack Overview

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend Framework | React 18 (Vite) | Fast build, large ecosystem, component reuse |
| Styling | Tailwind CSS v3 | Utility-first, Adani theme via custom config |
| State Management | React Context API + useReducer | Sufficient for single-user; scalable to Redux later |
| Routing | React Router v6 | SPA navigation, protected routes |
| Database | Firebase Firestore | Real-time, free tier, offline caching support |
| Authentication | Custom (Firestore-based) | Username is not an email; Firebase Auth not suitable |
| File Export (Excel) | SheetJS (xlsx) | Industry standard, browser-compatible |
| File Export (PDF) | jsPDF + jspdf-autotable | Lightweight, no server needed |
| Hosting | Vercel (free tier) | Continuous deployment, vercel.app subdomain |
| PWA | Vite PWA Plugin (vite-plugin-pwa) | Service worker + manifest auto-generation |
| Offline Cache | Workbox (via vite-plugin-pwa) | Stale-while-revalidate caching strategy |
| Timezone | date-fns-tz | IST conversions for all timestamps |
| Number Format | Custom Intl.NumberFormat | Indian format (en-IN locale) |

---

## 2. Project Structure

```
dsr-manager/
├── public/
│   ├── manifest.json
│   └── icons/
│       └── dsr-icon-192.png
│       └── dsr-icon-512.png
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── SecuritySetup.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── SideDrawer.jsx
│   │   │   └── ToastContainer.jsx
│   │   ├── shift/
│   │   │   ├── ShiftTabs.jsx
│   │   │   ├── ShiftGrid.jsx
│   │   │   ├── ShiftRow.jsx
│   │   │   ├── TotalRow.jsx
│   │   │   └── PriceHeader.jsx
│   │   ├── calendar/
│   │   │   └── DatePicker.jsx
│   │   ├── settings/
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── NozzleManager.jsx
│   │   │   └── EmployeeManager.jsx
│   │   ├── export/
│   │   │   ├── ExportDSR.jsx
│   │   │   └── MonthlyReport.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Dropdown.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       └── Badge.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── ShiftContext.jsx
│   │   └── SettingsContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useShiftData.js
│   │   ├── useNozzles.js
│   │   ├── useEmployees.js
│   │   ├── useCarryover.js
│   │   └── useOnlineStatus.js
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── HistoryPage.jsx
│   │   └── SettingsPage.jsx
│   ├── services/
│   │   ├── firebase.js
│   │   ├── authService.js
│   │   ├── shiftService.js
│   │   ├── settingsService.js
│   │   ├── exportService.js
│   │   └── cleanupService.js
│   ├── utils/
│   │   ├── calculations.js
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   ├── dateUtils.js
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 3. Firebase Configuration

### 3.1 Services Used
- **Firestore** — all data storage
- **Firebase Hosting** — NOT used (Vercel used instead)
- **Firebase Auth** — NOT used (custom auth via Firestore)

### 3.2 Firebase Init (`src/services/firebase.js`)
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence (Firestore IndexedDB cache)
enableIndexedDbPersistence(db).catch(console.warn);
```

### 3.3 Environment Variables (`.env`)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 4. Authentication Architecture

### 4.1 Custom Auth Flow
Since the username is not an email, Firebase Email/Password Auth is not used. Authentication is handled via:
- A single document in Firestore: `/auth/owner`
- Contains: `username`, `passwordHash` (bcrypt), `securityQuestion`, `securityAnswerHash`
- On login: fetch document, compare input with stored hash using bcryptjs

### 4.2 Session Management
- On successful login, store session in `localStorage`:
  ```json
  { "isAuthenticated": true, "sessionId": "uuid", "loginTime": "ISO timestamp" }
  ```
- All protected routes check `localStorage` for session
- Logout clears `localStorage` session
- Second device: check Firestore `activeSessions` array; if session ID mismatch → read-only mode

### 4.3 Password Hashing
- Library: `bcryptjs`
- Salt rounds: 10
- Applied to both password and security answer

### 4.4 Password Validation Regex
```javascript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$])[A-Za-z\d@#$]{6,12}$/;
```

---

## 5. Routing

```javascript
// App.jsx routes
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/setup" element={<SecuritySetup />} />
  <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
  <Route path="/history/:date" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
</Routes>
```

### Protected Route
```javascript
const ProtectedRoute = ({ children }) => {
  const session = JSON.parse(localStorage.getItem('dsr_session'));
  if (!session?.isAuthenticated) return <Navigate to="/login" />;
  return children;
};
```

---

## 6. State Management

### 6.1 AuthContext
```javascript
{
  isAuthenticated: boolean,
  isReadOnly: boolean,        // second device or offline
  isFirstLogin: boolean,
  logout: () => void,
}
```

### 6.2 ShiftContext
```javascript
{
  selectedDate: string,       // YYYY-MM-DD
  activeShift: number,        // 1, 2, or 3
  shiftData: {
    shift1: ShiftObject,
    shift2: ShiftObject,
    shift3: ShiftObject,
  },
  setSelectedDate: () => void,
  setActiveShift: () => void,
  saveShift: (shiftNum) => void,
  editShift: (shiftNum) => void,
}
```

### 6.3 ShiftObject Shape
```javascript
{
  price: number,              // Today's price per KG
  rows: [
    {
      nozzle: string,
      employee: string,
      openingReading: number,
      closingReading: number,
      difference: number,     // auto-calculated
      salesRs: number,        // auto-calculated
      cash: number,
      cc: number,
      upi: number,
      isOpeningAutoFilled: boolean,  // for grey italic indicator
    }
  ],
  totals: {
    difference: number,
    salesRs: number,
    cash: number,
    cc: number,
    upi: number,
  },
  savedAt: timestamp,
  editWindowExpiry: timestamp,   // savedAt + 48 hours
  isLocked: boolean,
  isSaved: boolean,
}
```

### 6.4 SettingsContext
```javascript
{
  stationName: string,
  nozzles: string[],          // ordered list
  employees: string[],        // ordered list
  updateStationName: () => void,
  addNozzle: () => void,
  removeNozzle: () => void,
  addEmployee: () => void,
  removeEmployee: () => void,
}
```

---

## 7. Calculation Engine (`src/utils/calculations.js`)

```javascript
// Triggered on field blur (not on every keystroke)

export const calcDifference = (closing, opening) => 
  parseFloat((closing - opening).toFixed(2));

export const calcSales = (difference, price) => 
  parseFloat((difference * price).toFixed(2));

export const calcRowTotals = (rows) => ({
  difference: rows.reduce((sum, r) => sum + (r.difference || 0), 0),
  salesRs: rows.reduce((sum, r) => sum + (r.salesRs || 0), 0),
  cash: rows.reduce((sum, r) => sum + (r.cash || 0), 0),
  cc: rows.reduce((sum, r) => sum + (r.cc || 0), 0),
  upi: rows.reduce((sum, r) => sum + (r.upi || 0), 0),
});

export const isReconciled = (row) => 
  parseFloat((row.cash + row.cc + row.upi).toFixed(2)) === parseFloat(row.salesRs.toFixed(2));
```

---

## 8. Number & Date Formatting (`src/utils/formatters.js`)

```javascript
// Indian number format
export const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

// Date format: DD/MM/YYYY
export const formatDisplayDate = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(date));

// Firestore key: YYYY-MM-DD
export const formatFirestoreDate = (date) => {
  const ist = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return ist.toISOString().split('T')[0];
};

// Export filename: DDMMYYYY
export const formatExportDate = (dateStr) => dateStr.replace(/-/g, '').split('').reverse().join('').replace(/(\d{4})(\d{2})(\d{2})/, '$3$2$1');
// YYYY-MM-DD → DDMMYYYY
```

---

## 9. Validation Engine (`src/utils/validators.js`)

```javascript
export const validateRow = (row) => {
  const errors = [];

  if (!row.nozzle) errors.push('Nozzle is required');
  if (!row.employee) errors.push('Employee is required');
  if (!row.openingReading || row.openingReading <= 0)
    errors.push('Opening Reading must be greater than 0');
  if (!row.closingReading || row.closingReading <= 0)
    errors.push('Closing Reading must be greater than 0');
  if (row.closingReading < row.openingReading)
    errors.push('Closing Reading must be ≥ Opening Reading');
  if (row.cash < 0 || row.cc < 0 || row.upi < 0)
    errors.push('Cash, CC, UPI cannot be negative');
  if (!isReconciled(row))
    errors.push(`Row reconciliation failed: Cash + CC + UPI (${row.cash + row.cc + row.upi}) ≠ Sales (${row.salesRs})`);

  return errors;
};

export const validateShift = (shift) => {
  if (!shift.price || shift.price <= 0)
    return ['Today\'s Price must be greater than 0'];
  
  const allErrors = [];
  shift.rows.forEach((row, i) => {
    const rowErrors = validateRow(row);
    if (rowErrors.length > 0)
      allErrors.push({ rowIndex: i + 1, nozzle: row.nozzle, errors: rowErrors });
  });
  return allErrors;
};

export const validatePassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$])[A-Za-z\d@#$]{6,12}$/.test(password);
```

---

## 10. Firestore Read Optimization

### 10.1 Strategies
- **Lazy Load History**: Only load a date's data when the user selects it from the calendar
- **Cache Firestore Reads**: Use Firestore's built-in IndexedDB offline persistence
- **Batch Writes**: Write all 3 shifts of a day in a Firestore batch
- **Paginate Calendar**: Only fetch metadata (dates with data) for the past 60 days on login, not full records
- **Single Document Per Shift**: Each shift is one document — one read loads all row data

### 10.2 Calendar Metadata Collection
- A lightweight `/metadata/calendar` document stores an array of dates that have saved data
- Updated on each shift save (batch write with the shift document)
- Calendar UI reads only this one document to highlight dates (instead of querying 60 documents)

### 10.3 Listener Strategy
- Do **not** use real-time `onSnapshot` listeners on shift data (wasteful for single user)
- Use one-time `getDoc` reads when the user selects a date or shift
- Use `onSnapshot` only for the `activeSessions` document to detect second-device login

---

## 11. Edit Window & Lock Logic

```javascript
// Check if shift is editable
export const isEditable = (shift) => {
  if (!shift.isSaved) return true;               // Never saved = always editable
  const now = Date.now();
  const expiry = shift.editWindowExpiry?.toMillis?.() || 0;
  return now < expiry;                            // Within 48 hours of last save
};

// Calculate edit window expiry (48 hours from save time, IST)
export const calcEditExpiry = (savedAt) => {
  const expiry = new Date(savedAt);
  expiry.setHours(expiry.getHours() + 48);
  return expiry;
};
```

---

## 12. Carryover Engine (`src/hooks/useCarryover.js`)

```javascript
// Get opening readings for shift N from shift N-1 closings (same day)
export const getCarryoverFromPrevShift = (prevShiftRows) =>
  prevShiftRows.map((row) => ({
    nozzle: row.nozzle,
    openingReading: row.closingReading,
    isAutoFilled: true,
  }));

// Get opening readings for Day N+1 Shift 1 from Day N Shift 3
export const getCarryoverFromPrevDay = (prevDayShift3Rows) =>
  getCarryoverFromPrevShift(prevDayShift3Rows);

// Apply carryover by row position index (fixed row-position matching)
export const applyCarryover = (currentRows, carryoverData) =>
  currentRows.map((row, index) => ({
    ...row,
    openingReading: carryoverData[index]?.openingReading ?? row.openingReading,
    isOpeningAutoFilled: carryoverData[index] ? true : false,
  }));
```

---

## 13. Data Cleanup Service (`src/services/cleanupService.js`)

```javascript
// Runs on app load after login
export const cleanOldRecords = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().split('T')[0]; // YYYY-MM-DD

  // Query all records older than 60 days
  const q = query(
    collection(db, 'records'),
    where('date', '<', cutoffStr)
  );
  const snapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};
```

---

## 14. Export Services

### 14.1 DSR Excel Export (`src/services/exportService.js`)
```javascript
import * as XLSX from 'xlsx';

export const exportDSR = (date, shift1, shift2, shift3, stationName) => {
  const wb = XLSX.utils.book_new();

  [shift1, shift2, shift3].forEach((shift, i) => {
    const shiftName = `SHIFT${i + 1}`;
    const rows = [
      [stationName],
      [`Date: ${formatDisplayDate(date)}`],
      [],
      ['Nozzle', 'Employee', 'Opening', 'Closing', 'Diff (KG)', 'Sales (₹)', 'Cash', 'CC', 'UPI'],
      ...shift.rows.map((r) => [r.nozzle, r.employee, r.openingReading, r.closingReading,
        r.difference, r.salesRs, r.cash, r.cc, r.upi]),
      ['TOTAL', '', '', '', shift.totals.difference, shift.totals.salesRs,
        shift.totals.cash, shift.totals.cc, shift.totals.upi],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, shiftName);
  });

  const filename = `${formatExportDate(date)}_DSR.xlsx`;
  XLSX.writeFile(wb, filename);
};
```

### 14.2 Monthly PDF Export
```javascript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportMonthlyPDF = (monthName, year, rows, stationName) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(stationName, 14, 15);
  doc.setFontSize(12);
  doc.text(`Monthly DSR — ${monthName} ${year}`, 14, 25);

  autoTable(doc, {
    startY: 30,
    head: [['Date', 'Diff (KG)', 'Sales (₹)', 'Cash', 'CC', 'UPI']],
    body: rows.map((r) => [r.date, r.totalDiff, r.totalSales, r.totalCash, r.totalCC, r.totalUPI]),
    foot: [['TOTAL', ...calculateMonthTotals(rows)]],
  });

  doc.save(`${monthName}_DSR.pdf`);
};
```

---

## 15. PWA Configuration

### 15.1 `vite.config.js`
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',         // Silent auto-update
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
          },
        ],
      },
      manifest: {
        name: 'DSR Manager',
        short_name: 'DSR',
        description: 'Gas Station Daily Sales Record Manager',
        theme_color: '#003087',
        background_color: '#003087',
        display: 'standalone',
        icons: [
          { src: '/icons/dsr-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/dsr-icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

---

## 16. Tailwind Configuration (Adani Theme)

### 16.1 `tailwind.config.js`
```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        adani: {
          navy: '#003087',       // Primary background, headers
          navyDark: '#001f5b',   // Darker navy for sidebar
          navyLight: '#0041b3',  // Hover states
          red: '#E2231A',        // Accent, CTA buttons, active states
          redDark: '#b51813',    // Button hover
          white: '#FFFFFF',
          lightGray: '#F4F5F7',  // Page backgrounds
          gray: '#6B7280',       // Secondary text
          border: '#D1D5DB',     // Input borders
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 48, 135, 0.12)',
      },
    },
  },
  plugins: [],
};
```

---

## 17. Online Status Hook (`src/hooks/useOnlineStatus.js`)

```javascript
import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
```

---

## 18. Toast Notification System

- Position: top-right corner
- Duration: 4 seconds (auto-dismiss)
- Types: `success` (green), `error` (red), `warning` (amber), `info` (navy)
- Library: `react-hot-toast` or custom implementation with Tailwind

```javascript
// Usage
toast.success('Shift 1 saved successfully');
toast.error('Cash + CC + UPI does not match Sales in Row 3');
toast.warning('Shift 2 opening readings updated due to Shift 1 edit');
```

---

## 19. Dependencies (`package.json` key deps)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "firebase": "^10.8.0",
    "bcryptjs": "^2.4.3",
    "xlsx": "^0.18.5",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "date-fns": "^3.3.1",
    "date-fns-tz": "^3.1.3",
    "react-hot-toast": "^2.4.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.1.4",
    "vite-plugin-pwa": "^0.19.7",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35"
  }
}
```

---

## 20. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Auth document — readable only (login check), writable only from app logic
    match /auth/owner {
      allow read: if true;                  // Needed to verify login
      allow write: if request.auth == null; // Only server-side (or migration script)
    }

    // All app data — restricted to authenticated session
    match /records/{document=**} {
      allow read, write: if isAuthenticated();
    }

    match /config/{document=**} {
      allow read, write: if isAuthenticated();
    }

    match /metadata/{document=**} {
      allow read, write: if isAuthenticated();
    }

    function isAuthenticated() {
      return request.headers.keys().hasAll(['x-session-id']) ||
             exists(/databases/$(database)/documents/sessions/$(request.headers['x-session-id']));
    }
  }
}
```

> Note: Since we use custom auth (not Firebase Auth), session validation is enforced at the application level. Firestore rules serve as an additional layer. Consider moving to Firebase Auth in v2 for stronger server-side enforcement.

---

## 21. Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Environment Variables (set in Vercel dashboard)
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Auto-deploy on push to `main` branch (if GitHub connected)
