# 📚 Complete Attendance Features Documentation

## 🎯 Fraud Prevention & Advanced Features Implemented

---

## ✅ Feature #1: Mark Students as Late

### Teacher Options When Scanning QR:

**Check-In (Login):**
```
┌──────────────────────────────────────┐
│  [✅ Mark Present]     Green          │
│  [⏰ Mark Late]        Orange         │
│  [❌ Mark Absent]      Red            │
│  [Cancel]              Gray           │
└──────────────────────────────────────┘
```

**Check-Out (Logout):**
```
┌──────────────────────────────────────┐
│  [✓ Check Out (Completed)]  Green    │
│  [⚠️ Left Early]            Orange   │
│  [Cancel]                   Gray     │
└──────────────────────────────────────┘
```

---

## ✅ Feature #2: One Event at a Time

### Rule: Student Can Only Be at ONE Place

**Example Scenario:**
```
8:00 AM - Student checks into Math Class ✅
9:00 AM - Student tries to check into Sports ❌

🚨 BLOCKED!
Message: "Student is currently checked into Math Class. 
         Please check out first before checking into Sports."

Solution:
1. Teacher checks student out of Math Class
2. Then student can check into Sports ✅
```

**Multiple Events Per Day (Allowed):**
```
8:00 AM - Check in to Math Class
9:30 AM - Check out of Math Class
10:00 AM - Check in to Sports Practice ✅
12:00 PM - Check out of Sports
1:00 PM - Check in to Library Study ✅
3:00 PM - Check out of Library

Total: 3 different events same day = ALLOWED ✅
```

---

## ✅ Feature #3: QR Code Scan Once Per Activity

### Rule: Can't Scan Same QR Twice for Same Event

**Example Scenario:**
```
Activity: Football Practice

Student scans QR:
- First scan: ✅ Checked in
- Second scan: 🚨 BLOCKED!

Message: "Student already checked into Football Practice 
         at 2:00 PM"
```

**Prevents:**
- Accidental double-scanning
- Intentional duplicate marking
- Database duplicates

---

## ✅ Feature #4: Left Early Tracking

### When Student Leaves Before Activity Ends

**Check-Out Options:**
```
Normal Checkout:
[✓ Check Out (Completed)] ← Student stayed until end

Early Departure:
[⚠️ Left Early] ← Student left before scheduled end time
```

**Use Cases:**
- Student feels sick and leaves early
- Student has appointment
- Student behavior issue (sent home)
- Emergency pickup

**Recorded As:**
```
{
  status: "left-early",
  notes: "Left early - Did not complete full activity",
  checkoutTime: "15:30",
  scheduledEnd: "17:00",
  completionPercentage: 75%
}
```

---

## ✅ Feature #5: Activity Pre-Scheduling

### Teacher Can Schedule Activities in Advance

**Schedule Modal:**
```
┌──────────────────────────────────────┐
│  Schedule Activity               [×]  │
├──────────────────────────────────────┤
│  Start Time:  [08:00]                │
│  End Time:    [09:30]                │
│                                      │
│  Auto-Checkout Students      [ON]    │
│  Automatically check out all         │
│  students at end time                │
│                                      │
│  Recurring Activity          [OFF]   │
│  Repeat this schedule for            │
│  future sessions                     │
│                                      │
│  [Save Schedule]                     │
└──────────────────────────────────────┘
```

**Benefits:**
- Set activity duration
- Auto-checkout enabled by default
- Recurring for regular classes
- One-time for special events

---

## ✅ Feature #6: Auto-Checkout System

### Automatic Student Logout at Scheduled End Time

**How It Works:**
```
Activity: Math Class
Scheduled: 8:00 AM - 9:30 AM
Auto-Checkout: Enabled

Students checked in:
- John Doe (8:00 AM)
- Jane Smith (8:05 AM - Late)
- Bob Wilson (8:10 AM - Late)

At 9:30 AM (End Time):
🤖 System automatically checks out all 3 students
```

**Auto-Checkout Record:**
```
{
  type: "logout",
  status: "checkout",
  teacherId: "SYSTEM",
  teacherName: "Auto-Checkout System",
  notes: "Auto-checkout at scheduled end time (09:30)",
  automated: true
}
```

**Benefits:**
- Teachers don't need to manually check out everyone
- No forgotten checkouts
- Accurate attendance duration
- Consistent end times

---

## 📊 Attendance Status Types (Complete)

| Status | When Checking In | When Checking Out | Icon | Color |
|--------|------------------|-------------------|------|-------|
| **Present** | Arrived on time | - | ✅ | Green |
| **Late** | Arrived after start | - | ⏰ | Orange |
| **Absent** | Didn't attend | - | ❌ | Red |
| **Checkout** | - | Stayed until end/normal | ✓ | Green |
| **Left Early** | - | Left before end time | ⚠️ | Orange |
| **Auto-Checkout** | - | System auto-checkout | 🤖 | Purple |

---

## 🔒 Fraud Prevention Rules Summary

### 1. ✅ Multiple Events Per Day
```
Allowed: Check in/out of different activities throughout the day
Example: Math → Sports → Library → Club
```

### 2. 🚫 Only One Event at a Time
```
Blocked: Being checked into two activities simultaneously
Must checkout of current before checking into next
```

### 3. 🚫 No Duplicate Scans
```
Blocked: Scanning QR code twice for same activity
Each QR can only be scanned once per event session
```

### 4. ⚠️ School Hours Warning
```
Warning: Scanning outside 7:00 AM - 6:00 PM
Still allows but logs warning
Teacher can proceed
```

### 5. ⚠️ Velocity Check
```
Warning: Student traveling too fast between locations
Flags suspicious activity
Doesn't block but alerts
```

---

## 🎓 Real-World Examples

### Example 1: Normal School Day

**John Doe's Day:**
```
8:00 AM  - ✅ Check in to Math (Present)
9:30 AM  - 🤖 Auto-checkout from Math
10:00 AM - ✅ Check in to Science (Present)
11:30 AM - ✓ Check out of Science (Completed)
12:30 PM - ⏰ Check in to Sports (Late - arrived 12:35)
2:30 PM  - ✓ Check out of Sports (Completed)
3:00 PM  - ✅ Check in to Library (Present)
4:00 PM  - ⚠️ Check out of Library (Left Early - sick)
```

**Result:** 4 activities, all tracked with status

---

### Example 2: Late Arrival

**Jane Smith:**
```
Class: Math
Scheduled: 8:00 AM - 9:30 AM
Student arrives: 8:15 AM

Teacher scans QR:
→ Clicks "⏰ Mark Late"
→ Recorded as: "Present - Arrived late"
→ Check-in time: 8:15 AM
→ Late by: 15 minutes
```

---

### Example 3: Left Early

**Bob Wilson:**
```
Activity: Football Practice
Scheduled: 3:00 PM - 5:00 PM
Checked in: 3:00 PM
Student leaves: 4:30 PM (appointment)

Teacher scans QR:
→ Clicks "⚠️ Left Early"
→ Recorded as: "Left early - Did not complete"
→ Duration: 1.5 hours (of 2 hours)
→ Completion: 75%
```

---

### Example 4: Auto-Checkout

**Entire Class:**
```
Activity: Science Lab
Scheduled: 10:00 AM - 11:30 AM
Auto-Checkout: Enabled

30 students checked in between 10:00-10:05 AM

At 11:30 AM:
🤖 System automatically checks out all 30 students
No teacher action needed!
```

---

### Example 5: Fraud Attempt Blocked

**Card Sharing Detected:**
```
Student: Alice Johnson
8:00 AM - Checked into Math (using her card)
9:00 AM - Tries to check into Sports

🚨 BLOCKED!
Reason: "Already checked into Math Class"

What happened:
- Friend used Alice's card for Math
- Real Alice tried to check into Sports
- System detected impossible situation
- Fraud prevented! ✅
```

---

## 📱 Teacher Workflow

### Starting an Activity:

**Step 1: Open Activity Scanner**
```
Teacher Portal → Track Activities
```

**Step 2: Select Activity Type**
```
Choose: Classroom / Sports / Library / Event / Club
```

**Step 3: Choose Specific Activity**
```
Select from list or enter custom activity name
```

**Step 4: (Optional) Schedule Activity**
```
Click "Set Activity Time & Auto-Checkout"
→ Enter start time (08:00)
→ Enter end time (09:30)
→ Enable auto-checkout toggle
→ Enable recurring if regular class
→ Save
```

**Step 5: Check In Students**
```
Click "Check In"
→ Scan student QR codes
→ For each student:
   - Verify photo
   - Choose: Present / Late / Absent
   - Confirm
```

**Step 6: Check Out Students**
```
Option A: Manual
→ Click "Check Out"
→ Scan student QR codes
→ Choose: Completed / Left Early

Option B: Automatic
→ Do nothing!
→ At scheduled end time (09:30)
→ System auto-checks out all students
```

---

## 🤖 Auto-Checkout Details

### When Auto-Checkout Triggers:
- At exact scheduled end time
- Only for activities with auto-checkout enabled
- Only students still checked in
- Creates logout record for each student

### What Gets Logged:
```javascript
{
  type: "logout",
  status: "checkout",
  teacherId: "SYSTEM",
  teacherName: "Auto-Checkout System",
  automated: true,
  scheduledEndTime: "09:30",
  actualCheckoutTime: "09:30",
  notes: "Auto-checkout at scheduled end time"
}
```

### Students Who Left Early:
- Not auto-checked out (already manually checked out)
- Manual "Left Early" status preserved
- Duration calculated correctly

---

## 📊 Reporting Benefits

### New Report Metrics:

**Attendance Breakdown:**
- Present (On Time): 85%
- Late Arrivals: 10%
- Absent: 5%

**Participation Quality:**
- Completed Full Activity: 90%
- Left Early: 8%
- No-Show: 2%

**Per Student:**
- Late arrival rate
- Early departure rate
- Average participation time
- Completion percentage

**Per Activity:**
- Average attendance
- Late arrival patterns
- Early departure trends
- Peak participation times

---

## ⚙️ Configuration Options

### School Hours:
```javascript
// In: src/utils/fraudDetection.js
SCHOOL_HOURS = {
  start: '07:00',  // 7:00 AM
  end: '18:00',    // 6:00 PM
  timezone: 'Pacific/Auckland'
}
```

### Auto-Checkout:
```javascript
// Per activity basis
{
  autoCheckout: true,  // Enable/disable
  endTime: "17:00"     // When to trigger
}
```

### Velocity Limits:
```javascript
MIN_TIME_BETWEEN_LOCATIONS = 5 minutes
MAX_REASONABLE_DISTANCE = 500 meters
```

---

## 🎯 Summary of New Features

**Check-In Options:**
1. ✅ Mark Present (On Time)
2. ⏰ Mark Late
3. ❌ Mark Absent

**Check-Out Options:**
4. ✓ Check Out (Completed)
5. ⚠️ Left Early

**Fraud Prevention:**
6. 🚫 Only one event at a time
7. 🚫 No duplicate scans per activity
8. ✅ Multiple events per day allowed

**Automation:**
9. 🤖 Auto-checkout at scheduled end time
10. 📅 Pre-schedule activities with times
11. 🔄 Recurring activity schedules

**Tracking:**
12. ⏱️ Late arrival tracking
13. 🏃 Early departure tracking
14. 📊 Completion percentage
15. 🕐 Duration calculation

---

## 💡 Best Practices

### For Teachers:

**Use Scheduling:**
- Set start/end times for all activities
- Enable auto-checkout for classes
- Disable auto-checkout for flexible activities

**Mark Accurately:**
- Use "Late" for late arrivals (tracks patterns)
- Use "Left Early" when students leave (medical, appointment)
- Use "Completed" for normal checkouts

**Review Before Marking:**
- Verify student photo
- Check existing activity status
- Read any fraud warnings

### For Students:

**Bring QR Card:**
- Always have card
- Check in when arriving
- Check out when leaving

**Avoid Issues:**
- Don't lend card to friends (fraud detection!)
- Don't forget to check out
- Inform teacher if leaving early

---

## 🔐 Security Features

**Prevents:**
- ✅ Card sharing (one location at a time)
- ✅ Duplicate scanning (once per activity)
- ✅ After-hours abuse (warnings)
- ✅ Impossible movement (velocity checks)

**Allows:**
- ✅ Legitimate late arrivals
- ✅ Early departures with reason
- ✅ Multiple activities per day
- ✅ Flexible scheduling

---

**Your attendance system now has enterprise-level fraud prevention!** 🔒✨

