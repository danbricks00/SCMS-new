/**
 * Test/Demo file for QR Code generation and decryption
 * This file can be used to test the QR code system
 */

import { QRCodeUtils } from './qrCodeUtils';

// Sample student data for testing
const sampleStudents = [
  {
    studentId: 'STU10AJ1234',
    name: 'John Doe',
    class: '10A'
  },
  {
    studentId: 'STU10BS5678',
    name: 'Jane Smith',
    class: '10B'
  },
  {
    studentId: 'STU09CW9012',
    name: 'Bob Wilson',
    class: '9C'
  }
];

/**
 * Test QR Code Generation and Decryption
 */
export const testQRCodeSystem = () => {
  console.log('=== QR Code System Test ===\n');

  sampleStudents.forEach((student, index) => {
    console.log(`Test ${index + 1}: ${student.name}`);
    console.log('-----------------------------------');

    // Generate QR Code
    const qrCode = QRCodeUtils.generateStudentQR(student);
    console.log('Generated QR Code:', qrCode.substring(0, 50) + '...');

    // Decrypt QR Code
    const decryptedData = QRCodeUtils.decryptStudentQR(qrCode);
    console.log('Decrypted Data:', decryptedData);

    // Verify data matches
    const isValid = 
      decryptedData &&
      decryptedData.studentId === student.studentId &&
      decryptedData.name === student.name &&
      decryptedData.class === student.class;

    console.log('Validation:', isValid ? '✅ PASS' : '❌ FAIL');
    console.log('\n');
  });

  // Test invalid QR code
  console.log('Test: Invalid QR Code');
  console.log('-----------------------------------');
  const invalidQR = 'This is not a valid QR code';
  const invalidResult = QRCodeUtils.decryptStudentQR(invalidQR);
  console.log('Result:', invalidResult === null ? '✅ Correctly rejected' : '❌ Should reject');
  console.log('\n');

  // Test student ID generation
  console.log('Test: Student ID Generation');
  console.log('-----------------------------------');
  const newStudentId = QRCodeUtils.generateStudentId('Alice', 'Johnson', '11A');
  console.log('Generated ID:', newStudentId);
  console.log('Format Check:', /^STU11AAJ\d{4}$/.test(newStudentId) ? '✅ Valid format' : '❌ Invalid format');
  console.log('\n');

  // Test NZT time formatting
  console.log('Test: NZT Time Formatting');
  console.log('-----------------------------------');
  const nztDetails = QRCodeUtils.getNZTDetails();
  console.log('Current NZT Time:', nztDetails.formatted);
  console.log('Timezone:', nztDetails.timezone);
  console.log('Is DST:', nztDetails.isDST ? 'Yes (NZDT)' : 'No (NZST)');
  console.log('\n');

  console.log('=== Test Complete ===');
};

/**
 * Generate test QR codes for display
 */
export const generateTestQRCodes = () => {
  return sampleStudents.map(student => ({
    student,
    qrCode: QRCodeUtils.generateStudentQR(student)
  }));
};

/**
 * Test QR code with custom data
 */
export const testCustomStudent = (firstName, lastName, className) => {
  console.log(`\n=== Testing Custom Student ===`);
  console.log(`Name: ${firstName} ${lastName}`);
  console.log(`Class: ${className}\n`);

  // Generate student ID
  const studentId = QRCodeUtils.generateStudentId(firstName, lastName, className);
  console.log('Generated Student ID:', studentId);

  // Create student object
  const student = {
    studentId,
    name: `${firstName} ${lastName}`,
    class: className
  };

  // Generate QR Code
  const qrCode = QRCodeUtils.generateStudentQR(student);
  console.log('QR Code (first 50 chars):', qrCode.substring(0, 50) + '...');
  console.log('QR Code Length:', qrCode.length);

  // Test decryption
  const decrypted = QRCodeUtils.decryptStudentQR(qrCode);
  console.log('\nDecrypted Data:', decrypted);

  // Verify
  const isValid = 
    decrypted &&
    decrypted.studentId === studentId &&
    decrypted.name === student.name &&
    decrypted.class === className;

  console.log('\nValidation:', isValid ? '✅ SUCCESS' : '❌ FAILED');

  return { student, qrCode, decrypted, isValid };
};

// Export for use in components
export default {
  testQRCodeSystem,
  generateTestQRCodes,
  testCustomStudent,
  sampleStudents
};

