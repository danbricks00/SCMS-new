import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AbsenceRequestForm from '../components/AbsenceRequestForm';
import ActivityLog from '../components/ActivityLog';
import AnnouncementBanner from '../components/AnnouncementBanner';
import ProtectedRoute from '../components/ProtectedRoute';
import ResponsiveScreen from '../components/ResponsiveScreen';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';

const ParentPortal = () => {
  const { user, logout } = useAuth();
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [absenceRequests, setAbsenceRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState([]);

  useEffect(() => {
    loadChildren();
  }, [user?.studentId, user?.linkedStudentId, user?.username]);

  useEffect(() => {
    if (children.length === 0) return;
    loadAbsenceRequests();
    loadEvents();
    loadNotifications();
  }, [children]);

  const loadChildren = async () => {
    try {
      const linkedStudentId = String(
        user?.linkedStudentId || user?.studentId || ''
      ).toUpperCase();
      if (!linkedStudentId) {
        setChildren([]);
        return;
      }

      const student = await DatabaseService.getStudentById(linkedStudentId);
      if (student) {
        setChildren([{
          id: student.id,
          studentId: String(student.studentId || linkedStudentId).toUpperCase(),
          name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || linkedStudentId,
          class: student.class || 'N/A'
        }]);
      } else {
        setChildren([{
          id: linkedStudentId,
          studentId: linkedStudentId,
          name: linkedStudentId,
          class: 'N/A'
        }]);
      }
    } catch (error) {
      console.error('Error loading parent children:', error);
      setChildren([]);
    }
  };

  const loadAbsenceRequests = async () => {
    try {
      if (children.length === 0) {
        setAbsenceRequests([]);
        return;
      }
      // Load absence requests for parent's children
      const allRequests = [];
      for (const child of children) {
        const requests = await DatabaseService.getAbsenceRequestsByStudent(child.name);
        allRequests.push(...requests);
      }
      setAbsenceRequests(allRequests);
    } catch (error) {
      console.error('Error loading absence requests:', error);
    }
  };

  const loadEvents = async () => {
    try {
      if (children.length === 0) {
        setEvents([]);
        return;
      }
      // Get child's classes
      const userClasses = children.map(child => child.class);
      const userEvents = await DatabaseService.getEventsForUser('parent', userClasses);
      setEvents(userEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      if (children.length === 0) {
        setNotifications([]);
        return;
      }

      const items = [];
      for (const child of children) {
        const studentId = String(child.studentId || '').toUpperCase();
        if (!studentId) continue;
        const attendance = await DatabaseService.getStudentAttendance(studentId);
        const latest = attendance
          .filter((record) => (record.type || 'login') === 'login')
          .sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0))[0];

        if (latest) {
          const status = String(latest.status || 'present');
          const statusTitle = status.charAt(0).toUpperCase() + status.slice(1);
          items.push({
            id: `${studentId}-${latest.id || latest.timestamp || Date.now()}`,
            icon: status === 'absent' ? 'close-circle' : status === 'late' ? 'time' : 'checkmark-circle',
            color: status === 'absent' ? '#f44336' : status === 'late' ? '#ff9800' : '#4caf50',
            title: `Attendance Update: ${child.name}`,
            text: `${child.name} was marked ${statusTitle}`,
            date: latest.timestamp ? new Date(latest.timestamp).toLocaleString() : 'Just now'
          });
        }
      }

      setNotifications(items);
    } catch (error) {
      console.error('Error loading parent notifications:', error);
      setNotifications([]);
    }
  };

  const handleSubmitAbsenceRequest = async (requestData) => {
    try {
      await DatabaseService.submitAbsenceRequest(requestData);
      if (Platform.OS === 'web') {
        alert('Absence request submitted successfully!');
      } else {
        Alert.alert('Success', 'Absence request submitted successfully!');
      }
      setShowAbsenceForm(false);
      loadAbsenceRequests();
    } catch (error) {
      console.error('Error submitting absence request:', error);
      if (Platform.OS === 'web') {
        alert('Error submitting absence request');
      } else {
        Alert.alert('Error', 'Failed to submit absence request');
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadAbsenceRequests(), loadEvents(), loadNotifications()]);
    } finally {
      setRefreshing(false);
    }
  };
  
  return (
    <ProtectedRoute requiredRole="parent">
      <SafeAreaView style={styles.container}>
        <ResponsiveScreen>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parent Portal - {user?.name}</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={20} color="#e74c3c" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      
      {/* Announcements Banner */}
      <AnnouncementBanner 
        userRole="parent" 
        userClass={children[0]?.class || '10A'}
      />
      
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children</Text>
          <View style={styles.childList}>
            {children.map((child, index) => (
              <View key={child.id || child.studentId || index} style={styles.childCard}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childClass}>ID: {child.studentId}</Text>
                <Text style={styles.childClass}>Class: {child.class}</Text>
                <View style={styles.attendanceIndicator}>
                  <Text style={styles.attendanceText}>Attendance: 95%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          <View style={styles.notificationList}>
            {notifications.length === 0 ? (
              <View style={styles.notificationItem}>
                <Ionicons name="notifications-off-outline" size={24} color="#999" />
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>No recent notifications</Text>
                  <Text style={styles.notificationText}>Updates will appear here for your linked child.</Text>
                </View>
              </View>
            ) : notifications.map((item) => (
              <View key={item.id} style={styles.notificationItem}>
                <Ionicons name={item.icon} size={24} color={item.color} />
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationText}>{item.text}</Text>
                  <Text style={styles.notificationDate}>{item.date}</Text>
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
                  <View style={styles.eventHeader}>
                    <Ionicons name="calendar-outline" size={20} color="#4a90e2" />
                    <Text style={styles.eventTitle}>{event.title}</Text>
                  </View>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.eventDetailText}>
                        {event.eventDate} | {event.startTime} - {event.endTime}
                      </Text>
                    </View>
                    <View style={styles.eventDetailRow}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.eventDetailText}>{event.location}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Absence Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Absence Requests</Text>
          <TouchableOpacity 
            style={styles.requestButton}
            onPress={() => setShowAbsenceForm(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.requestButtonText}>Submit Absence Request</Text>
          </TouchableOpacity>

          {absenceRequests.length > 0 && (
            <View style={styles.requestsList}>
              {absenceRequests.map((request, index) => (
                <View key={index} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <Text style={styles.requestStudent}>{request.studentName}</Text>
                    <View style={[
                      styles.statusBadge,
                      request.status === 'approved' && styles.statusApproved,
                      request.status === 'rejected' && styles.statusRejected,
                      request.status === 'pending' && styles.statusPending
                    ]}>
                      <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.requestReason}>{request.reason}</Text>
                  <Text style={styles.requestDates}>
                    {request.startDate} to {request.endDate}
                  </Text>
                  <Text style={styles.requestSubmitted}>
                    Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent Updates */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, styles.sectionTitleNoMargin]}>Recent Updates</Text>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push('/updates')}>
              <Text style={styles.viewAllButtonText}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityLogContainer}>
            <ActivityLog
              userRole="parent"
              maxItems={3}
              linkedStudentIds={children
                .map((c) => String(c.studentId || '').trim().toUpperCase())
                .filter(Boolean)}
              linkedStudentNames={children.map((c) => String(c.name || '').trim()).filter(Boolean)}
            />
          </View>
        </View>
      </ScrollView>
        </ResponsiveScreen>

      {/* Absence Request Form Modal */}
      <AbsenceRequestForm
        visible={showAbsenceForm}
        onClose={() => setShowAbsenceForm(false)}
        onSubmit={handleSubmitAbsenceRequest}
        parentName={user?.name}
        children={children}
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
  sectionTitleNoMargin: {
    marginBottom: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllButtonText: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '600',
  },
  childList: {
    marginBottom: 10,
  },
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  childClass: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  attendanceIndicator: {
    marginTop: 10,
    backgroundColor: '#e6f7ed',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  attendanceText: {
    color: '#4caf50',
    fontWeight: '500',
  },
  notificationList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notificationContent: {
    marginLeft: 10,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  requestButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  requestsList: {
    marginTop: 15,
    gap: 10,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  requestStudent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusApproved: {
    backgroundColor: '#d4edda',
  },
  statusRejected: {
    backgroundColor: '#f8d7da',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  requestReason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  requestDates: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  requestSubmitted: {
    fontSize: 12,
    color: '#999',
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
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  eventDetails: {
    gap: 5,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetailText: {
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

export default ParentPortal;