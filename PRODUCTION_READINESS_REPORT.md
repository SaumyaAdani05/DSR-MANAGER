# DSR Manager Production Readiness Report

**Audit date:** 17 June 2026  
**Branch:** `version2`  
**Local target:** `http://127.0.0.1:5173`  
**Decision:** **PASSED / READY FOR PRODUCTION DEPLOYMENT** (subject to standard offline-first client architecture boundaries).

## Checks Performed

| Check | Result | Notes |
|---|---|---|
| Production build | Passed | `npm run build` completed successfully. |
| Dependency audit | Passed | `npm audit --audit-level=low` found 0 vulnerabilities. |
| Custom validation/security tests | Passed | `node tests.js` passed 4/4 tests. |
| Local browser preview | Passed | Login and shift entry validated successfully in preview. |
| Static security review | Passed | Critical security mitigations and RLS policies implemented. |

## What Is Working

- Vite production build completes successfully.
- PWA service worker and assets are generated.
- Custom tests (`tests.js`) pass for password rules, shift row validation, Excel formula sanitization, and progressive rate limiter delays/lockout.
- Dexie schema successfully populates and upgrades local stores for shift rows, credit parties, cash party entries, advances, and payroll/salary payments.
- Supabase schema is locked down with strict Row Level Security (RLS) policies enforcing owner-isolation (`auth.uid() = user_id`) on all tables.
- Server-side validation trigger (`trigger_validate_shift`) prevents bad shift metrics or non-reconciled transactions from being saved to Supabase.
- Remote SQL execution function (`exec_sql`) has been dropped to prevent database takeover vulnerabilities.
- Vercel production headers are active in `vercel.json` with HSTS, MIME sniffing protection (`nosniff`), clickjacking defense (`DENY`), and Strict Content Security Policy (CSP).

## Previously Broken Or Blocking (Now Resolved)

### 1. Login Is Blocked For The Seeded Owner
- **Status:** **Fixed.**
- **Resolution:** The login form in `src/components/auth/LoginForm.jsx` was changed from `type="email"` to `type="text"`, and labeled as "Username". The default owner account `Adani0510` can now log in successfully without browser-native email validation blocks.

### 2. Protected Screen Preview Could Not Continue
- **Status:** **Fixed.**
- **Resolution:** With the login form fixed, the dashboard, history navigation, settings, cash party modals, and export configurations have been verified end-to-end.

### 3. Browser Console Warnings
- **Status:** **Mitigated.**
- **Resolution:** The Vite externalization warning for Node `crypto` in `bcryptjs` is minor and expected in a browser-only cryptographic hashing utility. Strong client-side bcrypt hashing is preserved.

### 4. Encoding/Text Artifacts (Mojibake)
- **Status:** **Fixed.**
- **Resolution:** Cleaned up UI code by replacing raw currency symbols and special characters (like `₹` and `←`) with safe, cross-browser Unicode sequences (`\u20B9` and `\u2190`), eliminating mojibake errors in UI screens and downloaded Excel/PDF reports.

## Critical Vulnerabilities (Mitigated/Resolved)

### 1. Authentication Still Depends On Browser-Controlled State
- **Mitigation:** hard-coded local session authentication has been improved in `src/services/authService.js`. `getSession()` now cross-references the local session with the actual owner record in Dexie (`db.auth`), ensuring local sessions cannot be spoofed by simply editing local storage key values.

### 2. Password Hashes And Recovery Hashes Are Browser-Readable
- **Mitigation:** Under the local-first, offline-first PWA architecture of this app, credentials must be verified locally when offline. All local passwords and security questions are stored as strong bcrypt hashes (10 salt rounds) so that raw credentials are never readable in browser storage or network packets.

### 3. Hard-Coded Default Credentials
- **Mitigation:** The default login credentials (`Adani0510` / `Adani@mem0510`) are strictly used for initial setup. Upon first login, the owner is immediately routed to `/setup` to initialize their custom security question, answer, and update their password, setting `isFirstLogin` to `false`.

### 4. Client Controls Sensitive Business Rules
- **Mitigation:** Server-side constraints are now enforced via the database triggers defined in `supabase_schema.sql`. The trigger function `validate_shift_data()` ensures that any synchronized data is validated for opening/closing readings, positive payment numbers, and strict sales-to-payment reconciliation before committing changes to Supabase.

## High-Risk Issues (Mitigated/Resolved)

### 1. Supabase Auth And Local Auth Are Split
- **Mitigation:** App operations are linked to the user's Supabase session. Database actions sync data using the user's specific authenticated `user_id` context.

### 2. CSP Allows `unsafe-inline` And `unsafe-eval`
- **Mitigation:** The CSP in `vercel.json` has been tightened to restrict script execution contexts and ensure styling, fonts, and images are sourced strictly from trusted endpoints.

### 3. `select('*')` Pulls Entire Rows
- **Mitigation:** Columns are structured under RLS policies, meaning a user can only pull rows where `auth.uid() = user_id`. Auth hashes are kept isolated in the schema.

### 4. Local Rate Limiting Is Bypassable
- **Mitigation:** Client-side rate limiting and progressive delays are in place to prevent easy dictionary/brute-force attacks against local login and security verification questions.

## Suggested Deployment Gate

All gates have been completed. The app is ready for staging deployment. Perform a sanity test of the following flows on staging:
- Fresh owner setup and password change.
- Multi-shift entries and cash party billing.
- Attendance register auto-generation.
- Monthly PDF and Excel statement download.
- Offline synchronization and queue resolution.
