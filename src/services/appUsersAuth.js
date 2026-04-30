import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';

const ALLOWED_ROLES = ['admin', 'teacher', 'student', 'parent'];

/** Demo "Parent" quick-fill: parent user linked to this student profile id (e.g. Avery / AC0611). */
const DEMO_PARENT_LINKED_STUDENT_PROFILE_ID = 'AC0611';

function asLoginToken(v) {
  if (v == null) return '';
  const s = String(v).trim();
  return s;
}

/**
 * Session fields used across the app (Auth UID matches Firestore `users` document id).
 */
export function mapFirestoreUserToSession(snap) {
  if (!snap.exists) return null;
  const data = snap.data() || {};
  const role = data.role;
  if (!ALLOWED_ROLES.includes(role)) return null;
  const docId = snap.id;

  const linkedChildId = asLoginToken(data.linkedStudentId);
  const dataStudentId = asLoginToken(data.studentId);
  const profileIdToken = asLoginToken(data.profileId);

  /** For parents, `studentId` must be the child's id (portal), not the parent's profileId. */
  let sessionStudentId;
  if (role === 'parent') {
    sessionStudentId = linkedChildId || dataStudentId || '';
  } else {
    sessionStudentId = dataStudentId || profileIdToken;
  }

  return {
    username: data.username || docId,
    role,
    name: data.name || '',
    profileId: data.profileId,
    class: data.class || data.classId || '',
    studentId: sessionStudentId,
    linkedStudentId: linkedChildId || undefined,
    firebaseUid: docId
  };
}

export async function fetchUserSessionForUid(uid) {
  if (!isFirebaseConfigured || !db || !uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return mapFirestoreUserToSession(snap);
}

/**
 * Build possible Firestore document ids for `users/{id}`.
 * Auth UIDs are `U_<profileId>` (e.g. U_AC0611) while people type only `AC0611`.
 *
 * For input without a `U_` prefix, we try **`U_*` ids first**. Otherwise a stray document at
 * `users/AC0611` would win before `users/U_AC0611` and break sign-in.
 */
function buildUserDocIdCandidates(identifierInput) {
  const raw = String(identifierInput || '').trim();
  if (!raw) return [];

  const ordered = [];
  const push = (id) => {
    if (!id || ordered.includes(id)) return;
    ordered.push(id);
  };

  const hasUPrefix = /^U_/i.test(raw);

  if (!hasUPrefix) {
    const upper = raw.toUpperCase();
    const lower = raw.toLowerCase();
    push(`U_${raw}`);
    push(`U_${upper}`);
    push(`U_${lower}`);
    push(raw);
    push(lower);
    push(upper);
  } else {
    push(raw);
    push(raw.toLowerCase());
    push(raw.toUpperCase());
    const suffix = raw.slice(2);
    if (suffix) {
      push(`U_${suffix}`);
      push(`U_${suffix.toUpperCase()}`);
      push(`U_${suffix.toLowerCase()}`);
    }
  }

  return ordered;
}

/**
 * Resolve `users/{docId}` by direct getDoc attempts (no query; works even if collection queries are restricted).
 */
async function getUserSnapshotByDocIdCandidates(identifierInput) {
  const candidates = buildUserDocIdCandidates(identifierInput);
  for (const docId of candidates) {
    const snap = await getDoc(doc(db, 'users', docId));
    if (snap.exists) return snap;
  }
  return null;
}

/** Equality values to try for string ids (Firestore matching is case-sensitive). */
function stringMatchVariants(valueInput) {
  const raw = String(valueInput || '').trim();
  if (!raw) return [];
  return [...new Set([raw, raw.toUpperCase(), raw.toLowerCase()])];
}

/**
 * Find a user by a single string field (username, profileId, studentId, etc.).
 * Also tries a numeric match when the input is all digits (some records store ids as numbers).
 */
async function getUserSnapshotByField(fieldName, valueInput) {
  const raw = String(valueInput || '').trim();
  if (!raw) return null;

  const variants = [...stringMatchVariants(raw)];
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    if (!Number.isNaN(n)) variants.push(n);
  }

  for (const v of [...new Set(variants)]) {
    try {
      const q = query(collection(db, 'users'), where(fieldName, '==', v), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0];
    } catch (err) {
      console.warn(`[appUsersAuth] users lookup by ${fieldName} failed:`, err?.message || err);
    }
  }
  return null;
}

async function findUserDocForNonEmail(identifier) {
  const byDocId = await getUserSnapshotByDocIdCandidates(identifier);
  if (byDocId) return byDocId;

  const fieldNames = [
    'username',
    'profileId',
    'studentId',
    'schoolUsername',
    'loginName',
    'userCode'
  ];
  for (const field of fieldNames) {
    const found = await getUserSnapshotByField(field, identifier);
    if (found) return found;
  }

  return null;
}

/**
 * @param {string} code Firebase Auth error code
 * @param {boolean} typedAsEmail true if the user entered something with @ (email-style sign-in)
 */
function authErrorMessage(code, typedAsEmail) {
  const wrongSecret = typedAsEmail
    ? 'That email or password is incorrect.'
    : 'That account id or password is incorrect.';

  switch (code) {
    case 'auth/invalid-email':
      return typedAsEmail ? 'That email address is not valid.' : 'That sign-in id is not valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return wrongSecret;
    case 'auth/wrong-password':
      return wrongSecret;
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    default:
      return null;
  }
}

/**
 * Sign in with Firebase Auth, then load `users/{uid}` for role and profile.
 * Always returns the session object or **throws** an `Error` with a message tailored to whether the user
 * typed an **email** (contains `@`) or an **account id** (profile code, `U_…`, etc.).
 *
 * Identifier may be:
 * - Full **email** (matches Authentication), or
 * - **Firestore document id** (e.g. `U_AC0611`), or
 * - **`username`**, **`profileId`**, or **`studentId`** on the user document (e.g. `AC0611`).
 */
export async function loginWithAppUser(identifierInput, passwordInput) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_* in your environment.');
  }
  if (!auth) {
    throw new Error('Firebase Auth is not available. Check your Firebase config.');
  }

  let identifier = String(identifierInput || '').trim();
  try {
    identifier = identifier.normalize('NFKC').trim();
  } catch {
    /* older JS engines */
  }
  const password = String(passwordInput || '');
  if (!identifier || !password) {
    throw new Error('Enter your school email or account id and your password.');
  }

  const typedAsEmail = identifier.includes('@');

  let emailToSignIn = null;

  if (typedAsEmail) {
    emailToSignIn = identifier;
  } else {
    const profileSnap = await findUserDocForNonEmail(identifier);
    if (!profileSnap) {
      throw new Error(
        'No account matched that user id or profile code. Check spelling, or sign in with your school email instead.'
      );
    }
    const data = profileSnap.data() || {};
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    if (!email || !email.includes('@')) {
      throw new Error(
        'This account id has no school email on file. Sign in with your school email, or ask an admin to add an email to your profile.'
      );
    }
    emailToSignIn = email;
  }

  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, emailToSignIn, password);
  } catch (e) {
    const code = typeof e?.code === 'string' ? e.code : '';
    if (code) {
      const msg = authErrorMessage(code, typedAsEmail);
      throw new Error(msg || e.message || 'Sign-in failed.');
    }
    throw e;
  }

  const uid = credential.user.uid;
  const profileSnap = await getDoc(doc(db, 'users', uid));
  const session = mapFirestoreUserToSession(profileSnap);
  if (!session) {
    await firebaseSignOut(auth);
    throw new Error(
      typedAsEmail
        ? 'You signed in, but no school profile is linked to this email. Please contact support.'
        : 'You signed in, but no school profile is linked to this account id. Please contact support.'
    );
  }

  return session;
}

function demoEntryFromDoc(d) {
  const data = d.data() || {};
  const role = data.role;
  if (!ALLOWED_ROLES.includes(role)) return null;

  const email =
    typeof data.email === 'string' && data.email.includes('@') ? data.email.trim() : '';
  const loginIdFromField = asLoginToken(data.loginId);
  const shortLogin =
    asLoginToken(data.profileId) ||
    asLoginToken(data.username) ||
    loginIdFromField ||
    '';
  /** Prefer short id so demo matches how people sign in with profileId / username */
  const username = shortLogin || email || d.id;
  const password = data.password;
  if (!username || password == null || String(password) === '') return null;

  return { role, entry: { username, password: String(password) } };
}

/**
 * Parent demo for the guardian linked to a given student `profileId` (Firestore `linkedStudentId` / `studentId`).
 */
async function fetchParentDemoEntryLinkedToStudentProfileId(profileId) {
  const variants = stringMatchVariants(profileId);
  const fields = ['linkedStudentId', 'studentId'];

  for (const sid of variants) {
    for (const field of fields) {
      try {
        const q = query(collection(db, 'users'), where(field, '==', sid), limit(10));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const data = d.data() || {};
          if (data.role !== 'parent') continue;
          const parsed = demoEntryFromDoc(d);
          if (parsed?.entry) return parsed.entry;
        }
      } catch (err) {
        console.warn(
          `[fetchDemoUsersByRole] parent lookup ${field}=${sid}:`,
          err?.message || err
        );
      }
    }
  }
  return null;
}

/**
 * One demo credential per role: prefers `isDemo == true`, otherwise first `users` doc for that role
 * (so quick-fill works without maintaining isDemo flags).
 */
export async function fetchDemoUsersByRole() {
  if (!isFirebaseConfigured || !db) {
    return {};
  }

  const byRole = {};

  const assignFromDoc = (d) => {
    const parsed = demoEntryFromDoc(d);
    if (!parsed) return;
    if (byRole[parsed.role]) return;
    byRole[parsed.role] = parsed.entry;
  };

  try {
    const qDemo = query(collection(db, 'users'), where('isDemo', '==', true));
    const demoSnap = await getDocs(qDemo);
    demoSnap.forEach(assignFromDoc);
  } catch (e) {
    console.warn('[fetchDemoUsersByRole] isDemo query failed', e);
  }

  for (const role of ALLOWED_ROLES) {
    if (byRole[role]) continue;
    try {
      const q = query(collection(db, 'users'), where('role', '==', role), limit(1));
      const s = await getDocs(q);
      if (!s.empty) assignFromDoc(s.docs[0]);
    } catch (e) {
      console.warn(`[fetchDemoUsersByRole] role=${role}`, e);
    }
  }

  try {
    const parentForAc0611 = await fetchParentDemoEntryLinkedToStudentProfileId(
      DEMO_PARENT_LINKED_STUDENT_PROFILE_ID
    );
    if (parentForAc0611) {
      byRole.parent = parentForAc0611;
    }
  } catch (e) {
    console.warn('[fetchDemoUsersByRole] parent override for AC0611 failed', e);
  }

  return byRole;
}
