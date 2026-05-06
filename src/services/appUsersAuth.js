import {
  deleteUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  getAuth
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { deleteApp, initializeApp } from 'firebase/app';
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
  const linkedChildIds = Array.isArray(data.linkedStudentIds)
    ? data.linkedStudentIds.map((id) => asLoginToken(id)).filter(Boolean)
    : [];
  const dataStudentId = asLoginToken(data.studentId);
  const profileIdToken = asLoginToken(data.profileId);

  /** For parents, `studentId` must be the child's id (portal), not the parent's profileId. */
  let sessionStudentId;
  if (role === 'parent') {
    sessionStudentId = linkedChildId || linkedChildIds[0] || dataStudentId || '';
  } else {
    sessionStudentId = dataStudentId || profileIdToken;
  }

  return {
    username: data.username || docId,
    role,
    name: data.name || '',
    profileId: data.profileId,
    email: data.email || '',
    class: data.class || data.classId || '',
    studentId: sessionStudentId,
    linkedStudentIds: linkedChildIds.length ? linkedChildIds : undefined,
    linkedStudentId: linkedChildId || undefined,
    firebaseUid: docId
  };
}

function normalizeLinkedStudentIds(...sources) {
  const ids = [];
  for (const source of sources) {
    if (Array.isArray(source)) {
      ids.push(...source);
    } else if (source != null && source !== '') {
      ids.push(source);
    }
  }
  return Array.from(
    new Set(
      ids
        .map((id) => String(id || '').trim().toUpperCase())
        .filter(Boolean)
    )
  );
}

async function hydrateParentLinkedStudents(session) {
  if (!session || session.role !== 'parent' || !db) return session;

  const existingIds = normalizeLinkedStudentIds(
    session.linkedStudentIds,
    session.linkedStudentId,
    session.studentId
  );

  let parentDocIds = [];
  const profileId = String(session.profileId || '').trim();
  if (profileId) {
    try {
      const parentById = await getDoc(doc(db, 'parents', profileId));
      if (parentById.exists()) {
        const data = parentById.data() || {};
        parentDocIds = normalizeLinkedStudentIds(
          data.linkedStudentId,
          data.linkedStudentIds
        );
      }
    } catch (error) {
      console.warn('[appUsersAuth] parent hydrate by profileId failed:', error);
    }
  }

  if (!parentDocIds.length && session.email) {
    try {
      const parentByEmail = query(
        collection(db, 'parents'),
        where('email', '==', String(session.email).trim().toLowerCase()),
        limit(1)
      );
      const parentSnap = await getDocs(parentByEmail);
      if (!parentSnap.empty) {
        const data = parentSnap.docs[0].data() || {};
        parentDocIds = normalizeLinkedStudentIds(
          data.linkedStudentId,
          data.linkedStudentIds
        );
      }
    } catch (error) {
      console.warn('[appUsersAuth] parent hydrate by email failed:', error);
    }
  }

  const mergedIds = normalizeLinkedStudentIds(existingIds, parentDocIds);
  if (!mergedIds.length) return session;

  return {
    ...session,
    studentId: mergedIds[0],
    linkedStudentId: mergedIds[0],
    linkedStudentIds: mergedIds
  };
}

export async function fetchUserSessionForUid(uid) {
  if (!isFirebaseConfigured || !db || !uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  const direct = mapFirestoreUserToSession(snap);
  if (direct) return await hydrateParentLinkedStudents(direct);

  try {
    const q = query(collection(db, 'users'), where('firebaseUid', '==', uid), limit(1));
    const byFirebaseUid = await getDocs(q);
    if (!byFirebaseUid.empty) {
      const session = mapFirestoreUserToSession(byFirebaseUid.docs[0]);
      return await hydrateParentLinkedStudents(session);
    }
  } catch (error) {
    console.warn('[appUsersAuth] fetchUserSessionForUid fallback failed:', error);
  }
  return null;
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

async function findUserDocsForNonEmail(identifier) {
  const docs = [];
  const seen = new Set();
  const pushDoc = (snap) => {
    if (!snap?.id || seen.has(snap.id)) return;
    seen.add(snap.id);
    docs.push(snap);
  };

  const byDocId = await getUserSnapshotByDocIdCandidates(identifier);
  if (byDocId) pushDoc(byDocId);

  const fieldNames = [
    'username',
    'profileId',
    'studentId',
    'schoolUsername',
    'loginName',
    'userCode'
  ];

  for (const field of fieldNames) {
    try {
      const values = stringMatchVariants(identifier);
      for (const v of values) {
        const q = query(collection(db, 'users'), where(field, '==', v), limit(10));
        const snap = await getDocs(q);
        snap.docs.forEach((d) => pushDoc(d));
      }
    } catch (error) {
      console.warn(`[appUsersAuth] user docs lookup by ${field} failed:`, error?.message || error);
    }
  }

  return docs;
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
  let signInCandidateEmails = [];

  if (typedAsEmail) {
    emailToSignIn = identifier;
    signInCandidateEmails = [emailToSignIn];
  } else {
    const profileDocs = await findUserDocsForNonEmail(identifier);
    if (!profileDocs.length) {
      throw new Error(
        'No account matched that user id or profile code. Check spelling, or sign in with your school email instead.'
      );
    }
    const emails = Array.from(
      new Set(
        profileDocs
          .map((d) => {
            const data = d.data() || {};
            return typeof data.email === 'string' ? data.email.trim() : '';
          })
          .filter((email) => email && email.includes('@'))
      )
    );

    if (!emails.length) {
      throw new Error(
        'This account id has no school email on file. Sign in with your school email, or ask an admin to add an email to your profile.'
      );
    }
    emailToSignIn = emails[0];
    signInCandidateEmails = emails;
  }

  let credential;
  let lastSignInError = null;
  for (const candidateEmail of signInCandidateEmails) {
    try {
      credential = await signInWithEmailAndPassword(auth, candidateEmail, password);
      break;
    } catch (e) {
      lastSignInError = e;
      const code = typeof e?.code === 'string' ? e.code : '';
      // For ID-based login, keep trying other mapped emails on invalid credentials.
      if (!typedAsEmail && (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password')) {
        continue;
      }
      const msg = authErrorMessage(code, typedAsEmail);
      throw new Error(msg || e.message || 'Sign-in failed.');
    }
  }

  if (!credential) {
    const code = typeof lastSignInError?.code === 'string' ? lastSignInError.code : '';
    const msg = authErrorMessage(code, typedAsEmail);
    throw new Error(msg || lastSignInError?.message || 'Sign-in failed.');
  }

  const uid = credential.user.uid;
  const session = await fetchUserSessionForUid(uid);
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

  const qDemo = query(collection(db, 'users'), where('isDemo', '==', true));
  const roleQueries = ALLOWED_ROLES.map((role) => ({
    role,
    q: query(collection(db, 'users'), where('role', '==', role), limit(1))
  }));

  // Run independent Firestore reads concurrently to reduce login-page wait time.
  const [demoResult, ...roleResults] = await Promise.allSettled([
    getDocs(qDemo),
    ...roleQueries.map(({ q }) => getDocs(q))
  ]);

  if (demoResult.status === 'fulfilled') {
    demoResult.value.forEach(assignFromDoc);
  } else {
    console.warn('[fetchDemoUsersByRole] isDemo query failed', demoResult.reason);
  }

  roleResults.forEach((result, idx) => {
    const { role } = roleQueries[idx];
    if (result.status !== 'fulfilled') {
      console.warn(`[fetchDemoUsersByRole] role=${role}`, result.reason);
      return;
    }
    if (byRole[role]) return;
    if (!result.value.empty) assignFromDoc(result.value.docs[0]);
  });

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

/**
 * Create a Firebase Auth account + matching `users/{uid}` profile without
 * changing the currently signed-in admin session.
 */
export async function createManagedAppUserAccount({
  email,
  password,
  role,
  name,
  username,
  profileId,
  studentId = '',
  className = '',
  linkedStudentId = '',
  linkedStudentIds = [],
  extraProfileData = {}
}) {
  if (!isFirebaseConfigured || !db || !auth?.app) {
    throw new Error('Firebase is not configured. Cannot create login account.');
  }

  if (!email || !password || !role || !profileId) {
    throw new Error('Missing required account fields (email, password, role, profileId).');
  }

  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error(`Invalid role "${role}" for login account.`);
  }

  const tempAppName = `managed-user-create-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const secondaryApp = initializeApp(auth.app.options, tempAppName);
  const secondaryAuth = getAuth(secondaryApp);
  const cleanupSecondaryApp = async () => {
    try {
      await firebaseSignOut(secondaryAuth);
    } catch {
      // best-effort cleanup
    }
    try {
      await deleteApp(secondaryApp);
    } catch {
      // best-effort cleanup
    }
  };

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    const uid = credential.user.uid;
    const normalizedProfileId = String(profileId || '').trim().toUpperCase();
    const userAliasDocId = `U_${normalizedProfileId}`;
    const normalizedClass = String(className || '').trim();
    const classId = normalizedClass ? `CLS${normalizedClass.replace(/\s+/g, '').toUpperCase()}` : '';

    const normalizedLinkedIds = Array.isArray(linkedStudentIds)
      ? linkedStudentIds.map((id) => String(id || '').trim().toUpperCase()).filter(Boolean)
      : [];
    const primaryLinkedStudentId = String(linkedStudentId || normalizedLinkedIds[0] || '')
      .trim()
      .toUpperCase();

    const basePayload = {
      id: userAliasDocId,
      username: username || normalizedProfileId,
      role,
      name: name || '',
      profileId: normalizedProfileId,
      email: email.trim().toLowerCase(),
      studentId: studentId || '',
      class: normalizedClass,
      classId,
      linkedStudentId: primaryLinkedStudentId || '',
      linkedStudentIds: primaryLinkedStudentId
        ? Array.from(new Set([primaryLinkedStudentId, ...normalizedLinkedIds]))
        : normalizedLinkedIds,
      firebaseUid: uid,
      ...extraProfileData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Keep canonical login alias path as U_<profileId> (same model used for students).
    await setDoc(doc(db, 'users', userAliasDocId), basePayload, { merge: true });

    await cleanupSecondaryApp();

    return { uid, userAliasDocId };
  } catch (error) {
    await cleanupSecondaryApp();
    throw error;
  }
}

export async function deleteManagedAppUserAccount(uid) {
  if (!isFirebaseConfigured || !auth?.app || !uid) return;

  const tempAppName = `managed-user-delete-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const secondaryApp = initializeApp(auth.app.options, tempAppName);
  const secondaryAuth = getAuth(secondaryApp);
  const cleanupSecondaryApp = async () => {
    try {
      await firebaseSignOut(secondaryAuth);
    } catch {
      // best-effort cleanup
    }
    try {
      await deleteApp(secondaryApp);
    } catch {
      // best-effort cleanup
    }
  };

  try {
    // We can only delete the currently signed-in user on this auth instance.
    // Since this helper is for rollback, we expect caller to provide a uid that
    // was just created in this flow and currently signed in on secondary auth.
    if (secondaryAuth.currentUser && secondaryAuth.currentUser.uid === uid) {
      await deleteUser(secondaryAuth.currentUser);
    }
  } catch (error) {
    console.warn('[appUsersAuth] account rollback failed:', error);
  } finally {
    await cleanupSecondaryApp();
  }
}

export async function linkStudentToExistingParentByEmail(parentEmail, studentId) {
  if (!isFirebaseConfigured || !db) return false;

  const email = String(parentEmail || '').trim().toLowerCase();
  const sid = String(studentId || '').trim().toUpperCase();
  if (!email || !sid) return false;

  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'parent'),
      where('email', '==', email),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return false;

    const parentDoc = snap.docs[0];
    const parentData = parentDoc.data() || {};
    const parentIdsFromUsers = Array.isArray(parentData.linkedStudentIds)
      ? parentData.linkedStudentIds.map((id) => String(id || '').trim().toUpperCase()).filter(Boolean)
      : [];
    const parentPrimaryFromUsers = String(parentData.linkedStudentId || '').trim().toUpperCase();

    // Prefer canonical list from parents/<id> collection when available.
    let parentIdsFromParentsCollection = [];
    try {
      const parentsQuery = query(
        collection(db, 'parents'),
        where('email', '==', email),
        limit(1)
      );
      const parentSnap = await getDocs(parentsQuery);
      if (!parentSnap.empty) {
        const parentProfile = parentSnap.docs[0].data() || {};
        const fromPrimary = Array.isArray(parentProfile.linkedStudentId)
          ? parentProfile.linkedStudentId
          : [parentProfile.linkedStudentId];
        const fromLegacy = Array.isArray(parentProfile.linkedStudentIds)
          ? parentProfile.linkedStudentIds
          : [parentProfile.linkedStudentIds];
        parentIdsFromParentsCollection = [...fromPrimary, ...fromLegacy]
          .map((id) => String(id || '').trim().toUpperCase())
          .filter(Boolean);
      }
    } catch (parentLookupError) {
      console.warn('[appUsersAuth] parent collection lookup failed during link:', parentLookupError);
    }

    const baseIds = parentIdsFromParentsCollection.length > 0
      ? parentIdsFromParentsCollection
      : [parentPrimaryFromUsers, ...parentIdsFromUsers].filter(Boolean);
    const mergedIds = Array.from(new Set([sid, ...baseIds].filter(Boolean)));

    const parentProfileId = String(parentData.profileId || '').trim().toUpperCase();
    const canonicalDocId = parentProfileId ? `U_${parentProfileId}` : '';
    const docIdsToSync = Array.from(
      new Set([parentDoc.id, canonicalDocId, parentData.firebaseUid].filter(Boolean))
    );
    for (const docId of docIdsToSync) {
      await setDoc(doc(db, 'users', docId), {
        id: canonicalDocId || docId,
        linkedStudentId: mergedIds[0], // backward compatibility
        linkedStudentIds: mergedIds,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // Keep dedicated parents collection in sync when present.
    try {
      const parentProfileIdLegacy = String(parentData.profileId || '').trim();
      const parentsQuery = query(
        collection(db, 'parents'),
        where('email', '==', email),
        limit(1)
      );
      const parentSnap = await getDocs(parentsQuery);
      if (!parentSnap.empty) {
        const parentDocSnap = parentSnap.docs[0];
        await updateDoc(doc(db, 'parents', parentDocSnap.id), {
          linkedStudentId: mergedIds,
          updatedAt: new Date().toISOString()
        });
      } else if (parentProfileIdLegacy) {
        await setDoc(doc(db, 'parents', parentProfileIdLegacy), {
          id: parentProfileIdLegacy,
          email,
          role: 'parent',
          firstName: '',
          lastName: '',
          name: String(parentData.name || '').trim(),
          phone: String(parentData.parentPhone || parentData.phone || '').trim(),
          linkedStudentId: mergedIds,
          isActive: true,
          createdAt: parentData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (syncError) {
      console.warn('[appUsersAuth] failed to sync parents collection link:', syncError);
    }
    return true;
  } catch (error) {
    console.warn('[appUsersAuth] failed to link student to parent account:', error);
    return false;
  }
}

export async function findParentAccountByEmail(parentEmail) {
  if (!isFirebaseConfigured || !db) return null;

  const email = String(parentEmail || '').trim().toLowerCase();
  if (!email) return null;

  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'parent'),
      where('email', '==', email)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docs = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      const mergedIds = Array.from(
        new Set(
          docs.flatMap((entry) => {
            const fromPrimary = Array.isArray(entry.linkedStudentId)
              ? entry.linkedStudentId
              : [entry.linkedStudentId];
            const fromLegacy = Array.isArray(entry.linkedStudentIds)
              ? entry.linkedStudentIds
              : [entry.linkedStudentIds];
            return [...fromPrimary, ...fromLegacy]
              .map((id) => String(id || '').trim().toUpperCase())
              .filter(Boolean);
          })
        )
      );
      const preferred = docs.find((entry) => String(entry.id || '').startsWith('U_')) || docs[0];
      return {
        ...preferred,
        linkedStudentIds: mergedIds,
        linkedStudentId: mergedIds
      };
    }
  } catch (error) {
    console.warn('[appUsersAuth] failed to find parent account by email:', error);
  }

  // Fallback for legacy data where parent exists in `parents` collection only.
  try {
    const parentQuery = query(
      collection(db, 'parents'),
      where('email', '==', email),
      limit(1)
    );
    const parentSnap = await getDocs(parentQuery);
    if (parentSnap.empty) return null;
    const d = parentSnap.docs[0];
    const data = d.data() || {};
    return {
      uid: null,
      source: 'parents',
      profileId: data.id || d.id,
      name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: data.email || email,
      linkedStudentId: data.linkedStudentId || '',
      linkedStudentIds: Array.isArray(data.linkedStudentId)
        ? data.linkedStudentId
        : (Array.isArray(data.linkedStudentIds) ? data.linkedStudentIds : (data.linkedStudentId ? [data.linkedStudentId] : []))
    };
  } catch (fallbackError) {
    console.warn('[appUsersAuth] fallback parent lookup failed:', fallbackError);
    return null;
  }
}
