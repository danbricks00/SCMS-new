import CryptoJS from 'crypto-js';

// QR Code generation and validation utilities
export class QRCodeUtils {
  // Secret key for encrypting QR codes (in production, this should be in environment variables)
  static SECRET_KEY = 'scms-qr-secret-2024';

  /**
   * Generate QR code data for a student
   * @param {Object} studentData - Student information
   * @returns {string} Encrypted QR code data
   */
  static generateStudentQR(studentData) {
    const qrData = {
      studentId: studentData.studentId,
      name: studentData.name,
      class: studentData.class,
      timestamp: Date.now(),
      type: 'student'
    };

    // Encrypt the data
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(qrData), 
      this.SECRET_KEY
    ).toString();

    return encryptedData;
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
        name: 'School Management System',
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
