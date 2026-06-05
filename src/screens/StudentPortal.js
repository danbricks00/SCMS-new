import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActivityLog from '../components/ActivityLog';
import AnnouncementBanner from '../components/AnnouncementBanner';
import PortalHeader from '../components/PortalHeader';
import PortalIdentity from '../components/PortalIdentity';
import ProtectedRoute from '../components/ProtectedRoute';
import ResponsiveScreen from '../components/ResponsiveScreen';
import ScreenGradient from '../components/ScreenGradient';
import SimpleQRCode from '../components/SimpleQRCode';
import * as Print from 'expo-print';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { QRCodeUtils } from '../utils/qrCodeUtils';
import { qrPayloadToDataUrl, qrPrintCssRules, qrPrintImgTag } from '../utils/qrRaster';
import { openPrintDialogWithHtml } from '../utils/pdfFromHtml';

const DAY_TO_INDEX = {
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  weds: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5
};

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PRINT_QR_SIZE = 200;

const StudentPortal = () => {
  const { user, logout } = useAuth();
  const [studentQRCode, setStudentQRCode] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [events, setEvents] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [attendanceMetrics, setAttendanceMetrics] = useState({ presentRate: 0, absences: 0, lateCount: 0 });
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [qrImageDataUrlForPrint, setQrImageDataUrlForPrint] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const toDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value?.toDate === 'function') {
      const parsed = value.toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }
    if (typeof value?.seconds === 'number') {
      const parsed = new Date(value.seconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  // Load student data and QR code from database
  useEffect(() => {
    const loadStudentData = async () => {
      if (!user?.username) {
        return;
      }

      const applyStudent = (student) => {
        const normalizedStudentId = String(student.studentId || user.username || '').toUpperCase();
        const normalizedStudent = {
          ...student,
          studentId: normalizedStudentId,
          name: student.name || user.name,
          class: student.class || user.class || '10A',
          firestoreDocId: student.id || user.name || user.username
        };
        setStudentData(normalizedStudent);
        if (student.qrCode) {
          setStudentQRCode(student.qrCode);
        } else {
          setStudentQRCode(QRCodeUtils.generateStudentQR(normalizedStudent));
        }
        loadEvents(normalizedStudent.class);
      };

      try {
        let student = await DatabaseService.getStudentById(user.username);
        // e.g. Firestore doc id "John Doe" but login username is student1 — no studentId field on doc
        if (!student && user.name) {
          student = await DatabaseService.getStudentByDocumentId(user.name);
        }

        if (student) {
          applyStudent(student);
          loadAttendance(String(student.studentId || user.username || '').toUpperCase());
          loadUpcomingClasses({
            className: student.class || user.class || '10A',
            classId: student.classId || ''
          });
        } else {
          const fallbackData = {
            studentId: String(user.username || '').toUpperCase(),
            name: user.name,
            firestoreDocId: user.name || user.username,
            class: user.class || '10A'
          };
          setStudentData(fallbackData);
          setStudentQRCode(QRCodeUtils.generateStudentQR(fallbackData));
          loadEvents(fallbackData.class);
          loadAttendance(fallbackData.studentId);
          loadUpcomingClasses({
            className: fallbackData.class,
            classId: fallbackData.classId || ''
          });
        }
      } catch (error) {
        console.error('Error loading student data:', error);
        const fallbackData = {
          studentId: String(user.username || '').toUpperCase(),
          name: user.name,
          firestoreDocId: user.name || user.username,
          class: user.class || '10A'
        };
        setStudentData(fallbackData);
        setStudentQRCode(QRCodeUtils.generateStudentQR(fallbackData));
        loadEvents(fallbackData.class);
        loadAttendance(fallbackData.studentId);
        loadUpcomingClasses({
          className: fallbackData.class,
          classId: fallbackData.classId || ''
        });
      }
    };

    loadStudentData();
  }, [user?.username, user?.name, user?.class]);

  useEffect(() => {
    const studentId = String(studentData?.studentId || user?.username || '').toUpperCase();
    if (!studentId) return;

    const interval = setInterval(() => {
      loadAttendance(studentId);
    }, 3000);

    return () => clearInterval(interval);
  }, [studentData?.studentId, user?.username]);

  const loadEvents = async (userClass) => {
    try {
      const userEvents = await DatabaseService.getEventsForUser('student', [userClass]);
      setEvents(userEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const parseDayIndexes = (dayExpr) => {
    const source = String(dayExpr || '').trim();
    if (!source) return [];
    return Array.from(
      new Set(
        source
          .split(/[-,/ ]+/)
          .map((token) => DAY_TO_INDEX[String(token || '').trim().toLowerCase()])
          .filter((v) => Number.isInteger(v))
      )
    );
  };

  const extractSlotsFromSchedule = (schedule) => {
    const text = String(schedule || '').trim();
    if (!text) return [];
    const slots = [];
    const segments = text.split('|').map((s) => s.trim()).filter(Boolean);

    segments.forEach((segment) => {
      const firstToken = segment.split(/\s+/)[0] || '';
      const dayIndexes = parseDayIndexes(firstToken);
      if (!dayIndexes.length) return;

      const ranges = segment.match(/\b(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\b/g) || [];
      if (ranges.length > 0) {
        ranges.forEach((rangeText) => {
          const m = rangeText.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
          if (!m) return;
          const startHour = Number(m[1]);
          const startMinute = Number(m[2]);
          const endHour = Number(m[3]);
          const endMinute = Number(m[4]);
          dayIndexes.forEach((dayIndex) => {
            slots.push({ dayIndex, startHour, startMinute, endHour, endMinute });
          });
        });
        return;
      }

      const singleTimes = segment.match(/\b(\d{1,2}):(\d{2})\b/g) || [];
      singleTimes.forEach((timeText) => {
        const m = timeText.match(/(\d{1,2}):(\d{2})/);
        if (!m) return;
        const hour = Number(m[1]);
        const minute = Number(m[2]);
        dayIndexes.forEach((dayIndex) => {
          slots.push({ dayIndex, startHour: hour, startMinute: minute, endHour: hour + 1, endMinute: minute });
        });
      });
    });

    return slots;
  };

  const nextOccurrenceForSlot = (slot, fromDate = new Date()) => {
    const now = new Date(fromDate);
    const start = new Date(now);
    const dayOffset = (slot.dayIndex - now.getDay() + 7) % 7;
    start.setDate(now.getDate() + dayOffset);
    start.setHours(slot.startHour, slot.startMinute, 0, 0);
    if (start <= now) start.setDate(start.getDate() + 7);

    const end = new Date(start);
    end.setHours(slot.endHour, slot.endMinute, 0, 0);
    if (end <= start) end.setHours(end.getHours() + 1);
    return { start, end };
  };

  const buildUpcomingClasses = (classRows, limit = 12) => {
    const seed = [];
    classRows.forEach((cls) => {
      extractSlotsFromSchedule(cls.schedule).forEach((slot) => {
        const { start, end } = nextOccurrenceForSlot(slot);
        seed.push({
          className: cls.name || 'Class',
          subject: cls.subject || 'General',
          room: cls.room || 'TBA',
          teacherName: cls.teacherName || cls.teacherId || 'Teacher',
          start,
          end
        });
      });
    });

    const result = [];
    const pool = [...seed];
    while (pool.length > 0 && result.length < limit) {
      pool.sort((a, b) => a.start - b.start);
      const next = pool.shift();
      result.push(next);
      const nextStart = new Date(next.start);
      const nextEnd = new Date(next.end);
      nextStart.setDate(nextStart.getDate() + 7);
      nextEnd.setDate(nextEnd.getDate() + 7);
      pool.push({ ...next, start: nextStart, end: nextEnd });
    }
    return result;
  };

  const loadUpcomingClasses = async (classInfo) => {
    try {
      const normalizedClassName = String(classInfo?.className || classInfo || '').trim().toLowerCase();
      const normalizedClassId = String(classInfo?.classId || '').trim().toUpperCase();
      const classes = await DatabaseService.getAllClasses();
      const matching = classes.filter(
        (cls) =>
          String(cls.name || '').trim().toLowerCase() === normalizedClassName ||
          (normalizedClassId && String(cls.classId || '').trim().toUpperCase() === normalizedClassId)
      );
      setUpcomingClasses(buildUpcomingClasses(matching));
    } catch (error) {
      console.error('Error loading upcoming classes:', error);
      setUpcomingClasses([]);
    }
  };

  const loadAttendance = async (studentId) => {
    const normalizedStudentId = String(studentId || '').toUpperCase();
    if (!normalizedStudentId) return;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const records = await DatabaseService.getStudentAttendance(normalizedStudentId);
      const recordsWithDates = records
        .map((record) => {
          const recordDate = toDate(record?.timestamp) || toDate(record?.createdAt) || toDate(record?.nztTimestamp);
          return {
            ...record,
            _recordDate: recordDate
          };
        })
        .filter((record) => !!record._recordDate && record._recordDate >= thirtyDaysAgo)
        .sort((a, b) => b._recordDate - a._recordDate);

      // Keep only the latest mark per class/day/action so status changes override older marks.
      const latestBySession = new Map();
      recordsWithDates.forEach((record) => {
        const dayKey = record._recordDate.toISOString().slice(0, 10);
        const classKey = String(record.class || studentData?.class || user?.class || 'unknown');
        const actionKey = String(record.type || 'login');
        const sessionKey = `${classKey}|${dayKey}|${actionKey}`;
        if (!latestBySession.has(sessionKey)) {
          latestBySession.set(sessionKey, record);
        }
      });

      const dedupedRecentRecords = Array.from(latestBySession.values()).sort((a, b) => b._recordDate - a._recordDate);
      setRecentAttendance(dedupedRecentRecords.slice(0, 5));

      const loginRecords = dedupedRecentRecords.filter((record) => !record.type || record.type === 'login');
      const absentCount = loginRecords.filter((record) => record.status === 'absent').length;
      const lateCount = loginRecords.filter((record) => record.status === 'late').length;
      const presentCount = loginRecords.filter((record) => record.status !== 'absent').length;
      const presentRate = loginRecords.length > 0 ? Math.round((presentCount / loginRecords.length) * 100) : 0;
      setAttendanceMetrics({
        presentRate,
        absences: absentCount,
        lateCount
      });
    } catch (error) {
      console.error('Error loading attendance:', error);
      setRecentAttendance([]);
      setAttendanceMetrics({ presentRate: 0, absences: 0, lateCount: 0 });
    }
  };

  const handleRefresh = async () => {
    const studentId = String(studentData?.studentId || user?.username || '').toUpperCase();
    const userClass = studentData?.class || user?.class || '10A';
    const userClassId = String(studentData?.classId || '').trim().toUpperCase();
    setRefreshing(true);
    try {
      await Promise.all([
        loadEvents(userClass),
        loadAttendance(studentId),
        loadUpcomingClasses({ className: userClass, classId: userClassId })
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerateNewQR = async () => {
    if (!user?.username) {
      return;
    }
    const base = studentData || {
      studentId: user.username,
      name: user.name,
      firestoreDocId: user.name || user.username,
      class: user.class || '10A'
    };
    const normalized = {
      ...base,
      studentId: base.studentId || user.username,
      name: base.name || user.name,
      class: base.class || user.class || '10A',
      firestoreDocId: base.firestoreDocId || base.id || user.name || user.username
    };
    const newQr = QRCodeUtils.generateStudentQR(normalized);
    setStudentQRCode(newQr);

    const docId = normalized.firestoreDocId;
    if (docId) {
      try {
        await DatabaseService.setStudentQrCodeByDocId(docId, newQr);
      } catch {
        // Still show the new QR locally if Firestore write fails (e.g. rules or missing doc fields).
      }
    }

    if (Platform.OS === 'web') {
      window.alert('A new QR code was generated. Show this code to your teacher for attendance.');
    } else {
      Alert.alert(
        'New QR code',
        'A new QR code was generated. It works the same for attendance; use this one from now on (or print again if you use a printed card).'
      );
    }
  };
  
  const handlePrintQR = async () => {
    const qrDataForPrint = studentQRCode;
    console.log('[QR Print] Using QR code:', qrDataForPrint ? qrDataForPrint.substring(0, 30) : 'NULL');

    if (!qrDataForPrint) {
      alert('QR code is not ready yet. Please wait a moment and try again.');
      return;
    }

    let qrImageDataUrl = qrImageDataUrlForPrint;
    try {
      if (!qrImageDataUrl) {
        qrImageDataUrl = await qrPayloadToDataUrl(qrDataForPrint, PRINT_QR_SIZE);
      }
    } catch (e) {
      console.error('[QR Print] Failed to build QR image:', e);
      if (Platform.OS === 'web') {
        window.alert('Could not prepare the QR image for printing. Please try again.');
      } else {
        Alert.alert('Print', 'Could not prepare the QR image for printing. Please try again.');
      }
      return;
    }

    if (!qrImageDataUrl) {
      if (Platform.OS === 'web') {
        window.alert('QR image is not ready yet. Please wait a moment and try again.');
      } else {
        Alert.alert('Print', 'QR image is not ready yet. Please wait a moment and try again.');
      }
      return;
    }

    const studentName = user?.name || 'Student Name';
    const studentId = user?.username || 'STU001';
    const safeName = escapeHtml(studentName);
    const safeId = escapeHtml(studentId);

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student QR Code - ${safeName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; background: white; color: #333; }
          .print-container { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 20px; border-radius: 10px; background: white; }
          .school-header { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .student-info { margin: 20px 0; display: flex; align-items: center; gap: 20px; }
          .student-photo-container { flex-shrink: 0; }
          .student-photo { width: 80px; height: 80px; border: 2px solid #333; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
          .photo-placeholder { text-align: center; }
          .photo-icon { font-size: 24px; margin-bottom: 4px; }
          .photo-text { font-size: 10px; color: #666; font-weight: bold; }
          .student-details { flex: 1; text-align: left; }
          .student-name { font-size: 20px; font-weight: bold; color: #4a90e2; margin-bottom: 5px; }
          .student-id { font-size: 16px; color: #666; margin-bottom: 20px; }
          .qr-code-container { margin: 20px 0; padding: 15px; border: 2px solid #e0e0e0; border-radius: 10px; background: #ffffff; display: flex; justify-content: center; align-items: center; }
          .instructions { font-size: 14px; color: #666; margin-top: 15px; line-height: 1.4; }
          .footer { margin-top: 20px; font-size: 12px; color: #999; }
          ${qrPrintCssRules(PRINT_QR_SIZE)}
          @media print { body { margin: 0; background: #ffffff !important; } .print-container { border: none; } }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="school-header">School Class Management System</div>
          <div class="student-info">
            <div class="student-photo-container">
              <div class="student-photo">
                <div class="photo-placeholder">
                  <div class="photo-icon">📷</div>
                  <div class="photo-text">Photo</div>
                </div>
              </div>
            </div>
            <div class="student-details">
              <div class="student-name">${safeName}</div>
              <div class="student-id">Student ID: ${safeId}</div>
            </div>
          </div>
          <div class="qr-code-container scms-print-qr">
            ${qrPrintImgTag(qrImageDataUrl, PRINT_QR_SIZE)}
          </div>
          <div class="instructions">
            <strong>Instructions:</strong><br>
            Show this QR code to your teacher for attendance marking.<br>
            Keep this card safe and do not share with others.
          </div>
          <div class="footer">
            Generated on ${new Date().toLocaleDateString()}
          </div>
        </div>
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      openPrintDialogWithHtml(printContent);
      return;
    }

    try {
      await Print.printAsync({ html: printContent });
    } catch (error) {
      console.error('[QR Print] Native print failed:', error);
      Alert.alert('Print error', 'Could not open the print menu. Please try again.');
    }
  };
  
  return (
    <ProtectedRoute requiredRole="student">
      <SafeAreaView style={styles.container}>
        <ScreenGradient>
        <PortalHeader
          actions={[
            {
              id: 'logout',
              label: 'Logout',
              icon: 'log-out',
              onPress: logout,
              iconColor: '#e74c3c',
              borderColor: '#e74c3c',
              backgroundColor: '#fff1ef',
              accessibilityLabel: 'Logout'
            }
          ]}
        />
        <ResponsiveScreen>
      
      {/* Announcements Banner */}
      <AnnouncementBanner 
        userRole="student" 
        userClass={studentData?.class || user?.class || '10A'}
      />
      
      <ScrollView
        style={[styles.content, Platform.OS === 'web' && styles.contentWebFullWidth]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.contentInner}>
        <PortalIdentity portalTitle="Student Portal" userName={user?.name || 'Student'} />
        {/* Student QR Code Section */}
        <View style={styles.section}>
          <View style={styles.qrCodeContainer}>
            <Text style={styles.qrCodeDescription}>
              Show this QR code to your teacher for attendance
            </Text>
            <View style={styles.qrCodeWrapper}>
              <SimpleQRCode
                studentData={studentData}
                qrCode={studentQRCode}
                size={200}
                onQrImageDataUrl={setQrImageDataUrlForPrint}
              />
            </View>
            <TouchableOpacity
              style={styles.regenerateQrButton}
              onPress={handleGenerateNewQR}
              disabled={!studentQRCode}
            >
              <Ionicons name="refresh" size={20} color="#4a90e2" />
              <Text style={styles.regenerateQrButtonText}>Generate new QR code</Text>
            </TouchableOpacity>
            <Text style={styles.studentInfo}>
              Student ID: {studentData?.studentId || user?.username || "STU001"}
            </Text>
            <Text style={styles.studentInfo}>
              Name: {studentData?.name || user?.name || "Student Name"}
            </Text>
            
            <TouchableOpacity 
              style={styles.printButton}
              onPress={handlePrintQR}
              disabled={!studentQRCode}
            >
              <Ionicons name="print" size={20} color="#fff" />
              <Text style={styles.printButtonText}>Print QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Classes</Text>
          {upcomingClasses.length === 0 ? (
            <View style={styles.attendanceList}>
              <Text style={styles.dayText}>No scheduled classes found yet.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingCardsRow}
            >
              {upcomingClasses.map((entry, index) => {
                const roomLabel = String(entry.room || 'TBA').trim();
                const displayRoom = /^room\b/i.test(roomLabel) ? roomLabel : `Room ${roomLabel}`;
                return (
                  <View key={`${entry.className}-${entry.start.toISOString()}-${index}`} style={styles.upcomingClassCard}>
                    <Text style={styles.upcomingClassTitle}>{entry.subject}</Text>
                    <Text style={styles.upcomingClassSubtitle}>{entry.className}</Text>
                    <Text style={styles.eventCardDetailText}>
                      {entry.start.toLocaleDateString()}
                    </Text>
                    <Text style={styles.eventCardDetailText}>
                      {entry.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {entry.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.eventCardDetailText}>{entry.teacherName}</Text>
                    <Text style={styles.eventCardDetailText}>{displayRoom}</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Overview</Text>
          <View style={styles.attendanceStats}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{attendanceMetrics.presentRate}%</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{attendanceMetrics.absences}</Text>
              <Text style={styles.statLabel}>Absences</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{attendanceMetrics.lateCount}</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Attendance</Text>
          <View style={styles.attendanceList}>
            {recentAttendance.length === 0 ? (
              <Text style={styles.dayText}>No attendance records yet.</Text>
            ) : recentAttendance.map((record) => {
              const displayDate =
                toDate(record.timestamp) || toDate(record.createdAt) || toDate(record.nztTimestamp);
              const dateLabel = displayDate ? displayDate.toLocaleDateString() : 'Unknown date';
              const isAbsent = record.status === 'absent';
              return (
                <View key={record.id} style={styles.attendanceItem}>
                  <Text style={styles.dayText}>{dateLabel}</Text>
                  <View style={[styles.statusIndicator, isAbsent ? styles.absentIndicator : styles.presentIndicator]}>
                    <Text style={styles.statusText}>{record.status || 'present'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Upcoming Events */}
        {events.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <View style={styles.eventsList}>
              {events.map((event, index) => (
                <View key={index} style={styles.eventCard}>
                  <View style={styles.eventCardHeader}>
                    <Ionicons name="calendar-outline" size={20} color="#4a90e2" />
                    <Text style={styles.eventCardTitle}>{event.title}</Text>
                  </View>
                  <Text style={styles.eventCardDescription}>{event.description}</Text>
                  <View style={styles.eventCardDetails}>
                    <View style={styles.eventCardDetailRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.eventCardDetailText}>
                        {event.eventDate} | {event.startTime} - {event.endTime}
                      </Text>
                    </View>
                    <View style={styles.eventCardDetailRow}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.eventCardDetailText}>{event.location}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, styles.sectionTitleNoMargin]}>Recent Updates</Text>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push('/updates')}>
              <Text style={styles.viewAllButtonText}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityLogContainer}>
            <ActivityLog
              userRole="student"
              maxItems={3}
              linkedStudentIds={[
                String(studentData?.studentId || user?.studentId || user?.username || '')
                  .trim()
                  .toUpperCase()
              ].filter(Boolean)}
              linkedStudentNames={[
                String(studentData?.name || user?.name || '').trim()
              ].filter(Boolean)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Absence</Text>
          <TouchableOpacity style={styles.requestButton}>
            <Text style={styles.requestButtonText}>Submit Absence Request</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
        </ResponsiveScreen>
        </ScreenGradient>
      </SafeAreaView>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e74c3c',
    gap: 4,
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '600',
  },
  dateTimeContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentWebFullWidth: {
    width: '100vw',
    maxWidth: '100vw',
    alignSelf: 'center',
  },
  contentInner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sectionTitleNoMargin: {
    marginBottom: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllButtonText: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '600',
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '30%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  attendanceList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  attendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  presentIndicator: {
    backgroundColor: '#e6f7ed',
  },
  absentIndicator: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  requestButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  qrCodeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  qrCodeWrapper: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  regenerateQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a90e2',
    backgroundColor: '#fff',
    marginBottom: 15,
    gap: 8,
  },
  regenerateQrButtonText: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: '600',
  },
  studentInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  studentInfoBlock: {
    flex: 1,
  },
  upcomingCardsRow: {
    gap: 12,
    paddingBottom: 4,
  },
  upcomingClassCard: {
    width: 240,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  upcomingClassTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  upcomingClassSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4a90e2',
    marginBottom: 8,
  },
  printButton: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  eventsList: {
    gap: 10,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  eventCardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  eventCardDetails: {
    gap: 5,
  },
  eventCardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventCardDetailText: {
    fontSize: 13,
    color: '#666',
  },
  activityLogContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minHeight: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});

export default StudentPortal;