import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProtectedRoute from '../components/ProtectedRoute';
import { DatabaseService } from '../services/database';

const EventReportPage = () => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [filter, events]);

  const loadEvents = async () => {
    try {
      const eventsData = await DatabaseService.getAllEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const filterEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    
    let filtered = events;
    if (filter === 'upcoming') {
      filtered = events.filter(e => e.eventDate >= today);
    } else if (filter === 'past') {
      filtered = events.filter(e => e.eventDate < today);
    }

    // Sort by date
    filtered.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
    setFilteredEvents(filtered);
  };

  const exportReport = () => {
    if (Platform.OS === 'web') {
      alert(`Exporting events report...\n\nThis will generate a PDF with:\n- All scheduled events\n- Event attendance (if tracked)\n- Event types breakdown\n- Calendar view`);
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'class':
        return '#4CAF50';
      case 'staff':
        return '#2196F3';
      case 'school-wide':
        return '#9C27B0';
      case 'student-parent':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'class':
        return 'Class Event';
      case 'staff':
        return 'Staff Event';
      case 'school-wide':
        return 'School-Wide';
      case 'student-parent':
        return 'Student/Parent';
      default:
        return type;
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Report</Text>
          <TouchableOpacity onPress={exportReport} style={styles.exportButton}>
            <Ionicons name="download-outline" size={20} color="#4a90e2" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Filter */}
          <View style={styles.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['all', 'upcoming', 'past'].map((filterType) => (
                <TouchableOpacity
                  key={filterType}
                  style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
                  onPress={() => setFilter(filterType)}
                >
                  <Text style={[styles.filterButtonText, filter === filterType && styles.filterButtonTextActive]}>
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="calendar" size={28} color="#4a90e2" />
                <Text style={styles.statNumber}>{events.length}</Text>
                <Text style={styles.statLabel}>Total Events</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="arrow-up-circle" size={28} color="#4CAF50" />
                <Text style={styles.statNumber}>
                  {events.filter(e => e.eventDate >= new Date().toISOString().split('T')[0]).length}
                </Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={28} color="#9C27B0" />
                <Text style={styles.statNumber}>
                  {events.filter(e => e.eventDate < new Date().toISOString().split('T')[0]).length}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Events List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Events ({filteredEvents.length})</Text>
            <View style={styles.eventsList}>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, index) => (
                  <View key={index} style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <View style={[styles.eventTypeBadge, { backgroundColor: getEventTypeColor(event.eventType) + '20' }]}>
                        <Text style={[styles.eventTypeText, { color: getEventTypeColor(event.eventType) }]}>
                          {getEventTypeLabel(event.eventType)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDescription} numberOfLines={2}>{event.description}</Text>
                    <View style={styles.eventDetails}>
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="calendar-outline" size={14} color="#666" />
                        <Text style={styles.eventDetailText}>{event.eventDate}</Text>
                      </View>
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={styles.eventDetailText}>{event.startTime} - {event.endTime}</Text>
                      </View>
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text style={styles.eventDetailText}>{event.location}</Text>
                      </View>
                      {event.targetClasses && event.targetClasses.length > 0 && (
                        <View style={styles.eventDetailRow}>
                          <Ionicons name="people-outline" size={14} color="#666" />
                          <Text style={styles.eventDetailText}>
                            {event.targetClasses.join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No events found</Text>
              )}
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
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  eventsList: {
    gap: 10,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventDetails: {
    gap: 6,
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
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
});

export default EventReportPage;

