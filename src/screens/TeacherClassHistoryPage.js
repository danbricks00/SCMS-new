import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProtectedRoute from '../components/ProtectedRoute';
import ResponsiveScreen from '../components/ResponsiveScreen';
import ScreenGradient from '../components/ScreenGradient';
import { DatabaseService } from '../services/database';

const DAY_TO_INDEX = {
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  weds: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5
};

function parseDayIndexes(dayExpr) {
  const source = String(dayExpr || '').trim();
  if (!source) return [];
  return Array.from(
    new Set(
      source
        .split(/[-,/ ]+/)
        .map((token) => DAY_TO_INDEX[String(token || '').trim().toLowerCase()])
        .filter((v) => Number.isInteger(v))
    )
  );
}

function parseScheduleSlots(schedule) {
  const text = String(schedule || '').trim();
  if (!text) return [];
  const slots = [];
  const segments = text.split('|').map((s) => s.trim()).filter(Boolean);

  segments.forEach((segment) => {
    const firstToken = segment.split(/\s+/)[0] || '';
    const dayIndexes = parseDayIndexes(firstToken);
    if (!dayIndexes.length) return;

    const ranges = segment.match(/\b(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\b/g) || [];
    if (ranges.length > 0) {
      ranges.forEach((rangeText) => {
        const m = rangeText.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (!m) return;
        const startHour = Number(m[1]);
        const startMinute = Number(m[2]);
        const endHour = Number(m[3]);
        const endMinute = Number(m[4]);
        dayIndexes.forEach((dayIndex) =>
          slots.push({ dayIndex, startHour, startMinute, endHour, endMinute })
        );
      });
      return;
    }

    const singleTimes = segment.match(/\b(\d{1,2}):(\d{2})\b/g) || [];
    singleTimes.forEach((timeText) => {
      const m = timeText.match(/(\d{1,2}):(\d{2})/);
      if (!m) return;
      const hour = Number(m[1]);
      const minute = Number(m[2]);
      dayIndexes.forEach((dayIndex) =>
        slots.push({ dayIndex, startHour: hour, startMinute: minute, endHour: hour + 1, endMinute: minute })
      );
    });
  });
  return slots;
}

function nextOccurrenceForSlot(slot, fromDate = new Date()) {
  const now = new Date(fromDate);
  const start = new Date(now);
  const dayOffset = (slot.dayIndex - now.getDay() + 7) % 7;
  start.setDate(now.getDate() + dayOffset);
  start.setHours(slot.startHour, slot.startMinute, 0, 0);
  if (start <= now) start.setDate(start.getDate() + 7);
  return start;
}

function lastOccurrenceForSlot(slot, fromDate = new Date()) {
  const now = new Date(fromDate);
  const start = new Date(now);
  const dayOffset = (now.getDay() - slot.dayIndex + 7) % 7;
  start.setDate(now.getDate() - dayOffset);
  start.setHours(slot.startHour, slot.startMinute, 0, 0);
  if (start > now) start.setDate(start.getDate() - 7);
  return start;
}

function dayLabelFromIndex(dayIndex) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex] || 'Day';
}

const TeacherClassHistoryPage = () => {
  const params = useLocalSearchParams();
  const className = String(params.className || '');
  const teacherId = String(params.teacherId || '');
  const teacherName = String(params.teacherName || '');
  const [classCards, setClassCards] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const allClasses = await DatabaseService.getAllClasses();
      let teacherClasses = allClasses.filter((cls) => {
        const byId = teacherId && String(cls.teacherId || '').trim() === teacherId.trim();
        const byName = teacherName && String(cls.teacherName || '').trim() === teacherName.trim();
        return byId || byName;
      });

      if (className) {
        const normalizedClassName = String(className).trim().toLowerCase();
        teacherClasses = teacherClasses.filter(
          (cls) => String(cls.name || '').trim().toLowerCase() === normalizedClassName
        );
      }

      const today = new Date().toISOString().split('T')[0];
      const cards = await Promise.all(
        teacherClasses.map(async (cls) => {
          const classTitle = String(cls.name || cls.className || '').trim() || 'Unknown Class';
          const [students, todayRows, historyRows] = await Promise.all([
            DatabaseService.getStudentsByClass(classTitle),
            DatabaseService.getClassAttendance(classTitle, today),
            DatabaseService.getClassAttendanceHistory(classTitle, 45)
          ]);
          const totalStudents = students.length;
          const slots = parseScheduleSlots(cls.schedule);
          if (!slots.length) {
            return [{
              cardId: `${String(cls.id || cls.classId || classTitle)}::no-timeslot`,
              className: classTitle,
              subject: cls.subject || 'General',
              schedule: cls.schedule || 'Time TBA',
              totalStudents,
              todayPresent: 0,
              todayLate: 0,
              todayAbsent: totalStudents,
              marks45d: 0,
              lastMarkedAt: null,
              sessionLabel: 'No timeslot',
              nextDate: null
            }];
          }

          return slots.map((slot) => {
            const dayLabel = dayLabelFromIndex(slot.dayIndex);
            const timeLabel = `${String(slot.startHour).padStart(2, '0')}:${String(slot.startMinute || 0).padStart(2, '0')}-${String(slot.endHour).padStart(2, '0')}:${String(slot.endMinute || 0).padStart(2, '0')}`;
            const sessionActivityLabel = `${classTitle} ${dayLabel} ${timeLabel}`;

            const todaySlotRows = todayRows
              .filter((row) => row.type === 'login')
              .filter((row) => String(row.activity || '') === sessionActivityLabel);
            const statusMap = {};
            [...todaySlotRows]
              .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))
              .forEach((row) => {
                const sid = String(row.studentId || '').toUpperCase();
                if (!sid) return;
                statusMap[sid] = row.status || 'present';
              });

            let present = 0;
            let late = 0;
            students.forEach((student) => {
              const sid = String(student.studentId || student.id || '').toUpperCase();
              const status = statusMap[sid];
              if (status && status !== 'absent') present += 1;
              if (status === 'late') late += 1;
            });
            const absent = Math.max(totalStudents - present, 0);

            const slotHistory = historyRows
              .filter((r) => r.type === 'login')
              .filter((r) => String(r.activity || '') === sessionActivityLabel);
            const lastMarkedAt = slotHistory.length
              ? slotHistory
                  .map((r) => new Date(r.timestamp || 0))
                  .sort((a, b) => b - a)[0]
              : null;

            return {
              cardId: `${String(cls.id || cls.classId || classTitle)}::${sessionActivityLabel}`,
              className: classTitle,
              subject: cls.subject || 'General',
              totalStudents,
              todayPresent: present,
              todayLate: late,
              todayAbsent: absent,
              marks45d: slotHistory.length,
              lastMarkedAt,
              sessionLabel: `${dayLabel} ${timeLabel}`,
              sessionDate: lastOccurrenceForSlot(slot)
            };
          });
        })
      );
      const flattened = cards.flat();
      flattened.sort((a, b) => {
        const aTs = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
        const bTs = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
        if (aTs !== bTs) return bTs - aTs;
        if (String(a.className) !== String(b.className)) {
          return String(a.className).localeCompare(String(b.className));
        }
        return String(a.sessionLabel || '').localeCompare(String(b.sessionLabel || ''));
      });
      setClassCards(flattened);
    } catch (error) {
      console.error('Error loading class history:', error);
      setClassCards([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [className, teacherId, teacherName]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadHistory();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="teacher">
      <SafeAreaView style={styles.container}>
        <ScreenGradient>
        <ResponsiveScreen>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Class History</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <View style={styles.section}>
              <Text style={styles.classTitle}>
                {className || (teacherName ? `${teacherName} - All Classes` : 'Class History')}
              </Text>
              <Text style={styles.activityText}>Overview cards for each class timeslot taught by this teacher.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Class Overview</Text>
              {classCards.length === 0 ? (
                <Text style={styles.emptyText}>No history yet for this class/session.</Text>
              ) : (
                classCards.map((card, index) => (
                  <View key={card.cardId || `${card.className}-${card.sessionLabel}-${index}`} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <View style={styles.historyHeadingLeft}>
                        <Text style={styles.historyClassTitle}>Class {card.className}</Text>
                        <Text style={styles.sessionText}>{card.sessionLabel}</Text>
                        {!!card.sessionDate && (
                          <Text style={styles.sessionDateText}>
                            Session date: {new Date(card.sessionDate).toLocaleDateString()} {new Date(card.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.historyClassStudents}>{card.totalStudents} Students</Text>
                    </View>
                    <View style={styles.historyAttendancePanel}>
                      <Text style={styles.attendanceText}>
                        Today&apos;s Attendance: {card.todayPresent}/{card.totalStudents}
                      </Text>
                      <View style={styles.statusBreakdown}>
                        <Text style={styles.presentText}>Present: {card.todayPresent}</Text>
                        <Text style={styles.lateText}>Late: {card.todayLate}</Text>
                        <Text style={styles.absentText}>Absent: {card.todayAbsent}</Text>
                      </View>
                    </View>
                    <Text style={styles.rowMeta}>
                      Last 45 days marks: {card.marks45d}
                      {card.lastMarkedAt ? ` • Last marked: ${card.lastMarkedAt.toLocaleString()}` : ''}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </ResponsiveScreen>
        </ScreenGradient>
      </SafeAreaView>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6'
  },
  backButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  headerSpacer: { width: 30 },
  content: { flex: 1, padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14 },
  classTitle: { fontSize: 18, fontWeight: '700', color: '#2d3748' },
  sessionText: { marginTop: 4, color: '#4a90e2', fontWeight: '600' },
  activityText: { marginTop: 4, color: '#666' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptyText: { color: '#666', fontStyle: 'italic' },
  rowMeta: { marginTop: 8, fontSize: 12, color: '#667085' },
  historyCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
    marginBottom: 12
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  historyHeadingLeft: { flex: 1, marginRight: 10 },
  historyClassTitle: { fontSize: 18, fontWeight: '700', color: '#2d3748' },
  historyClassStudents: { fontSize: 13, color: '#555', fontWeight: '600' },
  sessionDateText: { marginTop: 4, color: '#666', fontSize: 13 },
  historyAttendancePanel: {
    marginTop: 10,
    backgroundColor: '#e3f2fd',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  attendanceText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600'
  },
  statusBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  presentText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600'
  },
  lateText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600'
  },
  absentText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '600'
  }
});

export default TeacherClassHistoryPage;
