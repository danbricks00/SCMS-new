import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Modal, ScrollView, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRScanner from './QRScanner';
import StudentCard from './StudentCard';
import { DatabaseService } from '../services/database';
import { QRCodeUtils, QR_SCAN_RESULTS } from '../utils/qrCodeUtils';
import { scheduleActivity } from '../utils/activityScheduler';

const ACTIVITY_TYPES = [
  { id: 'classroom', name: 'Classroom', icon: 'school', color: '#4a90e2' },
  { id: 'sports', name: 'Sports', icon: 'football', color: '#4CAF50' },
  { id: 'library', name: 'Library', icon: 'library', color: '#FF9800' },
  { id: 'event', name: 'Event', icon: 'calendar', color: '#9C27B0' },
  { id: 'club', name: 'Club', icon: 'people', color: '#E91E63' }
];

const POPULAR_ACTIVITIES = {
  classroom: ['Math Class', 'English Class', 'Science Class', 'History Class'],
  sports: ['Football Practice', 'Basketball Training', 'Swimming', 'Athletics'],
  library: ['Library Study', 'Research Session', 'Quiet Study'],
  event: ['Assembly', 'Parent Meeting', 'School Trip', 'Performance'],
  club: ['Debate Club', 'Art Club', 'Music Club', 'Chess Club']
};

const ActivityScanner = ({ isVisible, onClose, onActivityComplete }) => {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showStudentCard, setShowStudentCard] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [scanType, setScanType] = useState('login'); // 'login' or 'logout'
  const [selectedActivityType, setSelectedActivityType] = useState('classroom');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [customActivity, setCustomActivity] = useState('');
  const [location, setLocation] = useState('');
  const [currentActivitySummary, setCurrentActivitySummary] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    startTime: '08:00',
    endTime: '09:30',
    autoCheckout: true,
    recurring: false
  });

  useEffect(() => {
    if (isVisible && selectedActivity) {
      loadActivitySummary();
    }
  }, [selectedActivity, isVisible]);

  const loadActivitySummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const summary = await DatabaseService.getActivitySummary(selectedActivity, today);
      setCurrentActivitySummary(summary);
    } catch (error) {
      console.error('Error loading activity summary:', error);
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

  const handleMarkActivity = async (studentData, type, status = 'present') => {
    try {
      const activityData = {
        studentId: studentData.studentId,
        studentName: studentData.name,
        class: studentData.class,
        teacherId: 'TCH001', // This should come from teacher authentication
        teacherName: 'Ms. Johnson', // This should come from teacher authentication
        type: type,
        status: status, // 'present', 'late', 'absent', 'checkout'
        activity: selectedActivity || customActivity,
        activityType: selectedActivityType,
        location: location || 'Main Campus',
        notes: type === 'login' 
          ? (status === 'late' ? 'Started activity - Late arrival' : 'Started activity') 
          : 'Completed activity'
      };

      const result = await DatabaseService.recordAttendance(activityData);
      
      // Check if blocked by fraud detection
      if (result.blocked) {
        Alert.alert(
          '🚨 Activity Blocked',
          result.message,
          [{ text: 'OK', onPress: () => {
            setShowStudentCard(false);
            setScannedStudent(null);
          }}]
        );
        return;
      }
      
      const timeText = QRCodeUtils.formatNZTTime(new Date().toISOString());
      
      const statusEmoji = {
        present: '✅',
        late: '⏰',
        absent: '❌',
        checkout: '👋',
        'left-early': '⚠️'
      };
      
      const emoji = statusEmoji[status] || '📝';
      const action = type === 'login' 
        ? (status === 'late' ? 'started (late)' : 'started') 
        : (status === 'left-early' ? 'left early from' : 'completed');
      
      Alert.alert(
        'Activity Recorded',
        `${emoji} ${studentData.name} ${action} ${selectedActivity || customActivity} at ${timeText}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowStudentCard(false);
              setScannedStudent(null);
              loadActivitySummary(); // Refresh the summary
              if (onActivityComplete) {
                onActivityComplete();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error recording activity:', error);
      Alert.alert('Error', 'Failed to record activity. Please try again.');
    }
  };

  const openQRScanner = (type) => {
    if (!selectedActivity && !customActivity) {
      Alert.alert('Select Activity', 'Please select an activity before scanning.');
      return;
    }
    setScanType(type);
    setShowQRScanner(true);
  };

  const closeQRScanner = () => {
    setShowQRScanner(false);
  };

  const closeStudentCard = () => {
    setShowStudentCard(false);
    setScannedStudent(null);
  };

  const getActivityTypeIcon = (type) => {
    const activityType = ACTIVITY_TYPES.find(t => t.id === type);
    return activityType ? activityType.icon : 'help-circle';
  };

  const getActivityTypeColor = (type) => {
    const activityType = ACTIVITY_TYPES.find(t => t.id === type);
    return activityType ? activityType.color : '#666';
  };

  if (!isVisible) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Scanner</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Activity Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activityTypeScroll}>
            {ACTIVITY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.activityTypeButton,
                  selectedActivityType === type.id && styles.activityTypeButtonSelected,
                  { borderColor: type.color }
                ]}
                onPress={() => {
                  setSelectedActivityType(type.id);
                  setSelectedActivity(''); // Reset activity selection
                }}
              >
                <Ionicons 
                  name={type.icon} 
                  size={24} 
                  color={selectedActivityType === type.id ? '#fff' : type.color} 
                />
                <Text style={[
                  styles.activityTypeText,
                  selectedActivityType === type.id && styles.activityTypeTextSelected,
                  { color: selectedActivityType === type.id ? '#fff' : type.color }
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Activity Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Activity</Text>
          <View style={styles.activityList}>
            {POPULAR_ACTIVITIES[selectedActivityType]?.map((activity) => (
              <TouchableOpacity
                key={activity}
                style={[
                  styles.activityButton,
                  selectedActivity === activity && styles.activityButtonSelected
                ]}
                onPress={() => {
                  setSelectedActivity(activity);
                  setCustomActivity('');
                }}
              >
                <Text style={[
                  styles.activityButtonText,
                  selectedActivity === activity && styles.activityButtonTextSelected
                ]}>
                  {activity}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* Custom Activity Input */}
            <View style={styles.customActivityContainer}>
              <Text style={styles.customActivityLabel}>Or enter custom activity:</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={customActivity}
                  onChangeText={setCustomActivity}
                  placeholder="e.g., Chess Tournament"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location (Optional)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Sports Field, Library, Room 101"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Current Activity Summary */}
        {currentActivitySummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Activity Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Ionicons name="people" size={20} color="#4a90e2" />
                <Text style={styles.summaryText}>
                  Total Participants: {currentActivitySummary.totalParticipants}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.summaryText}>
                  Completed Sessions: {currentActivitySummary.completedSessions}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="time" size={20} color="#FF9800" />
                <Text style={styles.summaryText}>
                  Average Duration: {currentActivitySummary.averageDuration} min
                </Text>
              </View>
              {currentActivitySummary.ongoingSessions > 0 && (
                <View style={styles.summaryRow}>
                  <Ionicons name="play-circle" size={20} color="#9C27B0" />
                  <Text style={styles.summaryText}>
                    Currently Active: {currentActivitySummary.ongoingSessions}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Schedule Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Schedule (Optional)</Text>
          <TouchableOpacity 
            style={styles.scheduleButton}
            onPress={() => setShowScheduleModal(true)}
          >
            <Ionicons name="calendar" size={20} color="#4a90e2" />
            <Text style={styles.scheduleButtonText}>Set Activity Time & Auto-Checkout</Text>
          </TouchableOpacity>
          {scheduleData.startTime && scheduleData.endTime && (
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleInfoText}>
                ⏰ Scheduled: {scheduleData.startTime} - {scheduleData.endTime}
              </Text>
              {scheduleData.autoCheckout && (
                <Text style={styles.scheduleInfoSubtext}>
                  🤖 Students will auto-checkout at {scheduleData.endTime}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Scan Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scan Student QR Code</Text>
          <View style={styles.scanButtons}>
            <TouchableOpacity 
              style={[styles.scanButton, styles.loginButton]}
              onPress={() => openQRScanner('login')}
            >
              <Ionicons name="qr-code" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Check In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.scanButton, styles.logoutButton]}
              onPress={() => openQRScanner('logout')}
            >
              <Ionicons name="stop-circle" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Check Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Schedule Activity Modal */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.scheduleModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Activity</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.scheduleForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TextInput
                  style={styles.timeInput}
                  value={scheduleData.startTime}
                  onChangeText={(text) => setScheduleData({...scheduleData, startTime: text})}
                  placeholder="08:00"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TextInput
                  style={styles.timeInput}
                  value={scheduleData.endTime}
                  onChangeText={(text) => setScheduleData({...scheduleData, endTime: text})}
                  placeholder="09:30"
                />
              </View>
              
              <View style={styles.switchGroup}>
                <View>
                  <Text style={styles.inputLabel}>Auto-Checkout Students</Text>
                  <Text style={styles.switchDesc}>
                    Automatically check out all students at end time
                  </Text>
                </View>
                <Switch
                  value={scheduleData.autoCheckout}
                  onValueChange={(value) => setScheduleData({...scheduleData, autoCheckout: value})}
                  trackColor={{ false: '#ccc', true: '#4CAF50' }}
                />
              </View>
              
              <View style={styles.switchGroup}>
                <View>
                  <Text style={styles.inputLabel}>Recurring Activity</Text>
                  <Text style={styles.switchDesc}>
                    Repeat this schedule for future sessions
                  </Text>
                </View>
                <Switch
                  value={scheduleData.recurring}
                  onValueChange={(value) => setScheduleData({...scheduleData, recurring: value})}
                  trackColor={{ false: '#ccc', true: '#4CAF50' }}
                />
              </View>
              
              <TouchableOpacity
                style={styles.saveScheduleButton}
                onPress={() => {
                  Alert.alert(
                    'Schedule Saved',
                    `Activity scheduled from ${scheduleData.startTime} to ${scheduleData.endTime}${scheduleData.autoCheckout ? '. Students will auto-checkout at end time.' : ''}`,
                    [{ text: 'OK', onPress: () => setShowScheduleModal(false) }]
                  );
                }}
              >
                <Text style={styles.saveScheduleButtonText}>Save Schedule</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
            onMarkAttendance={handleMarkActivity}
            onClose={closeStudentCard}
            attendanceType={scanType}
          />
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
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
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  activityTypeScroll: {
    flexDirection: 'row',
  },
  activityTypeButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 15,
    marginRight: 15,
    borderRadius: 10,
    borderWidth: 2,
    minWidth: 80,
  },
  activityTypeButtonSelected: {
    backgroundColor: '#4a90e2',
  },
  activityTypeText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
    textAlign: 'center',
  },
  activityTypeTextSelected: {
    color: '#fff',
  },
  activityList: {
    gap: 10,
  },
  activityButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activityButtonSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#4a90e2',
  },
  activityButtonText: {
    fontSize: 14,
    color: '#333',
  },
  activityButtonTextSelected: {
    color: '#4a90e2',
    fontWeight: '500',
  },
  customActivityContainer: {
    marginTop: 15,
  },
  customActivityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  scanButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
  },
  logoutButton: {
    backgroundColor: '#FF9800',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a90e2',
    gap: 8,
  },
  scheduleButtonText: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '500',
  },
  scheduleInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  scheduleInfoText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
    marginBottom: 4,
  },
  scheduleInfoSubtext: {
    fontSize: 12,
    color: '#1976d2',
  },
  scheduleModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduleForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    maxWidth: 250,
  },
  saveScheduleButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveScheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActivityScanner;
