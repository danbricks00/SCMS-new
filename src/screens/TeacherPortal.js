import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import QRScanner from '../components/QRScanner';
import StudentCard from '../components/StudentCard';
import ActivityScanner from '../components/ActivityScanner';
import { DatabaseService } from '../services/database';
import { QR_SCAN_RESULTS } from '../utils/qrCodeUtils';

const TeacherPortal = () => {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showStudentCard, setShowStudentCard] = useState(false);
  const [showActivityScanner, setShowActivityScanner] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [attendanceType, setAttendanceType] = useState('login');
  const [attendanceSummary, setAttendanceSummary] = useState({
    totalStudents: 0,
    presentStudents: 0,
    absentStudents: 0
  });
  const [currentClass, setCurrentClass] = useState('10A');

  useEffect(() => {
    loadAttendanceSummary();
  }, [currentClass]);

  const loadAttendanceSummary = async () => {
    try {
      const summary = await DatabaseService.getTodayAttendanceSummary(currentClass);
      setAttendanceSummary(summary);
    } catch (error) {
      console.error('Error loading attendance summary:', error);
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

  const handleMarkAttendance = async (studentData, type) => {
    try {
      const attendanceData = {
        studentId: studentData.studentId,
        studentName: studentData.name,
        class: studentData.class,
        teacherId: 'TCH001', // This should come from teacher authentication
        teacherName: 'Ms. Johnson', // This should come from teacher authentication
        type: type,
        location: 'Classroom A',
        notes: type === 'login' ? 'Present' : 'Absent'
      };

      await DatabaseService.recordAttendance(attendanceData);
      
      Alert.alert(
        'Attendance Recorded',
        `${studentData.name} marked as ${type === 'login' ? 'Present' : 'Absent'}`,
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
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          <View style={styles.classList}>
            <View style={styles.classCard}>
              <View style={styles.classHeader}>
                <Text style={styles.className}>Class {currentClass}</Text>
                <Text style={styles.classInfo}>{attendanceSummary.totalStudents} Students</Text>
              </View>
              
              <View style={styles.attendanceIndicator}>
                <Text style={styles.attendanceText}>
                  Today's Attendance: {attendanceSummary.presentStudents}/{attendanceSummary.totalStudents}
                </Text>
                <Text style={styles.absentText}>
                  Absent: {attendanceSummary.absentStudents}
                </Text>
              </View>

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
                <Text style={styles.attendanceText}>Today's Attendance: 26/28</Text>
                <Text style={styles.absentText}>Absent: 2</Text>
              </View>

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
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
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
  absentText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 2,
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
});

export default TeacherPortal;