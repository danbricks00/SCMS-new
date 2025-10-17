import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnnouncementBanner from '../components/AnnouncementBanner';
import SimpleQRCode from '../components/SimpleQRCode';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

const StudentPortal = () => {
  const { user, logout } = useAuth();
  
  const handlePrintQR = () => {
    // Create a printable HTML page with the QR code
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student QR Code - ${user?.name || 'Student'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            text-align: center;
            background: white;
          }
          .print-container {
            max-width: 400px;
            margin: 0 auto;
            border: 2px solid #333;
            padding: 20px;
            border-radius: 10px;
          }
          .school-header {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .student-info {
            margin: 20px 0;
          }
          .student-name {
            font-size: 20px;
            font-weight: bold;
            color: #4a90e2;
            margin-bottom: 5px;
          }
          .student-id {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
          }
          .qr-code-container {
            margin: 20px 0;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .instructions {
            font-size: 14px;
            color: #666;
            margin-top: 15px;
            line-height: 1.4;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #999;
          }
          @media print {
            body { margin: 0; }
            .print-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="school-header">School Management System</div>
          <div class="student-info">
            <div class="student-name">${user?.name || 'Student Name'}</div>
            <div class="student-id">Student ID: ${user?.username || 'STU001'}</div>
          </div>
          <div class="qr-code-container">
            <canvas id="qrcode" width="200" height="200"></canvas>
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
        
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        <script>
          // Generate QR code data
          const qrData = JSON.stringify({
            studentId: '${user?.username || 'STU001'}',
            studentName: '${user?.name || 'Student Name'}',
            class: '10A',
            timestamp: new Date().toISOString()
          });
          
          // Generate QR code on canvas
          QRCode.toCanvas(document.getElementById('qrcode'), qrData, {
            width: 200,
            height: 200,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            margin: 2,
            errorCorrectionLevel: 'M'
          }, function (error) {
            if (error) {
              console.error('QR code generation error:', error);
              // Fallback: show error message
              document.getElementById('qrcode').style.display = 'none';
              const errorDiv = document.createElement('div');
              errorDiv.innerHTML = 'QR Code generation failed. Please try again.';
              errorDiv.style.color = 'red';
              errorDiv.style.fontSize = '14px';
              document.querySelector('.qr-code-container').appendChild(errorDiv);
            } else {
              console.log('QR code generated successfully');
            }
          });
        </script>
      </body>
      </html>
    `;
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for QR code to load then print
    setTimeout(() => {
      printWindow.print();
    }, 2000);
  };
  
  return (
    <ProtectedRoute requiredRole="student">
      <SafeAreaView style={styles.container}>
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
                studentData={{
                  studentId: user?.username || "STU001",
                  name: user?.name || "Student",
                  class: "10A" // This should come from user data
                }}
                size={200}
              />
            </View>
            <Text style={styles.studentInfo}>
              Student ID: {user?.username || "STU001"}
            </Text>
            <Text style={styles.studentInfo}>
              Name: {user?.name || "Student Name"}
            </Text>
            
            <TouchableOpacity 
              style={styles.printButton}
              onPress={handlePrintQR}
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
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Absence</Text>
          <TouchableOpacity style={styles.requestButton}>
            <Text style={styles.requestButtonText}>Submit Absence Request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginBottom: 15,
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
});

export default StudentPortal;