import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { comprehensiveFraudCheck, formatFraudCheckMessage, logFraudAttempt } from '../utils/fraudDetection';
import { QRCodeUtils } from '../utils/qrCodeUtils';

// Database service for managing students and attendance
export class DatabaseService {
  
  // ===== TEACHER MANAGEMENT =====
  
  /**
   * Add a new teacher to the database
   * @param {Object} teacherData - Teacher information
   * @returns {Promise<string>} Document ID of the created teacher
   */
  static async addTeacher(teacherData) {
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
    try {
      const querySnapshot = await getDocs(collection(db, 'teachers'));
      const teachers = [];
      querySnapshot.forEach((doc) => {
        teachers.push({ id: doc.id, ...doc.data() });
      });
      return teachers;
    } catch (error) {
      console.error('Error getting teachers:', error);
      throw error;
    }
  }

  // ===== CLASS MANAGEMENT =====
  
  /**
   * Add a new class to the database
   * @param {Object} classData - Class information
   * @returns {Promise<string>} Document ID of the created class
   */
  static async addClass(classData) {
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
    try {
      const querySnapshot = await getDocs(collection(db, 'classes'));
      const classes = [];
      querySnapshot.forEach((doc) => {
        classes.push({ id: doc.id, ...doc.data() });
      });
      return classes;
    } catch (error) {
      console.error('Error getting classes:', error);
      throw error;
    }
  }

  // ===== ANNOUNCEMENT MANAGEMENT =====
  
  /**
   * Add a new announcement
   * @param {Object} announcementData - Announcement information
   * @returns {Promise<string>} Document ID of the created announcement
   */
  static async addAnnouncement(announcementData) {
    try {
      // Add creation timestamp
      announcementData.createdAt = new Date().toISOString();
      announcementData.updatedAt = new Date().toISOString();
      announcementData.isActive = true;

      const docRef = await addDoc(collection(db, 'announcements'), announcementData);
      
      console.log('Announcement added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding announcement:', error);
      throw error;
    }
  }

  /**
   * Get all active announcements
   * @returns {Promise<Array>} Array of announcement documents
   */
  static async getActiveAnnouncements() {
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
      throw error;
    }
  }

  // ===== STUDENT MANAGEMENT =====
  
  /**
   * Add a new student to the database
   * @param {Object} studentData - Student information
   * @returns {Promise<string>} Document ID of the created student
   */
  static async addStudent(studentData) {
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
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      const students = [];
      
      querySnapshot.forEach((doc) => {
        students.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return students.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting students:', error);
      throw error;
    }
  }

  /**
   * Get students by class
   * @param {string} className - Class name to filter by
   * @returns {Promise<Array>} Array of student documents
   */
  static async getStudentsByClass(className) {
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
      
      return students.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting students by class:', error);
      throw error;
    }
  }

  /**
   * Get a single student by ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object|null>} Student document or null
   */
  static async getStudentById(studentId) {
    try {
      const q = query(
        collection(db, 'students'),
        where('studentId', '==', studentId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting student by ID:', error);
      throw error;
    }
  }

  /**
   * Update student information
   * @param {string} studentId - Student ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  static async updateStudent(studentId, updateData) {
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
   * Delete a student
   * @param {string} studentId - Student ID
   * @returns {Promise<void>}
   */
  static async deleteStudent(studentId) {
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
    try {
      const { QRCodeUtils } = await import('../utils/qrCodeUtils');
      const nztDetails = QRCodeUtils.getNZTDetails();
      
      // Run fraud detection checks (unless skipped by admin override)
      if (!options.skipFraudCheck && attendanceData.type === 'login') {
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
      
      // If checking out, calculate duration from check-in
      if (attendanceData.type === 'logout') {
        const checkInRecord = todayAttendance?.find(r => 
          r.studentId === attendanceData.studentId && 
          r.activity === attendanceData.activity && 
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
    try {
      let q = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId),
        orderBy('timestamp', 'desc')
      );

      // Add date filters if provided
      if (startDate && endDate) {
        q = query(
          collection(db, 'attendance'),
          where('studentId', '==', studentId),
          where('timestamp', '>=', startDate),
          where('timestamp', '<=', endDate),
          orderBy('timestamp', 'desc')
        );
      }

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
   * Get today's attendance summary for a class
   * @param {string} className - Class name
   * @returns {Promise<Object>} Attendance summary
   */
  static async getTodayAttendanceSummary(className) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendance = await this.getClassAttendance(className, today);
      
      const summary = {
        totalStudents: 0,
        presentStudents: 0,
        absentStudents: 0,
        lateStudents: 0,
        attendance: attendance
      };

      // Get total students in class
      const students = await this.getStudentsByClass(className);
      summary.totalStudents = students.length;

      // Process attendance records
      const presentToday = new Set();
      const lateToday = new Set();
      
      attendance.forEach(record => {
        if (record.type === 'login') {
          presentToday.add(record.studentId);
          if (record.status === 'late') {
            lateToday.add(record.studentId);
          }
        }
      });

      summary.presentStudents = presentToday.size;
      summary.lateStudents = lateToday.size;
      summary.absentStudents = summary.totalStudents - summary.presentStudents;

      return summary;
    } catch (error) {
      console.error('Error getting attendance summary:', error);
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
      console.error('Error getting all announcements:', error);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
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
    try {
      const q = query(
        collection(db, 'absenceRequests'),
        where('studentName', '==', studentName),
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
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
      return events;
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  /**
   * Get events for a specific user based on their role
   * @param {string} userRole - 'admin', 'teacher', 'student', 'parent'
   * @param {Array} userClasses - Classes the user has access to
   * @returns {Promise<Array>} Array of event documents
   */
  static async getEventsForUser(userRole, userClasses = []) {
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
   * @param {number} limit - Maximum number of activities to return
   * @returns {Promise<Array>} Array of activity documents
   */
  static async getActivityLog(userRole = 'admin', filter = 'all', limit = 50) {
    try {
      let q;
      
      if (filter === 'all') {
        q = query(
          collection(db, 'activityLog'),
          orderBy('timestamp', 'desc'),
          limit(limit)
        );
      } else {
        // Map filter to activity types
        const typeMap = {
          'students': ['student_added', 'student_updated'],
          'teachers': ['teacher_added', 'teacher_updated'],
          'events': ['event_created', 'event_updated'],
          'announcements': ['announcement_created'],
        };
        
        const types = typeMap[filter] || [filter];
        q = query(
          collection(db, 'activityLog'),
          where('type', 'in', types),
          orderBy('timestamp', 'desc'),
          limit(limit)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      
      return activities;
    } catch (error) {
      console.error('Error getting activity log:', error);
      return [];
    }
  }
}

// Sample data for testing
export const SAMPLE_STUDENTS = [
  {
    studentId: 'STU10AJ1234',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    class: '10A',
    parentContact: 'john.parent@email.com',
    address: '123 School Street, Auckland, NZ',
    emergencyContact: '+64 21 123 4567',
    photo: null
  },
  {
    studentId: 'STU10BS5678',
    name: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    class: '10A',
    parentContact: 'jane.parent@email.com',
    address: '456 Learning Lane, Auckland, NZ',
    emergencyContact: '+64 21 987 6543',
    photo: null
  },
  {
    studentId: 'STU09CW9012',
    name: 'Bob Wilson',
    firstName: 'Bob',
    lastName: 'Wilson',
    class: '9B',
    parentContact: 'bob.parent@email.com',
    address: '789 Education Ave, Auckland, NZ',
    emergencyContact: '+64 21 555 1234',
    photo: null
  }
];

export const SAMPLE_ATTENDANCE = [
  {
    studentId: 'STU10AJ1234',
    studentName: 'John Doe',
    class: '10A',
    teacherId: 'TCH001',
    teacherName: 'Ms. Johnson',
    type: 'login',
    timestamp: new Date().toISOString(),
    location: 'Classroom A',
    notes: 'On time'
  }
];
