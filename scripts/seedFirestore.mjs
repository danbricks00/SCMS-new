import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';

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

function getFirebaseConfig() {
  const requiredKeys = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];
  const missing = requiredKeys.filter((key) => !process.env[key] || process.env[key].includes('your_'));
  if (missing.length) {
    throw new Error(`Missing Firebase env vars: ${missing.join(', ')}. Populate .env or export them before running.`);
  }
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
}

function makeIdFactory(startAt = 1001) {
  const counters = new Map();
  return (firstName, lastName) => {
    const initials = `${firstName[0] || 'X'}${lastName[0] || 'X'}`.toUpperCase();
    const next = counters.get(initials) || startAt;
    counters.set(initials, next + 1);
    return `${initials}${String(next).padStart(4, '0')}`;
  };
}

function makeIdFromDob(firstName, lastName, dob) {
  const initials = `${firstName[0] || 'X'}${lastName[0] || 'X'}`.toUpperCase();
  const [year, month, day] = dob.split('-');
  const suffix = `${day}${month}`;
  return `${initials}${suffix}`;
}

function buildSeedData() {
  const nextId = makeIdFactory();

  const teacherProfiles = [
    { firstName: 'Mila', lastName: 'Kensley', subject: 'Mathematics', dob: '1987-03-12' },
    { firstName: 'Rowan', lastName: 'Prescott', subject: 'English', dob: '1983-07-22' },
    { firstName: 'Talia', lastName: 'Mercer', subject: 'Science', dob: '1990-09-05' },
  ];
  const teachers = teacherProfiles.map((teacher, index) => ({
    id: makeIdFromDob(teacher.firstName, teacher.lastName, teacher.dob),
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    dob: teacher.dob,
    email: `${teacher.firstName.toLowerCase()}.${teacher.lastName.toLowerCase()}@scms.school.nz`,
    phone: `+64 21 310 00${index + 1}`,
    subject: teacher.subject,
    role: 'teacher',
    isActive: true,
  }));

  const classes = [
    { id: 'CLS10A', name: '10A', subject: 'Mathematics', teacherId: teachers[0].id, room: 'A1', schedule: 'Mon-Wed-Fri 09:00' },
    { id: 'CLS9B', name: '9B', subject: 'English', teacherId: teachers[1].id, room: 'B2', schedule: 'Tue-Thu 10:30' },
    { id: 'CLS11A', name: '11A', subject: 'Science', teacherId: teachers[2].id, room: 'C3', schedule: 'Mon-Wed 13:00' },
    { id: 'CLSTEST', name: 'TEST-ALWAYS', subject: 'Testing', teacherId: teachers[0].id, room: 'LAB-T', schedule: 'Always On (Testing)' },
  ];

  const studentNamePool = [
    ['Avery', 'Coleman', '2008-11-06'], ['Niko', 'Ramsey', '2008-04-19'], ['Zara', 'Ellison', '2008-08-27'],
    ['Leo', 'Bennett', '2008-01-14'], ['Iris', 'Caldwell', '2008-06-03'], ['Mason', 'Hartley', '2008-10-25'],
    ['Skye', 'Donovan', '2008-02-16'], ['Ethan', 'Mallory', '2009-07-09'], ['Aria', 'Winslow', '2009-12-21'],
    ['Felix', 'Crosby', '2009-05-30'], ['Piper', 'Hollis', '2009-03-11'], ['Jude', 'Sinclair', '2009-09-18'],
    ['Nova', 'Bishop', '2009-11-24'], ['Reid', 'Monroe', '2009-04-07'], ['Isla', 'Turner', '2007-08-13'],
    ['Kai', 'Sullivan', '2007-02-28'], ['Lena', 'Frost', '2007-06-17'], ['Otis', 'Keegan', '2007-10-04'],
    ['Mira', 'Dalton', '2007-01-22'], ['Noah', 'Ember', '2007-05-15'],
  ];
  const students = studentNamePool.map(([firstName, lastName, dob], index) => {
    const n = index + 1;
    const classId = n <= 7 ? 'CLS10A' : n <= 14 ? 'CLS9B' : 'CLS11A';
    const className = classId === 'CLS10A' ? '10A' : classId === 'CLS9B' ? '9B' : '11A';
    return {
      id: makeIdFromDob(firstName, lastName, dob),
      firstName,
      lastName,
      dob,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.scms.school.nz`,
      classId,
      class: className,
      yearLevel: classId === 'CLS11A' ? 11 : classId === 'CLS10A' ? 10 : 9,
      isActive: true,
    };
  });

  const parentProfiles = [
    { firstName: 'Keira', lastName: 'Coleman', linkedStudentId: students[0].id },
    { firstName: 'Dominic', lastName: 'Ramsey', linkedStudentId: students[1].id },
    { firstName: 'Renee', lastName: 'Ellison', linkedStudentId: students[2].id },
  ];
  const parents = parentProfiles.map((parent, index) => ({
    id: nextId(parent.firstName, parent.lastName),
    firstName: parent.firstName,
    lastName: parent.lastName,
    email: `${parent.firstName.toLowerCase()}.${parent.lastName.toLowerCase()}@whanau.nz`,
    phone: `+64 21 410 00${index + 1}`,
    role: 'parent',
    linkedStudentId: parent.linkedStudentId,
    isActive: true,
  }));

  const adminFirstName = 'Harper';
  const adminLastName = 'Quill';
  const admin = {
    id: nextId(adminFirstName, adminLastName),
    firstName: adminFirstName,
    lastName: adminLastName,
    email: 'harper.quill@scms.school.nz',
    role: 'admin',
    isActive: true
  };

  const enrolments = students.map((student) => ({
    id: `${student.id}_${student.classId}`,
    studentId: student.id,
    classId: student.classId,
    status: 'active',
  }));

  const users = [
    ...teachers.map((teacher, index) => ({
      id: `U_${teacher.id}`,
      username: teacher.id,
      password: `Teach-${teacher.id}`,
      email: teacher.email,
      role: 'teacher',
      profileId: teacher.id,
      name: `${teacher.firstName} ${teacher.lastName}`,
      isActive: true,
    })),
    ...students.map((student, index) => ({
      id: `U_${student.id}`,
      username: student.id,
      password: `Stud-${student.id}`,
      email: student.email,
      role: 'student',
      profileId: student.id,
      name: `${student.firstName} ${student.lastName}`,
      classId: student.classId,
      isActive: true,
    })),
    ...parents.map((parent, index) => ({
      id: `U_${parent.id}`,
      username: parent.id,
      password: `Par-${parent.id}`,
      email: parent.email,
      role: 'parent',
      profileId: parent.id,
      linkedStudentId: parent.linkedStudentId,
      name: `${parent.firstName} ${parent.lastName}`,
      isActive: true,
    })),
    { id: `U_${admin.id}`, username: admin.id, password: `Admin-${admin.id}`, email: admin.email, role: 'admin', profileId: admin.id, name: `${admin.firstName} ${admin.lastName}`, isActive: true },
  ];

  return { teachers, classes, students, parents, admin, enrolments, users };
}

async function writeCollection(db, collectionName, records) {
  for (const record of records) {
    await setDoc(doc(db, collectionName, record.id), { ...record, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  }
}

async function clearCollection(db, collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  if (snapshot.empty) return 0;

  let deletedCount = 0;
  let batch = writeBatch(db);
  let batchCount = 0;

  for (const document of snapshot.docs) {
    batch.delete(document.ref);
    batchCount += 1;
    deletedCount += 1;

    if (batchCount === 450) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  return deletedCount;
}

async function seedFirestore() {
  loadEnvFile();
  const app = initializeApp(getFirebaseConfig());
  const db = getFirestore(app);
  const { teachers, classes, students, parents, admin, enrolments, users } = buildSeedData();
  const collectionsToReset = ['teachers', 'classes', 'students', 'parents', 'admins', 'enrolments', 'users'];

  for (const collectionName of collectionsToReset) {
    const deleted = await clearCollection(db, collectionName);
    console.log(`Cleared ${collectionName}: ${deleted} docs`);
  }

  await writeCollection(db, 'teachers', teachers);
  await writeCollection(db, 'classes', classes);
  await writeCollection(db, 'students', students);
  await writeCollection(db, 'parents', parents);
  await writeCollection(db, 'admins', [admin]);
  await writeCollection(db, 'enrolments', enrolments);
  await writeCollection(db, 'users', users);
  console.log('Firestore seeding complete.');
  console.log(`Teachers: ${teachers.length}`);
  console.log(`Students: ${students.length}`);
  console.log(`Parents: ${parents.length}`);
  console.log('Admins: 1');
  console.log(`Enrolments: ${enrolments.length}`);
  console.log(`User accounts: ${users.length}`);
}

seedFirestore().catch((error) => {
  console.error('Failed to seed Firestore:', error.message);
  process.exitCode = 1;
});
