# 📊 Database Schema - Complete Timing Data for Reports

## 🎯 Overview

Every attendance record captures **comprehensive timing data** for detailed reporting and analytics.

---

## 📝 Database Record Structure

### Complete Attendance Record Example:

```javascript
{
  // === STUDENT IDENTIFICATION ===
  studentId: "STU10AJ1234",
  studentName: "John Doe",
  class: "10A",
  
  // === TEACHER/INSTRUCTOR ===
  teacherId: "TCH001",
  teacherName: "Ms. Johnson",
  
  // === ACTIVITY DETAILS ===
  activity: "Math Class",
  activityType: "classroom",
  type: "login",  // 'login' or 'logout'
  status: "late", // 'present', 'late', 'absent', 'checkout', 'left-early'
  
  // === ACTUAL TIMES (When QR Code Was Scanned) ===
  timestamp: "2025-10-13T08:15:00.000Z",     // ISO format
  nztTimestamp: "2025-10-13T20:15:00.000Z",  // NZ timezone
  nztFormatted: "13/10/2025, 20:15:00",      // Human readable
  nztTimezone: "NZDT",                       // NZST or NZDT
  nztIsDST: true,
  
  // === SCHEDULED TIMES (Planned Activity Duration) ===
  scheduledStartTime: "08:00",  // HH:MM format
  scheduledEndTime: "09:30",    // HH:MM format
  
  // === TIMING CALCULATIONS (For Check-Out Records) ===
  checkInTime: "2025-10-13T08:15:00.000Z",   // When they checked in
  checkOutTime: "2025-10-13T09:20:00.000Z",  // When they checked out
  durationMinutes: 65,                       // How long they stayed
  durationHours: "1.08",                     // Duration in hours
  completionPercentage: 72,                  // 65/90 minutes = 72%
  
  // === LATE/EARLY CALCULATIONS ===
  lateBy: 15,           // Arrived 15 minutes late (if status='late')
  leftEarlyBy: 10,      // Left 10 minutes early (if status='left-early')
  
  // === LOCATION DATA ===
  location: "Classroom A",
  gpsLocation: {
    latitude: -36.8485,
    longitude: 174.7633,
    accuracy: 10
  },
  userIP: "192.168.1.100",
  
  // === SECURITY & AUDIT ===
  fraudChecked: true,
  automated: false,  // True if auto-checkout by system
  notes: "Present - Arrived late",
  createdAt: "2025-10-13T08:15:00.000Z"
}
```

---

## 📊 Report Queries You Can Run

### 1. **Student Attendance Summary**

```javascript
Query: Get all records for student STU10AJ1234

Results:
- Total activities attended: 45
- Total hours participated: 120.5 hours
- Average duration per activity: 2.68 hours
- On-time rate: 85% (38/45 present, 7 late)
- Early departure rate: 5% (2/45 left early)
- Completion rate: 95% average
```

### 2. **Late Arrival Analysis**

```javascript
Query: Filter by status='late'

Data Available:
- Number of late arrivals per student
- Average late by (minutes)
- Which activities have most late arrivals
- Which days have most late arrivals
- Time patterns (always late for morning classes?)
```

**Example Report:**
```
John Doe - Late Arrival Pattern:
- Total late: 7 times
- Average late by: 12 minutes
- Most late for: Math Class (5/7)
- Worst time: Mondays 8:00 AM class
- Improvement trend: Getting better!
```

### 3. **Early Departure Tracking**

```javascript
Query: Filter by status='left-early'

Data Available:
- Number of early departures
- Average left early by (minutes)
- Completion percentage
- Reasons (from notes field)
```

**Example Report:**
```
Jane Smith - Early Departures:
- Total early exits: 2
- Average left early by: 25 minutes
- Completion rate: 83%
- Reasons: Medical (1), Appointment (1)
```

### 4. **Activity Duration Analysis**

```javascript
Query: Group by activity, aggregate duration

Results:
Math Class:
- Average duration: 1.5 hours (of 1.5 scheduled)
- Completion rate: 100%
- Students complete full class

Football Practice:
- Average duration: 1.8 hours (of 2.0 scheduled)
- Completion rate: 90%
- Some leave before end
```

### 5. **Time Comparison Report**

```javascript
Scheduled vs Actual:

Activity: Science Lab
Scheduled: 10:00 - 11:30 (90 minutes)

Student Performance:
- John: 10:05 - 11:30 (Late 5 min, Completed 85 min, 94%)
- Jane: 10:00 - 11:20 (On time, Left early 10 min, 89%)
- Bob: 10:15 - 11:30 (Late 15 min, Completed 75 min, 83%)

Class Average:
- Avg late: 6.7 minutes
- Avg duration: 81.7 minutes
- Avg completion: 91%
```

---

## 📈 Detailed Report Examples

### Monthly Attendance Report:

```sql
For: October 2025
Student: John Doe (STU10AJ1234)

Summary:
- Total Activities: 80
- Present (On Time): 68 (85%)
- Late Arrivals: 10 (12.5%)
- Absent: 2 (2.5%)

Time Analysis:
- Total Hours Participated: 185.5 hours
- Average Duration: 2.32 hours
- Completion Rate: 94%
- Late By Average: 8 minutes
- Left Early: 3 times (avg 15 min early)

By Activity Type:
- Classroom: 40 sessions, 96% attendance, 2.0 hrs avg
- Sports: 20 sessions, 90% attendance, 1.5 hrs avg
- Library: 15 sessions, 88% attendance, 1.8 hrs avg
- Events: 5 sessions, 100% attendance, 3.0 hrs avg

Late Arrival Patterns:
- Monday AM: 4 late arrivals
- Friday PM: 2 late arrivals
- Improving trend: -20% vs last month

Recommendations:
- Monitor Monday morning punctuality
- Otherwise excellent attendance!
```

---

## 🗄️ Database Fields Reference

### Always Present (Every Record):

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `studentId` | string | Unique ID | "STU10AJ1234" |
| `studentName` | string | Full name | "John Doe" |
| `class` | string | Class/Grade | "10A" |
| `teacherId` | string | Who recorded | "TCH001" |
| `teacherName` | string | Teacher name | "Ms. Johnson" |
| `activity` | string | Activity name | "Math Class" |
| `activityType` | string | Category | "classroom" |
| `type` | string | Check in/out | "login" or "logout" |
| `status` | string | Attendance status | "present", "late", etc. |
| `timestamp` | ISO datetime | When scanned | "2025-10-13T08:15:00Z" |
| `location` | string | Where | "Classroom A" |
| `notes` | string | Additional info | "Arrived late" |

### Timing Data (For Analysis):

| Field | Type | Calculated When | Purpose |
|-------|------|-----------------|---------|
| `scheduledStartTime` | HH:MM | On check-in | When activity should start |
| `scheduledEndTime` | HH:MM | On check-in | When activity should end |
| `lateBy` | minutes | On late check-in | How many minutes late |
| `checkInTime` | ISO datetime | On check-out | Reference to check-in |
| `checkOutTime` | ISO datetime | On check-out | Actual checkout time |
| `durationMinutes` | number | On check-out | Total time in activity |
| `durationHours` | decimal | On check-out | Duration in hours |
| `completionPercentage` | % | On check-out | % of scheduled time completed |
| `leftEarlyBy` | minutes | On early checkout | How early they left |

### Optional Data:

| Field | Type | Purpose |
|-------|------|---------|
| `gpsLocation` | object | GPS coordinates for location verification |
| `userIP` | string | Network tracking |
| `fraudChecked` | boolean | Was fraud detection run |
| `automated` | boolean | Auto-checkout vs manual |

---

## 📊 Report Query Examples

### Query 1: Students Who Are Habitually Late

```javascript
// Find students late more than 20% of the time
db.attendance
  .where('status', '==', 'late')
  .groupBy('studentId')
  .having(count > totalAttendance * 0.2)
  
Results:
- Bob Wilson: 15 late / 60 total = 25%
- Action: Send warning to parent
```

### Query 2: Average Class Duration

```javascript
// Calculate average time spent in each activity
db.attendance
  .where('type', '==', 'logout')
  .groupBy('activity')
  .aggregate({ avg: 'durationMinutes' })
  
Results:
- Math Class: 88 minutes avg (scheduled 90)
- Football: 110 minutes avg (scheduled 120)
- Library: 95 minutes avg (scheduled 90)
```

### Query 3: Completion Rates

```javascript
// Find activities with low completion rates
db.attendance
  .where('type', '==', 'logout')
  .aggregate({ avg: 'completionPercentage' })
  .orderBy('avg', 'asc')
  
Results (Low to High):
- Drama Club: 78% avg (students often leave early)
- Math Class: 98% avg (students stay)
- Sports: 92% avg (some early for transport)
```

### Query 4: Peak Late Times

```javascript
// When do students arrive late most often?
db.attendance
  .where('status', '==', 'late')
  .groupBy('scheduledStartTime')
  .count()
  
Results:
- 8:00 AM: 45 late arrivals (Morning classes)
- 1:00 PM: 12 late arrivals (After lunch)
- 3:00 PM: 5 late arrivals (After school)
```

---

## 📈 Advanced Analytics Possible

### 1. **Trend Analysis**
```
Compare month-over-month:
- Late arrival trend
- Completion rate trend
- Participation hours trend
- Improvement or decline
```

### 2. **Predictive Analytics**
```
Based on patterns:
- Predict likely late arrivals
- Forecast activity participation
- Identify at-risk students
- Suggest interventions
```

### 3. **Correlation Analysis**
```
Correlate:
- Late arrivals with academic performance
- Participation hours with grades
- Activity type with engagement
- Day of week with attendance
```

### 4. **Efficiency Metrics**
```
For teachers/admin:
- Which activities run on schedule
- Which activities end early
- Optimal activity duration
- Resource utilization
```

---

## 🎯 Sample Report Queries

### Student Performance Report:

```javascript
function generateStudentReport(studentId, startDate, endDate) {
  const records = await getStudentAttendance(studentId, startDate, endDate);
  
  return {
    totalActivities: records.length / 2, // login + logout = 1 activity
    
    attendance: {
      present: countWhere(records, 'status', 'present'),
      late: countWhere(records, 'status', 'late'),
      absent: countWhere(records, 'status', 'absent'),
      lateRate: percentage(late, total)
    },
    
    participation: {
      totalHours: sum(records, 'durationHours'),
      avgDuration: avg(records, 'durationMinutes'),
      completionRate: avg(records, 'completionPercentage'),
      leftEarlyCount: countWhere(records, 'status', 'left-early')
    },
    
    punctuality: {
      onTimeRate: percentage(present, total),
      avgLateBy: avg(lateRecords, 'lateBy'),
      mostLateFor: findMostCommon(lateRecords, 'activity'),
      latePattern: groupBy(lateRecords, 'dayOfWeek')
    },
    
    engagement: {
      avgCompletionRate: avg(records, 'completionPercentage'),
      earlyExitRate: percentage(leftEarly, total),
      avgLeftEarlyBy: avg(earlyRecords, 'leftEarlyBy')
    }
  };
}
```

---

## 💾 Database Collections

### 1. **Attendance Collection** (Main)
```
Collection: 'attendance'
Documents: One per scan (check-in or check-out)
Index on: studentId, timestamp, activity, type
```

### 2. **Activity Schedules Collection** (Future)
```
Collection: 'activitySchedules'
Documents: One per scheduled activity
Fields:
- activityName
- startTime
- endTime
- daysOfWeek
- autoCheckout
- recurring
```

### 3. **Fraud Logs Collection** (Future)
```
Collection: 'fraudLogs'
Documents: One per fraud detection event
Fields:
- studentId
- issueType
- severity
- timestamp
- details
```

---

## 📊 Report Types Enabled

### 1. Student Individual Reports

**Data Available:**
- ✅ Total attendance days
- ✅ On-time vs late arrivals
- ✅ Average late by (minutes)
- ✅ Total hours participated
- ✅ Average duration per activity
- ✅ Completion percentage
- ✅ Early departures count
- ✅ Activity breakdown by type

### 2. Class/Activity Reports

**Data Available:**
- ✅ Total students participated
- ✅ Average attendance rate
- ✅ Late arrival rate
- ✅ Average session duration
- ✅ Completion rate
- ✅ Early departure patterns
- ✅ Peak attendance times

### 3. Teacher Reports

**Data Available:**
- ✅ Activities conducted
- ✅ Total students managed
- ✅ Average activity duration
- ✅ On-time rate for classes
- ✅ Completion rates
- ✅ Time management metrics

### 4. Trend Reports

**Data Available:**
- ✅ Week-over-week comparison
- ✅ Month-over-month trends
- ✅ Seasonal patterns
- ✅ Improvement tracking
- ✅ Decline alerts

---

## 🔍 Example Queries for Reports

### Query 1: Who's Always Late?

```javascript
// Students late more than 5 times this month
SELECT studentName, COUNT(*) as lateCount, AVG(lateBy) as avgLateBy
FROM attendance
WHERE status = 'late' 
  AND timestamp >= '2025-10-01'
  AND timestamp < '2025-11-01'
GROUP BY studentId
HAVING lateCount > 5
ORDER BY lateCount DESC
```

**Output:**
```
Bob Wilson - 8 late arrivals, avg 18 minutes late
Jane Smith - 6 late arrivals, avg 10 minutes late
```

---

### Query 2: Activity Completion Rates

```javascript
// Which activities do students complete fully?
SELECT activity, AVG(completionPercentage) as avgCompletion
FROM attendance
WHERE type = 'logout'
  AND completionPercentage IS NOT NULL
GROUP BY activity
ORDER BY avgCompletion DESC
```

**Output:**
```
Math Class: 98% completion
Science Lab: 95% completion
Football: 88% completion (some leave early for transport)
Drama Club: 82% completion (flexible end times)
```

---

### Query 3: Late Patterns by Time

```javascript
// When are students most often late?
SELECT scheduledStartTime, COUNT(*) as lateCount
FROM attendance
WHERE status = 'late'
GROUP BY scheduledStartTime
ORDER BY lateCount DESC
```

**Output:**
```
08:00 - 45 late arrivals (morning classes hardest)
13:00 - 12 late arrivals (after lunch)
15:00 - 5 late arrivals (after school activities)
```

---

### Query 4: Duration Variance

```javascript
// Compare actual vs scheduled duration
SELECT activity,
       AVG(durationMinutes) as actualDuration,
       AVG((scheduledEndTime - scheduledStartTime)) as scheduledDuration,
       AVG(completionPercentage) as completion
FROM attendance
WHERE type = 'logout'
GROUP BY activity
```

**Output:**
```
Activity          | Scheduled | Actual | Completion
------------------|-----------|--------|------------
Math Class        | 90 min    | 88 min | 98%
Football Practice | 120 min   | 105 min| 88%
Library Study     | 90 min    | 95 min | 106% (stayed longer!)
```

---

## 📅 Scheduled vs Actual Tracking

### Example Activity:

**Math Class Schedule:**
```
Scheduled Start: 08:00
Scheduled End: 09:30
Duration: 90 minutes
```

**Student A (On Time):**
```
Actual Check-In: 08:00
Status: present
lateBy: 0

Actual Check-Out: 09:30
Status: checkout
durationMinutes: 90
completionPercentage: 100%
```

**Student B (Late):**
```
Actual Check-In: 08:15
Status: late
lateBy: 15

Actual Check-Out: 09:30
Status: checkout
durationMinutes: 75
completionPercentage: 83%
```

**Student C (Left Early):**
```
Actual Check-In: 08:00
Status: present
lateBy: 0

Actual Check-Out: 09:15
Status: left-early
durationMinutes: 75
completionPercentage: 83%
leftEarlyBy: 15
```

---

## 🤖 Auto-Checkout Data

### Auto-Checkout Record:

```javascript
{
  type: "logout",
  status: "checkout",
  teacherId: "SYSTEM",
  teacherName: "Auto-Checkout System",
  automated: true,  // ← Indicates auto-checkout
  timestamp: "2025-10-13T09:30:00.000Z",
  scheduledEndTime: "09:30",
  notes: "Auto-checkout at scheduled end time (09:30)",
  
  // Timing data same as manual checkout
  checkInTime: "...",
  durationMinutes: 90,
  completionPercentage: 100%
}
```

**Reports Can Show:**
- How many auto-checkouts vs manual
- Teacher checkout rate (did they manually checkout students?)
- System efficiency

---

## 📊 Data Points Captured (Summary)

### Per Check-In (Login):
1. ✅ Student ID and name
2. ✅ Activity and type
3. ✅ Actual arrival time (timestamp)
4. ✅ Scheduled start time
5. ✅ Status (present/late/absent)
6. ✅ Late by (if late)
7. ✅ Teacher who scanned
8. ✅ Location (room/field)
9. ✅ GPS coordinates (optional)
10. ✅ Photo verification done
11. ✅ Fraud check results

### Per Check-Out (Logout):
1. ✅ All check-in data (linked)
2. ✅ Actual departure time
3. ✅ Scheduled end time
4. ✅ Status (checkout/left-early)
5. ✅ Duration (minutes & hours)
6. ✅ Completion percentage
7. ✅ Left early by (if early)
8. ✅ Automated (yes/no)
9. ✅ Check-in time reference
10. ✅ Notes about departure

**Total Data Points:** 20+ per complete activity session!

---

## 📈 Report Generation Capabilities

### Available Now (With This Data):

**Student Reports:**
- ✅ Attendance percentage
- ✅ Late arrival rate
- ✅ Early departure rate
- ✅ Average participation time
- ✅ Completion rate
- ✅ Activity breakdown
- ✅ Trend analysis

**Activity Reports:**
- ✅ Total participation
- ✅ Average duration
- ✅ Completion rates
- ✅ Late start patterns
- ✅ Early end patterns
- ✅ Scheduled vs actual

**Class Reports:**
- ✅ Overall attendance
- ✅ Punctuality metrics
- ✅ Engagement metrics
- ✅ Time utilization
- ✅ Comparison across classes

**Time-Based Reports:**
- ✅ Daily summaries
- ✅ Weekly trends
- ✅ Monthly analytics
- ✅ Seasonal patterns
- ✅ Year-over-year

---

## 💡 Planning Use Cases

### 1. Schedule Optimization
```
Data: completionPercentage < 80%
Analysis: Activity too long, students leaving early
Action: Reduce scheduled duration
```

### 2. Punctuality Programs
```
Data: lateBy patterns by student
Analysis: Some students consistently 10+ min late
Action: Parent meeting, support program
```

### 3. Resource Allocation
```
Data: Peak activity participation times
Analysis: Most activities 2:00-4:00 PM
Action: Schedule more rooms/fields for that time
```

### 4. Teacher Efficiency
```
Data: Manual vs auto-checkout rates
Analysis: Teachers using auto-checkout effectively
Action: Train others on scheduling features
```

---

## 🎯 Summary

**Database Captures:**
- ✅ Scheduled times (planned)
- ✅ Actual times (reality)
- ✅ Duration (how long)
- ✅ Status (on time/late/early)
- ✅ Calculations (late by, early by, completion %)
- ✅ 20+ data points per activity

**Enables Reports On:**
- ✅ Individual student performance
- ✅ Activity efficiency
- ✅ Class-wide patterns
- ✅ Time-based trends
- ✅ Predictive analytics

**For Planning:**
- ✅ Optimize activity schedules
- ✅ Identify support needs
- ✅ Improve resource allocation
- ✅ Track improvements over time

---

**Every scan captures comprehensive timing data for powerful reporting!** 📊✨

