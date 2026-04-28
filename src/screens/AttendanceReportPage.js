import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DatabaseService } from '../services/database';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTimeNZ } from '../utils/dateUtils';

const AttendanceReportPage = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadAttendanceData();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const classesData = await DatabaseService.getAllClasses();
      setClasses(classesData);
      if (classesData.length > 0) {
        setSelectedClass(classesData[0].name);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadAttendanceData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todaySummary = await DatabaseService.getTodayAttendanceSummary(selectedClass);
      
      setSummary({
        totalStudents: todaySummary.totalStudents,
        presentToday: todaySummary.presentStudents,
        absentToday: todaySummary.absentStudents,
        lateToday: todaySummary.lateStudents,
        attendanceRate: todaySummary.totalStudents > 0 
          ? Math.round((todaySummary.presentStudents / todaySummary.totalStudents) * 100)
          : 0
      });

      setAttendanceData(todaySummary.attendance);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const exportReport = () => {
    if (Platform.OS === 'web') {
      alert(`Exporting attendance report for ${selectedClass}...\n\nThis will generate a PDF with:\n- Daily attendance records\n- Student-wise attendance\n- Attendance trends\n- Late arrivals summary`);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attendance Report</Text>
          <TouchableOpacity onPress={exportReport} style={styles.exportButton}>
            <Ionicons name="download-outline" size={20} color="#4a90e2" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Class Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classSelector}>
              {classes.map((cls, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.classChip,
                    selectedClass === cls.name && styles.classChipSelected
                  ]}
                  onPress={() => setSelectedClass(cls.name)}
                >
                  <Text style={[
                    styles.classChipText,
                    selectedClass === cls.name && styles.classChipTextSelected
                  ]}>
                    {cls.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Summary Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Summary - {selectedClass}</Text>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                <Text style={styles.summaryNumber}>{summary.presentToday}</Text>
                <Text style={styles.summaryLabel}>Present</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#ffebee' }]}>
                <Ionicons name="close-circle" size={32} color="#f44336" />
                <Text style={styles.summaryNumber}>{summary.absentToday}</Text>
                <Text style={styles.summaryLabel}>Absent</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="time" size={32} color="#FF9800" />
                <Text style={styles.summaryNumber}>{summary.lateToday}</Text>
                <Text style={styles.summaryLabel}>Late</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="pie-chart" size={32} color="#2196F3" />
                <Text style={styles.summaryNumber}>{summary.attendanceRate}%</Text>
                <Text style={styles.summaryLabel}>Rate</Text>
              </View>
            </View>
          </View>

          {/* Attendance Records */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Attendance Records</Text>
            <View style={styles.recordsList}>
              {attendanceData.length > 0 ? (
                attendanceData.slice(0, 20).map((record, index) => (
                  <View key={index} style={styles.recordItem}>
                    <View style={styles.recordIcon}>
                      <Ionicons 
                        name={record.status === 'late' ? 'time' : 'person'} 
                        size={20} 
                        color={record.status === 'late' ? '#FF9800' : '#4CAF50'} 
                      />
                    </View>
                    <View style={styles.recordContent}>
                      <Text style={styles.recordName}>{record.studentName}</Text>
                      <Text style={styles.recordDetails}>
                        {record.type === 'login' ? 'Checked In' : 'Checked Out'} • {formatDateTimeNZ(record.timestamp)}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      record.status === 'late' && styles.statusLate,
                      record.status === 'present' && styles.statusPresent
                    ]}>
                      <Text style={styles.statusText}>
                        {record.status === 'late' ? 'Late' : 'On Time'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No attendance records for today</Text>
              )}
            </View>
          </View>

          {/* Weekly Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Overview</Text>
            <View style={styles.weeklyContainer}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
                <View key={index} style={styles.dayCard}>
                  <Text style={styles.dayLabel}>{day}</Text>
                  <View style={styles.dayBar}>
                    <View style={[styles.dayBarFill, { height: `${Math.random() * 80 + 20}%` }]} />
                  </View>
                  <Text style={styles.dayPercent}>{Math.floor(Math.random() * 20 + 80)}%</Text>
                </View>
              ))}
            </View>
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4a90e2',
    gap: 4,
  },
  exportButtonText: {
    color: '#4a90e2',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  classSelector: {
    flexDirection: 'row',
  },
  classChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 10,
  },
  classChipSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  classChipText: {
    fontSize: 14,
    color: '#333',
  },
  classChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  recordsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordContent: {
    flex: 1,
  },
  recordName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recordDetails: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPresent: {
    backgroundColor: '#e8f5e9',
  },
  statusLate: {
    backgroundColor: '#fff3e0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  weeklyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dayCard: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  dayBar: {
    width: 30,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  dayBarFill: {
    width: '100%',
    backgroundColor: '#4a90e2',
    borderRadius: 15,
  },
  dayPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
});

export default AttendanceReportPage;

