import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimeDisplay from '../components/DateTimeDisplay';

const ParentPortal = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parent Portal</Text>
      </View>
      
      {/* Date and Time Display */}
      <View style={styles.dateTimeContainer}>
        <DateTimeDisplay />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children</Text>
          <View style={styles.childList}>
            <TouchableOpacity style={styles.childCard}>
              <Text style={styles.childName}>John Doe</Text>
              <Text style={styles.childClass}>Class: 10A</Text>
              <View style={styles.attendanceIndicator}>
                <Text style={styles.attendanceText}>Attendance: 95%</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.childCard}>
              <Text style={styles.childName}>Jane Doe</Text>
              <Text style={styles.childClass}>Class: 8B</Text>
              <View style={styles.attendanceIndicator}>
                <Text style={styles.attendanceText}>Attendance: 92%</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          <View style={styles.notificationList}>
            <View style={styles.notificationItem}>
              <Ionicons name="alert-circle" size={24} color="#ff9800" />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>Absence Alert</Text>
                <Text style={styles.notificationText}>John was absent on Wednesday</Text>
                <Text style={styles.notificationDate}>2 days ago</Text>
              </View>
            </View>
            
            <View style={styles.notificationItem}>
              <Ionicons name="calendar" size={24} color="#4caf50" />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>Upcoming Event</Text>
                <Text style={styles.notificationText}>Parent-Teacher Meeting</Text>
                <Text style={styles.notificationDate}>Next Monday</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Absence</Text>
          <TouchableOpacity style={styles.requestButton}>
            <Text style={styles.requestButtonText}>Submit Absence Request</Text>
          </TouchableOpacity>
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
    marginLeft: 15,
    color: '#333',
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
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ParentPortal;