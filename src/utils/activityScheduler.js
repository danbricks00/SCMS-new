/**
 * Activity Scheduler and Auto-Checkout System
 * Manages scheduled activities and automatic student logout
 */

import { DatabaseService } from '../services/database';

/**
 * Activity Schedule Schema
 */
export const createActivitySchedule = (activityData) => {
  return {
    id: `ACT${Date.now()}`,
    name: activityData.name,
    type: activityData.type, // 'classroom', 'sports', 'library', 'event', 'club'
    teacher: activityData.teacher,
    teacherId: activityData.teacherId,
    location: activityData.location,
    startTime: activityData.startTime, // "08:00"
    endTime: activityData.endTime, // "09:30"
    daysOfWeek: activityData.daysOfWeek || [1, 2, 3, 4, 5], // Monday-Friday
    recurring: activityData.recurring || false,
    autoCheckout: activityData.autoCheckout !== false, // Default true
    maxStudents: activityData.maxStudents || null,
    description: activityData.description || '',
    createdAt: new Date().toISOString()
  };
};

/**
 * Check if activity is currently scheduled
 * @param {Object} schedule - Activity schedule
 * @param {Date} checkTime - Time to check (defaults to now)
 * @returns {Object} { isActive: boolean, message: string }
 */
export const isActivityActive = (schedule, checkTime = new Date()) => {
  const now = checkTime;
  
  // Check day of week
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  if (!schedule.daysOfWeek.includes(dayOfWeek)) {
    return {
      isActive: false,
      message: `Activity not scheduled for today (${getDayName(dayOfWeek)})`,
      reason: 'WRONG_DAY'
    };
  }
  
  // Get current time in HH:MM format
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;
  
  // Check if within time range
  if (currentTime < schedule.startTime) {
    return {
      isActive: false,
      message: `Activity starts at ${schedule.startTime}`,
      reason: 'TOO_EARLY',
      startsIn: getTimeDifference(currentTime, schedule.startTime)
    };
  }
  
  if (currentTime > schedule.endTime) {
    return {
      isActive: false,
      message: `Activity ended at ${schedule.endTime}`,
      reason: 'ENDED',
      endedAgo: getTimeDifference(schedule.endTime, currentTime)
    };
  }
  
  return {
    isActive: true,
    message: `Activity in progress (${schedule.startTime} - ${schedule.endTime})`,
    timeRemaining: getTimeDifference(currentTime, schedule.endTime)
  };
};

/**
 * Auto-checkout students when activity ends
 * @param {string} activityName - Name of the activity
 * @param {Object} schedule - Activity schedule
 * @returns {Promise<Object>} { checkedOut: number, students: Array }
 */
export const autoCheckoutStudents = async (activityName, schedule) => {
  console.log(`🤖 Auto-checkout triggered for: ${activityName}`);
  
  try {
    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await DatabaseService.getClassAttendance(schedule.class || 'ALL', today);
    
    // Find students still checked into this activity
    const studentsToCheckout = [];
    const activityMap = {};
    
    todayAttendance.forEach(record => {
      if (record.activity === activityName) {
        if (!activityMap[record.studentId]) {
          activityMap[record.studentId] = { login: null, logout: null, student: null };
        }
        if (record.type === 'login') {
          activityMap[record.studentId].login = record;
          activityMap[record.studentId].student = {
            studentId: record.studentId,
            studentName: record.studentName,
            class: record.class
          };
        } else if (record.type === 'logout') {
          activityMap[record.studentId].logout = record;
        }
      }
    });
    
    // Find students with login but no logout
    Object.keys(activityMap).forEach(studentId => {
      if (activityMap[studentId].login && !activityMap[studentId].logout) {
        studentsToCheckout.push(activityMap[studentId].student);
      }
    });
    
    console.log(`Found ${studentsToCheckout.length} students to auto-checkout`);
    
    // Checkout each student automatically
    const checkoutResults = [];
    for (const student of studentsToCheckout) {
      const checkoutData = {
        studentId: student.studentId,
        studentName: student.studentName,
        class: student.class,
        teacherId: 'SYSTEM',
        teacherName: 'Auto-Checkout System',
        type: 'logout',
        status: 'checkout',
        activity: activityName,
        activityType: schedule.type,
        location: schedule.location,
        notes: `Auto-checkout at scheduled end time (${schedule.endTime})`
      };
      
      try {
        const result = await DatabaseService.recordAttendance(checkoutData, { skipFraudCheck: true });
        checkoutResults.push({
          studentId: student.studentId,
          success: result.success,
          timestamp: new Date().toISOString()
        });
        console.log(`✅ Auto-checked out: ${student.studentName}`);
      } catch (error) {
        console.error(`❌ Failed to auto-checkout ${student.studentName}:`, error);
        checkoutResults.push({
          studentId: student.studentId,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      activityName,
      scheduledEndTime: schedule.endTime,
      checkedOut: checkoutResults.filter(r => r.success).length,
      failed: checkoutResults.filter(r => !r.success).length,
      students: checkoutResults,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Auto-checkout error:', error);
    throw error;
  }
};

/**
 * Schedule an activity with start/end times
 * @param {Object} activityData - Activity details
 * @returns {Promise<Object>} Created schedule
 */
export const scheduleActivity = async (activityData) => {
  const schedule = createActivitySchedule(activityData);
  
  // TODO: Save to database
  // await DatabaseService.addActivitySchedule(schedule);
  
  console.log('Activity scheduled:', schedule);
  
  // Set up auto-checkout timer if activity is recurring
  if (schedule.autoCheckout && schedule.recurring) {
    setupAutoCheckoutTimer(schedule);
  }
  
  return schedule;
};

/**
 * Set up timer for auto-checkout (in production, use cron job or scheduled function)
 * @param {Object} schedule - Activity schedule
 */
const setupAutoCheckoutTimer = (schedule) => {
  // Calculate milliseconds until end time
  const now = new Date();
  const [endHour, endMin] = schedule.endTime.split(':').map(Number);
  const endTime = new Date(now);
  endTime.setHours(endHour, endMin, 0, 0);
  
  // If end time already passed today, schedule for tomorrow
  if (endTime <= now) {
    endTime.setDate(endTime.getDate() + 1);
  }
  
  const msUntilEnd = endTime - now;
  
  console.log(`⏰ Auto-checkout scheduled for ${schedule.name} at ${schedule.endTime}`);
  console.log(`   Time until checkout: ${Math.round(msUntilEnd / 1000 / 60)} minutes`);
  
  // Note: In production, use a proper job scheduler (cron, cloud functions, etc.)
  // This setTimeout approach only works while app is running
  if (msUntilEnd > 0 && msUntilEnd < 24 * 60 * 60 * 1000) { // Within 24 hours
    setTimeout(async () => {
      await autoCheckoutStudents(schedule.name, schedule);
    }, msUntilEnd);
  }
};

/**
 * Get day name from day number
 * @param {number} day - Day number (0-6)
 * @returns {string} Day name
 */
const getDayName = (day) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
};

/**
 * Calculate time difference in minutes
 * @param {string} time1 - Time in HH:MM format
 * @param {string} time2 - Time in HH:MM format
 * @returns {number} Difference in minutes
 */
const getTimeDifference = (time1, time2) => {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return Math.abs((h2 * 60 + m2) - (h1 * 60 + m1));
};

/**
 * Get all scheduled activities for today
 * @returns {Promise<Array>} Array of today's scheduled activities
 */
export const getTodayScheduledActivities = async () => {
  // TODO: Fetch from database
  // const schedules = await DatabaseService.getScheduledActivities(new Date());
  
  // Sample data for now
  const sampleSchedules = [
    {
      id: 'ACT001',
      name: 'Math Class',
      type: 'classroom',
      teacher: 'Ms. Johnson',
      startTime: '08:00',
      endTime: '09:30',
      autoCheckout: true
    },
    {
      id: 'ACT002',
      name: 'Football Practice',
      type: 'sports',
      teacher: 'Coach Smith',
      startTime: '15:00',
      endTime: '17:00',
      autoCheckout: true
    }
  ];
  
  return sampleSchedules;
};

/**
 * Check if it's time to auto-checkout an activity
 * @param {Object} schedule - Activity schedule
 * @returns {boolean} True if should auto-checkout now
 */
export const shouldAutoCheckout = (schedule) => {
  if (!schedule.autoCheckout) return false;
  
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;
  
  // Check if current time is at or past end time
  return currentTime >= schedule.endTime;
};

/**
 * Run auto-checkout for all scheduled activities that have ended
 * @returns {Promise<Object>} Summary of auto-checkouts
 */
export const runScheduledAutoCheckouts = async () => {
  console.log('🤖 Running scheduled auto-checkouts...');
  
  const schedules = await getTodayScheduledActivities();
  const results = [];
  
  for (const schedule of schedules) {
    if (shouldAutoCheckout(schedule)) {
      console.log(`Auto-checkout needed for: ${schedule.name}`);
      try {
        const result = await autoCheckoutStudents(schedule.name, schedule);
        results.push(result);
      } catch (error) {
        console.error(`Failed to auto-checkout ${schedule.name}:`, error);
      }
    }
  }
  
  return {
    timestamp: new Date().toISOString(),
    activitiesChecked: schedules.length,
    activitiesProcessed: results.length,
    totalStudentsCheckedOut: results.reduce((sum, r) => sum + r.checkedOut, 0),
    results
  };
};

export default {
  createActivitySchedule,
  isActivityActive,
  autoCheckoutStudents,
  scheduleActivity,
  getTodayScheduledActivities,
  shouldAutoCheckout,
  runScheduledAutoCheckouts
};

