/**
 * Fraud Detection Utilities for Attendance System
 * Prevents attendance fraud through multiple verification methods
 */

// School hours configuration (24-hour format)
const SCHOOL_HOURS = {
  start: '07:00', // 7:00 AM
  end: '18:00',   // 6:00 PM
  timezone: 'Pacific/Auckland'
};

// Velocity check: Minimum time between scans at different locations (minutes)
const MIN_TIME_BETWEEN_LOCATIONS = 5;

// Maximum distance a student can travel in minimum time (meters)
const MAX_REASONABLE_DISTANCE = 500; // 500 meters in 5 minutes

/**
 * Check if current time is within school hours
 * @returns {Object} { allowed: boolean, message: string, currentTime: string }
 */
export const isWithinSchoolHours = () => {
  const now = new Date();
  
  // Get current time in NZT
  const nztTime = new Date(now.toLocaleString('en-US', { 
    timeZone: SCHOOL_HOURS.timezone 
  }));
  
  const hours = nztTime.getHours();
  const minutes = nztTime.getMinutes();
  const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  const [startHour, startMin] = SCHOOL_HOURS.start.split(':').map(Number);
  const [endHour, endMin] = SCHOOL_HOURS.end.split(':').map(Number);
  
  const currentMinutes = hours * 60 + minutes;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  const allowed = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  
  return {
    allowed,
    currentTime,
    schoolHours: `${SCHOOL_HOURS.start} - ${SCHOOL_HOURS.end}`,
    message: allowed 
      ? 'Within school hours' 
      : `Attendance can only be marked between ${SCHOOL_HOURS.start} and ${SCHOOL_HOURS.end} (NZT)`
  };
};

/**
 * Check if student is already checked into another event
 * Student can only be at ONE event at a time
 * @param {string} studentId - Student ID
 * @param {string} currentActivity - Current activity trying to check into
 * @param {Array} todayAttendance - Array of today's attendance records
 * @returns {Object} { alreadyCheckedIn: boolean, currentEvent: Object|null, message: string }
 */
export const checkCurrentlyCheckedIn = (studentId, currentActivity, todayAttendance) => {
  // Find if student has an open session (checked in but not checked out)
  const openSessions = todayAttendance.filter(record => 
    record.studentId === studentId
  );
  
  // Group by activity to find sessions without checkout
  const activitiesMap = {};
  openSessions.forEach(record => {
    if (!activitiesMap[record.activity]) {
      activitiesMap[record.activity] = { login: null, logout: null };
    }
    if (record.type === 'login') {
      activitiesMap[record.activity].login = record;
    } else if (record.type === 'logout') {
      activitiesMap[record.activity].logout = record;
    }
  });
  
  // Find activities with login but no logout (currently active)
  const activeEvents = Object.keys(activitiesMap).filter(activity => 
    activitiesMap[activity].login && !activitiesMap[activity].logout
  );
  
  if (activeEvents.length > 0 && !activeEvents.includes(currentActivity)) {
    const currentEvent = activitiesMap[activeEvents[0]].login;
    return {
      alreadyCheckedIn: true,
      currentEvent,
      activeActivity: activeEvents[0],
      message: `Student is currently checked into "${activeEvents[0]}". Please check out first before checking into "${currentActivity}".`,
      timestamp: currentEvent.timestamp
    };
  }
  
  return {
    alreadyCheckedIn: false,
    currentEvent: null,
    message: 'Student not currently checked into any event'
  };
};

/**
 * Check for duplicate scan in same activity (QR scanned twice for same event)
 * @param {string} studentId - Student ID
 * @param {string} activity - Activity name
 * @param {string} scanType - 'login' or 'logout'
 * @param {Array} todayAttendance - Array of today's attendance records
 * @returns {Object} { isDuplicate: boolean, existingRecord: Object|null, message: string }
 */
export const checkDuplicateScanSameActivity = (studentId, activity, scanType, todayAttendance) => {
  // Find records for this student and activity today
  const activityRecords = todayAttendance.filter(record => 
    record.studentId === studentId && 
    record.activity === activity
  );
  
  // Check if already has same scan type for this activity
  const existingRecord = activityRecords.find(record => record.type === scanType);
  
  if (existingRecord) {
    const action = scanType === 'login' ? 'checked into' : 'checked out of';
    return {
      isDuplicate: true,
      existingRecord,
      message: `Student already ${action} "${activity}" at ${new Date(existingRecord.timestamp).toLocaleTimeString('en-NZ')}`,
      timestamp: existingRecord.timestamp
    };
  }
  
  return {
    isDuplicate: false,
    existingRecord: null,
    message: `No duplicate ${scanType} found for this activity`
  };
};

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Velocity check - Detect if student traveled too fast (impossible)
 * @param {string} studentId - Student ID
 * @param {Object} currentLocation - { latitude, longitude }
 * @param {Array} recentAttendance - Recent attendance records
 * @returns {Object} { valid: boolean, message: string, details: Object }
 */
export const checkVelocity = (studentId, currentLocation, recentAttendance) => {
  if (!currentLocation || !currentLocation.latitude || !currentLocation.longitude) {
    return {
      valid: true,
      message: 'Location not available, skipping velocity check',
      warning: 'Consider enabling location services for better security'
    };
  }
  
  // Get student's most recent scan (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentScans = recentAttendance
    .filter(record => 
      record.studentId === studentId && 
      record.timestamp > oneHourAgo &&
      record.location && 
      record.location.latitude
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  if (recentScans.length === 0) {
    return {
      valid: true,
      message: 'No recent scans to compare',
      firstScanToday: true
    };
  }
  
  const lastScan = recentScans[0];
  const lastLocation = lastScan.location;
  
  // Calculate distance traveled
  const distance = calculateDistance(
    lastLocation.latitude,
    lastLocation.longitude,
    currentLocation.latitude,
    currentLocation.longitude
  );
  
  // Calculate time difference (minutes)
  const timeDiff = (Date.now() - new Date(lastScan.timestamp).getTime()) / (1000 * 60);
  
  // Check if distance/time is reasonable
  if (timeDiff < MIN_TIME_BETWEEN_LOCATIONS && distance > MAX_REASONABLE_DISTANCE) {
    return {
      valid: false,
      message: `Student cannot travel ${Math.round(distance)}m in ${Math.round(timeDiff)} minutes`,
      details: {
        distance: Math.round(distance),
        timeDiff: Math.round(timeDiff),
        lastLocation: lastScan.activity,
        lastTime: lastScan.timestamp,
        suspicious: true
      }
    };
  }
  
  return {
    valid: true,
    message: 'Velocity check passed',
    details: {
      distance: Math.round(distance),
      timeDiff: Math.round(timeDiff),
      reasonable: true
    }
  };
};

/**
 * Check if scan is from school network (IP-based)
 * @param {string} ipAddress - User's IP address
 * @param {Array} allowedIPs - Array of allowed IP ranges
 * @returns {Object} { allowed: boolean, message: string }
 */
export const checkSchoolNetwork = (ipAddress, allowedIPs = []) => {
  // If no IP restrictions configured, allow all
  if (!allowedIPs || allowedIPs.length === 0) {
    return {
      allowed: true,
      message: 'No IP restrictions configured',
      warning: 'Consider configuring school IP ranges for better security'
    };
  }
  
  // Check if IP is in allowed ranges
  const isAllowed = allowedIPs.some(allowedIP => {
    // Simple IP matching (can be enhanced with CIDR notation)
    return ipAddress.startsWith(allowedIP);
  });
  
  return {
    allowed: isAllowed,
    message: isAllowed 
      ? 'Scan from authorized school network' 
      : 'Scan from unauthorized network - please connect to school WiFi',
    ipAddress,
    fromSchool: isAllowed
  };
};

/**
 * Comprehensive fraud check - Run all checks
 * @param {Object} params - All check parameters
 * @returns {Object} { allowed: boolean, issues: Array, warnings: Array }
 */
export const comprehensiveFraudCheck = ({
  studentId,
  studentName,
  activity,
  scanType,
  currentLocation,
  todayAttendance,
  recentAttendance,
  userIP,
  allowedIPs,
  override = false // Admin can override checks
}) => {
  const issues = [];
  const warnings = [];
  let allowed = true;
  
  // 1. Time-based check (only warn, don't block)
  const timeCheck = isWithinSchoolHours();
  if (!timeCheck.allowed) {
    warnings.push({
      type: 'TIME_WARNING',
      severity: 'MEDIUM',
      message: timeCheck.message + ' - Proceed with caution',
      details: timeCheck
    });
  }
  
  // 2. Check if student is already checked into ANOTHER event (can only be at one place)
  if (scanType === 'login') {
    const checkedInCheck = checkCurrentlyCheckedIn(studentId, activity, todayAttendance);
    if (checkedInCheck.alreadyCheckedIn && !override) {
      issues.push({
        type: 'ALREADY_CHECKED_IN',
        severity: 'HIGH',
        message: checkedInCheck.message,
        details: checkedInCheck
      });
      allowed = false;
    }
  }
  
  // 3. Check for duplicate scan in SAME activity (can't scan QR twice for same event)
  const duplicateCheck = checkDuplicateScanSameActivity(studentId, activity, scanType, todayAttendance);
  if (duplicateCheck.isDuplicate && !override) {
    issues.push({
      type: 'DUPLICATE_SCAN',
      severity: 'HIGH',
      message: duplicateCheck.message,
      details: duplicateCheck
    });
    allowed = false;
  }
  
  // 4. Velocity check (optional, just warns)
  const velocityCheck = checkVelocity(studentId, currentLocation, recentAttendance);
  if (!velocityCheck.valid) {
    warnings.push({
      type: 'VELOCITY_WARNING',
      severity: 'MEDIUM',
      message: velocityCheck.message,
      details: velocityCheck.details
    });
    // Don't block, just warn about suspicious movement
  } else if (velocityCheck.warning) {
    warnings.push({
      type: 'LOCATION_UNAVAILABLE',
      message: velocityCheck.warning
    });
  }
  
  // 5. Network check (optional, just warns)
  const networkCheck = checkSchoolNetwork(userIP, allowedIPs);
  if (!networkCheck.allowed) {
    warnings.push({
      type: 'NETWORK_WARNING',
      severity: 'LOW',
      message: networkCheck.message,
      details: networkCheck
    });
    // Don't block, just warn
  }
  
  return {
    allowed,
    issues,
    warnings,
    summary: {
      totalChecks: 5,
      passed: issues.length === 0,
      issuesCount: issues.length,
      warningsCount: warnings.length,
      studentId,
      studentName,
      activity,
      scanType,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Log fraud attempt for audit trail
 * @param {Object} fraudData - Fraud detection data
 * @returns {Promise<void>}
 */
export const logFraudAttempt = async (fraudData) => {
  console.warn('🚨 FRAUD DETECTION ALERT:', fraudData);
  
  // In production, this would:
  // - Save to database
  // - Send alert to admin
  // - Flag student/teacher for review
  // - Create incident report
  
  const fraudLog = {
    timestamp: new Date().toISOString(),
    type: 'FRAUD_ATTEMPT',
    severity: fraudData.issues[0]?.severity || 'MEDIUM',
    studentId: fraudData.summary.studentId,
    studentName: fraudData.summary.studentName,
    issues: fraudData.issues,
    warnings: fraudData.warnings,
    teacherId: fraudData.teacherId,
    location: fraudData.location,
    deviceInfo: fraudData.deviceInfo
  };
  
  // For now, just log to console
  console.table(fraudLog);
  
  // TODO: Implement database logging
  // await DatabaseService.logFraudAttempt(fraudLog);
  
  return fraudLog;
};

/**
 * Get recommended actions based on fraud detection
 * @param {Object} fraudCheck - Result from comprehensiveFraudCheck
 * @returns {Array} Recommended actions for teacher/admin
 */
export const getRecommendedActions = (fraudCheck) => {
  const actions = [];
  
  if (!fraudCheck.allowed) {
    actions.push({
      action: 'DENY_ATTENDANCE',
      priority: 'HIGH',
      message: 'Do not mark attendance - fraud indicators detected'
    });
  }
  
  fraudCheck.issues.forEach(issue => {
    switch (issue.type) {
      case 'ALREADY_CHECKED_IN':
        actions.push({
          action: 'CHECKOUT_FIRST',
          priority: 'HIGH',
          message: `Student must check out of "${issue.details.activeActivity}" first`,
          data: issue.details
        });
        break;
        
      case 'DUPLICATE_SCAN':
        actions.push({
          action: 'CHECK_EXISTING_RECORD',
          priority: 'HIGH',
          message: 'Student already scanned for this activity - QR code already used',
          data: issue.details.existingRecord
        });
        break;
        
      case 'VELOCITY_VIOLATION':
        actions.push({
          action: 'VERIFY_IDENTITY',
          priority: 'CRITICAL',
          message: 'Verify student identity - suspicious movement pattern',
          data: issue.details
        });
        break;
        
      case 'TIME_RESTRICTION':
        actions.push({
          action: 'CONTACT_ADMIN',
          priority: 'MEDIUM',
          message: 'Contact admin for after-hours attendance approval',
          data: issue.details
        });
        break;
        
      default:
        actions.push({
          action: 'REVIEW_REQUIRED',
          priority: 'MEDIUM',
          message: issue.message
        });
    }
  });
  
  fraudCheck.warnings.forEach(warning => {
    actions.push({
      action: 'NOTE',
      priority: 'LOW',
      message: warning.message
    });
  });
  
  return actions;
};

/**
 * Format fraud check results for display
 * @param {Object} fraudCheck - Result from comprehensiveFraudCheck
 * @returns {string} Formatted message for alert/display
 */
export const formatFraudCheckMessage = (fraudCheck) => {
  if (fraudCheck.allowed && fraudCheck.warnings.length === 0) {
    return '✅ All security checks passed';
  }
  
  let message = '';
  
  if (!fraudCheck.allowed) {
    message += '🚨 ATTENDANCE BLOCKED\n\n';
    message += 'Security Issues:\n';
    fraudCheck.issues.forEach((issue, index) => {
      message += `${index + 1}. ${issue.message}\n`;
    });
  }
  
  if (fraudCheck.warnings.length > 0) {
    message += '\n⚠️ Warnings:\n';
    fraudCheck.warnings.forEach((warning, index) => {
      message += `${index + 1}. ${warning.message}\n`;
    });
  }
  
  return message;
};

/**
 * Check if weekend or holiday
 * @param {Date} date - Date to check
 * @param {Array} holidays - Array of holiday dates
 * @returns {Object} { isWeekend: boolean, isHoliday: boolean, shouldAllow: boolean }
 */
export const checkSchoolDay = (date = new Date(), holidays = []) => {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6; // Sunday = 0, Saturday = 6
  
  const dateString = date.toISOString().split('T')[0];
  const isHoliday = holidays.includes(dateString);
  
  return {
    isWeekend,
    isHoliday,
    shouldAllow: !isWeekend && !isHoliday,
    message: isWeekend ? 'Today is a weekend' : 
             isHoliday ? 'Today is a holiday' : 
             'Regular school day'
  };
};

/**
 * Rate limiting - Prevent spam scanning
 * @param {string} teacherId - Teacher ID
 * @param {Array} recentScans - Recent scans by this teacher
 * @param {number} maxScansPerMinute - Maximum allowed scans per minute
 * @returns {Object} { allowed: boolean, message: string }
 */
export const checkRateLimit = (teacherId, recentScans, maxScansPerMinute = 30) => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  
  const scansLastMinute = recentScans.filter(scan => 
    scan.teacherId === teacherId && 
    scan.timestamp > oneMinuteAgo
  );
  
  const allowed = scansLastMinute.length < maxScansPerMinute;
  
  return {
    allowed,
    scansLastMinute: scansLastMinute.length,
    limit: maxScansPerMinute,
    message: allowed 
      ? 'Rate limit OK' 
      : `Too many scans (${scansLastMinute.length}/${maxScansPerMinute} per minute). Please slow down.`
  };
};

/**
 * Get fraud prevention statistics
 * @param {Array} fraudLogs - Array of fraud detection logs
 * @param {string} dateRange - 'today' | 'week' | 'month'
 * @returns {Object} Statistics object
 */
export const getFraudStatistics = (fraudLogs, dateRange = 'today') => {
  const now = new Date();
  let startDate;
  
  switch (dateRange) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    default:
      startDate = new Date(0);
  }
  
  const relevantLogs = fraudLogs.filter(log => 
    new Date(log.timestamp) >= startDate
  );
  
  const byType = {};
  relevantLogs.forEach(log => {
    log.issues.forEach(issue => {
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    });
  });
  
  return {
    total: relevantLogs.length,
    byType,
    mostCommon: Object.keys(byType).sort((a, b) => byType[b] - byType[a])[0],
    dateRange,
    startDate: startDate.toISOString(),
    endDate: new Date().toISOString()
  };
};

export default {
  isWithinSchoolHours,
  checkCurrentlyCheckedIn,
  checkDuplicateScanSameActivity,
  checkVelocity,
  checkSchoolNetwork,
  comprehensiveFraudCheck,
  logFraudAttempt,
  getRecommendedActions,
  formatFraudCheckMessage,
  checkSchoolDay,
  checkRateLimit,
  getFraudStatistics,
  SCHOOL_HOURS,
  MIN_TIME_BETWEEN_LOCATIONS,
  MAX_REASONABLE_DISTANCE
};

