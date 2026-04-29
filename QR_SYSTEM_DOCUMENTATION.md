# QR Code Attendance System Documentation

## Overview

The School Management System (SCMS) uses a secure QR code-based attendance tracking system. Each student has their own unique, encrypted QR code that teachers can scan to mark attendance and track activities.

## How It Works

### 1. Student QR Code Generation

Each student is assigned a unique QR code when added to the system:

- **Unique Student ID**: Generated using the format `STU[Class][Initials][Timestamp]`
  - Example: `STU10AJ1234` for John Doe in Class 10A
  
- **Encrypted QR Code**: Contains encrypted student information:
  - Student ID
  - Full Name
  - Class
  - Timestamp
  - QR Code Version

- **Security**: All QR codes are encrypted using AES encryption with a secret key

### 2. QR Code Scanning

Teachers can scan student QR codes using the built-in camera scanner:

1. **Camera Permission**: The app requests camera permission on first use
2. **Real-time Scanning**: The scanner continuously looks for QR codes
3. **Instant Validation**: QR codes are decrypted and validated immediately
4. **Student Verification**: After scanning, the student's information is displayed for confirmation

### 3. Attendance Tracking

The system tracks two types of attendance:

#### Regular Attendance
- **Mark Present**: Teacher scans student QR code and marks them present
- **Mark Absent**: Teacher can mark students absent

#### Activity Tracking
- **Login/Check-in**: Student arrives at an activity
- **Logout/Check-out**: Student leaves an activity
- **Duration Tracking**: System automatically calculates activity duration
- **Activity Types**: 
  - Classroom
  - Sports
  - Library
  - Events
  - Clubs

## Using the System

### For Administrators

1. **Add Students**:
   - Navigate to Admin Portal
   - Click "Add Student"
   - Fill in student details (First Name, Last Name, Class)
   - System automatically generates unique Student ID and QR Code

2. **Generate QR Codes**:
   - Go to "Manage Students"
   - Select a student
   - Click "QR Code" button
   - QR code is displayed with option to print
   - Students should keep their printed QR code for daily use

3. **Print QR Codes**:
   - QR codes can be printed as PDF
   - Each printed QR code includes:
     - Student name and ID
     - Class information
     - Instructions for use
     - School branding

### For Teachers

1. **Mark Daily Attendance**:
   - Select your class
   - Click "Mark Present" or "Mark Absent"
   - Scan student's QR code
   - Confirm student details
   - Attendance is recorded with timestamp in NZT

2. **Track Activities**:
   - Click "Track Activities"
   - Select activity type (Sports, Library, etc.)
   - Choose specific activity or enter custom activity
   - Add location (optional)
   - Scan student QR codes when they:
     - Start Activity (Login)
     - End Activity (Logout)

3. **View Attendance Summary**:
   - Real-time attendance count for your classes
   - Today's present/absent statistics
   - Activity participation tracking

### For Students

1. **Your QR Code**:
   - Receive your printed QR code from administrator
   - Keep it safe and bring it daily
   - Do NOT share or duplicate
   - Contact admin if lost or damaged

2. **Using Your QR Code**:
   - Present QR code to teacher for attendance
   - Scan when entering/leaving activities
   - Ensure QR code is visible and not damaged

### For Parents

1. **View Attendance**:
   - Check children's attendance records
   - View attendance percentage
   - See recent attendance history

2. **Notifications**:
   - Receive alerts for absences
   - Get notified of upcoming events

## Date and Time Display

All pages in the system display the current date and time in New Zealand timezone:

**Format**: `Monday 13 October 2025, at 10:11am NZDT`

- Updates every second
- Automatically handles NZST (New Zealand Standard Time) and NZDT (Daylight Time)
- Displayed at the top of every portal page

## Technical Details

### QR Code Data Structure

```javascript
{
  studentId: "STU10AJ1234",
  name: "John Doe",
  class: "10A",
  timestamp: 1704067200000,
  type: "student",
  version: "2.0"
}
```

### Encryption

- **Algorithm**: AES Encryption (via CryptoJS)
- **Secret Key**: Securely stored (should be in environment variables for production)
- **Data Format**: Encrypted string that can only be decrypted with the correct key

### Attendance Records

Each attendance record includes:
- Student Information (ID, Name, Class)
- Teacher Information (ID, Name)
- Type (login/logout, present/absent)
- Activity Details (if applicable)
- Timestamp (ISO format)
- NZT Formatted Time
- Timezone Information (NZST/NZDT)
- Location
- Notes

### Database Schema

**Students Collection**:
- studentId (unique)
- name
- firstName
- lastName
- class
- qrCode (encrypted)
- parentContact
- address
- emergencyContact
- createdAt
- updatedAt

**Attendance Collection**:
- studentId
- studentName
- class
- teacherId
- teacherName
- type (login/logout)
- activity
- activityType
- timestamp
- nztTimestamp
- nztFormatted
- nztTimezone
- nztIsDST
- location
- notes
- duration (for activities)
- createdAt

## Troubleshooting

### QR Code Won't Scan

1. **Camera Permission**: Ensure camera permission is granted
2. **Lighting**: Make sure there's adequate lighting
3. **QR Code Quality**: Check if QR code is clear and not damaged
4. **Distance**: Hold device 6-12 inches from QR code
5. **Alignment**: Center QR code within the scan frame

### QR Code Invalid

1. **Verify QR Code**: Ensure it's an official school QR code
2. **Check Expiration**: Old QR codes may need regeneration
3. **Contact Admin**: Request a new QR code if needed

### Camera Not Working

1. **Permissions**: Go to device settings and enable camera permission
2. **App Restart**: Close and restart the app
3. **Device Restart**: Restart your device
4. **Update App**: Ensure you have the latest version

## Security Features

1. **Encrypted QR Codes**: All student data in QR codes is encrypted
2. **Unique Identification**: Each student has a unique, non-transferable QR code
3. **Timestamp Validation**: QR codes include generation timestamps
4. **Type Checking**: Only student-type QR codes are accepted
5. **Audit Trail**: All scans are logged with timestamps and user information

## Best Practices

### For Students
- Laminate your QR code for durability
- Keep a backup copy at home
- Report lost QR codes immediately
- Never share your QR code

### For Teachers
- Verify student identity after scanning
- Record attendance at consistent times
- Report any scanning issues promptly
- Keep devices charged for scanning

### For Administrators
- Regular backup of student data
- Periodic regeneration of QR codes (if needed)
- Monitor attendance patterns
- Keep contact information updated

## Support

For technical support or questions:
1. Contact your school administrator
2. Check system logs for error details
3. Ensure all dependencies are up to date
4. Review Firebase configuration for database issues

---

**System Version**: 2.0  
**Last Updated**: October 2025  
**Timezone**: Pacific/Auckland (NZST/NZDT)

