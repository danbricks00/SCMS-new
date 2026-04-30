import { addDoc, collection, deleteDoc, doc, getDoc, limit as firestoreLimit, getDocs, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { comprehensiveFraudCheck, formatFraudCheckMessage, logFraudAttempt } from '../utils/fraudDetection';
import { QRCodeUtils } from '../utils/qrCodeUtils';

/** When EXPO_PUBLIC_FIREBASE_* are missing (local/Vercel), `db` is undefined — never pass it to collection(). */
function hasFirestore() {
  return db != null;
}

// Demo/testing IDs that should bypass fraud rules to avoid scan warnings during demos.
const FRAUD_CHECK_BYPASS_STUDENT_IDS = new Set(['AC0611']);

// Database service for managing students and attendance
export class DatabaseService {
  
  // ===== TEACHER MANAGEMENT =====
  
  /**
   * Add a new teacher to the database
   * @param {Object} teacherData - Teacher information
   * @returns {Promise<string>} Document ID of the created teacher
   */
  static async addTeacher(teacherData) {
    if (!hasFirestore()) return null;
    try {
      // Generate teacher ID if not provided
      if (!teacherData.teacherId) {
        teacherData.teacherId = `TCH${Date.now().toString().slice(-6)}`;
      }
      
      // Add creation timestamp
      teacherData.createdAt = new Date().toISOString();
      teacherData.updatedAt = new Date().toISOString();
      teacherData.isActive = true;

      const docRef = await addDoc(collection(db, 'teachers'), teacherData);
      
      // Log activity
      await this.logActivity({
        type: 'teacher_added',
        details: {
          teacherName: teacherData.name || `${teacherData.firstName} ${teacherData.lastName}`,
          teacherId: teacherData.teacherId,
          subject: teacherData.subject,
          description: `New teacher ${teacherData.name || `${teacherData.firstName} ${teacherData.lastName}`} added - ${teacherData.subject || 'Subject not specified'}`
        }
      });
      
      console.log('Teacher added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding teacher:', error);
      throw error;
    }
  }

  /**
   * Get all teachers
   * @returns {Promise<Array>} Array of teacher documents
   */
  static async getAllTeachers() {
    if (!hasFirestore()) return this.getSampleTeachers();
    try {
      const querySnapshot = await getDocs(collection(db, 'teachers'));
      const teachers = [];
      querySnapshot.forEach((doc) => {
        teachers.push({ id: doc.id, ...doc.data() });
      });
      // Return sample data if no teachers found
      return teachers.length > 0 ? teachers : this.getSampleTeachers();
    } catch (error) {
      console.error('Error getting teachers:', error);
      return this.getSampleTeachers();
    }
  }

  // ===== CLASS MANAGEMENT =====
  
  /**
   * Add a new class to the database
   * @param {Object} classData - Class information
   * @returns {Promise<string>} Document ID of the created class
   */
  static async addClass(classData) {
    if (!hasFirestore()) return null;
    try {
      // Generate class ID if not provided
      if (!classData.classId) {
        classData.classId = `CLS${classData.name.replace(/\s+/g, '')}${Date.now().toString().slice(-4)}`;
      }
      
      // Add creation timestamp
      classData.createdAt = new Date().toISOString();
      classData.updatedAt = new Date().toISOString();
      classData.isActive = true;

      const docRef = await addDoc(collection(db, 'classes'), classData);
      
      // Log activity
      await this.logActivity({
        type: 'class_added',
        details: {
          className: classData.name,
          classId: classData.classId,
          teacherName: classData.teacherName,
          description: `New class ${classData.name} created with teacher ${classData.teacherName || 'TBD'}`
        }
      });
      
      console.log('Class added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding class:', error);
      throw error;
    }
  }

  /**
   * Get all classes
   * @returns {Promise<Array>} Array of class documents
   */
  static async getAllClasses() {
    if (!hasFirestore()) return this.getSampleClasses();
    try {
      const querySnapshot = await getDocs(collection(db, 'classes'));
      const classes = [];
      querySnapshot.forEach((doc) => {
        classes.push({ id: doc.id, ...doc.data() });
      });
      // Return sample data if no classes found
      return classes.length > 0 ? classes : this.getSampleClasses();
    } catch (error) {
      console.error('Error getting classes:', error);
      return this.getSampleClasses();
    }
  }

  // ===== ANNOUNCEMENT MANAGEMENT =====

  /**
   * Get all active announcements
   * @returns {Promise<Array>} Array of announcement documents
   */
  static async getActiveAnnouncements() {
    if (!hasFirestore()) return [];
    try {
      const q = query(
        collection(db, 'announcements'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const announcements = [];
      querySnapshot.forEach((doc) => {
        announcements.push({ id: doc.id, ...doc.data() });
      });
      return announcements;
    } catch (error) {
      console.error('Error getting announcements:', error);
      return [];
    }
  }

  // ===== STUDENT MANAGEMENT =====
  
  /**
   * Add a new student to the database
   * @param {Object} studentData - Student information
   * @returns {Promise<string>} Document ID of the created student
   */
  static async addStudent(studentData) {
    if (!hasFirestore()) return null;
    try {
      // Generate student ID if not provided
      if (!studentData.studentId) {
        studentData.studentId = QRCodeUtils.generateStudentId(
          studentData.firstName, 
          studentData.lastName, 
          studentData.class
        );
      }

      // Generate QR code data (without timestamp for display)
      studentData.qrCode = QRCodeUtils.generateStudentQR(studentData);
      
      // Add creation timestamp
      studentData.createdAt = new Date().toISOString();
      studentData.updatedAt = new Date().toISOString();

      const docRef = await addDoc(collection(db, 'students'), studentData);
      
      // Log activity
      await this.logActivity({
        type: 'student_added',
        details: {
          studentName: studentData.name || `${studentData.firstName} ${studentData.lastName}`,
          studentId: studentData.studentId,
          class: studentData.class,
          description: `New student ${studentData.name || `${studentData.firstName} ${studentData.lastName}`} added to class ${studentData.class}`
        }
      });
      
      console.log('Student added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  }

  /**
   * Get all students
   * @returns {Promise<Array>} Array of student documents
   */
  static async getAllStudents() {
    if (!hasFirestore()) return this.getSampleStudents();
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      const students = [];
      
      querySnapshot.forEach((doc) => {
        students.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Return sample data if no students found
      const result = students.length > 0 ? students : this.getSampleStudents();
      return result.sort((a, b) => {
        const nameA = a.name || `${a.firstName} ${a.lastName}`;
        const nameB = b.name || `${b.firstName} ${b.lastName}`;
        return nameA.localeCompare(nameB);
      });
    } catch (error) {
      console.error('Error getting students:', error);
      return this.getSampleStudents();
    }
  }

  /**
   * Get students by class
   * @param {string} className - Class name to filter by
   * @returns {Promise<Array>} Array of student documents
   */
  static async getStudentsByClass(className) {
    if (!hasFirestore()) return [];
    try {
      const q = query(
        collection(db, 'students'),
        where('class', '==', className)
      );
      
      const querySnapshot = await getDocs(q);
      const students = [];
      
      querySnapshot.forEach((doc) => {
        students.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return students.sort((a, b) => {
        const nameA = a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim();
        const nameB = b.name || `${b.firstName || ''} ${b.lastName || ''}`.trim();
        return nameA.localeCompare(nameB);
      });
    } catch (error) {
      console.error('Error getting students by class:', error);
      return [];
    }
  }

  /**
   * Get a single student by ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object|null>} Student document or null
   */
  static async getStudentById(studentId) {
    try {
      if (!hasFirestore()) {
        return null;
      }
      const q = query(
        collection(db, 'students'),
        where('studentId', '==', studentId)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const d = querySnapshot.docs[0];
        return {
          id: d.id,
          ...d.data()
        };
      }

      // Doc may use login id or name as document id (e.g. students/John Doe with only isCheckedIn)
      const byDocId = await getDoc(doc(db, 'students', studentId));
      if (byDocId.exists) {
        return {
          id: byDocId.id,
          ...byDocId.data()
        };
      }

      return null;
    } catch (error) {
      // Permission denied / offline / bad rules — avoid throwing; callers use local fallback.
      console.warn('Error getting student by ID:', error?.code || error?.message || error);
      return null;
    }
  }

  /**
   * Load student by Firestore document id (e.g. display name when doc id is "John Doe").
   */
  static async getStudentByDocumentId(documentId) {
    try {
      if (!hasFirestore() || !documentId) {
        return null;
      }
      const snap = await getDoc(doc(db, 'students', documentId));
      if (!snap.exists) {
        return null;
      }
      return {
        id: snap.id,
        ...snap.data()
      };
    } catch (error) {
      console.error('Error getting student by document id:', error);
      return null;
    }
  }

  /**
   * Update student information
   * @param {string} studentId - Student ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  static async updateStudent(studentId, updateData) {
    if (!hasFirestore()) return;
    try {
      const student = await this.getStudentById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Update QR code if student data changed (without timestamp for display)
      if (updateData.name || updateData.class) {
        const updatedStudentData = { ...student, ...updateData };
        updateData.qrCode = QRCodeUtils.generateStudentQR(updatedStudentData);
      }

      updateData.updatedAt = new Date().toISOString();

      await updateDoc(doc(db, 'students', student.id), updateData);
      console.log('Student updated successfully');
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  /**
   * Save a new QR payload on a student document (by Firestore document id).
   * Used when the student regenerates their display QR; scanning still resolves the same account.
   */
  static async setStudentQrCodeByDocId(firestoreDocId, qrCode) {
    if (!hasFirestore() || !firestoreDocId || qrCode == null) {
      return;
    }
    try {
      await updateDoc(doc(db, 'students', firestoreDocId), {
        qrCode,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Could not persist qrCode to Firestore:', error);
      throw error;
    }
  }

  /**
   * Delete a student
   * @param {string} studentId - Student ID
   * @returns {Promise<void>}
   */
  static async deleteStudent(studentId) {
    if (!hasFirestore()) return;
    try {
      const student = await this.getStudentById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      await deleteDoc(doc(db, 'students', student.id));
      console.log('Student deleted successfully');
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  // ===== ATTENDANCE MANAGEMENT =====

  /**
   * Record student attendance/activity with fraud detection
   * @param {Object} attendanceData - Attendance information
   * @param {Object} options - Additional options { skipFraudCheck, currentLocation, userIP }
   * @returns {Promise<Object>} { success: boolean, docId: string|null, fraudCheck: Object }
   */
  static async recordAttendance(attendanceData, options = {}) {
    if (!hasFirestore()) {
      return {
        success: false,
        docId: null,
        fraudCheck: null,
        message: 'Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_* environment variables.',
        blocked: true,
      };
    }
    try {
      const { QRCodeUtils } = await import('../utils/qrCodeUtils');
      const nztDetails = QRCodeUtils.getNZTDetails();
      
      // Run fraud detection checks (unless skipped by admin override or demo bypass).
      const normalizedStudentId = String(attendanceData.studentId || '').toUpperCase();
      const shouldSkipFraudCheck =
        options.skipFraudCheck || FRAUD_CHECK_BYPASS_STUDENT_IDS.has(normalizedStudentId);
      if (!shouldSkipFraudCheck && attendanceData.type === 'login') {
        console.log('🔒 Running fraud detection checks...');
        
        // Get today's attendance for duplicate check
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = await this.getClassAttendance(attendanceData.class, today);
        
        // Get recent attendance for velocity check (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const recentAttendance = todayAttendance.filter(r => r.timestamp > oneHourAgo);
        
        // Run comprehensive fraud check
        const fraudCheck = comprehensiveFraudCheck({
          studentId: attendanceData.studentId,
          studentName: attendanceData.studentName,
          activity: attendanceData.activity || 'Class Attendance',
          scanType: attendanceData.type,
          currentLocation: options.currentLocation,
          todayAttendance,
          recentAttendance,
          userIP: options.userIP,
          allowedIPs: options.allowedIPs || [],
          override: options.adminOverride || false
        });
        
        console.log('Fraud check result:', fraudCheck);
        
        // If fraud detected and not overridden, block attendance
        if (!fraudCheck.allowed) {
          console.warn('🚨 Attendance blocked due to fraud detection');
          await logFraudAttempt({
            ...fraudCheck,
            teacherId: attendanceData.teacherId,
            location: attendanceData.location,
            deviceInfo: options.deviceInfo
          });
          
          return {
            success: false,
            docId: null,
            fraudCheck,
            message: formatFraudCheckMessage(fraudCheck),
            blocked: true
          };
        }
        
        // If warnings but allowed, proceed with warnings logged
        if (fraudCheck.warnings.length > 0) {
          console.warn('⚠️ Attendance allowed with warnings:', fraudCheck.warnings);
        }
      }
      
      // Calculate timing data for reports
      const timingData = {};
      
      // If checking out, calculate duration from check-in (fetch attendance here — `todayAttendance` from the
      // login-only fraud block is not in scope for logout).
      if (attendanceData.type === 'logout') {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRows = await this.getClassAttendance(attendanceData.class, todayStr);
        const sid = String(attendanceData.studentId || '').toUpperCase();
        const activityLabel = attendanceData.activity || 'Class Attendance';
        const checkInRecord = (todayRows || []).find(
          (r) =>
            String(r.studentId || '').toUpperCase() === sid &&
            (r.activity || 'Class Attendance') === activityLabel &&
            r.type === 'login'
        );

        if (checkInRecord) {
          const checkInTime = new Date(checkInRecord.timestamp);
          const checkOutTime = new Date();
          const durationMinutes = Math.round((checkOutTime - checkInTime) / (1000 * 60));
          
          timingData.checkInTime = checkInRecord.timestamp;
          timingData.checkOutTime = new Date().toISOString();
          timingData.durationMinutes = durationMinutes;
          timingData.durationHours = (durationMinutes / 60).toFixed(2);
          
          // If activity was scheduled, calculate completion percentage
          if (attendanceData.scheduledEndTime && checkInRecord.scheduledStartTime) {
            const scheduledStart = new Date(`2000-01-01T${checkInRecord.scheduledStartTime}:00`);
            const scheduledEnd = new Date(`2000-01-01T${attendanceData.scheduledEndTime}:00`);
            const scheduledDuration = (scheduledEnd - scheduledStart) / (1000 * 60);
            timingData.completionPercentage = Math.round((durationMinutes / scheduledDuration) * 100);
            
            // Calculate if left early
            if (attendanceData.status === 'left-early') {
              const scheduledEndActual = new Date(checkInTime);
              scheduledEndActual.setHours(
                parseInt(attendanceData.scheduledEndTime.split(':')[0]),
                parseInt(attendanceData.scheduledEndTime.split(':')[1])
              );
              const leftEarlyMinutes = Math.round((scheduledEndActual - checkOutTime) / (1000 * 60));
              timingData.leftEarlyBy = leftEarlyMinutes > 0 ? leftEarlyMinutes : 0;
            }
          }
        }
      }
      
      // If checking in late, calculate how late
      if (attendanceData.type === 'login' && attendanceData.status === 'late' && attendanceData.scheduledStartTime) {
        const scheduledStart = new Date();
        scheduledStart.setHours(
          parseInt(attendanceData.scheduledStartTime.split(':')[0]),
          parseInt(attendanceData.scheduledStartTime.split(':')[1]),
          0, 0
        );
        const actualArrival = new Date();
        const lateByMinutes = Math.round((actualArrival - scheduledStart) / (1000 * 60));
        timingData.lateBy = lateByMinutes > 0 ? lateByMinutes : 0;
      }
      
      const attendance = {
        studentId: attendanceData.studentId,
        studentName: attendanceData.studentName,
        class: attendanceData.class,
        teacherId: attendanceData.teacherId,
        teacherName: attendanceData.teacherName,
        type: attendanceData.type, // 'login' or 'logout'
        status: attendanceData.status || 'present', // 'present', 'late', 'absent', 'checkout', 'left-early'
        activity: attendanceData.activity || 'Class Attendance',
        activityType: attendanceData.activityType || 'classroom',
        
        // Actual times (when scanned)
        timestamp: new Date().toISOString(),
        nztTimestamp: nztDetails.timestamp,
        nztFormatted: nztDetails.formatted,
        nztTimezone: nztDetails.timezone,
        nztIsDST: nztDetails.isDST,
        
        // Scheduled times (for comparison)
        scheduledStartTime: attendanceData.scheduledStartTime || null,
        scheduledEndTime: attendanceData.scheduledEndTime || null,
        
        // Timing calculations (for reports)
        ...timingData,
        
        // Location data
        location: attendanceData.location || 'Classroom',
        gpsLocation: options.currentLocation || null,
        userIP: options.userIP || null,
        
        // Additional data
        notes: attendanceData.notes || '',
        fraudChecked: !options.skipFraudCheck,
        automated: attendanceData.automated || false, // True if auto-checkout
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'attendance'), attendance);

      // Log attendance activity so Student/Parent "Recent Updates" can reflect new scans.
      await this.logActivity({
        type: 'attendance_marked',
        details: {
          studentName: attendance.studentName,
          studentId: attendance.studentId,
          class: attendance.class,
          status: attendance.status,
          action: attendance.type,
          teacherName: attendance.teacherName,
          description: `${attendance.studentName} marked ${attendance.status} (${attendance.type}) in ${attendance.class}`
        }
      });

      // Keep `students.isCheckedIn` in sync with *daily attendance* scans.
      // We intentionally only update for "Class Attendance" style scans (i.e. no custom activity passed)
      // so that activity login/logout tracking doesn't toggle this field unexpectedly.
      try {
        const isDailyAttendance =
          attendanceData.activity === undefined &&
          attendanceData.activityType === undefined;

        if (isDailyAttendance) {
          let nextCheckedIn = null;
          if (attendanceData.type === 'login') {
            // Present/Late => checked in, Absent => not checked in
            nextCheckedIn = (attendanceData.status || 'present') !== 'absent';
          } else if (attendanceData.type === 'logout') {
            nextCheckedIn = false;
          }

          if (typeof nextCheckedIn === 'boolean') {
            const updateData = {
              isCheckedIn: nextCheckedIn
            };
            if (nextCheckedIn) {
              updateData.lastCheckedInAt = nztDetails.timestamp;
            } else {
              updateData.lastCheckedOutAt = nztDetails.timestamp;
            }

            let studentDoc = null;

            // First try direct document id from QR payload.
            if (attendanceData.studentDocId) {
              try {
                await updateDoc(doc(db, 'students', attendanceData.studentDocId), updateData);
                studentDoc = { id: attendanceData.studentDocId };
              } catch (e) {
                // Fall through to other lookup strategies.
              }
            }

            if (!studentDoc) {
              studentDoc = await this.getStudentById(attendanceData.studentId);
            }

            // Fallback: if a student doc was created without `studentId`, try matching by name.
            if (!studentDoc && attendanceData.studentName) {
              const studentsByNameQuery = query(
                collection(db, 'students'),
                where('name', '==', attendanceData.studentName)
              );
              const nameSnapshot = await getDocs(studentsByNameQuery);
              if (!nameSnapshot.empty) {
                const doc = nameSnapshot.docs[0];
                studentDoc = { id: doc.id, ...doc.data() };
              }
            }

            if (studentDoc) {
              await updateDoc(doc(db, 'students', studentDoc.id), updateData);
            } else {
              // Last-resort fallback: some deployments store student docs where the document id
              // is the student's display name or generated studentId (instead of storing `studentId` in fields).
              const updateData = {
                isCheckedIn: nextCheckedIn
              };
              if (nextCheckedIn) {
                updateData.lastCheckedInAt = nztDetails.timestamp;
              } else {
                updateData.lastCheckedOutAt = nztDetails.timestamp;
              }

              const candidateIds = [attendanceData.studentId, attendanceData.studentName].filter(Boolean);
              for (const candidateId of candidateIds) {
                try {
                  await updateDoc(doc(db, 'students', candidateId), updateData);
                  break; // stop once we successfully updated
                } catch (e) {
                  // If the doc doesn't exist, continue to next candidate.
                }
              }
            }
          }
        }
      } catch (syncError) {
        // Attendance should still be recorded even if this sync fails.
        console.warn('Failed to sync students.isCheckedIn:', syncError);
      }
      
      console.log('✅ Attendance recorded with ID:', docRef.id);
      return {
        success: true,
        docId: docRef.id,
        fraudCheck: null,
        message: 'Attendance recorded successfully',
        blocked: false
      };
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance records for a specific student
   * @param {string} studentId - Student ID
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Array>} Array of attendance records
   */
  static async getStudentAttendance(studentId, startDate, endDate) {
    if (!hasFirestore()) return [];
    try {
      const normalizedStudentId = String(studentId || '').toUpperCase();
      const lowerStudentId = normalizedStudentId.toLowerCase();
      const attendance = [];
      const addFromSnapshot = (snapshot) => {
        snapshot.forEach((doc) => {
          attendance.push({
            id: doc.id,
            ...doc.data()
          });
        });
      };
      const safeGetDocs = async (queryRef, label) => {
        try {
          return await getDocs(queryRef);
        } catch (queryError) {
          console.warn(`getStudentAttendance query failed (${label}); falling back to client-side filter.`, queryError);
          return null;
        }
      };
      let q = query(
        collection(db, 'attendance'),
        where('studentId', '==', normalizedStudentId),
        orderBy('timestamp', 'desc')
      );

      // Add date filters if provided
      if (startDate && endDate) {
        q = query(
          collection(db, 'attendance'),
          where('studentId', '==', normalizedStudentId),
          where('timestamp', '>=', startDate),
          where('timestamp', '<=', endDate),
          orderBy('timestamp', 'desc')
        );
      }

      let querySnapshot = await safeGetDocs(q, 'normalized');
      if (querySnapshot) addFromSnapshot(querySnapshot);

      // Backward-compat: older records may have lowercase student IDs.
      if (attendance.length === 0 && lowerStudentId && lowerStudentId !== normalizedStudentId) {
        let lowerQuery = query(
          collection(db, 'attendance'),
          where('studentId', '==', lowerStudentId),
          orderBy('timestamp', 'desc')
        );
        if (startDate && endDate) {
          lowerQuery = query(
            collection(db, 'attendance'),
            where('studentId', '==', lowerStudentId),
            where('timestamp', '>=', startDate),
            where('timestamp', '<=', endDate),
            orderBy('timestamp', 'desc')
          );
        }
        querySnapshot = await safeGetDocs(lowerQuery, 'lowercase');
        if (querySnapshot) addFromSnapshot(querySnapshot);
      }

      // Last-resort fallback: filter client-side for mixed-case historical records.
      if (attendance.length === 0) {
        const allSnapshot = await getDocs(collection(db, 'attendance'));
        allSnapshot.forEach((doc) => {
          const data = doc.data();
          const recordStudentId = String(data.studentId || '').toUpperCase();
          if (recordStudentId === normalizedStudentId) {
            attendance.push({
              id: doc.id,
              ...data
            });
          }
        });
        attendance.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      }

      return attendance;
    } catch (error) {
      console.error('Error getting student attendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance records for a specific class
   * @param {string} className - Class name
   * @param {string} date - Date (ISO string)
   * @returns {Promise<Array>} Array of attendance records
   */
  static async getClassAttendance(className, date) {
    if (!hasFirestore()) return [];
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'attendance'),
        where('class', '==', className),
        where('timestamp', '>=', startOfDay.toISOString()),
        where('timestamp', '<=', endOfDay.toISOString()),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const attendance = [];
      
      querySnapshot.forEach((doc) => {
        attendance.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return attendance;
    } catch (error) {
      console.error('Error getting class attendance:', error);
      throw error;
    }
  }

  /**
   * Get activity summary for a specific activity
   * @param {string} activity - Activity name (e.g., 'Football Practice', 'Library Study')
   * @param {string} date - Date (ISO string)
   * @returns {Promise<Object>} Activity summary
   */
  static async getActivitySummary(activity, date) {
    if (!hasFirestore()) {
      return {
        activity,
        date,
        totalParticipants: 0,
        completedSessions: 0,
        ongoingSessions: 0,
        totalDuration: 0,
        averageDuration: 0,
        sessions: [],
        ongoingStudents: [],
      };
    }
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'attendance'),
        where('activity', '==', activity),
        where('timestamp', '>=', startOfDay.toISOString()),
        where('timestamp', '<=', endOfDay.toISOString()),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const records = [];
      
      querySnapshot.forEach((doc) => {
        records.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Process login/logout pairs to calculate durations
      const activitySessions = [];
      const loginRecords = {};
      
      records.forEach(record => {
        if (record.type === 'login') {
          loginRecords[record.studentId] = record;
        } else if (record.type === 'logout' && loginRecords[record.studentId]) {
          const loginRecord = loginRecords[record.studentId];
          const duration = Math.round((new Date(record.timestamp) - new Date(loginRecord.timestamp)) / (1000 * 60)); // minutes
          
          activitySessions.push({
            studentId: record.studentId,
            studentName: record.studentName,
            loginTime: loginRecord.nztFormatted,
            logoutTime: record.nztFormatted,
            duration: duration,
            location: record.location,
            timezone: record.nztTimezone
          });
          
          delete loginRecords[record.studentId];
        }
      });

      // Calculate summary statistics
      const totalParticipants = new Set(records.map(r => r.studentId)).size;
      const totalDuration = activitySessions.reduce((sum, session) => sum + session.duration, 0);
      const averageDuration = activitySessions.length > 0 ? Math.round(totalDuration / activitySessions.length) : 0;

      return {
        activity,
        date,
        totalParticipants,
        completedSessions: activitySessions.length,
        ongoingSessions: Object.keys(loginRecords).length,
        totalDuration,
        averageDuration,
        sessions: activitySessions,
        ongoingStudents: Object.values(loginRecords).map(r => ({
          studentId: r.studentId,
          studentName: r.studentName,
          loginTime: r.nztFormatted,
          timezone: r.nztTimezone
        }))
      };
    } catch (error) {
      console.error('Error getting activity summary:', error);
      throw error;
    }
  }

  /**
   * Get student activity history
   * @param {string} studentId - Student ID
   * @param {string} activityType - Activity type filter (optional)
   * @param {number} days - Number of days to look back (default 30)
   * @returns {Promise<Array>} Activity history
   */
  static async getStudentActivityHistory(studentId, activityType = null, days = 30) {
    if (!hasFirestore()) return [];
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let q = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId),
        where('timestamp', '>=', startDate.toISOString()),
        orderBy('timestamp', 'desc')
      );

      if (activityType) {
        q = query(
          collection(db, 'attendance'),
          where('studentId', '==', studentId),
          where('activityType', '==', activityType),
          where('timestamp', '>=', startDate.toISOString()),
          orderBy('timestamp', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const activities = [];
      
      querySnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return activities;
    } catch (error) {
      console.error('Error getting student activity history:', error);
      throw error;
    }
  }

  // ===== REAL-TIME LISTENERS =====

  /**
   * Subscribe to real-time attendance updates for a class
   * @param {string} className - Class name
   * @param {Function} callback - Callback function for updates
   * @returns {Function} Unsubscribe function
   */
  static subscribeToClassAttendance(className, callback) {
    if (!hasFirestore()) {
      return () => {};
    }
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'attendance'),
      where('class', '==', className),
      where('timestamp', '>=', startOfDay.toISOString()),
      where('timestamp', '<=', endOfDay.toISOString()),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, callback);
  }

  /**
   * Subscribe to real-time student updates
   * @param {Function} callback - Callback function for updates
   * @returns {Function} Unsubscribe function
   */
  static subscribeToStudents(callback) {
    if (!hasFirestore()) {
      return () => {};
    }
    const q = query(collection(db, 'students'), orderBy('name'));
    return onSnapshot(q, callback);
  }

  // ===== ANNOUNCEMENT MANAGEMENT =====
  
  /**
   * Add a new announcement
   * @param {Object} announcementData - Announcement information
   * @returns {Promise<string>} Document ID of the created announcement
   */
  static async addAnnouncement(announcementData) {
    if (!hasFirestore()) return null;
    try {
      // Add creation timestamp and defaults
      announcementData.createdAt = new Date().toISOString();
      announcementData.updatedAt = new Date().toISOString();
      announcementData.isActive = true;
      announcementData.visibility = announcementData.visibility || 'all'; // all, staff, students, class
      announcementData.targetClasses = announcementData.targetClasses || [];
      announcementData.includeParents = announcementData.includeParents || false;

      const docRef = await addDoc(collection(db, 'announcements'), announcementData);
      
      // Log activity
      await this.logActivity({
        type: 'announcement_created',
        details: {
          announcementTitle: announcementData.title,
          visibility: announcementData.visibility,
          targetClasses: announcementData.targetClasses,
          description: `Announcement "${announcementData.title}" posted for ${announcementData.visibility === 'all' ? 'everyone' : announcementData.visibility}`
        }
      });
      
      console.log('Announcement added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding announcement:', error);
      throw error;
    }
  }

  /**
   * Get announcements based on user role and class
   * @param {string} userRole - 'admin', 'teacher', 'student', 'parent'
   * @param {string} userClass - User's class (for students/teachers)
   * @param {Array} userClasses - Array of classes user has access to (for teachers)
   * @returns {Promise<Array>} Array of announcement documents
   */
  static async getAnnouncementsForUser(userRole, userClass = null, userClasses = []) {
    if (!hasFirestore()) return [];
    try {
      const q = query(
        collection(db, 'announcements'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const allAnnouncements = [];
      querySnapshot.forEach((doc) => {
        allAnnouncements.push({ id: doc.id, ...doc.data() });
      });

      // Filter announcements based on user role and class
      const filteredAnnouncements = allAnnouncements.filter(announcement => {
        // Admin can see all announcements
        if (userRole === 'admin') {
          return true;
        }

        // Global announcements (everyone sees)
        if (announcement.visibility === 'all') {
          return true;
        }

        // Staff-only announcements (teachers and admin)
        if (announcement.visibility === 'staff' && (userRole === 'teacher' || userRole === 'admin')) {
          return true;
        }

        // Student-only announcements (students and parents)
        if (announcement.visibility === 'students' && (userRole === 'student' || userRole === 'parent')) {
          return true;
        }

        // Class-specific announcements
        if (announcement.visibility === 'class') {
          // Teachers can see announcements for their classes
          if (userRole === 'teacher' && userClasses.some(cls => announcement.targetClasses.includes(cls))) {
            return true;
          }
          
          // Students can see announcements for their class
          if (userRole === 'student' && userClass && announcement.targetClasses.includes(userClass)) {
            return true;
          }
          
          // Parents can see announcements for their child's class (if includeParents is true)
          if (userRole === 'parent' && userClass && announcement.targetClasses.includes(userClass) && announcement.includeParents) {
            return true;
          }
        }

        return false;
      });

      return filteredAnnouncements;
    } catch (error) {
      console.error('Error getting announcements:', error);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  }

  /**
   * Get all active announcements (for admin oversight)
   * @returns {Promise<Array>} Array of all announcement documents
   */
  static async getAllAnnouncements() {
    if (!hasFirestore()) return this.getSampleAnnouncements();
    try {
      const q = query(
        collection(db, 'announcements'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const announcements = [];
      querySnapshot.forEach((doc) => {
        announcements.push({ id: doc.id, ...doc.data() });
      });
      // Return sample announcements if none found
      return announcements.length > 0 ? announcements : this.getSampleAnnouncements();
    } catch (error) {
      console.error('Error getting all announcements:', error);
      // Return sample announcements on error
      return this.getSampleAnnouncements();
    }
  }

  /**
   * Get classes for a teacher
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Array>} Array of class names
   */
  static async getTeacherClasses(teacherId) {
    try {
      // This would typically come from a teachers collection
      // For now, return sample data
      return ['10A', '8B', '9C'];
    } catch (error) {
      console.error('Error getting teacher classes:', error);
      return [];
    }
  }

  // ===== ABSENCE REQUEST MANAGEMENT =====

  /**
   * Submit an absence request
   * @param {Object} requestData - Absence request information
   * @returns {Promise<string>} Document ID of the created request
   */
  static async submitAbsenceRequest(requestData) {
    if (!hasFirestore()) return null;
    try {
      const docRef = await addDoc(collection(db, 'absenceRequests'), {
        ...requestData,
        status: 'pending', // pending, approved, rejected
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Log activity
      await this.logActivity({
        type: 'absence_request',
        details: {
          studentName: requestData.studentName,
          parentName: requestData.parentName,
          startDate: requestData.startDate,
          endDate: requestData.endDate,
          description: `Absence request for ${requestData.studentName} from ${requestData.startDate} to ${requestData.endDate}`
        }
      });
      
      console.log('Absence request submitted with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting absence request:', error);
      throw error;
    }
  }

  /**
   * Get all absence requests
   * @param {string} status - Filter by status (optional: 'pending', 'approved', 'rejected')
   * @returns {Promise<Array>} Array of absence request documents
   */
  static async getAllAbsenceRequests(status = null) {
    if (!hasFirestore()) return [];
    try {
      let q;
      if (status) {
        q = query(
          collection(db, 'absenceRequests'),
          where('status', '==', status),
          orderBy('submittedAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'absenceRequests'),
          orderBy('submittedAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      return requests;
    } catch (error) {
      console.error('Error getting absence requests:', error);
      return [];
    }
  }

  /**
   * Get absence requests for a specific student
   * @param {string} studentName - Student name
   * @returns {Promise<Array>} Array of absence request documents
   */
  static async getAbsenceRequestsByStudent(studentName) {
    if (!hasFirestore()) return [];
    try {
      const requests = [];
      const pushSnapshot = (querySnapshot) => {
        querySnapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });
      };

      try {
        const q = query(
          collection(db, 'absenceRequests'),
          where('studentName', '==', studentName),
          orderBy('submittedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        pushSnapshot(querySnapshot);
      } catch (indexError) {
        console.warn('Indexed absence request query failed; using fallback query.', indexError);
        const fallbackQuery = query(
          collection(db, 'absenceRequests'),
          where('studentName', '==', studentName)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        pushSnapshot(fallbackSnapshot);
        requests.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
      }

      return requests;
    } catch (error) {
      console.error('Error getting absence requests by student:', error);
      return [];
    }
  }

  /**
   * Update absence request status
   * @param {string} requestId - Request document ID
   * @param {string} status - New status ('approved' or 'rejected')
   * @param {string} reviewedBy - Name of person reviewing
   * @param {string} reviewNotes - Optional review notes
   * @returns {Promise<void>}
   */
  static async updateAbsenceRequestStatus(requestId, status, reviewedBy, reviewNotes = '') {
    if (!hasFirestore()) return;
    try {
      await updateDoc(doc(db, 'absenceRequests', requestId), {
        status,
        reviewedBy,
        reviewNotes,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('Absence request status updated');
    } catch (error) {
      console.error('Error updating absence request status:', error);
      throw error;
    }
  }

  // ===== EVENT MANAGEMENT =====

  /**
   * Create an event
   * @param {Object} eventData - Event information
   * @returns {Promise<string>} Document ID of the created event
   */
  static async createEvent(eventData) {
    if (!hasFirestore()) return null;
    try {
      const docRef = await addDoc(collection(db, 'events'), {
        ...eventData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Log activity
      await this.logActivity({
        type: 'event_created',
        details: {
          eventTitle: eventData.title,
          eventDate: eventData.eventDate,
          eventType: eventData.eventType,
          description: `Event "${eventData.title}" scheduled for ${eventData.eventDate} at ${eventData.location}`
        }
      });
      
      console.log('Event created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Get all events
   * @param {string} eventType - Filter by event type (optional)
   * @returns {Promise<Array>} Array of event documents
   */
  static async getAllEvents(eventType = null) {
    if (!hasFirestore()) return this.getSampleEvents();
    try {
      let q;
      if (eventType) {
        q = query(
          collection(db, 'events'),
          where('isActive', '==', true),
          where('eventType', '==', eventType),
          orderBy('eventDate', 'asc')
        );
      } else {
        q = query(
          collection(db, 'events'),
          where('isActive', '==', true),
          orderBy('eventDate', 'asc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const events = [];
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
      });
      // Return sample data if no events found
      return events.length > 0 ? events : this.getSampleEvents();
    } catch (error) {
      console.error('Error getting events:', error);
      return this.getSampleEvents();
    }
  }

  /**
   * Get events for a specific user based on their role
   * @param {string} userRole - 'admin', 'teacher', 'student', 'parent'
   * @param {Array} userClasses - Classes the user has access to
   * @returns {Promise<Array>} Array of event documents
   */
  static async getEventsForUser(userRole, userClasses = []) {
    if (!hasFirestore()) return [];
    try {
      const q = query(
        collection(db, 'events'),
        where('isActive', '==', true),
        orderBy('eventDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const allEvents = [];
      querySnapshot.forEach((doc) => {
        allEvents.push({ id: doc.id, ...doc.data() });
      });

      // Filter events based on user role and event type
      const filteredEvents = allEvents.filter(event => {
        // Admin sees all events
        if (userRole === 'admin') {
          return true;
        }

        // Teachers see staff and school-wide events, plus their class events
        if (userRole === 'teacher') {
          if (event.eventType === 'staff' || event.eventType === 'school-wide') {
            return true;
          }
          if (event.eventType === 'class') {
            return event.targetClasses.some(cls => userClasses.includes(cls));
          }
          return false;
        }

        // Students see school-wide and student-parent events, plus their class events
        if (userRole === 'student') {
          if (event.eventType === 'school-wide' || event.eventType === 'student-parent') {
            return true;
          }
          if (event.eventType === 'class') {
            return event.targetClasses.some(cls => userClasses.includes(cls));
          }
          return false;
        }

        // Parents see student-parent events and class events (if includeParents is true)
        if (userRole === 'parent') {
          if (event.eventType === 'student-parent') {
            return true;
          }
          if (event.eventType === 'class' && event.includeParents) {
            return event.targetClasses.some(cls => userClasses.includes(cls));
          }
          return false;
        }

        return false;
      });

      return filteredEvents;
    } catch (error) {
      console.error('Error getting events for user:', error);
      return [];
    }
  }

  /**
   * Update an event
   * @param {string} eventId - Event document ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  static async updateEvent(eventId, updateData) {
    if (!hasFirestore()) return;
    try {
      await updateDoc(doc(db, 'events', eventId), {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      console.log('Event updated successfully');
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete an event (soft delete)
   * @param {string} eventId - Event document ID
   * @returns {Promise<void>}
   */
  static async deleteEvent(eventId) {
    if (!hasFirestore()) return;
    try {
      await updateDoc(doc(db, 'events', eventId), {
        isActive: false,
        updatedAt: new Date().toISOString()
      });
      console.log('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // ===== ACTIVITY LOG MANAGEMENT =====

  /**
   * Log an activity
   * @param {Object} activityData - Activity information
   * @returns {Promise<string>} Document ID of the logged activity
   */
  static async logActivity(activityData) {
    if (!hasFirestore()) return null;
    try {
      const docRef = await addDoc(collection(db, 'activityLog'), {
        ...activityData,
        timestamp: new Date().toISOString()
      });
      
      console.log('Activity logged with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error to prevent breaking the main operation
      return null;
    }
  }

  /**
   * Get activity log
   * @param {string} userRole - User role for filtering
   * @param {string} filter - Activity type filter
   * @param {number} maxResults - Maximum number of activities to return
   * @returns {Promise<Array>} Array of activity documents
   */
  static async getActivityLog(userRole = 'admin', filter = 'all', maxResults = 50) {
    if (!hasFirestore()) return [];
    try {
      // Always use a non-index-dependent query, then filter client-side.
      // This avoids runtime errors when composite indexes are missing.
      const querySnapshot = await getDocs(
        query(collection(db, 'activityLog'), orderBy('timestamp', 'desc'), firestoreLimit(200))
      );
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });

      if (filter === 'all') {
        return activities.slice(0, maxResults);
      }

      const typeMap = {
        students: ['student_added', 'student_updated'],
        teachers: ['teacher_added', 'teacher_updated'],
        events: ['event_created', 'event_updated'],
        announcements: ['announcement_created'],
      };
      const types = typeMap[filter] || [filter];
      return activities.filter((activity) => types.includes(activity.type)).slice(0, maxResults);
    } catch (error) {
      const message = String(error?.message || '');
      if (message.includes('requires an index')) {
        console.warn('Activity log index missing, using fallback query.');
      } else {
        console.error('Error getting activity log:', error);
      }
      // Fallback for missing composite indexes: query broad set, then filter/sort client-side.
      try {
        const fallbackSnapshot = await getDocs(
          query(collection(db, 'activityLog'), orderBy('timestamp', 'desc'), firestoreLimit(200))
        );
        let fallbackActivities = [];
        fallbackSnapshot.forEach((doc) => {
          fallbackActivities.push({ id: doc.id, ...doc.data() });
        });

        if (filter !== 'all') {
          const typeMap = {
            students: ['student_added', 'student_updated'],
            teachers: ['teacher_added', 'teacher_updated'],
            events: ['event_created', 'event_updated'],
            announcements: ['announcement_created'],
          };
          const types = typeMap[filter] || [filter];
          fallbackActivities = fallbackActivities.filter((activity) => types.includes(activity.type));
        }

        fallbackActivities.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        return fallbackActivities.slice(0, maxResults);
      } catch (fallbackError) {
        console.error('Fallback activity log query failed:', fallbackError);
        return [];
      }
    }
  }

  // ===== HELPER FUNCTIONS WITH FALLBACK DATA =====

  /**
   * Get today's attendance summary with fallback data
   * @param {string} className - Name of the class
   * @returns {Promise<Object>} Attendance summary
   */
  static async getTodayAttendanceSummary(className) {
    if (!hasFirestore()) {
      return {
        totalStudents: 15,
        presentStudents: 13,
        absentStudents: 2,
        lateStudents: 2,
        attendance: this.generateSampleAttendance(className, 13, 2),
      };
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get students in the class
      const studentsQuery = query(
        collection(db, 'students'),
        where('class', '==', className)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const totalStudents = studentsSnapshot.size || 15; // Fallback to 15 students
      
      // Get today's attendance
      const attendance = await this.getClassAttendance(className, today);
      
      // Calculate statistics
      const presentStudents = new Set(
        attendance.filter(r => r.type === 'login').map(r => r.studentId)
      ).size || Math.floor(totalStudents * 0.85); // Fallback to 85% attendance
      
      const lateStudents = attendance.filter(r => r.status === 'late').length || 
        Math.floor(totalStudents * 0.1); // Fallback to 10% late
      
      const absentStudents = totalStudents - presentStudents;
      
      // Generate sample attendance records if empty
      let attendanceRecords = attendance;
      if (attendanceRecords.length === 0) {
        attendanceRecords = this.generateSampleAttendance(className, presentStudents, lateStudents);
      }
      
      return {
        totalStudents,
        presentStudents,
        absentStudents,
        lateStudents,
        attendance: attendanceRecords
      };
    } catch (error) {
      console.error('Error getting attendance summary:', error);
      // Return fallback data
      return {
        totalStudents: 15,
        presentStudents: 13,
        absentStudents: 2,
        lateStudents: 2,
        attendance: this.generateSampleAttendance(className, 13, 2)
      };
    }
  }

  /**
   * Generate sample attendance records
   * @param {string} className - Name of the class
   * @param {number} presentCount - Number of present students
   * @param {number} lateCount - Number of late students
   * @returns {Array} Sample attendance records
   */
  static generateSampleAttendance(className, presentCount, lateCount) {
    const sampleNames = [
      'John Smith', 'Emma Johnson', 'Michael Brown', 'Sophia Davis', 'William Wilson',
      'Olivia Martinez', 'James Anderson', 'Ava Taylor', 'Robert Thomas', 'Isabella Moore',
      'David Jackson', 'Mia White', 'Joseph Harris', 'Charlotte Martin', 'Daniel Thompson'
    ];
    
    const attendance = [];
    const now = new Date();
    
    for (let i = 0; i < presentCount; i++) {
      const isLate = i < lateCount;
      const timestamp = new Date(now);
      timestamp.setHours(8, 30 + (isLate ? 20 : 0), 0, 0);
      
      attendance.push({
        studentId: `STU${className.replace(/\s/g, '')}${1000 + i}`,
        studentName: sampleNames[i % sampleNames.length],
        class: className,
        type: 'login',
        status: isLate ? 'late' : 'present',
        timestamp: timestamp.toISOString(),
        location: `Classroom ${className}`
      });
    }
    
    return attendance;
  }

  /**
   * Get all data with fallback
   * @returns {Promise<Object>} All system data
   */
  static async getAllDataWithFallback() {
    try {
      const [students, teachers, classes] = await Promise.all([
        this.getAllStudents(),
        this.getAllTeachers(),
        this.getAllClasses()
      ]);

      // Provide fallback data if collections are empty
      return {
        students: students.length > 0 ? students : this.getSampleStudents(),
        teachers: teachers.length > 0 ? teachers : this.getSampleTeachers(),
        classes: classes.length > 0 ? classes : this.getSampleClasses()
      };
    } catch (error) {
      console.error('Error getting all data:', error);
      return {
        students: this.getSampleStudents(),
        teachers: this.getSampleTeachers(),
        classes: this.getSampleClasses()
      };
    }
  }

  /**
   * Get sample students data
   * @returns {Array} Sample students
   */
  static getSampleStudents() {
    return [
      { id: '1', studentId: 'AC0611', name: 'Avery Coleman', firstName: 'Avery', lastName: 'Coleman', class: '10A', parentContact: 'keira.coleman@whanau.nz' },
      { id: '2', studentId: 'NR1904', name: 'Niko Ramsey', firstName: 'Niko', lastName: 'Ramsey', class: '10A', parentContact: 'dominic.ramsey@whanau.nz' },
      { id: '3', studentId: 'ZE2708', name: 'Zara Ellison', firstName: 'Zara', lastName: 'Ellison', class: '10A', parentContact: 'renee.ellison@whanau.nz' },
      { id: '4', studentId: 'LB1401', name: 'Leo Bennett', firstName: 'Leo', lastName: 'Bennett', class: '10A', parentContact: 'parent4@email.com' },
      { id: '5', studentId: 'IC0306', name: 'Iris Caldwell', firstName: 'Iris', lastName: 'Caldwell', class: '10A', parentContact: 'parent5@email.com' },
      { id: '6', studentId: 'MH2510', name: 'Mason Hartley', firstName: 'Mason', lastName: 'Hartley', class: '10A', parentContact: 'parent6@email.com' },
      { id: '7', studentId: 'SD1602', name: 'Skye Donovan', firstName: 'Skye', lastName: 'Donovan', class: '10A', parentContact: 'parent7@email.com' },
      { id: '8', studentId: 'EM0907', name: 'Ethan Mallory', firstName: 'Ethan', lastName: 'Mallory', class: '9B', parentContact: 'parent8@email.com' },
      { id: '9', studentId: 'AW2112', name: 'Aria Winslow', firstName: 'Aria', lastName: 'Winslow', class: '9B', parentContact: 'parent9@email.com' },
      { id: '10', studentId: 'FC3005', name: 'Felix Crosby', firstName: 'Felix', lastName: 'Crosby', class: '9B', parentContact: 'parent10@email.com' },
    ];
  }

  /**
   * Get sample teachers data
   * @returns {Array} Sample teachers
   */
  static getSampleTeachers() {
    return [
      { id: '1', teacherId: 'MK1203', name: 'Mila Kensley', firstName: 'Mila', lastName: 'Kensley', subject: 'Mathematics', classes: ['10A'] },
      { id: '2', teacherId: 'RP2207', name: 'Rowan Prescott', firstName: 'Rowan', lastName: 'Prescott', subject: 'English', classes: ['9B'] },
      { id: '3', teacherId: 'TM0509', name: 'Talia Mercer', firstName: 'Talia', lastName: 'Mercer', subject: 'Science', classes: ['11A'] },
    ];
  }

  /**
   * Get sample classes data
   * @returns {Array} Sample classes
   */
  static getSampleClasses() {
    return [
      { id: '1', classId: 'CLS10A', name: '10A', teacherName: 'Mila Kensley', subject: 'Mathematics', studentCount: 7 },
      { id: '2', classId: 'CLS9B', name: '9B', teacherName: 'Rowan Prescott', subject: 'English', studentCount: 7 },
      { id: '3', classId: 'CLS11A', name: '11A', teacherName: 'Talia Mercer', subject: 'Science', studentCount: 6 },
    ];
  }

  /**
   * Get sample events data
   * @returns {Array} Sample events
   */
  static getSampleEvents() {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return [
      {
        id: '1',
        title: 'Parent-Teacher Conference',
        description: 'Individual meetings with parents to discuss student progress',
        eventDate: nextWeek.toISOString().split('T')[0],
        startTime: '14:00',
        endTime: '17:00',
        location: 'School Hall',
        eventType: 'student-parent',
        targetClasses: ['10A', '10B', '9A'],
        includeParents: true,
        isActive: true
      },
      {
        id: '2',
        title: 'Science Fair',
        description: 'Annual science fair showcasing student projects',
        eventDate: nextMonth.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '15:00',
        location: 'Main Campus',
        eventType: 'school-wide',
        targetClasses: [],
        includeParents: true,
        isActive: true
      },
      {
        id: '3',
        title: 'Mathematics Workshop',
        description: 'Advanced calculus workshop for Year 10 students',
        eventDate: today.toISOString().split('T')[0],
        startTime: '13:00',
        endTime: '14:30',
        location: 'Math Lab',
        eventType: 'class',
        targetClasses: ['10A', '10B'],
        includeParents: false,
        isActive: true
      },
      {
        id: '4',
        title: 'Staff Meeting',
        description: 'Monthly staff meeting to discuss curriculum updates',
        eventDate: lastWeek.toISOString().split('T')[0],
        startTime: '15:30',
        endTime: '17:00',
        location: 'Staff Room',
        eventType: 'staff',
        targetClasses: [],
        includeParents: false,
        isActive: true
      },
      {
        id: '5',
        title: 'Sports Day',
        description: 'Annual sports day competition for all year levels',
        eventDate: nextMonth.toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '16:00',
        location: 'Sports Field',
        eventType: 'school-wide',
        targetClasses: [],
        includeParents: true,
        isActive: true
      }
    ];
  }

  /**
   * Get sample announcements data
   * @returns {Array} Sample announcements
   */
  static getSampleAnnouncements() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    return [
      {
        id: '1',
        title: 'School Photo Day Next Week',
        message: 'School photos will be taken next Wednesday. Please ensure students are in full uniform. Order forms have been sent home.',
        priority: 'high',
        visibility: 'all',
        targetClasses: [],
        createdBy: 'Admin',
        createdAt: now.toISOString(),
        isActive: true,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: 'Library Extended Hours',
        message: 'The school library will be open until 5:30 PM this week for exam preparation. Study materials and tutoring support available.',
        priority: 'normal',
        visibility: 'students',
        targetClasses: ['10A', '10B', '11A'],
        createdBy: 'Ms. Sarah Johnson',
        createdAt: yesterday.toISOString(),
        isActive: true,
        expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        title: 'Parent-Teacher Interviews Booking Open',
        message: 'Bookings for parent-teacher interviews are now open. Please log in to the parent portal to reserve your preferred time slot.',
        priority: 'high',
        visibility: 'parents',
        targetClasses: [],
        createdBy: 'Admin',
        createdAt: twoDaysAgo.toISOString(),
        isActive: true,
        expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        title: 'Science Lab Equipment Update',
        message: 'New microscopes and lab equipment have been installed in Science Lab B. Please familiarize yourself with the new equipment before your next class.',
        priority: 'normal',
        visibility: 'teachers',
        targetClasses: [],
        createdBy: 'Admin',
        createdAt: threeDaysAgo.toISOString(),
        isActive: true,
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '5',
        title: 'Reminder: School Uniform Policy',
        message: 'Please ensure all students adhere to the school uniform policy. Sports uniforms are only for PE classes and sports days.',
        priority: 'normal',
        visibility: 'all',
        targetClasses: [],
        createdBy: 'Admin',
        createdAt: threeDaysAgo.toISOString(),
        isActive: true,
        expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
}

// Sample data for testing
export const SAMPLE_STUDENTS = [
  {
    studentId: 'AC0611',
    name: 'Avery Coleman',
    firstName: 'Avery',
    lastName: 'Coleman',
    class: '10A',
    parentContact: 'keira.coleman@whanau.nz',
    address: '123 School Street, Auckland, NZ',
    emergencyContact: '+64 21 123 4567',
    photo: null
  },
  {
    studentId: 'NR1904',
    name: 'Niko Ramsey',
    firstName: 'Niko',
    lastName: 'Ramsey',
    class: '10A',
    parentContact: 'dominic.ramsey@whanau.nz',
    address: '456 Learning Lane, Auckland, NZ',
    emergencyContact: '+64 21 987 6543',
    photo: null
  },
  {
    studentId: 'ZE2708',
    name: 'Zara Ellison',
    firstName: 'Zara',
    lastName: 'Ellison',
    class: '9B',
    parentContact: 'renee.ellison@whanau.nz',
    address: '789 Education Ave, Auckland, NZ',
    emergencyContact: '+64 21 555 1234',
    photo: null
  }
];

export const SAMPLE_ATTENDANCE = [
  {
    studentId: 'AC0611',
    studentName: 'Avery Coleman',
    class: '10A',
    teacherId: 'MK1203',
    teacherName: 'Mila Kensley',
    type: 'login',
    timestamp: new Date().toISOString(),
    location: 'Classroom A',
    notes: 'On time'
  }
];
