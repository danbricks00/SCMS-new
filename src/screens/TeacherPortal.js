import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActivityScanner from '../components/ActivityScanner';
import AnnouncementBanner from '../components/AnnouncementBanner';
import EventManager from '../components/EventManager';
import ProtectedRoute from '../components/ProtectedRoute';
import ResponsiveScreen from '../components/ResponsiveScreen';
import QRScanner from '../components/QRScanner';
import StudentCard from '../components/StudentCard';
import TeacherAnnouncement from '../components/TeacherAnnouncement';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { QR_SCAN_RESULTS, QRCodeUtils } from '../utils/qrCodeUtils';

const TeacherPortal = () => {
  const { user, logout } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showStudentCard, setShowStudentCard] = useState(false);
  const [showActivityScanner, setShowActivityScanner] = useState(false);
  const [showTeacherAnnouncement, setShowTeacherAnnouncement] = useState(false);
  const [showEventManager, setShowEventManager] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [attendanceType, setAttendanceType] = useState('login');
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [classesData, setClassesData] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    totalStudents: 0,
    presentStudents: 0,
    absentStudents: 0,
    lateStudents: 0
  });
  const [currentClass, setCurrentClass] = useState('');
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [showStudentList, setShowStudentList] = useState(false);
  const [classStudents, setClassStudents] = useState([]);
  const [studentAttendanceStatus, setStudentAttendanceStatus] = useState({});
  const [studentListFilter, setStudentListFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTeacherClasses();
  }, [user?.name, user?.profileId]);

  useEffect(() => {
    if (!currentClass) return;
    loadAttendanceSummary();
    loadClassStudents();
    loadEvents();
    loadAnnouncements();
  }, [currentClass]);

  useEffect(() => {
    // Refresh when student list modal opens
    if (showStudentList) {
      loadClassStudents();
      loadAttendanceSummary();
    }
  }, [showStudentList]);

  const loadAttendanceSummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [students, attendanceRecords] = await Promise.all([
        DatabaseService.getStudentsByClass(currentClass),
        DatabaseService.getClassAttendance(currentClass, today)
      ]);

      const totalStudents = students.length;
      const statusMap = {};
      [...attendanceRecords]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .forEach(record => {
        const normalizedStudentId = String(record.studentId || '').toUpperCase();
        if (record.type === 'login') {
          statusMap[normalizedStudentId] = {
            status: record.status || 'present',
            time: record.nztFormatted || record.timestamp,
            activity: record.activity,
            lateBy: record.lateBy || 0
          };
        }
      });

      let presentStudents = 0;
      let lateStudents = 0;
      students.forEach((student) => {
        const normalizedStudentId = String(student.studentId || student.id || '').toUpperCase();
        const status = statusMap[normalizedStudentId]?.status;
        if (status && status !== 'absent') presentStudents += 1;
        if (status === 'late') lateStudents += 1;
      });

      const absentStudents = Math.max(totalStudents - presentStudents, 0);
      setAttendanceSummary({
        totalStudents,
        presentStudents,
        absentStudents,
        lateStudents,
      });

      setStudentAttendanceStatus(statusMap);
    } catch (error) {
      console.error('Error loading attendance summary:', error);
      setAttendanceSummary({
        totalStudents: 0,
        presentStudents: 0,
        absentStudents: 0,
        lateStudents: 0
      });
      setStudentAttendanceStatus({});
    }
  };

  const loadTeacherClasses = async () => {
    try {
      const allClasses = await DatabaseService.getAllClasses();
      const mine = allClasses.filter((cls) => {
        return (
          (user?.profileId && cls.teacherId === user.profileId) ||
          (user?.name && cls.teacherName === user.name)
        );
      });
      const classNames = mine.map((cls) => cls.name);
      setClassesData(mine);
      setTeacherClasses(classNames);
      if (classNames.length > 0 && !classNames.includes(currentClass)) {
        setCurrentClass(classNames[0]);
      }
    } catch (error) {
      console.error('Error loading teacher classes:', error);
      setClassesData([]);
      setTeacherClasses([]);
      setCurrentClass('');
    }
  };

  const loadClassStudents = async () => {
    try {
      const students = await DatabaseService.getStudentsByClass(currentClass);
      setClassStudents(students);
    } catch (error) {
      console.error('Error loading class students:', error);
      setClassStudents([]);
    }
  };

  const loadEvents = async () => {
    try {
      const userEvents = await DatabaseService.getEventsForUser('teacher', teacherClasses);
      setEvents(userEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const data = await DatabaseService.getAnnouncementsForUser('teacher', currentClass, teacherClasses);
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setAnnouncements([]);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await DatabaseService.createEvent(eventData);
      if (Platform.OS === 'web') {
        alert('Event created successfully!');
      } else {
        Alert.alert('Success', 'Event created successfully!');
      }
      setShowEventManager(false);
      loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      if (Platform.OS === 'web') {
        alert('Error creating event');
      } else {
        Alert.alert('Error', 'Failed to create event');
      }
    }
  };

  const handleQRScan = (scanResult) => {
    setShowQRScanner(false);
    
    if (scanResult.result === QR_SCAN_RESULTS.SUCCESS) {
      setScannedStudent(scanResult.studentData);
      setShowStudentCard(true);
    } else if (scanResult.result === QR_SCAN_RESULTS.INVALID) {
      Alert.alert('Invalid QR Code', 'The scanned QR code is not valid for this system.');
    } else {
      Alert.alert('Scan Error', scanResult.error || 'Failed to scan QR code');
    }
  };

  const handleMarkAttendance = async (studentData, type, status = 'present') => {
    try {
      // status can be: 'present', 'late', 'absent', 'checkout'
      const statusLabels = {
        present: 'Present (On Time)',
        late: 'Late',
        absent: 'Absent',
        checkout: 'Checked Out',
        'left-early': 'Left Early'
      };
      
      const statusNotes = {
        present: 'Present - On time',
        late: 'Present - Arrived late',
        absent: 'Marked absent',
        checkout: 'Checked out - Completed activity',
        'left-early': 'Left early - Did not complete full activity'
      };
      
      const attendanceData = {
        studentId: String(
          studentData.studentId ||
          studentData.profileId ||
          studentData.username ||
          ''
        ).toUpperCase(),
        studentName: studentData.name || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
        studentDocId: studentData.firestoreDocId || null,
        class: studentData.class || currentClass,
        teacherId: user?.profileId || user?.username || 'TEACHER',
        teacherName: user?.name || 'Teacher',
        type: type,
        status: status, // 'present', 'late', 'absent', 'checkout'
        location: 'Classroom A',
        notes: statusNotes[status] || 'Attendance marked'
      };

      if (!attendanceData.studentId) {
        Alert.alert('Missing student ID', 'Could not mark attendance because this student has no valid ID.');
        return;
      }

      const result = await DatabaseService.recordAttendance(attendanceData);
      
      // Check if attendance was blocked due to fraud detection
      if (result.blocked) {
        Alert.alert(
          'Attendance blocked',
          result.message,
          [{ text: 'OK', onPress: () => {
            setShowStudentCard(false);
            setScannedStudent(null);
          }}]
        );
        return;
      }
      
      const timeText = QRCodeUtils.formatNZTTime(new Date().toISOString());
      const timezone = QRCodeUtils.getNZTimezoneAbbreviation();
      
      Alert.alert(
        'Attendance recorded',
        `${studentData.name} marked as ${statusLabels[status]} at ${timeText} (${timezone})`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowStudentCard(false);
              setScannedStudent(null);
              loadAttendanceSummary(); // Refresh the summary
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error recording attendance:', error);
      Alert.alert('Error', 'Failed to record attendance. Please try again.');
    }
  };

  const openQRScanner = (type) => {
    setAttendanceType(type);
    setShowQRScanner(true);
  };

  const closeQRScanner = () => {
    setShowQRScanner(false);
  };

  const closeStudentCard = () => {
    setShowStudentCard(false);
    setScannedStudent(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTeacherClasses();
      if (currentClass) {
        await Promise.all([
          loadAttendanceSummary(),
          loadClassStudents(),
          loadEvents(),
          loadAnnouncements()
        ]);
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="teacher">
      <SafeAreaView style={styles.container}>
        <ResponsiveScreen>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Teacher Portal - {user?.name}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.announcementButton}
              onPress={() => setShowTeacherAnnouncement(true)}
            >
              <Ionicons name="megaphone" size={20} color="#4a90e2" />
              <Text style={styles.announcementButtonText}>Announce</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.eventButton}
              onPress={() => setShowEventManager(true)}
            >
              <Ionicons name="calendar" size={20} color="#4a90e2" />
              <Text style={styles.eventButtonText}>Event</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Ionicons name="log-out" size={20} color="#e74c3c" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      
      {/* Announcements Banner */}
      <AnnouncementBanner 
        userRole="teacher" 
        userClass={currentClass} 
        userClasses={teacherClasses} 
      />
      
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          <View style={styles.classList}>
            {currentClass ? <View style={styles.classCard}>
              <View style={styles.classHeader}>
                <Text style={styles.className}>Class {currentClass}</Text>
                <Text style={styles.classInfo}>{classStudents.length || attendanceSummary.totalStudents} Students</Text>
              </View>
              
              <View style={styles.attendanceIndicator}>
                <Text style={styles.attendanceText}>
                  Today&apos;s Attendance: {attendanceSummary.presentStudents}/{attendanceSummary.totalStudents}
                </Text>
                <View style={styles.statusBreakdown}>
                  <Text style={styles.presentText}>Present: {attendanceSummary.presentStudents}</Text>
                  <Text style={styles.lateText}>Late: {attendanceSummary.lateStudents || 0}</Text>
                  <Text style={styles.absentText}>Absent: {attendanceSummary.absentStudents}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.viewStudentListButton}
                onPress={() => {
                  setShowStudentList(true);
                }}
              >
                <Ionicons name="list" size={18} color="#4a90e2" />
                <Text style={styles.viewStudentListText}>View All Students</Text>
              </TouchableOpacity>

              <View style={styles.qrScanButtons}>
                <TouchableOpacity 
                  style={[styles.scanButton, styles.checkInButton]}
                  onPress={() => openQRScanner('login')}
                >
                  <Ionicons name="log-in" size={18} color="#fff" />
                  <Text style={styles.scanButtonText}>Check In</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.scanButton, styles.absentButton]}
                  onPress={() => openQRScanner('absent')}
                >
                  <Ionicons name="close-circle" size={18} color="#fff" />
                  <Text style={styles.scanButtonText}>Mark Absent</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.scanButton, styles.checkOutButton]}
                  onPress={() => openQRScanner('logout')}
                >
                  <Ionicons name="log-out" size={18} color="#fff" />
                  <Text style={styles.scanButtonText}>Check Out</Text>
                </TouchableOpacity>
              </View>
            </View> : (
              <Text style={styles.classInfo}>No classes found for this teacher yet.</Text>
            )}

            {teacherClasses.length > 1 && (
              <View style={styles.classSwitchRow}>
                {teacherClasses.map((className) => (
                  <TouchableOpacity
                    key={className}
                    style={[
                      styles.classSwitchChip,
                      currentClass === className && styles.classSwitchChipActive
                    ]}
                    onPress={() => setCurrentClass(className)}
                  >
                    <Text style={[
                      styles.classSwitchChipText,
                      currentClass === className && styles.classSwitchChipTextActive
                    ]}>
                      {className}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Tracking</Text>
          <TouchableOpacity
            style={styles.nfcPrepButton}
            onPress={() => router.push('/nfc-kiosk')}
          >
            <Ionicons name="phone-portrait-outline" size={22} color="#1565c0" />
            <Text style={styles.nfcPrepButtonText}>NFC kiosk (prep)</Text>
            <Ionicons name="chevron-forward" size={20} color="#1565c0" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.activityButton}
            onPress={() => setShowActivityScanner(true)}
          >
            <Ionicons name="qr-code" size={32} color="#fff" />
            <View style={styles.activityButtonContent}>
              <Text style={styles.activityButtonTitle}>Track Activities</Text>
              <Text style={styles.activityButtonSubtitle}>
                Sports, Library, Events, Clubs
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
          <View style={styles.scheduleList}>
            {(classesData.length ? classesData.map((cls) => `${cls.schedule || 'Time TBA'}: Class ${cls.name}`) : ['No schedule data available']).map((session, index) => (
              <View key={index} style={styles.scheduleItem}>
                <Ionicons name="time" size={24} color="#4a90e2" />
                <Text style={styles.scheduleText}>{session}</Text>
              </View>
            ))}
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
                    {event.targetClasses && event.targetClasses.length > 0 && (
                      <View style={styles.eventCardDetailRow}>
                        <Ionicons name="people-outline" size={16} color="#666" />
                        <Text style={styles.eventCardDetailText}>
                          Classes: {event.targetClasses.join(', ')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          <View style={styles.announcementList}>
            {announcements.length === 0 ? (
              <Text style={styles.announcementText}>No announcements available.</Text>
            ) : announcements.slice(0, 3).map((announcement) => (
              <View key={announcement.id} style={styles.announcementItem}>
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <Text style={styles.announcementText}>{announcement.message}</Text>
                <Text style={styles.announcementDate}>
                  {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : 'Now'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
        </ResponsiveScreen>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <QRScanner
          onScan={handleQRScan}
          onClose={closeQRScanner}
          isVisible={showQRScanner}
        />
      </Modal>

      {/* Student Card Modal */}
      <Modal
        visible={showStudentCard}
        animationType="slide"
        transparent={true}
        onRequestClose={closeStudentCard}
      >
        <View style={styles.modalOverlay}>
          <StudentCard
            studentData={scannedStudent}
            onMarkAttendance={handleMarkAttendance}
            onClose={closeStudentCard}
            attendanceType={attendanceType}
          />
        </View>
      </Modal>

      {/* Activity Scanner Modal */}
      <Modal
        visible={showActivityScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ActivityScanner
          isVisible={showActivityScanner}
          onClose={() => setShowActivityScanner(false)}
          onActivityComplete={() => {
            // Refresh any relevant data if needed
            loadAttendanceSummary();
          }}
        />
      </Modal>

      {/* Student List Modal */}
      <Modal
        visible={showStudentList}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStudentList(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Class {currentClass} - All Students</Text>
            <TouchableOpacity onPress={() => loadAttendanceSummary()}>
              <Ionicons name="refresh" size={24} color="#4a90e2" />
            </TouchableOpacity>
          </View>

          {/* Attendance Summary Header */}
          <View style={styles.summaryHeader}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{attendanceSummary.totalStudents}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={[styles.summaryCard, styles.presentCard]}>
              <Text style={[styles.summaryNumber, styles.presentNumber]}>{attendanceSummary.presentStudents}</Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
            <View style={[styles.summaryCard, styles.lateCard]}>
              <Text style={[styles.summaryNumber, styles.lateNumber]}>{attendanceSummary.lateStudents || 0}</Text>
              <Text style={styles.summaryLabel}>Late</Text>
            </View>
            <View style={[styles.summaryCard, styles.absentCard]}>
              <Text style={[styles.summaryNumber, styles.absentNumber]}>{attendanceSummary.absentStudents}</Text>
              <Text style={styles.summaryLabel}>Absent</Text>
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[styles.filterTab, studentListFilter === 'all' && styles.activeFilterTab]}
              onPress={() => setStudentListFilter('all')}
            >
              <Text style={studentListFilter === 'all' ? styles.activeFilterText : styles.filterText}>
                All ({classStudents.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, studentListFilter === 'present' && styles.activeFilterTab]}
              onPress={() => setStudentListFilter('present')}
            >
              <Text style={studentListFilter === 'present' ? styles.activeFilterText : styles.filterText}>
                Present ({attendanceSummary.presentStudents})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, studentListFilter === 'absent' && styles.activeFilterTab]}
              onPress={() => setStudentListFilter('absent')}
            >
              <Text style={studentListFilter === 'absent' ? styles.activeFilterText : styles.filterText}>
                Absent ({attendanceSummary.absentStudents})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Student List */}
          <ScrollView style={styles.studentListContainer}>
            {classStudents.filter((student) => {
              if (studentListFilter === 'all') return true;
              const normalizedStudentId = String(student.studentId || student.id || '').toUpperCase();
              const attendanceInfo = studentAttendanceStatus[normalizedStudentId] || studentAttendanceStatus[student.id];
              const status = attendanceInfo?.status || 'absent';
              if (studentListFilter === 'present') return status !== 'absent';
              if (studentListFilter === 'absent') return status === 'absent';
              return true;
            }).map((student, index) => {
              const studentKey = student.studentId || student.id || `${student.firstName || 'student'}-${student.lastName || index}`;
              const normalizedStudentId = String(student.studentId || student.id || '').toUpperCase();
              const attendanceInfo = studentAttendanceStatus[normalizedStudentId] || studentAttendanceStatus[student.id];
              const status = attendanceInfo?.status || 'absent';
              const displayName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed student';
              const displayStudentId = student.studentId || student.id || 'N/A';
              
              return (
                <View key={studentKey} style={styles.studentListItem}>
                  <View style={styles.studentAvatar}>
                    <Ionicons name="person-circle" size={48} color="#4a90e2" />
                  </View>
                  
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentListName}>{displayName}</Text>
                    <Text style={styles.studentListId}>{displayStudentId}</Text>
                    {attendanceInfo && (
                      <Text style={styles.studentListActivity}>
                        {attendanceInfo.activity} • {attendanceInfo.time}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.statusBadgeContainer}>
                    {status === 'present' && (
                      <View style={[styles.statusBadge, styles.presentBadge]}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.presentBadgeText}>Present</Text>
                      </View>
                    )}
                    {status === 'late' && (
                      <View style={[styles.statusBadge, styles.lateBadge]}>
                        <Ionicons name="time" size={16} color="#FF9800" />
                        <Text style={styles.lateBadgeText}>
                          Late {attendanceInfo?.lateBy ? `(+${attendanceInfo.lateBy}m)` : ''}
                        </Text>
                      </View>
                    )}
                    {status === 'absent' && (
                      <View style={[styles.statusBadge, styles.absentBadge]}>
                        <Ionicons name="close-circle" size={16} color="#f44336" />
                        <Text style={styles.absentBadgeText}>Absent</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Teacher Announcement Modal */}
      <TeacherAnnouncement
        visible={showTeacherAnnouncement}
        onClose={() => setShowTeacherAnnouncement(false)}
        teacherId={user?.profileId || user?.username || "TEACHER"}
        teacherName={user?.name || "Teacher"}
        teacherClasses={teacherClasses.map((className, index) => ({
          id: `class_${index}`,
          name: className,
          subject: classesData.find((cls) => cls.name === className)?.subject || 'General'
        }))}
      />

      {/* Event Manager Modal */}
      <EventManager
        visible={showEventManager}
        onClose={() => setShowEventManager(false)}
        onSubmit={handleCreateEvent}
        userRole="teacher"
        teacherClasses={teacherClasses}
      />
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
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flex: 1,
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
  announcementButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  classList: {
    gap: 12,
  },
  classSwitchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  classSwitchChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f1f1',
  },
  classSwitchChipActive: {
    backgroundColor: '#4a90e2',
  },
  classSwitchChipText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '600',
  },
  classSwitchChipTextActive: {
    color: '#fff',
  },
  classCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  classInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  attendanceIndicator: {
    marginTop: 8,
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 15,
  },
  attendanceText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
  },
  statusBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  presentText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  lateText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '500',
  },
  absentText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '500',
  },
  viewStudentListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4a90e2',
    gap: 6,
  },
  viewStudentListText: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '600',
  },
  qrScanButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  scanButton: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 4,
  },
  checkInButton: {
    backgroundColor: '#4CAF50',
  },
  absentButton: {
    backgroundColor: '#FF9800',
  },
  checkOutButton: {
    backgroundColor: '#2196F3',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nfcPrepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#90caf9',
    gap: 10,
  },
  nfcPrepButtonText: {
    flex: 1,
    color: '#1565c0',
    fontSize: 15,
    fontWeight: '600',
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  activityButtonContent: {
    flex: 1,
    marginLeft: 15,
  },
  activityButtonTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityButtonSubtitle: {
    color: '#e3f2fd',
    fontSize: 14,
  },
  scheduleList: {
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  scheduleText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  announcementList: {
    gap: 12,
  },
  announcementItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  announcementText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    color: '#999',
  },
  // Student List Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryCard: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  presentNumber: {
    color: '#4CAF50',
  },
  lateNumber: {
    color: '#FF9800',
  },
  absentNumber: {
    color: '#f44336',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeFilterTab: {
    backgroundColor: '#4a90e2',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
  },
  activeFilterText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  studentListContainer: {
    flex: 1,
    padding: 15,
  },
  studentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  studentAvatar: {
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  studentListId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  studentListActivity: {
    fontSize: 11,
    color: '#999',
  },
  statusBadgeContainer: {
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  presentBadge: {
    backgroundColor: '#e8f5e9',
  },
  presentBadgeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  lateBadge: {
    backgroundColor: '#fff3e0',
  },
  lateBadgeText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
  },
  absentBadge: {
    backgroundColor: '#ffebee',
  },
  absentBadgeText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '600',
  },
  eventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4a90e2',
    gap: 4,
    marginRight: 8,
  },
  eventButtonText: {
    color: '#4a90e2',
    fontSize: 12,
    fontWeight: '600',
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
});

export default TeacherPortal;