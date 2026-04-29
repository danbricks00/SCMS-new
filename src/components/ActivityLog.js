import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DatabaseService } from '../services/database';
import { formatTimestampNZ } from '../utils/dateUtils';

const ActivityLog = ({ userRole, maxItems = 10 }) => {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all'); // all, students, teachers, events, announcements

  useEffect(() => {
    loadActivities();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, [filter, userRole]);

  const loadActivities = async () => {
    try {
      const activityData = await DatabaseService.getActivityLog(userRole, filter);
      setActivities(activityData.slice(0, maxItems));
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const getActivityIcon = (activity) => {
    switch (activity?.type) {
      case 'student_added':
        return { name: 'person-add', color: '#4CAF50' };
      case 'teacher_added':
        return { name: 'briefcase', color: '#2196F3' };
      case 'class_added':
        return { name: 'school', color: '#FF9800' };
      case 'event_created':
        return { name: 'calendar', color: '#9C27B0' };
      case 'announcement_created':
        return { name: 'megaphone', color: '#F44336' };
      case 'absence_request':
        return { name: 'document-text', color: '#00BCD4' };
      case 'attendance_marked':
        if (activity?.details?.status === 'absent') {
          return { name: 'close-circle', color: '#F44336' };
        }
        if (activity?.details?.status === 'late') {
          return { name: 'time', color: '#FF9800' };
        }
        return { name: 'checkmark-done-circle', color: '#4CAF50' };
      default:
        return { name: 'information-circle', color: '#666' };
    }
  };

  const getActivityTitle = (activity) => {
    switch (activity.type) {
      case 'student_added':
        return `New Student: ${activity.details.studentName}`;
      case 'teacher_added':
        return `New Teacher: ${activity.details.teacherName}`;
      case 'class_added':
        return `New Class: ${activity.details.className}`;
      case 'event_created':
        return `Event: ${activity.details.eventTitle}`;
      case 'announcement_created':
        return `Announcement: ${activity.details.announcementTitle}`;
      case 'absence_request':
        return `Absence Request: ${activity.details.studentName}`;
      case 'attendance_marked':
        return `Attendance: ${activity.details.studentName}`;
      default:
        return 'Activity';
    }
  };

  const formatTimestamp = (timestamp) => {
    return formatTimestampNZ(timestamp);
  };

  // Filter activities based on user role
  const shouldShowActivity = (activity) => {
    // Admin and teachers see everything
    if (userRole === 'admin' || userRole === 'teacher') {
      return true;
    }

    // Students and parents don't see student/teacher/class additions
    if (userRole === 'student' || userRole === 'parent') {
      return !['student_added', 'teacher_added', 'class_added'].includes(activity.type);
    }

    return true;
  };

  const filteredActivities = activities.filter(shouldShowActivity);

  if (filteredActivities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No recent activities</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {userRole === 'admin' && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'students', 'teachers', 'events', 'announcements'].map((filterType) => (
              <TouchableOpacity
                key={filterType}
                style={[
                  styles.filterButton,
                  filter === filterType && styles.filterButtonActive
                ]}
                onPress={() => setFilter(filterType)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === filterType && styles.filterButtonTextActive
                ]}>
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.activityList}>
        {filteredActivities.map((activity, index) => {
          const icon = getActivityIcon(activity);
          return (
            <View key={index} style={styles.activityItem}>
              <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                <Ionicons name={icon.name} size={20} color={icon.color} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{getActivityTitle(activity)}</Text>
                {activity.details.description && (
                  <Text style={styles.activityDescription} numberOfLines={2}>
                    {activity.details.description}
                  </Text>
                )}
                <Text style={styles.activityTime}>{formatTimestamp(activity.timestamp)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4a90e2',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  activityList: {
    flex: 1,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});

export default ActivityLog;

