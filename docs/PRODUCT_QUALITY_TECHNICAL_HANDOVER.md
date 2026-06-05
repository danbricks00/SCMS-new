# Product Quality and Technical Handover Dimension

**Project:** School Class Management System (SCMS)  
**Repository:** `SCMS-new`  
**Stack:** Expo Router (React Native Web) · Firebase · Vercel  
**Document purpose:** Capstone rubric — engineering quality, security isolation, and validated attendance UX

---

## 1. Architectural Clean Code Metrics

### 1.1 File-based routing and API surface

SCMS separates **thin route shells** from **domain implementation**, following Vercel/Next.js-style serverless conventions on the backend and Expo Router conventions on the frontend.

| Layer | Path | Responsibility |
|--------|------|----------------|
| App routes | `app/` | File-based Expo Router entries (`admin.js`, `teacher.js`, `student.js`, `parent.js`, `login.js`, `nfc-kiosk.tsx`, nested `app/reports/*`) |
| Root layout | `app/_layout.tsx` | Global `AuthProvider`, theme stack, role portals |
| Screens | `src/screens/` | Portal business logic (`AdminPortal.js`, `TeacherPortal.js`, `StudentPortal.js`, etc.) |
| Components | `src/components/` | Reusable UI (`QRCodeGenerator.js`, `QRScanner.js`, `ProtectedRoute.js`, `EventManager.js`) |
| Services | `src/services/` | Data and auth (`database.js`, `appUsersAuth.js`) |
| Utilities | `src/utils/` | Cross-cutting logic (`qrCodeUtils.js`, `pdfFromHtml.js`, `fraudDetection.js`) |
| Serverless API | `api/pdf-from-html.js` | Same-origin POST proxy; secrets never exposed to the client |

**Routing pattern:** Each `app/*.js` file imports a single screen module (e.g. `app/admin.js` → `src/screens/AdminPortal.js`), keeping navigation declarative and screens testable in isolation.

**API routing pattern:** Client code calls `/api/pdf-from-html` via `src/utils/pdfFromHtml.js`. The handler validates method/body, reads `process.env.API2PDF_API_KEY` only on the server, and returns a temporary PDF URL—mirroring the Next.js/Vercel “API route as BFF” model without embedding third-party keys in the static bundle.

### 1.2 Modular component layout

- **Role-gated access:** `src/components/ProtectedRoute.js` centralizes auth redirects by role (`admin`, `teacher`, `student`, `parent`).
- **Attendance domain:** QR generation (`QRCodeGenerator.js`), scanning (`QRScanner.js`), and shared encoding (`qrCodeUtils.js`) are decoupled from portal screens.
- **Responsive layout:** `src/hooks/useResponsiveLayout.js` and `src/components/ResponsiveScreen.js` support web and handset viewports from one codebase.
- **Platform adapters:** `src/nfc/nfcAdapter.web.ts` / `nfcAdapter.native.ts` isolate NFC kiosk behaviour by platform.

### 1.3 Production build discipline

| Item | Configuration |
|------|----------------|
| Build command | `npm run build` → `npm run build:web` (`package.json`) |
| Export | `expo export --platform web --output-dir dist` with `NODE_ENV=production` |
| Hosting | `vercel.json`: `buildCommand`, `outputDirectory: dist`, SPA rewrites, immutable asset caching |
| Lint | `npm run lint` (`expo lint`) |

**Deployment gate:** Production releases target a **zero-warning Vercel build**. Configuration drift (e.g. legacy `vercel.json` shapes) is corrected before merge so CI/deploy logs remain clean—required for repeatable handover and capstone evidence. Static routes are pre-rendered under `app/` (admin, teacher, student, parent, reports, login, NFC kiosk, etc.) for predictable CDN delivery.

---

## 2. Absolute Production Environment Isolation (Critical Security)

### 2.1 Zero local secrets policy

Team policy: **no `.env` files on developers’ physical machines.** Environment variables, database credentials, and Firebase/API secrets are **not** stored on laptops or workstations. This enforces a **zero-trust boundary** between local UI work and production data plane access.

Repository enforcement (`.gitignore`):

```
.env
.env*.local
.env.production
.env.development
.env.test
```

`.env.example` documents **placeholder names only**—never real keys—and is safe to commit as a schema reference.

### 2.2 Vercel-only secret injection

All runtime configuration is injected **dynamically and exclusively** in the **Vercel Production Console** (Project → Settings → Environment Variables):

| Variable class | Examples | Exposure |
|----------------|----------|----------|
| Client build-time (public prefix) | `EXPO_PUBLIC_FIREBASE_*` | Baked into web bundle at build; values set only in Vercel |
| Server-only | `API2PDF_API_KEY` | Read only in `api/pdf-from-html.js`; **not** prefixed with `EXPO_PUBLIC_` |

`src/config/firebase.js` reads `process.env.EXPO_PUBLIC_FIREBASE_*` and refuses initialization when placeholders are detected—preventing silent misconfiguration.

**PDF proxy:** `src/utils/pdfFromHtml.js` documents that `API2PDF_API_KEY` must remain on the server; the browser never receives the key.

### 2.3 Security outcomes

- No secrets in Git history for ignored env files.
- Cryptographic/API keys rotate in Vercel without redeploying developer machines.
- Firestore rules (`firestore.rules`) remain the authoritative data-access layer regardless of client build.

---

## 3. UI/UX Matrix and Hardware Attendance Validation

### 3.1 Defect: QR matrix failed contrast in system Dark Mode

**Symptom:** On web (Chrome/Safari, `prefers-color-scheme: dark`), SVG-based QR modules could render as **white-on-white**, failing optical contrast and breaking teacher/student scan workflows.

**Affected surfaces:** Student QR display/print (`SimpleQRCode.js`, `StudentPortal.js`), admin generator (`QRCodeGenerator.js`).

### 3.2 Engineering solution: light enclave + raster fallback

**Layer 1 — Solid white backing wrapper (ignore OS theme hooks)**

`src/components/SimpleQRCode.js` applies `QR_LIGHT_ENCLAVE` on web:

- `backgroundColor: '#FFFFFF'`
- `colorScheme: 'light'`
- `forcedColorAdjust: 'none'`

Wrapped in `styles.qrWrapper` (white padding, border) so the QR block is visually and logically isolated from app dark theme.

**Layer 2 — Global CSS guard**

`web/index.html` defines `.scms-qr-light` with `color-scheme: light !important`, `isolation: isolate`, and forced black/white SVG stroke/fill rules—documented as required because RN StyleSheet alone is insufficient on some Vercel-hosted builds.

**Layer 3 — Web raster path**

On web, `SimpleQRCode` generates a PNG data URL via the `qrcode` package with explicit `color: { dark: '#000000', light: '#ffffff' }`, avoiding unreliable SVG rendering under dark mode and hydration timing issues with `useColorScheme`.

**Admin generator:** `QRCodeGenerator.js` uses `qrCodeWrapper` with `backgroundColor: '#FFFFFF'` and explicit `QRCode` `color` / `backgroundColor` props for the same contrast guarantee.

### 3.3 UI/UX and device validation matrix

| Scenario | Device / viewport | Validation |
|----------|-------------------|------------|
| Teacher scan-in | iOS Safari, Android Chrome (physical handsets) | Camera permission, `QRScanner.js` mobile detection, haptic feedback |
| Admin QR issue | Desktop + tablet web | `AdminPortal.js` → `QRCodeGenerator` modal, print/PDF via server or dialog fallback |
| Student self-service QR | Mobile student portal | `StudentPortal.js` + `SimpleQRCode` contrast fix |
| Cross-device asset transfer | Phone → desktop | Screenshots/PDFs transferred via **LocalSend** (LAN, no cloud upload) to verify desktop report/print layout against real mobile captures |
| Wrong-platform guard | Desktop browser | Teacher flow shows platform guidance when camera scan is unavailable (`MOBILE_SCANNING_GUIDE.md`, `WEB_CAMERA_FIX.md`) |

**Hardware attendance path (validated):**

1. Admin generates encrypted student QR (`QRCodeUtils.generateStudentQR`).
2. Teacher opens Teacher Portal on **physical mobile** → scans via `QRScanner` / `expo-camera`.
3. Attendance states (present, late, absent, check-out, left-early) and fraud checks (`fraudDetection.js`) run server-side against Firestore.

**Documentation cross-reference:** `DEVICE_SUPPORT_GUIDE.md`, `TEST_ON_YOUR_IPHONE.md`, `MOBILE_SCANNING_GUIDE.md`, `QR_SYSTEM_DOCUMENTATION.md`.

---

## Handover checklist (for successors)

- [ ] Confirm Vercel Production env vars (`EXPO_PUBLIC_FIREBASE_*`, `API2PDF_API_KEY`) — never copy to local `.env`
- [ ] Run `npm run build` on release branch; confirm Vercel deploy log is warning-clean
- [ ] Smoke-test QR display in **system Dark Mode** on iOS and Android browsers
- [ ] End-to-end scan: Admin generate → Teacher scan → Firestore attendance record
- [ ] Review `firestore.rules` before any schema change

---

*Generated for SCMS capstone — Product Quality and Technical Handover Dimension.*
