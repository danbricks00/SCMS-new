import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QRCodeUtils } from '../utils/qrCodeUtils';

const StudentCard = ({ studentData, onMarkAttendance, onClose, attendanceType = 'login' }) => {
  if (!studentData) return null;

  const handleMarkAttendance = (status) => {
    // status can be: 'present', 'late', 'absent'
    onMarkAttendance(studentData, attendanceType, status);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Information</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Student Photo - Prominent Display */}
        <View style={styles.photoContainer}>
          {studentData.photo ? (
            <Image source={{ uri: studentData.photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={48} color="#999" />
              <Text style={styles.noPhotoText}>No Photo</Text>
            </View>
          )}
        </View>

        {/* Verification Warning */}
        <View style={styles.verificationWarning}>
          <Ionicons name="shield-checkmark" size={20} color="#ff9800" />
          <Text style={styles.verificationText}>
            Verify student face matches their photo
          </Text>
        </View>

        {/* Student Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.studentName}>{studentData.name}</Text>
          <Text style={styles.studentId}>ID: {studentData.studentId}</Text>
          <Text style={styles.studentClass}>Class: {studentData.class}</Text>
          
          {/* QR Code Info */}
          <View style={styles.qrInfoContainer}>
            <Ionicons name="qr-code" size={16} color="#4a90e2" />
            <Text style={styles.qrInfoText}>QR Code Verified ✓</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {attendanceType === 'login' ? (
            <>
              {/* Present Button */}
              <TouchableOpacity
                style={[styles.attendanceButton, styles.presentButton]}
                onPress={() => handleMarkAttendance('present')}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.attendanceButtonText}>Mark Present</Text>
              </TouchableOpacity>

              {/* Late Button */}
              <TouchableOpacity
                style={[styles.attendanceButton, styles.lateButton]}
                onPress={() => handleMarkAttendance('late')}
              >
                <Ionicons name="time" size={20} color="#fff" />
                <Text style={styles.attendanceButtonText}>Mark Late</Text>
              </TouchableOpacity>

              {/* Absent Button */}
              <TouchableOpacity
                style={[styles.attendanceButton, styles.absentButton]}
                onPress={() => handleMarkAttendance('absent')}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.attendanceButtonText}>Mark Absent</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* Logout/Checkout Button */
            <TouchableOpacity
              style={[styles.attendanceButton, styles.logoutButton]}
              onPress={() => handleMarkAttendance('checkout')}
            >
              <Ionicons name="log-out" size={20} color="#fff" />
              <Text style={styles.attendanceButtonText}>Check Out</Text>
            </TouchableOpacity>
          )}

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          <Text style={styles.scanTime}>
            Scanned at: {QRCodeUtils.formatNZTTime(new Date().toISOString())}
          </Text>
          <Text style={styles.timezoneInfo}>
            ({QRCodeUtils.getNZTimezoneAbbreviation()})
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 15,
    margin: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34, // Same width as close button for centering
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  photoContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  photo: {
    width: 120,
    height: 140,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: '#4a90e2',
  },
  photoPlaceholder: {
    width: 120,
    height: 140,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  noPhotoText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  verificationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  verificationText: {
    color: '#e65100',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  detailsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  studentId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  studentClass: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  qrInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  qrInfoText: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  actionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  attendanceButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  presentButton: {
    backgroundColor: '#4CAF50',
  },
  lateButton: {
    backgroundColor: '#FF9800',
  },
  absentButton: {
    backgroundColor: '#f44336',
  },
  logoutButton: {
    backgroundColor: '#9C27B0',
  },
  attendanceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  additionalInfo: {
    alignItems: 'center',
  },
  scanTime: {
    color: '#999',
    fontSize: 12,
  },
  timezoneInfo: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 2,
  },
});

export default StudentCard;
