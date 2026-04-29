# Mobile Scanning & Photo Verification Guide

## Overview

The QR code attendance system is designed for **mobile phone scanning** (iPhone or Android) with **photo verification** to prevent attendance fraud.

## Key Security Feature: Photo Verification

### Why Photos Matter

Students could potentially sign in for their friends by borrowing their QR code cards. To prevent this, the system uses **photo verification**:

1. **Student's photo is printed on their QR code card**
2. **Teacher compares the student's face to the photo** before confirming attendance
3. This prevents classmates from signing in for each other

## System Workflow

### 1. Admin Setup (Any Device)

**Device**: Desktop, tablet, or mobile
**Location**: Admin Portal

#### Add Student with Photo:

```
1. Navigate to Admin Portal
2. Click "Add Student"
3. Fill in student details:
   - Photo URL (optional but recommended)
   - First Name
   - Last Name
   - Class
   - Parent Contact
   - Emergency Contact
4. Save student
```

**Photo Tips:**
- Upload photo to cloud storage (Google Drive, Dropbox, etc.)
- Get shareable link
- Paste URL in photo field
- OR leave blank and affix physical photo to printed card

#### Generate QR Code Card:

```
1. Go to "Manage Students"
2. Select a student
3. Click "QR Code" button
4. System generates printable card with:
   ✓ Student photo (if provided)
   ✓ Student details (Name, ID, Class)
   ✓ QR code
   ✓ Security instructions
5. Print or share PDF
```

### 2. Student Card Preparation

**What Students Receive:**
- Printed QR code card (A5 or letter size)
- Contains:
  - Photo placeholder or actual photo
  - Name and Student ID
  - Class information
  - QR code for scanning
  - Instructions

**Recommended:**
- Laminate the card for durability
- Keep backup copy at home
- Bring card daily to school

**If No Photo URL:**
- Print card with photo placeholder
- Affix physical photo to card
- Laminate to secure photo

### 3. Teacher Attendance (Mobile Phone Required)

**Device**: 📱 iPhone or Android phone (REQUIRED)
**Location**: Teacher Portal

#### Mark Attendance:

```
1. Open app on MOBILE PHONE
2. Navigate to Teacher Portal
3. Select your class
4. Click "Mark Present" or "Mark Absent"
5. Camera opens
6. Student presents their QR card
7. Point phone camera at QR code
8. System scans and decrypts QR code
9. Student information appears with photo
10. **VERIFY: Compare photo to student's face**
11. If match: Click "Mark Present"
12. If no match: Click "Cancel" and investigate
```

#### Track Activities:

```
1. Click "Track Activities"
2. Select activity type (Sports, Library, etc.)
3. Choose specific activity
4. Add location (optional)
5. For each student:
   a. Scan QR code when they arrive (Start Activity)
   b. Verify photo matches student
   c. Confirm check-in
   d. Scan QR code when they leave (End Activity)
   e. Verify photo again
   f. Confirm check-out
```

## Device Requirements

### For Scanning (Teachers)

**MUST USE:**
- ✅ iPhone (iOS)
- ✅ Android Phone

**Features Required:**
- Camera with autofocus
- Adequate lighting
- Camera permissions enabled

**NOT Recommended for Scanning:**
- ❌ Desktop computers (no camera/limited camera)
- ❌ Web browsers (limited camera API support)
- ❌ Tablets (possible but phones are better)

### For Management (Teachers & Admins)

**Can Use Any Device:**
- ✅ Desktop computers
- ✅ Laptops
- ✅ Tablets
- ✅ Mobile phones

**Tasks Available on All Devices:**
- Create/manage students
- Generate QR codes
- View attendance reports
- Create activities/events
- View schedules

## Security & Fraud Prevention

### Built-in Security Features

1. **Encrypted QR Codes**
   - All student data is AES encrypted
   - Cannot be forged or copied
   - Unique to each student

2. **Photo Verification**
   - Student photo on QR card
   - Teacher must verify face matches photo
   - Prevents friends signing in for each other

3. **Audit Trail**
   - Every scan is logged with:
     - Student ID
     - Teacher ID
     - Timestamp (NZT)
     - Location
     - Activity type

4. **Unique Student IDs**
   - Format: `STU[Class][Initials][Timestamp]`
   - Example: `STU10AJ1234`
   - Cannot be duplicated

### Teacher Verification Process

**IMPORTANT: Always follow these steps:**

```
1. Student presents QR card
2. Scan QR code with phone
3. Student info appears on screen
4. Look at photo on screen
5. Look at photo on physical card
6. Look at student's face
7. VERIFY all three match
8. Only then mark attendance
```

**Red Flags:**
- Photo doesn't match student
- Student without their card (using friend's card)
- Damaged/altered QR codes
- Multiple students with same card

**If Suspicious:**
1. Do NOT mark attendance
2. Click "Cancel"
3. Report to admin
4. Request student ID verification
5. Check student records

## Best Practices

### For Teachers

**Daily Attendance:**
- ✅ Use your phone for scanning
- ✅ Ensure good lighting
- ✅ Verify photos match students
- ✅ Report suspicious activity
- ✅ Keep phone charged

**Activity Tracking:**
- ✅ Record both check-in and check-out
- ✅ Verify photos both times
- ✅ Add location information
- ✅ Use specific activity names

**Security:**
- ✅ Never mark attendance without seeing student
- ✅ Always verify photo matches face
- ✅ Report lost/damaged cards immediately
- ✅ Don't let students "borrow" cards

### For Students

**Card Care:**
- ✅ Bring card every day
- ✅ Keep card in protective sleeve/lanyard
- ✅ Don't fold or damage QR code
- ✅ Keep backup copy at home
- ✅ Report lost cards immediately

**Usage:**
- ✅ Present card yourself (not friend)
- ✅ Hold card steady for scanning
- ✅ Ensure QR code is visible and clean
- ✅ Wait for teacher to verify photo

**Security:**
- ✅ Never lend card to classmates
- ✅ Don't share photos of your QR code
- ✅ Report if someone asks to use your card
- ✅ Keep card secure when not in use

### For Administrators

**Setup:**
- ✅ Collect student photos when enrolling
- ✅ Use clear, recent photos
- ✅ Print high-quality QR cards
- ✅ Laminate cards before distribution
- ✅ Keep digital backup of cards

**Management:**
- ✅ Train teachers on photo verification
- ✅ Monitor attendance patterns
- ✅ Investigate suspicious activity
- ✅ Replace lost/damaged cards promptly
- ✅ Update photos annually

**Security:**
- ✅ Regular audits of attendance records
- ✅ Check for duplicate scans
- ✅ Verify teacher compliance
- ✅ Update secret keys periodically
- ✅ Backup database regularly

## Troubleshooting

### Camera Won't Open

**On iPhone:**
1. Go to Settings → Privacy → Camera
2. Find School Management app
3. Enable camera permission
4. Restart app

**On Android:**
1. Go to Settings → Apps → School Management
2. Tap Permissions
3. Enable Camera
4. Restart app

### QR Code Won't Scan

**Check:**
- ✅ Adequate lighting
- ✅ QR code not damaged/wrinkled
- ✅ Hold phone 6-12 inches away
- ✅ Center QR code in scan frame
- ✅ Hold steady for 1-2 seconds

**If Still Fails:**
1. Clean camera lens
2. Clean QR code (if laminated)
3. Try different angle/lighting
4. Request new QR card if damaged

### Photo Doesn't Match

**Possible Reasons:**
- Student grew/changed appearance
- Wrong card (friend's card)
- Old photo on card
- Damaged photo

**Action:**
1. Do NOT mark attendance
2. Verify student identity (student ID)
3. If genuine: Request updated card
4. If fraud: Report to admin

### Wrong Platform Warning

**If you see:** "Mobile Device Required"

**Solution:**
- Open app on iPhone or Android phone
- Desktop/web cannot scan QR codes
- Use desktop only for management tasks

## Summary

✅ **Admins**: Use any device to manage students and generate QR cards
✅ **Teachers**: Use mobile phone for scanning, verify photos always
✅ **Students**: Keep card safe, bring daily, never lend to friends
✅ **Security**: Photo verification prevents attendance fraud
✅ **System**: Encrypted QR codes, audit trail, mobile-optimized

---

**Remember:** The photo verification step is crucial for preventing fraud. Always verify the student's face matches both the photo on screen and the photo on their physical card before marking attendance.

**Support:** Contact your school administrator for technical issues or to report lost cards.

