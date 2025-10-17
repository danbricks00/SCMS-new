import CryptoJS from 'crypto-js';

// QR Code generation and validation utilities
export class QRCodeUtils {
  // Secret key for encrypting QR codes (in production, this should be in environment variables)
  static SECRET_KEY = 'scms-qr-secret-2024';

  /**
   * Generate QR code data for a student
   * @param {Object} studentData - Student information
   * @param {boolean} includeTimestamp - Whether to include timestamp (default: false for display)
   * @returns {string} Encrypted QR code data
   */
  static generateStudentQR(studentData, includeTimestamp = false) {
    const qrData = {
      studentId: studentData.studentId,
      name: studentData.name,
      class: studentData.class,
      type: 'student',
      version: '2.0' // Version for enhanced tracking
    };

    // Only include timestamp if specifically requested (for attendance scanning)
    if (includeTimestamp) {
      qrData.timestamp = Date.now();
    }

    // Encrypt the data
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(qrData), 
      this.SECRET_KEY
    ).toString();

    return encryptedData;
  }

  /**
   * Get current NZT timestamp (handles both NZST and NZDT automatically)
   * @returns {string} NZT timestamp string
   */
  static getNZTimestamp() {
    const now = new Date();
    // Use Pacific/Auckland timezone which automatically handles NZST/NZDT
    return now.toLocaleString('en-CA', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', 'T') + '.000Z';
  }

  /**
   * Format timestamp for display in NZT (New Zealand Time - handles both NZST and NZDT)
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted NZT time string
   */
  static formatNZTTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * Get the current timezone abbreviation (NZST or NZDT)
   * @returns {string} Timezone abbreviation
   */
  static getNZTimezoneAbbreviation() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-NZ', {
      timeZone: 'Pacific/Auckland',
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName');
    return timeZoneName ? timeZoneName.value : 'NZT';
  }

  /**
   * Get detailed NZT timestamp with timezone info
   * @returns {Object} NZT timestamp object with timezone details
   */
  static getNZTDetails() {
    const now = new Date();
    const timezone = this.getNZTimezoneAbbreviation();
    
    return {
      timestamp: this.getNZTimestamp(),
      formatted: this.formatNZTTime(now.toISOString()),
      timezone: timezone,
      isDST: timezone === 'NZDT'
    };
  }

  /**
   * Decrypt and validate QR code data
   * @param {string} encryptedData - Encrypted QR code data
   * @returns {Object|null} Decrypted student data or null if invalid
   */
  static decryptStudentQR(encryptedData) {
    try {
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedData) {
        throw new Error('Invalid QR code');
      }

      const studentData = JSON.parse(decryptedData);
      
      // Validate required fields
      if (!studentData.studentId || !studentData.name || studentData.type !== 'student') {
        throw new Error('Invalid student QR code format');
      }

      return studentData;
    } catch (error) {
      console.error('QR Code decryption error:', error);
      return null;
    }
  }

  /**
   * Generate a unique student ID
   * @param {string} firstName - Student's first name
   * @param {string} lastName - Student's last name
   * @param {string} studentClass - Student's class
   * @returns {string} Unique student ID
   */
  static generateStudentId(firstName, lastName, studentClass) {
    const timestamp = Date.now().toString().slice(-4);
    const initials = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
    const classCode = studentClass.replace(/[^a-zA-Z0-9]/g, '');
    
    return `STU${classCode}${initials}${timestamp}`;
  }

  /**
   * Validate QR code format
   * @param {string} qrData - QR code data string
   * @returns {boolean} True if valid format
   */
  static isValidQRFormat(qrData) {
    try {
      const decrypted = this.decryptStudentQR(qrData);
      return decrypted !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create printable QR code data
   * @param {Object} studentData - Student information
   * @returns {Object} Data for printable QR code
   */
  static createPrintableQRData(studentData) {
    const qrCode = this.generateStudentQR(studentData);
    
    return {
      qrCode,
      studentInfo: {
        name: studentData.name,
        studentId: studentData.studentId,
        class: studentData.class,
        photo: studentData.photo || null
      },
      generatedAt: new Date().toISOString(),
      schoolInfo: {
        name: 'School Class Management System',
        logo: null // Add school logo URL here
      }
    };
  }
}

// Sample student data structure
export const SAMPLE_STUDENT_DATA = {
  studentId: 'STU10AJ1234',
  name: 'John Doe',
  class: '10A',
  photo: null,
  parentContact: 'parent@email.com',
  address: '123 School Street, Auckland, NZ',
  emergencyContact: '+64 21 123 4567'
};

// QR Code scanning results
export const QR_SCAN_RESULTS = {
  SUCCESS: 'success',
  ERROR: 'error',
  INVALID: 'invalid',
  ALREADY_SCANNED: 'already_scanned'
};
