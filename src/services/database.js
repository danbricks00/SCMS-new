import { db } from '../config/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { QRCodeUtils } from '../utils/qrCodeUtils';

// Database service for managing students and attendance
export class DatabaseService {
  
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

      // Generate QR code data
      studentData.qrCode = QRCodeUtils.generateStudentQR(studentData);
      
      // Add creation timestamp
      studentData.createdAt = new Date().toISOString();
      studentData.updatedAt = new Date().toISOString();

      const docRef = await addDoc(collection(db, 'students'), studentData);
      
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

      // Update QR code if student data changed
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
   * Record student attendance/activity
   * @param {Object} attendanceData - Attendance information
   * @returns {Promise<string>} Document ID of the attendance record
   */
  static async recordAttendance(attendanceData) {
    try {
      const { QRCodeUtils } = await import('../utils/qrCodeUtils');
      
      const nztDetails = QRCodeUtils.getNZTDetails();
      
      const attendance = {
        studentId: attendanceData.studentId,
        studentName: attendanceData.studentName,
        class: attendanceData.class,
        teacherId: attendanceData.teacherId,
        teacherName: attendanceData.teacherName,
        type: attendanceData.type, // 'login' or 'logout'
        activity: attendanceData.activity || 'Class Attendance', // e.g., 'Football Practice', 'Library Study'
        activityType: attendanceData.activityType || 'classroom', // 'sports', 'academic', 'library', 'event'
        timestamp: new Date().toISOString(),
        nztTimestamp: nztDetails.timestamp,
        nztFormatted: nztDetails.formatted,
        nztTimezone: nztDetails.timezone,
        nztIsDST: nztDetails.isDST,
        location: attendanceData.location || 'Classroom',
        notes: attendanceData.notes || '',
        duration: attendanceData.duration || null, // Duration in minutes if logout
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'attendance'), attendance);
      
      console.log('Attendance recorded with ID:', docRef.id);
      return docRef.id;
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
      attendance.forEach(record => {
        if (record.type === 'login') {
          presentToday.add(record.studentId);
        }
      });

      summary.presentStudents = presentToday.size;
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
