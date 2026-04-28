# 🔒 Fraud Prevention System Documentation

## Overview

The attendance system now includes comprehensive fraud prevention to ensure accurate attendance tracking and prevent abuse.

---

## 🎯 Key Rules

### 1. **Multiple Events Per Day Allowed** ✅
```
Student can attend:
- Morning class (8:00 AM - 10:00 AM)
- Sports practice (10:30 AM - 12:00 PM)
- Library study (1:00 PM - 3:00 PM)
- After-school club (3:30 PM - 5:00 PM)

All on the same day = ALLOWED ✅
```

### 2. **Only One Event at a Time** 🚫
```
Student CANNOT:
- Check into Football while still in Math Class
- Check into Library while still in Sports

MUST check out of current event BEFORE checking into next event!
```

### 3. **No Duplicate Scans Per Event** 🚫
```
Per activity session:
- Check in: Once only
- Check out: Once only

Cannot scan QR code twice for same activity!
```

---

## 📱 Teacher Interface Changes

### When Scanning QR Code for Check-In:

**Teacher sees 3 buttons:**
```
┌──────────────────────────────────────┐
│  Student: John Doe                   │
│  ID: STU10AJ1234                     │
│  Class: 10A                          │
├──────────────────────────────────────┤
│  [✅ Mark Present (On Time)]         │  ← Green
│  [⏰ Mark Late]                       │  ← Orange
│  [❌ Mark Absent]                     │  ← Red
│  [Cancel]                            │  ← Gray
└──────────────────────────────────────┘
```

**Use Cases:**
- **Mark Present:** Student arrived on time
- **Mark Late:** Student arrived after start time
- **Mark Absent:** Student present but being marked absent for partial day
- **Cancel:** Wrong student or mistake

### When Scanning for Check-Out:

**Teacher sees:**
```
┌──────────────────────────────────────┐
│  Student: John Doe                   │
│  Currently in: Math Class            │
│  Checked in: 8:00 AM                 │
├──────────────────────────────────────┤
│  [👋 Check Out]                      │  ← Purple
│  [Cancel]                            │  ← Gray
└──────────────────────────────────────┘
```

---

## 🔒 Fraud Detection Checks

### Check 1: Already Checked Into Another Event

**Scenario:**
```
Student: John Doe
Currently in: Math Class (checked in at 8:00 AM)
Trying to: Check into Sports (9:00 AM)
```

**Result:**
```
🚨 BLOCKED
Message: "Student is currently checked into Math Class. 
         Please check out first before checking into Sports."
```

**Teacher Action:**
- Check out student from Math Class
- Then check into Sports
- Or verify if it's a mistake

---

### Check 2: Duplicate Scan Same Activity

**Scenario A - Duplicate Check-In:**
```
Student: Jane Smith
Activity: Football Practice
Already checked in: 2:00 PM
Trying to check in again: 2:15 PM
```

**Result:**
```
🚨 BLOCKED
Message: "Student already checked into Football Practice 
         at 2:00 PM"
```

**Scenario B - Duplicate Check-Out:**
```
Student: Jane Smith
Activity: Football Practice
Already checked out: 4:00 PM
Trying to check out again: 4:10 PM
```

**Result:**
```
🚨 BLOCKED
Message: "Student already checked out of Football Practice 
         at 4:00 PM"
```

---

### Check 3: Time-Based Warning (School Hours)

**Configuration:**
```javascript
School Hours: 7:00 AM - 6:00 PM (NZT)
```

**Scenario:**
```
Time: 7:30 PM
Student trying to check in
```

**Result:**
```
⚠️ WARNING (Not blocked, just warned)
Message: "Attendance can only be marked between 7:00 AM 
         and 6:00 PM (NZT) - Proceed with caution"
```

**Teacher can still mark attendance but gets warning**

---

### Check 4: Velocity Check (Optional)

**Scenario:**
```
Student: Bob Wilson
Last scan: Sports Field (2:00 PM)
Current scan: Library (2:03 PM)
Distance: 800 meters in 3 minutes
```

**Result:**
```
⚠️ WARNING
Message: "Student cannot travel 800m in 3 minutes"
(Still allows but logs suspicious activity)
```

---

## 💡 How It Works

### Typical Student Day:

**8:00 AM - Math Class**
```
✅ Check in to Math Class
   → Scan QR → Teacher selects "Present" or "Late"
   → Status: Checked in
```

**9:30 AM - End of Math**
```
✅ Check out of Math Class
   → Scan QR → Automatic checkout
   → Status: Free to check into next event
```

**10:00 AM - Sports Practice**
```
✅ Check in to Sports
   → Scan QR → Teacher selects "Present" or "Late"
   → Status: Checked in to Sports
```

**11:30 AM - Try to scan into Library (WRONG!)**
```
🚨 BLOCKED!
   → Still checked into Sports
   → System prevents check-in
   → Teacher must check out of Sports first
```

---

## 🎯 Benefits

### 1. Prevents Card Sharing
```
If Alice gives her QR card to Bob:
- Bob checks into Math using Alice's card
- Later, actual Alice tries to check into Sports
- System shows: "Already checked into Math"
- Fraud detected! ✅
```

### 2. Prevents Duplicate Scanning
```
Student scans QR code:
- First scan: ✅ Recorded
- Second scan: 🚨 Blocked "Already scanned"
- Prevents accidental double-marking
```

### 3. Ensures One Location at a Time
```
Student physically can only be in one place:
- Checked into Sports
- Cannot check into Library simultaneously
- Must check out first
- Logical consistency ✅
```

---

## 📊 Attendance Status Types

### Status Options:

| Status | Color | Icon | Meaning | Use Case |
|--------|-------|------|---------|----------|
| **Present** | 🟢 Green | ✅ | On time | Student arrived before/at start time |
| **Late** | 🟠 Orange | ⏰ | Late arrival | Student arrived after start time |
| **Absent** | 🔴 Red | ❌ | Not present | Student didn't attend |
| **Checkout** | 🟣 Purple | 👋 | Checked out | Student left/completed activity |

### Database Records:

```javascript
{
  studentId: "STU10AJ1234",
  activity: "Math Class",
  type: "login",  // or "logout"
  status: "late", // 'present', 'late', 'absent', 'checkout'
  timestamp: "2025-10-12T08:15:00Z",
  notes: "Present - Arrived late"
}
```

---

## 🔧 Teacher Workflow Examples

### Example 1: Student Arrives On Time

```
1. Student presents QR card
2. Teacher scans QR code
3. Student info appears
4. Teacher verifies photo matches
5. Teacher clicks "✅ Mark Present"
6. System checks:
   - Not already checked in elsewhere? ✅
   - Not duplicate scan? ✅
   - Within school hours? ✅
7. Attendance recorded as "Present"
```

### Example 2: Student Arrives Late

```
1. Class started at 8:00 AM
2. Student arrives at 8:20 AM
3. Teacher scans QR code
4. Teacher clicks "⏰ Mark Late"
5. System records as "Late"
6. Late arrival logged for reports
```

### Example 3: Student Tries to Check Into Two Events

```
1. Student checked into Math at 8:00 AM
2. At 9:00 AM, tries to check into Sports
3. Teacher scans QR code
4. 🚨 System shows alert:
   "Already checked into Math Class. 
    Please check out first."
5. Teacher options:
   a. Check student out of Math first
   b. Cancel if it's a mistake
```

### Example 4: Student Checks Out

```
1. Activity ending (Math Class at 9:30 AM)
2. Teacher scans student QR codes
3. Student card shows "Check Out" button
4. Teacher clicks "👋 Check Out"
5. System records checkout
6. Student now free for next activity
```

---

## 📈 Reporting Benefits

### Late Arrival Tracking:
```
Reports can now show:
- Total late arrivals per student
- Late arrival patterns (which days/classes)
- Percentage on time vs late
- Improvement over time
```

### Activity Participation:
```
- How long student stayed in activity
- Check-in to check-out duration
- Attendance vs participation hours
- Activity completion rates
```

---

## 🚨 Fraud Prevention Scenarios

### Scenario 1: Friend Using Card
```
Problem: Bob uses Alice's QR card

Detection:
1. Bob checks into Math using Alice's card (8:00 AM)
2. Real Alice tries to check into Sports (10:00 AM)
3. System: "Already checked into Math Class"
4. 🚨 Fraud detected!
5. Teacher investigates
```

### Scenario 2: Scanning QR Twice
```
Problem: Student scans QR twice accidentally

Detection:
1. Student scans QR - marked present
2. Student scans again (maybe photo didn't show)
3. System: "Already checked into this activity"
4. 🚨 Duplicate prevented!
5. No duplicate records
```

### Scenario 3: Being in Two Places
```
Problem: System error or attempted fraud

Detection:
1. Student checked into Library
2. Tries to check into Sports simultaneously
3. System: "Must check out of Library first"
4. 🚨 Physical impossibility prevented!
5. Data integrity maintained
```

---

## ⚙️ Configuration

### School Hours (Configurable):
```javascript
SCHOOL_HOURS = {
  start: '07:00',  // 7:00 AM
  end: '18:00',    // 6:00 PM
  timezone: 'Pacific/Auckland'
}
```

### Velocity Limits (Configurable):
```javascript
MIN_TIME_BETWEEN_LOCATIONS = 5 minutes
MAX_REASONABLE_DISTANCE = 500 meters
```

**Customize these in:** `src/utils/fraudDetection.js`

---

## 📊 Admin Dashboard Additions

### Fraud Detection Reports (Future):
- Number of blocked scans today
- Most common fraud type
- Students with multiple violations
- Velocity violations map
- Time-based violation patterns

### Audit Trail:
- All fraud attempts logged
- Timestamp of each attempt
- Teacher who attempted
- Student involved
- Reason for block

---

## 🎓 Student Education

### Students Should Know:
1. ✅ Can attend multiple events per day
2. ✅ Must check out before next event
3. 🚫 Cannot lend QR card to friends (will be detected)
4. 🚫 Cannot scan QR twice for same event
5. ✅ Late arrivals are tracked but not penalized in scan

---

## 📝 Summary of Changes

**Added:**
- ✅ "Mark Late" button (orange)
- ✅ Three attendance options (Present, Late, Absent)
- ✅ Check for already checked in elsewhere
- ✅ Check for duplicate scans per activity
- ✅ Velocity warnings
- ✅ Time-based warnings
- ✅ Fraud attempt logging

**Prevents:**
- 🚫 Being in two places at once
- 🚫 Scanning QR twice for same event
- 🚫 Card sharing (via multi-location detection)
- 🚫 After-hours abuse (warnings)

**Allows:**
- ✅ Multiple events per day
- ✅ Marking students late
- ✅ Normal check-in/check-out flow
- ✅ Admin override for special cases

---

**The system now has robust fraud prevention while remaining user-friendly!** 🔒✨

