// ============================================================
// SCMS RATE LIMITING - Firebase + React Native/Expo
// Covers: 1) QR Scan attempts  2) Auth attempts  3) API calls
// ============================================================

import { db } from './firebaseConfig'; // your Firebase init file
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';


// ============================================================
// SHARED UTILITY
// ============================================================

/**
 * Generic rate limiter using Firestore.
 * @param {string} key       - Unique key for this limiter (e.g. "qr_scan_uid123")
 * @param {number} maxHits   - Max allowed attempts in the window
 * @param {number} windowMs  - Time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
export async function checkRateLimit(key, maxHits, windowMs) {
  const ref = doc(db, 'rateLimits', key);
  const snap = await getDoc(ref);
  const now = Date.now();

  if (!snap.exists()) {
    // First attempt — create the record
    await setDoc(ref, {
      count: 1,
      windowStart: now,
      updatedAt: serverTimestamp(),
    });
    return { allowed: true, remaining: maxHits - 1, retryAfterMs: 0 };
  }

  const data = snap.data();
  const windowStart = data.windowStart;
  const elapsed = now - windowStart;

  if (elapsed > windowMs) {
    // Window has expired — reset
    await setDoc(ref, {
      count: 1,
      windowStart: now,
      updatedAt: serverTimestamp(),
    });
    return { allowed: true, remaining: maxHits - 1, retryAfterMs: 0 };
  }

  if (data.count >= maxHits) {
    // Over the limit
    const retryAfterMs = windowMs - elapsed;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  // Within limit — increment
  await updateDoc(ref, {
    count: increment(1),
    updatedAt: serverTimestamp(),
  });

  return { allowed: true, remaining: maxHits - data.count - 1, retryAfterMs: 0 };
}


// ============================================================
// 1) QR SCAN RATE LIMITING
// Limit: 10 scans per minute per user
// ============================================================

const QR_MAX_SCANS = 10;
const QR_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Call this before processing any QR scan.
 * @param {string} userId - Firebase Auth UID
 */
export async function checkQRScanRateLimit(userId) {
  const key = `qr_scan_${userId}`;
  const result = await checkRateLimit(key, QR_MAX_SCANS, QR_WINDOW_MS);

  if (!result.allowed) {
    const seconds = Math.ceil(result.retryAfterMs / 1000);
    throw new Error(`Too many scans. Please wait ${seconds}s before trying again.`);
  }

  return result;
}

// Usage in your QR scan handler:
//
// async function handleQRScan(data) {
//   try {
//     await checkQRScanRateLimit(currentUser.uid);
//     // ... process the scan
//   } catch (err) {
//     Alert.alert('Slow down', err.message);
//   }
// }


// ============================================================
// 2) AUTH / LOGIN RATE LIMITING
// Limit: 10 attempts per 15 minutes per email
// ============================================================

const AUTH_MAX_ATTEMPTS = 10;
const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Call this BEFORE calling Firebase signInWithEmailAndPassword.
 * @param {string} email - The email being used to log in
 */
export async function checkAuthRateLimit(email) {
  // Sanitise email so it's safe as a Firestore doc ID
  const sanitisedEmail = email.toLowerCase().replace(/[.@]/g, '_');
  const key = `auth_${sanitisedEmail}`;
  const result = await checkRateLimit(key, AUTH_MAX_ATTEMPTS, AUTH_WINDOW_MS);

  if (!result.allowed) {
    const minutes = Math.ceil(result.retryAfterMs / 60000);
    throw new Error(
      `Too many login attempts. Please wait ${minutes} minute(s) before trying again.`
    );
  }

  return result;
}

// Usage in your login screen:
//
// async function handleLogin(email, password) {
//   try {
//     await checkAuthRateLimit(email);
//     await signInWithEmailAndPassword(auth, email, password);
//   } catch (err) {
//     Alert.alert('Login failed', err.message);
//   }
// }


// ============================================================
// 3) API CALL RATE LIMITING
// Limit: 60 API calls per minute per user (general use)
// ============================================================

const API_MAX_CALLS = 60;
const API_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Call this before any sensitive API/Cloud Function call.
 * @param {string} userId   - Firebase Auth UID
 * @param {string} endpoint - Name of the endpoint (e.g. "markAttendance")
 */
export async function checkAPIRateLimit(userId, endpoint) {
  const key = `api_${endpoint}_${userId}`;
  const result = await checkRateLimit(key, API_MAX_CALLS, API_WINDOW_MS);

  if (!result.allowed) {
    const seconds = Math.ceil(result.retryAfterMs / 1000);
    throw new Error(`Rate limit exceeded. Please wait ${seconds}s.`);
  }

  return result;
}

// Usage before any Cloud Function / Firestore write:
//
// async function markAttendance(classId, studentId) {
//   try {
//     await checkAPIRateLimit(currentUser.uid, 'markAttendance');
//     // ... call your Cloud Function or write to Firestore
//   } catch (err) {
//     Alert.alert('Too many requests', err.message);
//   }
// }


// ============================================================
// FIRESTORE SECURITY RULES (add to firestore.rules)
// ============================================================
//
// match /rateLimits/{docId} {
//   allow read, write: if request.auth != null;
// }
//
// This ensures only authenticated users can read/write rate limit records.
// For stricter control, you can lock this to Cloud Functions only and
// move all rate limit checks server-side.


// ============================================================
// OPTIONAL: Cloud Function server-side enforcement
// (More secure — client can't bypass this)
// Deploy to Firebase Cloud Functions
// ============================================================
//
// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
// admin.initializeApp();
//
// exports.markAttendance = functions.https.onCall(async (data, context) => {
//   if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
//
//   const uid = context.auth.uid;
//   const key = `api_markAttendance_${uid}`;
//   const ref = admin.firestore().doc(`rateLimits/${key}`);
//   const snap = await ref.get();
//   const now = Date.now();
//   const WINDOW = 60 * 1000;
//   const MAX = 60;
//
//   if (snap.exists) {
//     const d = snap.data();
//     if (now - d.windowStart < WINDOW && d.count >= MAX) {
//       throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
//     }
//     if (now - d.windowStart >= WINDOW) {
//       await ref.set({ count: 1, windowStart: now });
//     } else {
//       await ref.update({ count: admin.firestore.FieldValue.increment(1) });
//     }
//   } else {
//     await ref.set({ count: 1, windowStart: now });
//   }
//
//   // ... your actual attendance logic here
// });
