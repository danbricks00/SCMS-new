import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActivityLog from '../components/ActivityLog';
import AnnouncementBanner from '../components/AnnouncementBanner';
import ProtectedRoute from '../components/ProtectedRoute';
import ResponsiveScreen from '../components/ResponsiveScreen';
import SimpleQRCode from '../components/SimpleQRCode';
import * as Print from 'expo-print';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { QRCodeUtils } from '../utils/qrCodeUtils';

const StudentPortal = () => {
  const { user, logout } = useAuth();
  const [studentQRCode, setStudentQRCode] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [events, setEvents] = useState([]);
  const [qrImageDataUrlForPrint, setQrImageDataUrlForPrint] = useState(null);

  // Load student data and QR code from database
  useEffect(() => {
    const loadStudentData = async () => {
      if (!user?.username || studentQRCode) {
        return;
      }

      const applyStudent = (student) => {
        const normalizedStudent = {
          ...student,
          studentId: student.studentId || user.username,
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
        } else {
          const fallbackData = {
            studentId: user.username,
            name: user.name,
            firestoreDocId: user.name || user.username,
            class: user.class || '10A'
          };
          setStudentData(fallbackData);
          setStudentQRCode(QRCodeUtils.generateStudentQR(fallbackData));
          loadEvents(fallbackData.class);
        }
      } catch (error) {
        console.error('Error loading student data:', error);
        const fallbackData = {
          studentId: user.username,
          name: user.name,
          firestoreDocId: user.name || user.username,
          class: user.class || '10A'
        };
        setStudentData(fallbackData);
        setStudentQRCode(QRCodeUtils.generateStudentQR(fallbackData));
        loadEvents(fallbackData.class);
      }
    };

    loadStudentData();
  }, [user?.username, user?.name, user?.class, studentQRCode]);

  const loadEvents = async (userClass) => {
    try {
      const userEvents = await DatabaseService.getEventsForUser('student', [userClass]);
      setEvents(userEvents);
    } catch (error) {
      console.error('Error loading events:', error);
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

    if (Platform.OS !== 'web' && !qrImageDataUrlForPrint) {
      Alert.alert('Print', 'QR image is not ready yet. Please wait a moment and try again.');
      return;
    }

    const qrValueLiteral = JSON.stringify(qrDataForPrint);
    const shouldAutoPrint = Platform.OS === 'web';
    const studentName = user?.name || 'Student Name';
    const studentId = user?.username || 'STU001';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student QR Code - ${studentName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; background: white; }
          .print-container { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 20px; border-radius: 10px; }
          .school-header { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .student-info { margin: 20px 0; display: flex; align-items: center; gap: 20px; }
          .student-photo-container { flex-shrink: 0; }
          .student-photo { width: 80px; height: 80px; border: 2px solid #333; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
          .photo-placeholder { text-align: center; }
          .photo-icon { font-size: 24px; margin-bottom: 4px; }
          .photo-text { font-size: 10px; color: #666; font-weight: bold; }
          .student-details { flex: 1; }
          .student-name { font-size: 20px; font-weight: bold; color: #4a90e2; margin-bottom: 5px; }
          .student-id { font-size: 16px; color: #666; margin-bottom: 20px; }
          .qr-code-container { margin: 20px 0; padding: 15px; border: 2px solid #e0e0e0; border-radius: 10px; background: white; display: flex; justify-content: center; align-items: center; }
          .instructions { font-size: 14px; color: #666; margin-top: 15px; line-height: 1.4; }
          .footer { margin-top: 20px; font-size: 12px; color: #999; }
          @media print { body { margin: 0; } .print-container { border: none; } }
        </style>
        ${Platform.OS === 'web' ? '<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>' : ''}
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
              <div class="student-name">${studentName}</div>
              <div class="student-id">Student ID: ${studentId}</div>
            </div>
          </div>
          <div class="qr-code-container">
            ${
              Platform.OS === 'web'
                ? '<canvas id="qr-canvas" width="200" height="200" style="width: 200px; height: 200px; display: block; margin: 0 auto;"></canvas>'
                : `<img src="${qrImageDataUrlForPrint}" alt="Student QR Code" style="width: 200px; height: 200px; display: block; margin: 0 auto;" />`
            }
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

        ${
          Platform.OS === 'web'
            ? `
        <script>
          const qrValue = ${qrValueLiteral};
          const SHOULD_AUTO_PRINT = true;

          function renderQr() {
            if (!window.QRCode || !window.QRCode.toCanvas) return false;
            const canvas = document.getElementById('qr-canvas');
            if (!canvas) return false;
            window.QRCode.toCanvas(canvas, qrValue, {
              width: 200,
              height: 200,
              color: { dark: '#000000', light: '#FFFFFF' },
              margin: 2,
              errorCorrectionLevel: 'M'
            });
            return true;
          }

          // Render, then print
          try {
            const rendered = renderQr();
            if (!rendered) {
              setTimeout(renderQr, 250);
            }
          } catch (e) {
            // no-op
          }

          setTimeout(() => {
            if (window && window.print) window.print();
          }, 600);
        </script>
        `
            : ''
        }
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
      } else {
        alert('Please allow pop-ups to print the QR code.');
      }
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
        <ResponsiveScreen>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Portal - {user?.name}</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={20} color="#e74c3c" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      
      {/* Announcements Banner */}
      <AnnouncementBanner 
        userRole="student" 
        userClass="10A" // This should come from student data
      />
      
      <ScrollView style={styles.content}>
        {/* Student QR Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My QR Code</Text>
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
              Student ID: {user?.username || "STU001"}
            </Text>
            <Text style={styles.studentInfo}>
              Name: {user?.name || "Student Name"}
            </Text>
            
            <TouchableOpacity 
              style={styles.printButton}
              onPress={handlePrintQR}
              disabled={Platform.OS !== 'web' && !qrImageDataUrlForPrint}
            >
              <Ionicons name="print" size={20} color="#fff" />
              <Text style={styles.printButtonText}>Print QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Overview</Text>
          <View style={styles.attendanceStats}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>95%</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Absences</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Attendance</Text>
          <View style={styles.attendanceList}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => (
              <View key={index} style={styles.attendanceItem}>
                <Text style={styles.dayText}>{day}</Text>
                <View style={[styles.statusIndicator, 
                  day === 'Wednesday' ? styles.absentIndicator : styles.presentIndicator]}>
                  <Text style={styles.statusText}>
                    {day === 'Wednesday' ? 'Absent' : 'Present'}
                  </Text>
                </View>
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
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Updates</Text>
          <View style={styles.activityLogContainer}>
            <ActivityLog userRole="student" maxItems={5} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Absence</Text>
          <TouchableOpacity style={styles.requestButton}>
            <Text style={styles.requestButtonText}>Submit Absence Request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
        </ResponsiveScreen>
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
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
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