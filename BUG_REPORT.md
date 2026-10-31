# 🐛 GAMEVERSE — MASTER DEFECT & BUG AUDIT REPORT

**Audit Date:** October 31, 2026  
**Auditor:** Lead QA Automation & Security Audit Team  
**Policy Applied:** Discover → Reproduce → Document → Prioritize → Fix → Retest  

---

## Defect Summary Dashboard

| Bug ID | Severity | Category | Component | Status | Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | **P0 (Critical)** | Security | Auth / Admin API | **FIXED** | Forged cookie authorization removed; DB `is_admin` enforced |
| **BUG-002** | **P1 (High)** | Database / API | Wallet Service | **FIXED** | Separated relational query for PostgREST schema cache compatibility |
| **BUG-003** | **P1 (High)** | Data Integrity | In-Game Wallet | **FIXED** | Added guest/demo fallback regex to avoid PostgreSQL UUID cast crashes |
| **BUG-004** | **P1 (High)** | UI / State | Teen Patti Table | **FIXED** | Added defensive fallback for dealer in `localStorage` hydration |
| **BUG-005** | **P2 (Medium)** | UI / Search | Games Discovery | **FIXED** | Isolated Search query grid from static continue playing list |
| **BUG-006** | **P2 (Medium)** | Environment | DevOps / Test | **FIXED** | Aligned Playwright base URL host to avoid Windows port HMR conflicts |

---

## Detailed Bug Reports

### BUG-001: Insecure Unauthenticated Admin Session Cookie Privilege Escalation
- **Severity:** P0 (Critical - Security)
- **CWE:** CWE-287 (Improper Authentication), CWE-565 (Reliance on Cookies without Validation)
- **Affected Endpoints:**
  - `src/lib/supabase/middleware.ts`
  - `src/app/api/admin/chip-requests/route.ts`
  - `src/app/api/admin/review-request/route.ts`
- **Steps to Reproduce:**
  1. Open browser developer console or cURL.
  2. Set raw document cookie: `document.cookie = "gameverse_admin_session=true; path=/;"`
  3. Send an unauthenticated POST request to `/api/admin/review-request` with arbitrary `requestId` and `action: "approve"`.
- **Root Cause:**
  The server checked `request.cookies.get('gameverse_admin_session')?.value === 'true'` without any cryptographic HMAC signature or session verification against Supabase `auth.users`. Furthermore, `review-request` fell back to fetching `anyAdmin` from `profiles` to satisfy the audit column `reviewed_by`.
- **Remediation Applied:**
  - Removed master admin cookie bypass for production mode (`isSupabaseConfigured() === true`).
  - Required verified Supabase session user via `supabase.auth.getUser()`.
  - Enforced server-side database verification: `profiles.is_admin === true || profiles.role === 'admin'`.
  - Updated middleware to protect `/admin` routes.
- **Verification:** Unit tests and security audit suite confirmed unauthenticated and non-admin requests are rejected with 401/403.

---

### BUG-002: PostgREST Relational Join Error in `adminSearchPlayers()`
- **Severity:** P1 (High - Functionality)
- **Affected Component:** `src/lib/wallet/wallet-service.ts`
- **Steps to Reproduce:**
  1. Navigate to `/admin/chips`.
  2. Attempt to view the list of players to grant virtual chips.
  3. Observe empty list with no players rendered.
- **Root Cause:**
  The query used relational join syntax: `supabase.from('profiles').select('*, player_wallets(balance)')`. In the PostgreSQL database, `player_wallets.user_id` has a foreign key to `auth.users(id)`, not `public.profiles(id)`. PostgREST threw a schema cache relationship error, causing the catch block to return `[]`.
- **Remediation Applied:**
  Decoupled the queries:
  1. Query `profiles` for matching users.
  2. Query `player_wallets` for the specific IDs using `.in('user_id', userIds)`.
  3. Map and merge balances safely in TypeScript.
- **Verification:** Player lookup displays all matching accounts with live balances, and the "Grant Chips" modal opens reliably.

---

### BUG-003: PostgreSQL UUID Syntax Failure on Anonymous Chip Requests
- **Severity:** P1 (High - Exception Handling)
- **Affected Component:** `src/app/wallet/request-chips/page.tsx` & `src/lib/wallet/wallet-service.ts`
- **Steps to Reproduce:**
  1. Navigate to `/wallet/request-chips` without being signed in.
  2. Fill in 50,000 chips and submit request.
  3. Observe submission error and lack of success confirmation.
- **Root Cause:**
  When unauthenticated, the component defaulted `userId` to `'demo-player'`. The database column `chip_requests.requester_user_id` is of type `UUID REFERENCES auth.users(id)`. Attempting to insert a non-UUID string caused PostgreSQL error: `invalid input syntax for type uuid: "demo-player"`.
- **Remediation Applied:**
  Added UUID regex check `isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)`. When unauthenticated or using a demo ID, requests are routed to local demo persistence, preventing database exception crashes.
- **Verification:** Submitting a chip request as a guest or demo user completes with feedback `REQUEST SUBMITTED!`.

---

### BUG-004: Undefined Dealer State in Cached Teen Patti Tables
- **Severity:** P1 (High - Table UI)
- **Affected Component:** `src/components/teen-patti/DealerAvatar.tsx` & `table-manager.ts`
- **Steps to Reproduce:**
  1. Open a Teen Patti table previously cached in browser `localStorage` before dealer features were introduced.
  2. The table failed to render and remained permanently on the spinning loader.
- **Root Cause:**
  `table.dealer` was undefined in stale `localStorage` entries. When `DealerAvatar` attempted to destructure `dealer.message`, a JavaScript `TypeError` crashed the React component tree.
- **Remediation Applied:**
  1. Added defensive fallback in `DealerAvatar`:
     ```ts
     const safeDealer = dealer || {
       message: 'Welcome to the High Stakes GAMEVERSE Table! Take a seat to play.',
       emotion: 'idle',
       isMuted: false,
       animationsEnabled: true,
     };
     ```
  2. Added migration check in `getOrCreateTable()` to automatically inject default dealer state if missing in stored table JSON.
- **Verification:** Live table renders dealer Aria, voice toggle, sound controls, and table seats across all table states.

---

### BUG-005: Playwright Strict Mode Violation in Game Discovery Search
- **Severity:** P2 (Medium - UI / Test Stability)
- **Affected Component:** `src/app/games/page.tsx`
- **Steps to Reproduce:**
  1. Launch `/games`.
  2. Search for "snake".
  3. Observe that "Space Defender" in the Continue Playing carousel remained visible on screen while the main grid filtered to "Neon Snake".
- **Root Cause:**
  The `continuePlayingList` section did not check `!searchQuery && selectedCategory === 'all'` before rendering.
- **Remediation Applied:**
  Updated conditional rendering to hide the Continue Playing section while a search filter or category filter is active.
- **Verification:** Search filter strictly isolates matching games without duplicate card titles.

---

### BUG-006: Playwright Base URL Host Discrepancy
- **Severity:** P2 (Medium - DevOps / Testing)
- **Affected Component:** `playwright.config.ts`
- **Root Cause:**
  `baseURL` was hardcoded to `http://127.0.0.1:4000` while Next.js Turbopack dev server bound to `localhost:4000`. On Windows, this caused Turbopack HMR WebSocket handshakes to fail and delayed page hydration.
- **Remediation Applied:**
  Unified `baseURL` and `webServer.url` to `http://localhost:4000`.
- **Verification:** Playwright tests run with instant hydration and zero WebSocket handshake errors.
