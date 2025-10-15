import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActivityScanner from '../components/ActivityScanner';
import AnnouncementBanner from '../components/AnnouncementBanner';
import DateTimeDisplay from '../components/DateTimeDisplay';
import QRScanner from '../components/QRScanner';
import StudentCard from '../components/StudentCard';
=======
=======
>>>>>>> Stashed changes
import AnnouncementBanner from '../components/AnnouncementBanner';
import QRScanner from '../components/QRScanner';
import StudentCard from '../components/StudentCard';
import ActivityScanner from '../components/ActivityScanner';
import TeacherAnnouncement from '../components/TeacherAnnouncement';
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
import { DatabaseService } from '../services/database';
import { QR_SCAN_RESULTS, QRCodeUtils } from '../utils/qrCodeUtils';

const TeacherPortal = () => {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showStudentCard, setShowStudentCard] = useState(false);
  const [showActivityScanner, setShowActivityScanner] = useState(false);
  const [showTeacherAnnouncement, setShowTeacherAnnouncement] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [attendanceType, setAttendanceType] = useState('login');
  const [attendanceSummary, setAttendanceSummary] = useState({
    totalStudents: 0,
    presentStudents: 0,
    absentStudents: 0,
    lateStudents: 0
  });
  const [currentClass, setCurrentClass] = useState('10A');
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  const [showStudentList, setShowStudentList] = useState(false);
  const [classStudents, setClassStudents] = useState([]);
  const [studentAttendanceStatus, setStudentAttendanceStatus] = useState({});
=======
  const [teacherClasses, setTeacherClasses] = useState(['10A', '8B', '9C']); // Teacher's classes
>>>>>>> Stashed changes
=======
  const [teacherClasses, setTeacherClasses] = useState(['10A', '8B', '9C']); // Teacher's classes
>>>>>>> Stashed changes

  useEffect(() => {
    loadAttendanceSummary();
    loadClassStudents();
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
      const summary = await DatabaseService.getTodayAttendanceSummary(currentClass);
      setAttendanceSummary(summary);
      
      // Build status map for each student
      const statusMap = {};
      summary.attendance.forEach(record => {
        if (record.type === 'login') {
          statusMap[record.studentId] = {
            status: record.status || 'present',
            time: record.nztFormatted || record.timestamp,
            activity: record.activity,
            lateBy: record.lateBy || 0
          };
        }
      });
      setStudentAttendanceStatus(statusMap);
    } catch (error) {
      console.error('Error loading attendance summary:', error);
    }
  };

  const loadClassStudents = async () => {
    try {
      const students = await DatabaseService.getStudentsByClass(currentClass);
      setClassStudents(students);
    } catch (error) {
      console.error('Error loading class students:', error);
      // Fallback to sample data
      setClassStudents([
        { studentId: 'STU10AJ1234', name: 'John Doe', class: currentClass, photo: null },
        { studentId: 'STU10BS5678', name: 'Jane Smith', class: currentClass, photo: null },
        { studentId: 'STU10CW9012', name: 'Bob Wilson', class: currentClass, photo: null },
      ]);
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
        studentId: studentData.studentId,
        studentName: studentData.name,
        class: studentData.class,
        teacherId: 'TCH001', // This should come from teacher authentication
        teacherName: 'Ms. Johnson', // This should come from teacher authentication
        type: type,
        status: status, // 'present', 'late', 'absent', 'checkout'
        location: 'Classroom A',
        notes: statusNotes[status] || 'Attendance marked'
      };

      const result = await DatabaseService.recordAttendance(attendanceData);
      
      // Check if attendance was blocked due to fraud detection
      if (result.blocked) {
        Alert.alert(
          '🚨 Attendance Blocked',
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
      
      const statusEmoji = {
        present: '✅',
        late: '⏰',
        absent: '❌',
        checkout: '👋',
        'left-early': '⚠️'
      };
      
      Alert.alert(
        'Attendance Recorded',
        `${statusEmoji[status]} ${studentData.name} marked as ${statusLabels[status]} at ${timeText} (${timezone})`,
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teacher Portal</Text>
        <TouchableOpacity 
          style={styles.announcementButton}
          onPress={() => setShowTeacherAnnouncement(true)}
        >
          <Ionicons name="megaphone" size={20} color="#4a90e2" />
        </TouchableOpacity>
      </View>
      
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      {/* Date and Time Display */}
      <View style={styles.dateTimeContainer}>
        <DateTimeDisplay />
      </View>
      
      {/* Announcements Banner */}
      <AnnouncementBanner targetAudience="teachers" />
=======
=======
>>>>>>> Stashed changes
      {/* Announcements Banner */}
      <AnnouncementBanner 
        userRole="teacher" 
        userClass={currentClass} 
        userClasses={teacherClasses} 
      />
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          <View style={styles.classList}>
            <View style={styles.classCard}>
              <View style={styles.classHeader}>
                <Text style={styles.className}>Class {currentClass}</Text>
                <Text style={styles.classInfo}>{classStudents.length || attendanceSummary.totalStudents} Students</Text>
              </View>
              
              <View style={styles.attendanceIndicator}>
                <Text style={styles.attendanceText}>
                  Today&apos;s Attendance: {attendanceSummary.presentStudents}/{attendanceSummary.totalStudents}
                </Text>
                <View style={styles.statusBreakdown}>
                  <Text style={styles.presentText}>✅ Present: {attendanceSummary.presentStudents}</Text>
                  <Text style={styles.lateText}>⏰ Late: {attendanceSummary.lateStudents || 0}</Text>
                  <Text style={styles.absentText}>❌ Absent: {attendanceSummary.absentStudents}</Text>
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
                  style={[styles.scanButton, styles.presentButton]}
                  onPress={() => openQRScanner('login')}
                >
                  <Ionicons name="qr-code" size={20} color="#fff" />
                  <Text style={styles.scanButtonText}>Mark Present</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.scanButton, styles.absentButton]}
                  onPress={() => openQRScanner('logout')}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.scanButtonText}>Mark Absent</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.classCard}>
              <View style={styles.classHeader}>
                <Text style={styles.className}>Class 8B</Text>
                <Text style={styles.classInfo}>28 Students</Text>
              </View>
              
              <View style={styles.attendanceIndicator}>
                <Text style={styles.attendanceText}>Today&apos;s Attendance: 26/28</Text>
                <View style={styles.statusBreakdown}>
                  <Text style={styles.presentText}>✅ Present: 26</Text>
                  <Text style={styles.lateText}>⏰ Late: 0</Text>
                  <Text style={styles.absentText}>❌ Absent: 2</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.viewStudentListButton}
                onPress={() => {
                  setCurrentClass('8B');
                  setShowStudentList(true);
                }}
              >
                <Ionicons name="list" size={18} color="#4a90e2" />
                <Text style={styles.viewStudentListText}>View All Students</Text>
              </TouchableOpacity>

              <View style={styles.qrScanButtons}>
                <TouchableOpacity 
                  style={[styles.scanButton, styles.presentButton]}
                  onPress={() => {
                    setCurrentClass('8B');
                    openQRScanner('login');
                  }}
                >
                  <Ionicons name="qr-code" size={20} color="#fff" />
                  <Text style={styles.scanButtonText}>Mark Present</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.scanButton, styles.absentButton]}
                  onPress={() => {
                    setCurrentClass('8B');
                    openQRScanner('logout');
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.scanButtonText}>Mark Absent</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Tracking</Text>
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
            {['8:00 AM - 9:30 AM: Class 10A', '10:00 AM - 11:30 AM: Class 8B', 
              '12:30 PM - 2:00 PM: Class 9C', '2:30 PM - 4:00 PM: Staff Meeting'].map((session, index) => (
              <View key={index} style={styles.scheduleItem}>
                <Ionicons name="time" size={24} color="#4a90e2" />
                <Text style={styles.scheduleText}>{session}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          <View style={styles.announcementList}>
            <View style={styles.announcementItem}>
              <Text style={styles.announcementTitle}>Staff Meeting</Text>
              <Text style={styles.announcementText}>Reminder: Staff meeting today at 2:30 PM in the conference room.</Text>
              <Text style={styles.announcementDate}>Today</Text>
            </View>
            
            <View style={styles.announcementItem}>
              <Text style={styles.announcementTitle}>Exam Schedule</Text>
              <Text style={styles.announcementText}>Mid-term exams will begin next Monday. Please submit your question papers by Friday.</Text>
              <Text style={styles.announcementDate}>Yesterday</Text>
            </View>
          </View>
        </View>
      </ScrollView>

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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
            <TouchableOpacity style={[styles.filterTab, styles.activeFilterTab]}>
              <Text style={styles.activeFilterText}>All ({classStudents.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterTab}>
              <Text style={styles.filterText}>Present ({attendanceSummary.presentStudents})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterTab}>
              <Text style={styles.filterText}>Absent ({attendanceSummary.absentStudents})</Text>
            </TouchableOpacity>
          </View>

          {/* Student List */}
          <ScrollView style={styles.studentListContainer}>
            {classStudents.map((student) => {
              const attendanceInfo = studentAttendanceStatus[student.studentId];
              const status = attendanceInfo?.status || 'absent';
              
              return (
                <View key={student.studentId} style={styles.studentListItem}>
                  <View style={styles.studentAvatar}>
                    <Ionicons name="person-circle" size={48} color="#4a90e2" />
                  </View>
                  
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentListName}>{student.name}</Text>
                    <Text style={styles.studentListId}>{student.studentId}</Text>
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
=======
=======
>>>>>>> Stashed changes
      {/* Teacher Announcement Modal */}
      <TeacherAnnouncement
        isVisible={showTeacherAnnouncement}
        onClose={() => setShowTeacherAnnouncement(false)}
        teacherId="TCH001" // This should come from authentication
        teacherClasses={teacherClasses}
      />
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    </SafeAreaView>
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
  },
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  dateTimeContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
=======
=======
>>>>>>> Stashed changes
  announcementButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
    justifyContent: 'space-between',
    gap: 10,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  presentButton: {
    backgroundColor: '#4CAF50',
  },
  absentButton: {
    backgroundColor: '#FF9800',
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
});

export default TeacherPortal;