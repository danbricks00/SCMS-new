import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const TeacherPortal = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teacher Portal</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          <View style={styles.classList}>
            <TouchableOpacity style={styles.classCard}>
              <Text style={styles.className}>Class 10A</Text>
              <Text style={styles.classInfo}>32 Students</Text>
              <View style={styles.attendanceIndicator}>
                <Text style={styles.attendanceText}>Today's Attendance: 30/32</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.classCard}>
              <Text style={styles.className}>Class 8B</Text>
              <Text style={styles.classInfo}>28 Students</Text>
              <View style={styles.attendanceIndicator}>
                <Text style={styles.attendanceText}>Today's Attendance: 26/28</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <View style={styles.scheduleList}>
            {['8:00 AM - 9:30 AM: Class 10A', '10:00 AM - 11:30 AM: Class 8B', 
              '12:30 PM - 2:00 PM: Class 9C', '2:30 PM - 4:00 PM: Staff Meeting'].map((session, index) => (
              <View key={index} style={styles.scheduleItem}>
                <Ionicons name="time" size={24} color="#4a90e2" />
                <Text style={styles.scheduleText}>{session}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          <View style={styles.announcementList}>
            <View style={styles.announcementItem}>
              <Text style={styles.announcementTitle}>Staff Meeting</Text>
              <Text style={styles.announcementText}>Reminder: Staff meeting today at 2:30 PM in the conference room.</Text>
              <Text style={styles.announcementDate}>Today</Text>
            </View>
            
            <View style={styles.announcementItem}>
              <Text style={styles.announcementTitle}>Exam Schedule</Text>
              <Text style={styles.announcementText}>Mid-term exams will begin next Monday. Please submit your question papers by Friday.</Text>
              <Text style={styles.announcementDate}>Yesterday</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  classList: {
    gap: 12,
  },
  classCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  classInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  attendanceIndicator: {
    marginTop: 8,
    backgroundColor: '#e3f2fd',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  attendanceText: {
    color: '#1976d2',
    fontSize: 12,
  },
  scheduleList: {
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  scheduleText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  announcementList: {
    gap: 12,
  },
  announcementItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  announcementText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    color: '#999',
  },
});

export default TeacherPortal;