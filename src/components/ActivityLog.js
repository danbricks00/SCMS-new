import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DatabaseService } from '../services/database';
import { formatTimestampNZ } from '../utils/dateUtils';

/** Normalize for comparing student names from activity log vs roster. */
function normalizeStudentName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Parents only see attendance / absence lines for their linked children (not whole-school feeds).
 */
function activityMatchesLinkedChildren(activity, idSet, nameSet, includeNonStudentSpecific = false) {
  if (!idSet?.size && !nameSet?.size) return false;
  const d = activity.details || {};

  if (activity.type === 'attendance_marked') {
    const sid = String(d.studentId || '').trim().toUpperCase();
    if (sid && idSet?.has(sid)) return true;
    const nm = normalizeStudentName(d.studentName);
    if (nm && nameSet?.has(nm)) return true;
    return false;
  }

  if (activity.type === 'absence_request') {
    const nm = normalizeStudentName(d.studentName);
    return Boolean(nm && nameSet?.has(nm));
  }

  return includeNonStudentSpecific;
}

const ActivityLog = ({
  userRole,
  maxItems = 10,
  /** When set (e.g. parent portal), only activities for these student ids / names are shown. */
  linkedStudentIds = null,
  linkedStudentNames = null
}) => {
  const [activities, setActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [filter, setFilter] = useState('all'); // all, student, teacher, event, announcement

  const normalizeFilter = (value) => {
    const key = String(value || 'all').toLowerCase();
    if (key === 'students' || key === 'student') return 'student';
    if (key === 'teachers' || key === 'teacher') return 'teacher';
    if (key === 'events' || key === 'event') return 'event';
    if (key === 'announcements' || key === 'announcement') return 'announcement';
    return 'all';
  };

  const activityMatchesFilter = (activity, activeFilter) => {
    if (activeFilter === 'all') return true;

    const type = activity?.type;
    switch (activeFilter) {
      case 'student':
        return [
          'student_added',
          'student_updated',
          'attendance_marked',
          'absence_request'
        ].includes(type);
      case 'teacher':
        return [
          'teacher_added',
          'teacher_updated'
        ].includes(type);
      case 'event':
        return [
          'event_created',
          'event_updated'
        ].includes(type);
      case 'announcement':
        return [
          'announcement_created'
        ].includes(type);
      default:
        return true;
    }
  };

  const scopedStudentFilterKey = useMemo(() => {
    if (!['parent', 'student'].includes(userRole) || linkedStudentIds == null) return '';
    return [linkedStudentIds.join('|'), (linkedStudentNames || []).join('|')].join('~');
  }, [userRole, linkedStudentIds, linkedStudentNames]);

  useEffect(() => {
    loadActivities();

    // Refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, [userRole, maxItems, scopedStudentFilterKey]);

  const loadActivities = async () => {
    try {
      const scopedStudentFilter = ['parent', 'student'].includes(userRole) && linkedStudentIds != null;
      const fetchCap = scopedStudentFilter ? 200 : Math.max(maxItems * 4, 50);
      let activityData = await DatabaseService.getActivityLog(userRole, 'all', fetchCap);

      if (scopedStudentFilter) {
        if (!linkedStudentIds.length) {
          activityData = [];
        } else {
          const idSet = new Set(
            linkedStudentIds.map((id) => String(id || '').trim().toUpperCase()).filter(Boolean)
          );
          const nameSet = new Set(
            (linkedStudentNames || [])
              .map((n) => normalizeStudentName(n))
              .filter(Boolean)
          );
          activityData = activityData.filter((a) =>
            activityMatchesLinkedChildren(a, idSet, nameSet, userRole === 'student')
          );
        }
      }

      setAllActivities(activityData);
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
    if (userRole === 'admin' || userRole === 'teacher') {
      return true;
    }

    if (['student_added', 'teacher_added', 'class_added'].includes(activity.type)) {
      return false;
    }

    if ((userRole === 'parent' || userRole === 'student') && linkedStudentIds != null) {
      return ['attendance_marked', 'absence_request'].includes(activity.type);
    }

    return true;
  };

  useEffect(() => {
    const normalizedFilter = normalizeFilter(filter);
    const scopedActivities = allActivities
      .filter((activity) => activityMatchesFilter(activity, normalizedFilter))
      .filter(shouldShowActivity)
      .slice(0, maxItems);

    setActivities(scopedActivities);
  }, [allActivities, filter, maxItems, userRole, linkedStudentIds, linkedStudentNames]);

  const filteredActivities = activities;

  return (
    <View style={styles.container}>
      {userRole === 'admin' && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'All' },
              { key: 'student', label: 'Student' },
              { key: 'teacher', label: 'Teachers' },
              { key: 'event', label: 'Events' },
              { key: 'announcement', label: 'Announcements' }
            ].map((filterType) => (
              <TouchableOpacity
                key={filterType.key}
                style={[
                  styles.filterButton,
                  normalizeFilter(filter) === filterType.key && styles.filterButtonActive
                ]}
                onPress={() => setFilter(filterType.key)}
              >
                <Text style={[
                  styles.filterButtonText,
                  normalizeFilter(filter) === filterType.key && styles.filterButtonTextActive
                ]}>
                  {filterType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.activityList}>
        {filteredActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No recent activities</Text>
          </View>
        ) : filteredActivities.map((activity, index) => {
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

