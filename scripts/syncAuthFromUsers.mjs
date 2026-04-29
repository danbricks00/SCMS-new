import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvFile() {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return;
  const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const rawLine of envLines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseServiceAccountFromEnv() {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    };
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const absolutePath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      : path.join(projectRoot, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  }
  return null;
}

function ensureAdminApp() {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Missing EXPO_PUBLIC_FIREBASE_PROJECT_ID in environment.');
  }

  const serviceAccount = parseServiceAccountFromEnv();
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

function normalizeEmail(user) {
  if (user.email) return user.email.toLowerCase();
  return `${user.username}@scms.local`;
}

async function syncAuthUsers() {
  loadEnvFile();
  ensureAdminApp();

  const auth = getAuth();
  const db = getFirestore();
  const usersSnap = await db.collection('users').get();

  if (usersSnap.empty) {
    console.log('No documents found in users collection.');
    return;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    if (!user?.username || !user?.password || !user?.role) {
      skipped += 1;
      console.log(`Skipped ${userDoc.id}: missing username/password/role`);
      continue;
    }

    const uid = user.id || userDoc.id;
    const email = normalizeEmail(user);
    const displayName = user.name || user.username;
    const claims = {
      role: user.role,
      profileId: user.profileId || null,
      classId: user.classId || null,
      linkedStudentId: user.linkedStudentId || null,
    };

    try {
      await auth.createUser({
        uid,
        email,
        password: user.password,
        displayName,
        disabled: user.isActive === false,
      });
      created += 1;
      await auth.setCustomUserClaims(uid, claims);
      console.log(`Created auth user: ${uid} (${email})`);
    } catch (error) {
      if (error.code !== 'auth/uid-already-exists') {
        throw error;
      }

      await auth.updateUser(uid, {
        email,
        password: user.password,
        displayName,
        disabled: user.isActive === false,
      });
      updated += 1;
      await auth.setCustomUserClaims(uid, claims);
      console.log(`Updated auth user: ${uid} (${email})`);
    }
  }

  console.log('');
  console.log('Firebase Auth sync complete.');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

syncAuthUsers().catch((error) => {
  if (String(error?.message || '').includes('default credentials')) {
    console.error(
      'Auth sync failed: missing Admin credentials. Set FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env, or set FIREBASE_SERVICE_ACCOUNT_PATH.',
    );
  } else {
    console.error('Auth sync failed:', error.message);
  }
  process.exitCode = 1;
});
