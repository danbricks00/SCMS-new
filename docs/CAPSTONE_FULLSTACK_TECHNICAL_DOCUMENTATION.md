# School Class Management System (SCMS)
## Full-Stack Technical Documentation Packet — Capstone Showcase Report

**Document classification:** Technical architecture, security, and operational API reference  
**Primary deployment target:** Vercel (Production)  
**Application framework:** Expo Router 6 (React Native / React Native Web) with static export  
**Data and identity plane:** Google Firebase (Authentication + Cloud Firestore)  
**Document version:** 1.0 — aligned to repository `SCMS-new`

---

## Executive Summary

The School Class Management System is a cross-platform school operations application deployed on Vercel’s global edge network. The codebase uses **Expo Router** for file-based routing and static site generation, which is architecturally comparable to Next.js App Router conventions (thin route files, co-located layouts, server-adjacent API handlers under `/api`). Business logic for authentication, entity management, and attendance is implemented primarily through the **Firebase client SDK** and a typed service layer (`src/services/`), while **one Vercel Serverless Function** (`api/pdf-from-html.js`) provides a backend-for-frontend (BFF) endpoint for secure PDF generation.

This document is structured for direct export into academic or industry handover reports. It describes real implementation paths, configuration files, and contracts—without abbreviated placeholders.

---

## 1. System Architecture and Vercel Deployment Optimization

### 1.1 Architectural overview

SCMS follows a **Jamstack-oriented, serverless-adjacent** pattern:

| Tier | Technology | Responsibility |
|------|------------|----------------|
| Presentation | Expo Router (`app/`), React Native Web | Role-specific portals, QR UI, responsive layouts |
| Application services | `src/services/database.js`, `src/services/appUsersAuth.js` | Firestore CRUD, attendance, user lifecycle |
| Identity | Firebase Authentication + `users` Firestore profiles | Credential verification, session hydration |
| Edge hosting | Vercel static output (`dist/`) | CDN delivery, SPA routing, immutable asset caching |
| Serverless compute | `api/pdf-from-html.js` | HTML-to-PDF proxy with secret isolation |
| Persistence rules | `firestore.rules` | Collection-level read/write policy (database boundary) |

The repository does **not** use the Next.js `pages/` or `app/` directory from the Next.js framework itself. Instead, it uses **Expo Router’s `app/` directory**, which provides the same *conceptual* separation: routes are files, layouts compose navigation stacks, and API handlers live under `/api` per Vercel’s universal serverless convention.

### 1.2 File-based routing and rendering model

**Entry and layout**

- `app/_layout.tsx` wraps the application in `AuthProvider` and React Navigation `ThemeProvider`, registering stack screens for `login`, `landing`, `admin`, `teacher`, `student`, `parent`, `nfc-kiosk`, nested `reports/*`, and modal routes.
- `app/index.js` performs a client-only redirect to `/landing` after hydration, avoiding static render mismatches on web.

**Route-to-screen mapping (thin controller pattern)**

Each route file imports exactly one screen module from `src/screens/`, preserving a clean boundary between navigation identifiers and business logic:

| Route file | Screen module | Primary actors |
|------------|---------------|----------------|
| `app/admin.js` | `AdminPortal.js` | Administrators |
| `app/teacher.js` | `TeacherPortal.js` | Teachers |
| `app/student.js` | `StudentPortal.js` | Students |
| `app/parent.js` | `ParentPortal.js` | Parents |
| `app/login.js` | `LoginPage.js` | Unauthenticated users |
| `app/reports/attendance.js` | `AttendanceReportPage.js` | Administrators |
| `app/nfc-kiosk.tsx` | NFC kiosk flow | Experimental hardware attendance |

**Static export (production rendering)**

Production web builds execute:

```text
npm run build
  → cross-env NODE_ENV=production expo export --platform web --output-dir dist
```

Expo’s static renderer pre-generates HTML for configured routes. The resulting artifact is a **static single-page application (SPA)** with hashed assets under `dist/_expo/` and `dist/assets/`. Dynamic behaviour (authentication state, Firestore subscriptions, camera scanning) executes **client-side after hydration**, which is the standard model for Firebase-backed Expo web deployments on Vercel.

This differs from Next.js **Server Components** or **SSR per request**, but achieves equivalent operational goals for SCMS: fast global delivery, minimal server compute cost, and predictable CDN cache behaviour.

### 1.3 Vercel serverless API routing

Vercel automatically maps files in `/api` to HTTP endpoints. SCMS defines:

| File | Deployed URL | Runtime |
|------|--------------|---------|
| `api/pdf-from-html.js` | `POST /api/pdf-from-html` | Node.js serverless function |

The client invokes this route from `src/utils/pdfFromHtml.js` using same-origin `fetch`, which avoids cross-origin complexity and keeps third-party API keys off the browser.

**Handler behaviour summary**

1. Rejects non-`POST` methods with HTTP 405.
2. Answers `OPTIONS` with HTTP 204 for CORS preflight compatibility.
3. Validates `API2PDF_API_KEY` from `process.env` (injected in Vercel console only).
4. Parses JSON body, requires non-empty `html` string.
5. Proxies to `https://v2.api2pdf.com/chrome/pdf/html` with server-side `Authorization` header.
6. Returns `{ fileUrl, FileUrl }` on success; structured error JSON on failure (400, 502, 503, 500).

There is **no** `middleware.ts` file in this repository. Request validation for the PDF route occurs **inside the serverless handler** at invocation time, which is the Vercel-native equivalent of route-level middleware for that single endpoint.

### 1.4 Vercel configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [ /* SPA fallback to /index.html */ ],
  "headers": [ /* Cache-Control: immutable for /assets, /static, /_expo */ ]
}
```

**Deployment optimisation choices**

1. **Immutable long-cache headers** on versioned static bundles reduce repeat download cost and improve Lighthouse performance scores on returning visits.
2. **SPA rewrite rule** `{ "source": "/(.*)", "destination": "/index.html" }` ensures deep links (e.g. `/teacher`, `/admin`) resolve correctly after static export—critical for teacher bookmarking and admin report URLs.
3. **Build isolation**: `NODE_ENV=production` and Expo Router env vars (`EXPO_ROUTER_APP_ROOT`, `EXPO_ROUTER_IMPORT_MODE`) are set in `package.json` scripts, producing deterministic CI output.

### 1.5 Hosting on Vercel: rationale and operational advantages

**Edge network and CDN**

Vercel serves the `dist/` artifact from geographically distributed edge caches. For a school attendance product used on mobile devices during class changeover, low-latency initial load and cached static chunks materially improve perceived responsiveness.

**CI/CD pipeline automation**

Connecting the GitHub repository to a Vercel project yields:

- Automatic preview deployments per branch or pull request.
- Production promotion on merge to the configured production branch.
- Build logs, runtime logs (Pro tier), and deployment rollback from the Vercel dashboard.

A supplementary workflow exists at `.github/workflows/deploy.yml` for **GitHub Pages** (Ubuntu runner, `npm ci`, `npm run build`, artifact upload). Production operations for SCMS are centred on **Vercel**; GitHub Actions provides an alternate static host path documented in `DEPLOYMENT_GUIDE.md`.

**Performance and cost profile**

- Static export minimises serverless invocation charges for page views.
- Serverless invocations are limited to PDF generation, concentrating paid compute on an infrequent admin/print workflow.
- Firebase Firestore handles transactional writes with horizontal scale independent of Vercel function concurrency.

**Environment variable injection**

Firebase public configuration (`EXPO_PUBLIC_FIREBASE_*`) and server secrets (`API2PDF_API_KEY`) are supplied **only** through Vercel Project → Settings → Environment Variables at build and runtime. Local `.env` files are gitignored (`.gitignore` lines 33–38) to maintain a zero-trust developer machine boundary.

### 1.6 Modular codebase layout (clean architecture metrics)

```
app/                    → Routes (navigation shell)
src/screens/            → Portal orchestration
src/components/         → Reusable UI (QRScanner, QRCodeGenerator, ProtectedRoute)
src/contexts/           → AuthContext (session state)
src/services/           → database.js, appUsersAuth.js
src/utils/              → qrCodeUtils.js, pdfFromHtml.js, fraudDetection.js
api/                    → Vercel serverless handlers
firestore.rules         → Database security policy
vercel.json             → Hosting and cache policy
```

Cross-cutting concerns (fraud detection, NZ timezone formatting, responsive layout) are isolated in `src/utils/` and `src/hooks/`, keeping portal screens focused on user workflow rather than infrastructure.

---

## 2. Zero-Trust Security Boundary and RBAC Infrastructure

### 2.1 Security model in context

SCMS implements **defence in depth** across four layers:

1. **Client session and UI gatekeeping** — `AuthContext` + `ProtectedRoute`
2. **Firebase Authentication** — email/password credentials, UID-anchored identity
3. **Firestore profile binding** — `users/{docId}` role and linkage metadata
4. **Serverless secret boundary** — PDF API key never exposed to the browser

Because the web client uses the Firebase SDK directly, there is **no custom JWT-validating Express middleware** in this repository. Authorization for data mutations is intended to be enforced by **Firestore Security Rules** at the database boundary. The current `firestore.rules` file documents a **development/demo posture** (`allow read, write: if true` on operational collections) with an explicit comment that production must migrate to `request.auth` and custom claims. The RBAC described below is therefore **structurally implemented in the application layer today**, with the database rules staged for hardening.

### 2.2 Role definitions and allowed portal surfaces

Roles are enumerated in `src/services/appUsersAuth.js`:

```javascript
const ALLOWED_ROLES = ['admin', 'teacher', 'student', 'parent'];
```

| Role | Portal route | `ProtectedRoute` guard | Primary capabilities |
|------|--------------|------------------------|----------------------|
| `admin` | `/admin` | `requiredRole="admin"` | Student/teacher/class CRUD, QR issuance, reports, announcements, absence adjudication |
| `teacher` | `/teacher` | `requiredRole="teacher"` | QR scanning, attendance marking, class session control, class history |
| `student` | `/student` | `requiredRole="student"` | View own QR identity, attendance history, class schedule |
| `parent` | `/parent` | `requiredRole="parent"` | Linked-child visibility, absence requests, notifications |

Additional admin-only report routes (`AttendanceReportPage`, `StudentReportPage`, `CustomReportPage`, `ReportsPage`, `EventReportPage`) each wrap content in `<ProtectedRoute requiredRole="admin">`.

`UpdatesPage.js` accepts a dynamic `userRole` prop, allowing authenticated users to see role-appropriate system updates while still requiring authentication.

### 2.3 RBAC middleware: `ProtectedRoute` component

`src/components/ProtectedRoute.js` functions as the **client-side authorization middleware** for routed screens. Execution flow:

1. Subscribe to `useAuth()` for `user`, `loading`, `isAuthenticated()`, and `hasRole(role)`.
2. While `loading === true`, render a blocking loading indicator (prevents flash of protected content).
3. If not authenticated, `router.replace('/login')` and render `null`.
4. If `requiredRole` is set and `user.role !== requiredRole`, redirect to the user’s **home portal** via the map `{ admin: '/admin', teacher: '/teacher', student: '/student', parent: '/parent' }` rather than exposing forbidden UI.
5. Only when checks pass does the component render `children`.

This pattern prevents horizontal privilege escalation at the UI layer (e.g. a student cannot mount `TeacherPortal` even by manually navigating to `/teacher`).

### 2.4 Authentication and session validation

**Sign-in contract (`loginWithAppUser`)**

Located in `src/services/appUsersAuth.js`, the login pipeline:

1. Accepts **school email** (contains `@`) or **account identifier** (profile code, `U_*` document id, username fields).
2. Resolves identifier to one or more Firebase Auth emails via Firestore `users` collection lookups (`buildUserDocIdCandidates`, field queries on `username`, `profileId`, `studentId`, etc.).
3. Calls `signInWithEmailAndPassword(auth, email, password)` — Firebase validates credentials and issues an ID token managed by the SDK.
4. Loads `users/{uid}` (or fallback query on `firebaseUid`) and maps to a session via `mapFirestoreUserToSession`.
5. Rejects login if no profile exists (signs out Firebase to avoid orphan auth state).
6. For parents, `hydrateParentLinkedStudents` merges `linkedStudentId` / `linkedStudentIds` from `parents` collection documents.

**Session object shape (post-login)**

```json
{
  "username": "string",
  "role": "admin | teacher | student | parent",
  "name": "string",
  "profileId": "string",
  "email": "string",
  "class": "string",
  "studentId": "string",
  "linkedStudentIds": ["string"],
  "linkedStudentId": "string",
  "firebaseUid": "string"
}
```

**Persistence (`AuthContext`)**

- When Firebase is configured: `onAuthStateChanged` rehydrates session from Firestore on each page load; Firebase ID token refresh is handled by the SDK.
- Fallback mode (Firebase unavailable): `sessionStorage.getItem('user')` stores JSON session — suitable only for offline demos, not production.
- `logout()` calls `firebaseSignOut`, clears session storage, and navigates to `/landing`.

**Token validation semantics**

Firebase ID tokens are validated by Google’s Auth service on each SDK operation. The application does not implement custom HMAC session cookies. Firestore reads/writes made through `src/config/firebase.js` attach the current user’s credentials when rules require `request.auth`.

### 2.5 Preventing unauthorized database transactions

**Application-layer controls**

- `hasRole()` gates UI and redirect logic before destructive controls render.
- `DatabaseService.recordAttendance` runs `comprehensiveFraudCheck` for `type === 'login'` unless `skipFraudCheck` or demo bypass IDs apply—blocking duplicate scans, velocity abuse, and optional IP/geo checks before `addDoc(collection(db, 'attendance'), ...)`.
- `logFraudAttempt` writes audit records when fraud blocks a scan.
- Admin account creation uses a **secondary Firebase App instance** (`createManagedAppUserAccount`) so creating a user does not terminate the administrator’s active session.

**Database-layer controls (`firestore.rules`)**

- Explicit `match` blocks for `attendance`, `students`, `classes`, `users`, `parents`, `teachers`, `admins`, `announcements`, `events`, `absenceRequests`, `activityLog`, `enrolments`.
- Default deny: `match /{document=**} { allow read, write: if false; }` for undeclared paths.

**Serverless-layer controls (`/api/pdf-from-html`)**

- No authentication header is currently required on the PDF route; security relies on same-origin deployment and the absence of the API2PDF key in client code. Production hardening may add session verification or signed short-lived tokens before accepting HTML payloads.

**Edge/middleware note**

Vercel does not run Next.js Middleware in this project. The effective “edge boundary” is the combination of **static hosting** (no server-side page secrets), **single-purpose serverless validation**, and **Firestore rules** intended for production hardening.

### 2.6 Zero-trust environment isolation (operations)

| Asset | Storage location | Rationale |
|-------|------------------|-----------|
| `EXPO_PUBLIC_FIREBASE_*` | Vercel env (build-time embed) | Public Firebase web config; still not committed in repo |
| `API2PDF_API_KEY` | Vercel env (runtime serverless only) | True secret; never `EXPO_PUBLIC_` prefixed |
| Developer laptops | No `.env` with production values | `.gitignore` blocks accidental commit |
| QR encryption key | `QRCodeUtils.SECRET_KEY` in source (demo) | Production should move to env-managed secret |

---

## 3. Core Technical API Documentation (Reference “Cheat Sheet”)

This section documents **all HTTP API routes** deployed by the project, followed by **application service contracts** that implement authentication, entity management, and attendance—because those operations use the Firebase SDK rather than REST handlers.

---

### 3.1 HTTP API routes (Vercel Serverless)

#### 3.1.1 Generate PDF from HTML

| Attribute | Value |
|-----------|-------|
| **HTTP method** | `POST` |
| **Route** | `/api/pdf-from-html` |
| **Full URL (production)** | `https://<your-vercel-domain>/api/pdf-from-html` |
| **Implementation** | `api/pdf-from-html.js` |
| **Authentication** | None (same-origin client call; secret is server-side API2PDF key) |

**Description**

Accepts an HTML document string, forwards it to API2PDF’s Chrome HTML renderer, and returns a temporary URL to the generated PDF. Used by `QRCodeGenerator` and related print flows on web when `canUseServerPdf()` is true (`Platform.OS === 'web'` and `window.location.origin` is defined).

**Request headers**

| Header | Required | Value |
|--------|----------|-------|
| `Content-Type` | Yes | `application/json` |

**Request body (JSON)**

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `html` | `string` | Yes | Full HTML document to render (includes inline CSS for QR cards) |

**Example request body**

```json
{
  "html": "<!DOCTYPE html><html><head><meta charset=\"utf-8\">...</head><body>...</body></html>"
}
```

**Success response — HTTP 200**

```json
{
  "fileUrl": "https://storage.api2pdf.com/.../output.pdf",
  "FileUrl": "https://storage.api2pdf.com/.../output.pdf"
}
```

**Error responses**

| HTTP status | Body shape | Cause |
|-------------|------------|-------|
| 400 | `{ "error": "Invalid JSON body" }` | Malformed JSON |
| 400 | `{ "error": "Missing html" }` | Empty or absent `html` field |
| 405 | `{ "error": "Method not allowed" }` | Non-POST request |
| 503 | `{ "error": "PDF service not configured", "hint": "..." }` | Missing `API2PDF_API_KEY` |
| 502 | `{ "error": "API2PDF request failed", "status": number, "details": object }` | Upstream failure |
| 500 | `{ "error": "PDF generation failed", "message": string }` | Unhandled exception |

**CORS**

`OPTIONS` returns HTTP 204 with empty body for preflight support.

---

#### 3.1.2 PDF route — client invocation helper

| Attribute | Value |
|-----------|-------|
| **Consumer** | `generatePdfUrlFromHtml(html)` in `src/utils/pdfFromHtml.js` |
| **Method** | `POST` (via `fetch`) |
| **Fallback** | `openPrintDialogWithHtml(html)` opens a new window and calls `window.print()` if API unavailable |

---

### 3.2 Application authentication contract (Firebase — not HTTP)

These operations are invoked from `LoginPage.js` and `AuthContext.js`. They are documented here because capstone evaluators expect authentication “endpoints”; in SCMS they are **SDK service calls**.

#### 3.2.1 User sign-in

| Attribute | Value |
|-----------|-------|
| **Service function** | `loginWithAppUser(identifierInput, passwordInput)` |
| **Module** | `src/services/appUsersAuth.js` |
| **Underlying protocol** | Firebase Authentication `signInWithEmailAndPassword` |
| **Transport** | HTTPS to Firebase Auth endpoints (Google SDK) |

**Input parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identifierInput` | `string` | Yes | School email **or** account id / profile code (e.g. `AC0611`, `U_AC0611`) |
| `passwordInput` | `string` | Yes | User password |

**Successful return value (session object)**

Same shape as Section 2.4 session object. Caller passes this to `AuthContext.login(userData)` and routes by `role`:

| Role | Default redirect |
|------|------------------|
| `admin` | `/admin` |
| `teacher` | `/teacher` |
| `student` | `/student` |
| `parent` | `/parent` |

**Failure behaviour**

Throws `Error` with user-facing message (invalid credentials, missing profile, Firebase misconfiguration). Does not return partial session data.

**Example error messages**

- `"That account id or password is incorrect."`
- `"No account matched that user id or profile code..."`
- `"Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_* in your environment."`

---

#### 3.2.2 Session hydration (automatic on load)

| Attribute | Value |
|-----------|-------|
| **Service function** | `fetchUserSessionForUid(uid)` |
| **Trigger** | `onAuthStateChanged` in `AuthContext` |
| **Firestore reads** | `users/{uid}`; fallback query `where('firebaseUid', '==', uid)` |

**Return**

Session object or `null` if no valid role document exists.

---

#### 3.2.3 User sign-out

| Attribute | Value |
|-----------|-------|
| **Context method** | `logout()` in `AuthContext` |
| **Firebase call** | `firebaseSignOut(auth)` |
| **Client cleanup** | `sessionStorage.removeItem('user')` |
| **Navigation** | `router.replace('/landing')` |

---

#### 3.2.4 Managed account creation (admin workflow)

| Attribute | Value |
|-----------|-------|
| **Service function** | `createManagedAppUserAccount({ email, password, role, name, username, profileId, studentId, className, linkedStudentId, linkedStudentIds, extraProfileData })` |
| **Firestore write** | `setDoc(doc(db, 'users', 'U_<PROFILEID>'), basePayload, { merge: true })` |
| **Auth write** | Secondary Firebase App + `createUserWithEmailAndPassword` |

**Required payload keys**

| Key | Type | Required |
|-----|------|----------|
| `email` | `string` | Yes |
| `password` | `string` | Yes |
| `role` | `admin \| teacher \| student \| parent` | Yes |
| `profileId` | `string` | Yes |
| `name` | `string` | No |
| `username` | `string` | No |
| `studentId` | `string` | No |
| `className` | `string` | No |
| `linkedStudentId` | `string` | No (parents) |
| `linkedStudentIds` | `string[]` | No (parents) |

**Success response**

```json
{
  "uid": "<firebase-auth-uid>",
  "userAliasDocId": "U_<NORMALIZED_PROFILE_ID>"
}
```

---

### 3.3 Entity management contracts (Firestore service layer)

Operations are static methods on `DatabaseService` (`src/services/database.js`). Firestore collection names constitute the persistence API.

#### 3.3.1 Create student

| Attribute | Value |
|-----------|-------|
| **Service function** | `DatabaseService.addStudent(studentData)` |
| **Firestore** | `setDoc(doc(db, 'students', studentDocId), studentData, { merge: true })` |
| **Collection** | `students` |
| **Typical caller** | `AdminPortal.js` student creation form |

**Required / generated input keys**

| Key | Type | Notes |
|-----|------|-------|
| `firstName` | `string` | Used for ID generation |
| `lastName` | `string` | Used for ID generation |
| `class` | `string` | Normalized; drives `classId` |
| `dob` | `string` | `YYYY-MM-DD` preferred for deterministic `studentId` |
| `studentId` | `string` | Optional; auto-generated via `QRCodeUtils.generateStudentId` if omitted |
| `name` | `string` | Optional display name |
| `photo` | `string` | Optional URL for QR card |
| `parentContact` | `string` | Optional |
| `emergencyContact` | `string` | Optional |

**Side effects**

- Sets `qrCode` field to AES-encrypted payload from `QRCodeUtils.generateStudentQR(studentData)`.
- Writes `activityLog` entry `type: 'student_added'`.

**Success response**

Returns `studentDocId` (string)—the Firestore document id (uppercase normalized student id).

**Failure**

Throws on Firestore error; returns `null` if Firestore not configured.

---

#### 3.3.2 Update student

| Attribute | Value |
|-----------|-------|
| **Service function** | `DatabaseService.updateStudent(studentId, updateData)` |
| **Collection** | `students` |

**Input**

| Parameter | Type | Description |
|-----------|------|-------------|
| `studentId` | `string` | Document id |
| `updateData` | `object` | Partial fields to merge |

**Success**

Resolves when `updateDoc` completes (no structured return documented in source).

---

#### 3.3.3 Read students (representative query)

| Attribute | Value |
|-----------|-------|
| **Service function** | `DatabaseService.getAllStudents()` |
| **Collection** | `students` |
| **Success response** | `Array<{ id: string, ...studentFields }>` |

---

#### 3.3.4 Parent profile upsert

| Attribute | Value |
|-----------|-------|
| **Service function** | `DatabaseService.upsertParentProfile({ parentId, email, name, phone, linkedStudentId, linkedStudentIds })` |
| **Collection** | `parents` |

**Required keys**

| Key | Required |
|-----|----------|
| `email` | Yes (normalized lowercase) |

**Success response**

```json
{
  "docId": "string",
  "id": "string",
  "linkedStudentIds": ["STUDENT_ID"]
}
```

---

### 3.4 Attendance scanning and recording contracts

Attendance is a **multi-step client pipeline** rather than a single HTTP POST.

#### 3.4.1 Step 1 — QR scan and decryption (camera event)

| Attribute | Value |
|-----------|-------|
| **Component** | `QRScanner.js` → `handleBarCodeScanned` |
| **Input** | Raw QR string from `expo-camera` / `CameraView` |
| **Crypto** | `QRCodeUtils.decryptStudentQR(data)` (AES via `crypto-js`) |

**Decrypted payload structure (internal)**

```json
{
  "studentId": "string",
  "name": "string",
  "class": "string",
  "firestoreDocId": "string | null",
  "type": "student",
  "version": "2.0",
  "timestamp": "number (optional)"
}
```

**Callback to Teacher Portal (`onScan`)**

Success:

```json
{
  "result": "success",
  "studentData": { /* decrypted object */ },
  "timestamp": "ISO-8601 string"
}
```

Invalid:

```json
{
  "result": "invalid",
  "error": "Invalid QR code format",
  "timestamp": "ISO-8601 string"
}
```

Error:

```json
{
  "result": "error",
  "error": "string",
  "timestamp": "ISO-8601 string"
}
```

(`QR_SCAN_RESULTS` constants in `src/utils/qrCodeUtils.js`.)

---

#### 3.4.2 Step 2 — Teacher confirmation and attendance write

| Attribute | Value |
|-----------|-------|
| **Screen handler** | `TeacherPortal.handleMarkAttendance(studentData, type, status)` |
| **Service function** | `DatabaseService.recordAttendance(attendanceData, options)` |
| **Collection** | `attendance` (append via `addDoc`) |

**`attendanceData` payload keys**

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `studentId` | `string` | Yes | Uppercase canonical id |
| `studentName` | `string` | Yes | Display name |
| `studentDocId` | `string` | No | Firestore doc id from QR |
| `class` | `string` | Yes | Class identifier |
| `teacherId` | `string` | Yes | From session `profileId` or `username` |
| `teacherName` | `string` | Yes | From session `name` |
| `type` | `string` | Yes | `'login'` (check-in) or `'logout'` (check-out) |
| `status` | `string` | Yes | `'present'`, `'late'`, `'absent'`, `'checkout'`, `'left-early'` |
| `activity` | `string` | No | Defaults to class session label |
| `activityType` | `string` | No | Defaults to `'classroom'` |
| `scheduledStartTime` | `string` | No | HH:mm from session |
| `scheduledEndTime` | `string` | No | HH:mm from session |
| `location` | `string` | No | e.g. `'Classroom A'` |
| `notes` | `string` | No | Human-readable note |

**`options` parameter (second argument)**

| Key | Type | Description |
|-----|------|-------------|
| `skipFraudCheck` | `boolean` | Bypass fraud engine |
| `adminOverride` | `boolean` | Treat fraud as overridable |
| `currentLocation` | `object` | GPS for geo checks |
| `userIP` | `string` | IP allow-list checks |
| `allowedIPs` | `string[]` | Permitted addresses |
| `deviceInfo` | `object` | Logged on fraud block |

**Success response**

```json
{
  "success": true,
  "docId": "<firestore-attendance-document-id>",
  "fraudCheck": null,
  "message": "Attendance recorded successfully",
  "blocked": false
}
```

**Fraud-blocked response**

```json
{
  "success": false,
  "docId": null,
  "fraudCheck": { /* comprehensiveFraudCheck object */ },
  "message": "<formatted user message>",
  "blocked": true
}
```

**Firestore document written (representative fields)**

```json
{
  "studentId": "string",
  "studentName": "string",
  "class": "string",
  "teacherId": "string",
  "teacherName": "string",
  "type": "login | logout",
  "status": "present | late | absent | checkout | left-early",
  "activity": "string",
  "activityType": "string",
  "timestamp": "ISO-8601 UTC",
  "nztTimestamp": "string",
  "nztFormatted": "string",
  "nztTimezone": "NZST | NZDT",
  "nztIsDST": "boolean",
  "scheduledStartTime": "string | null",
  "scheduledEndTime": "string | null",
  "location": "string",
  "notes": "string",
  "fraudChecked": "boolean",
  "createdAt": "ISO-8601"
}
```

**Secondary effects on success**

- `activityLog` entry `type: 'attendance_marked'`.
- Updates `students/{id}.isCheckedIn`, `lastCheckedInAt`, or `lastCheckedOutAt` for daily class attendance scans.

---

#### 3.4.3 QR code generation (admin — display/print)

| Attribute | Value |
|-----------|-------|
| **Utility** | `QRCodeUtils.generateStudentQR(studentData, includeTimestamp)` |
| **Output** | AES-encrypted string embedded in QR image |
| **UI** | `QRCodeGenerator.js`, `SimpleQRCode.js` |
| **Print** | HTML template → `POST /api/pdf-from-html` or native `expo-print` |

---

### 3.5 Firestore collections reference (data plane)

| Collection | Primary operations | RBAC expectation (application) |
|------------|-------------------|------------------------------|
| `users` | Login profile, roles | All roles read own profile via session |
| `students` | CRUD, check-in flags | Admin write; teacher read; student read self |
| `attendance` | Append scan records | Teacher write; admin read reports |
| `classes` | Class metadata | Admin |
| `teachers` | Staff records | Admin |
| `parents` | Guardian linkage | Admin; parent read linked |
| `announcements` | School comms | Admin write; all read |
| `events` | Calendar | Admin write; all read |
| `absenceRequests` | Parent submit, admin approve | Parent write; admin adjudicate |
| `activityLog` | Audit trail | System write on major actions |

---

## Appendix A — Route map (Expo Router)

| Public path | Screen | Role guard |
|-------------|--------|------------|
| `/landing` | LandingPage | Public |
| `/login` | LoginPage | Public |
| `/signup` | SignUpPage | Public |
| `/admin` | AdminPortal | `admin` |
| `/teacher` | TeacherPortal | `teacher` |
| `/student` | StudentPortal | `student` |
| `/parent` | ParentPortal | `parent` |
| `/reports` | ReportsPage | `admin` |
| `/reports/attendance` | AttendanceReportPage | `admin` |
| `/nfc-kiosk` | NFC kiosk | Experimental |
| `/api/pdf-from-html` | Serverless | Server-only secret |

---

## Appendix B — Technology versions (from `package.json`)

| Package | Version |
|---------|---------|
| Expo SDK | ~54.0.10 |
| Expo Router | ~6.0.8 |
| React | 19.1.0 |
| React Native | 0.81.4 |
| Firebase JS SDK | ^12.3.0 |

---

## Appendix C — Production hardening checklist

1. Replace permissive `firestore.rules` with `request.auth != null` and role-based custom claims matching `users.role`.
2. Move `QRCodeUtils.SECRET_KEY` to a Vercel environment variable and rotate periodically.
3. Add authenticated middleware to `/api/pdf-from-html` (verify Firebase ID token server-side before PDF generation).
4. Enforce HTTPS-only and review Vercel deployment protection for preview URLs.
5. Remove demo `sessionStorage` auth fallback when Firebase is disabled.

---

*End of document — prepared for capstone full-stack technical showcase and Word processor export.*
