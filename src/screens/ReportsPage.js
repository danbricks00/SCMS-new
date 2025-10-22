import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';

const ReportsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalEvents: 0,
    totalAnnouncements: 0,
    pendingAbsenceRequests: 0,
    todayAttendance: 0,
    attendanceRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      // Load all statistics
      const [students, teachers, classes, events, announcements, absenceRequests] = await Promise.all([
        DatabaseService.getAllStudents(),
        DatabaseService.getAllTeachers(),
        DatabaseService.getAllClasses(),
        DatabaseService.getAllEvents(),
        DatabaseService.getAllAnnouncements(),
        DatabaseService.getAllAbsenceRequests('pending'),
      ]);

      // Calculate attendance statistics
      const today = new Date().toISOString().split('T')[0];
      let totalAttendance = 0;
      let totalStudentsWithAttendance = 0;

      for (const cls of classes) {
        const attendance = await DatabaseService.getClassAttendance(cls.name, today);
        const presentStudents = new Set(
          attendance.filter(r => r.type === 'login').map(r => r.studentId)
        ).size;
        totalAttendance += presentStudents;
      }

      totalStudentsWithAttendance = students.length;
      const attendanceRate = totalStudentsWithAttendance > 0 
        ? Math.round((totalAttendance / totalStudentsWithAttendance) * 100)
        : 0;

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalEvents: events.length,
        totalAnnouncements: announcements.length,
        pendingAbsenceRequests: absenceRequests.length,
        todayAttendance: totalAttendance,
        attendanceRate,
      });

      // Load recent activities
      const activities = await DatabaseService.getActivityLog('admin', 'all');
      setRecentActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Error loading report data:', error);
    }
  };

  const StatCard = ({ icon, iconColor, title, value, subtitle }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const exportReport = () => {
    if (Platform.OS === 'web') {
      alert('Export functionality will generate a PDF report with all statistics and activities.');
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
          <TouchableOpacity onPress={exportReport} style={styles.exportButton}>
            <Ionicons name="download-outline" size={20} color="#4a90e2" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Overview Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="people"
                iconColor="#4CAF50"
                title="Total Students"
                value={stats.totalStudents}
              />
              <StatCard
                icon="briefcase"
                iconColor="#2196F3"
                title="Total Teachers"
                value={stats.totalTeachers}
              />
              <StatCard
                icon="school"
                iconColor="#FF9800"
                title="Total Classes"
                value={stats.totalClasses}
              />
              <StatCard
                icon="calendar"
                iconColor="#9C27B0"
                title="Upcoming Events"
                value={stats.totalEvents}
              />
            </View>
          </View>

          {/* Attendance Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Attendance</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="checkmark-circle"
                iconColor="#4CAF50"
                title="Present Today"
                value={stats.todayAttendance}
                subtitle={`${stats.attendanceRate}% attendance rate`}
              />
              <StatCard
                icon="document-text"
                iconColor="#00BCD4"
                title="Pending Requests"
                value={stats.pendingAbsenceRequests}
                subtitle="Absence requests"
              />
            </View>
          </View>

          {/* Communication Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Communication</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="megaphone"
                iconColor="#F44336"
                title="Active Announcements"
                value={stats.totalAnnouncements}
              />
              <StatCard
                icon="mail"
                iconColor="#673AB7"
                title="Notifications Sent"
                value={stats.totalAnnouncements + stats.totalEvents}
                subtitle="This month"
              />
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityList}>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityDot} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {activity.details.description || 'Activity'}
                      </Text>
                      <Text style={styles.activityTime}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noActivityText}>No recent activities</Text>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/reports/attendance')}
              >
                <Ionicons name="bar-chart" size={24} color="#4a90e2" />
                <Text style={styles.actionButtonText}>Attendance Report</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/reports/students')}
              >
                <Ionicons name="people" size={24} color="#4a90e2" />
                <Text style={styles.actionButtonText}>Student Report</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/reports/events')}
              >
                <Ionicons name="calendar" size={24} color="#4a90e2" />
                <Text style={styles.actionButtonText}>Event Report</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/reports/custom')}
              >
                <Ionicons name="document-text" size={24} color="#4a90e2" />
                <Text style={styles.actionButtonText}>Custom Report</Text>
              </TouchableOpacity>
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
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4a90e2',
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  noActivityText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minWidth: '48%',
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
  actionButtonText: {
    fontSize: 13,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ReportsPage;

