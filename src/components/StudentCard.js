import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QRCodeUtils } from '../utils/qrCodeUtils';

const StudentCard = ({ studentData, onMarkAttendance, onClose, attendanceType = 'login' }) => {
  if (!studentData) return null;

  const getAttendanceButtonColor = () => {
    switch (attendanceType) {
      case 'login':
        return '#4CAF50';
      case 'logout':
        return '#FF9800';
      default:
        return '#4a90e2';
    }
  };

  const getAttendanceButtonText = () => {
    switch (attendanceType) {
      case 'login':
        return 'Mark Present';
      case 'logout':
        return 'Mark Absent';
      default:
        return 'Mark Attendance';
    }
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
        {/* Student Photo */}
        <View style={styles.photoContainer}>
          {studentData.photo ? (
            <Image source={{ uri: studentData.photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={40} color="#666" />
            </View>
          )}
        </View>

        {/* Student Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.studentName}>{studentData.name}</Text>
          <Text style={styles.studentId}>ID: {studentData.studentId}</Text>
          <Text style={styles.studentClass}>Class: {studentData.class}</Text>
          
          {/* QR Code Info */}
          <View style={styles.qrInfoContainer}>
            <Ionicons name="qr-code" size={16} color="#4a90e2" />
            <Text style={styles.qrInfoText}>QR Code Verified</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.attendanceButton, { backgroundColor: getAttendanceButtonColor() }]}
            onPress={() => onMarkAttendance(studentData, attendanceType)}
          >
            <Ionicons 
              name={attendanceType === 'login' ? 'checkmark-circle' : 'close-circle'} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.attendanceButtonText}>
              {getAttendanceButtonText()}
            </Text>
          </TouchableOpacity>

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
            Scanned at: {QRCodeUtils.formatNZSTTime(new Date().toISOString())}
          </Text>
          <Text style={styles.timezoneInfo}>
            (New Zealand Standard Time)
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
    marginBottom: 20,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#4a90e2',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ddd',
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
  attendanceButtonText: {
    color: '#fff',
    fontSize: 18,
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
