import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Alert, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnnouncementBanner from '../components/AnnouncementBanner';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { DatabaseService, SAMPLE_STUDENTS } from '../services/database';
import { QRCodeUtils } from '../utils/qrCodeUtils';

const AdminPortal = () => {
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [showAddStudent, setShowStudentList] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    class: '',
    parentContact: '',
    address: '',
    emergencyContact: ''
  });
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal',
    visibility: 'all',
    targetClasses: []
  });

  useEffect(() => {
    loadStudents();
    loadAnnouncements();
  }, []);

  const loadStudents = async () => {
    try {
      const studentsData = await DatabaseService.getAllStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      // Use sample data if database is not available
      setStudents(SAMPLE_STUDENTS);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.class) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const studentData = {
        ...newStudent,
        name: `${newStudent.firstName} ${newStudent.lastName}`
      };

      await DatabaseService.addStudent(studentData);
      Alert.alert('Success', 'Student added successfully');
      
      // Reset form
      setNewStudent({
        firstName: '',
        lastName: '',
        class: '',
        parentContact: '',
        address: '',
        emergencyContact: ''
      });
      
      setShowAddStudent(false);
      loadStudents();
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert('Error', 'Failed to add student');
    }
  };

  const handleGenerateQR = (student) => {
    setSelectedStudent(student);
    setShowQRGenerator(true);
  };

  const handlePrintQR = (uri) => {
    console.log('QR Code printed:', uri);
    Alert.alert('Success', 'QR Code generated successfully');
  };

  const loadAnnouncements = async () => {
    try {
      const announcementsData = await DatabaseService.getAllAnnouncements();
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setAnnouncements([]);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }

    try {
      const announcementData = {
        ...newAnnouncement,
        createdBy: 'admin',
        createdByRole: 'admin'
      };

      await DatabaseService.addAnnouncement(announcementData);
      Alert.alert('Success', 'Announcement posted successfully');
      
      // Reset form
      setNewAnnouncement({
        title: '',
        message: '',
        priority: 'normal',
        visibility: 'all',
        targetClasses: []
      });
      
      setShowAnnouncements(false);
      loadAnnouncements();
    } catch (error) {
      console.error('Error adding announcement:', error);
      Alert.alert('Error', 'Failed to post announcement');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Portal</Text>
        <TouchableOpacity 
          style={styles.announcementButton}
          onPress={() => setShowAnnouncements(true)}
        >
          <Ionicons name="megaphone" size={20} color="#4a90e2" />
        </TouchableOpacity>
      </View>
      
      {/* Announcements Banner */}
      <AnnouncementBanner 
        userRole="admin" 
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>School Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>450</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>35</Text>
              <Text style={styles.statLabel}>Teachers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>15</Text>
              <Text style={styles.statLabel}>Classes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>92%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowStudentList(true)}
            >
              <Ionicons name="people" size={32} color="#4a90e2" />
              <Text style={styles.actionText}>Manage Students</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="calendar" size={32} color="#4a90e2" />
              <Text style={styles.actionText}>Attendance Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowAddStudent(true)}
            >
              <Ionicons name="person-add" size={32} color="#4CAF50" />
              <Text style={styles.actionText}>Add Student</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="qr-code" size={32} color="#FF9800" />
              <Text style={styles.actionText}>QR Codes</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {[
              { action: 'New student registered', time: '10 minutes ago', icon: 'person-add' },
              { action: 'Attendance report generated', time: '1 hour ago', icon: 'document-text' },
              { action: 'System update completed', time: '3 hours ago', icon: 'refresh-circle' },
              { action: 'New announcement posted', time: 'Yesterday', icon: 'megaphone' },
            ].map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Ionicons name={activity.icon} size={24} color="#4a90e2" />
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.action}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Student List Modal */}
      <Modal
        visible={showStudentList}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStudentList(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Student Management</Text>
            <View style={styles.placeholder} />
          </View>
          
          <FlatList
            data={students}
            keyExtractor={(item) => item.studentId}
            renderItem={({ item }) => (
              <View style={styles.studentItem}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentDetails}>
                    ID: {item.studentId} • Class: {item.class}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.qrButton}
                  onPress={() => handleGenerateQR(item)}
                >
                  <Ionicons name="qr-code" size={20} color="#4a90e2" />
                  <Text style={styles.qrButtonText}>QR Code</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.studentList}
          />
        </SafeAreaView>
      </Modal>

      {/* Add Student Modal */}
      <Modal
        visible={showAddStudent}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddStudent(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Student</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={newStudent.firstName}
                onChangeText={(text) => setNewStudent({...newStudent, firstName: text})}
                placeholder="Enter first name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={newStudent.lastName}
                onChangeText={(text) => setNewStudent({...newStudent, lastName: text})}
                placeholder="Enter last name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Class *</Text>
              <TextInput
                style={styles.input}
                value={newStudent.class}
                onChangeText={(text) => setNewStudent({...newStudent, class: text})}
                placeholder="e.g., 10A, 9B"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Parent Contact</Text>
              <TextInput
                style={styles.input}
                value={newStudent.parentContact}
                onChangeText={(text) => setNewStudent({...newStudent, parentContact: text})}
                placeholder="parent@email.com"
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newStudent.address}
                onChangeText={(text) => setNewStudent({...newStudent, address: text})}
                placeholder="Student address"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Emergency Contact</Text>
              <TextInput
                style={styles.input}
                value={newStudent.emergencyContact}
                onChangeText={(text) => setNewStudent({...newStudent, emergencyContact: text})}
                placeholder="+64 21 123 4567"
                keyboardType="phone-pad"
              />
            </View>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddStudent}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Student</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* QR Code Generator Modal */}
      <Modal
        visible={showQRGenerator}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <QRCodeGenerator
          studentData={selectedStudent}
          onClose={() => setShowQRGenerator(false)}
          onPrint={handlePrintQR}
        />
      </Modal>

      {/* Announcements Management Modal */}
      <Modal
        visible={showAnnouncements}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAnnouncements(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Announcement Management</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.announcementContainer}>
            {/* All Announcements List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Announcements ({announcements.length})</Text>
              
              {announcements.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="megaphone-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyStateText}>No announcements yet</Text>
                </View>
              ) : (
                announcements.map((announcement) => (
                  <View key={announcement.id} style={styles.announcementCard}>
                    <View style={styles.announcementHeader}>
                      <Text style={styles.announcementTitle}>{announcement.title}</Text>
                      <View style={[styles.priorityBadge, 
                        announcement.priority === 'urgent' ? styles.urgentBadge : 
                        announcement.priority === 'high' ? styles.highBadge : styles.normalBadge
                      ]}>
                        <Text style={styles.priorityText}>{announcement.priority.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.announcementMessage}>{announcement.message}</Text>
                    <View style={styles.announcementFooter}>
                      <Text style={styles.announcementVisibility}>
                        {announcement.visibility === 'all' ? 'Everyone' :
                         announcement.visibility === 'staff' ? 'Staff Only' :
                         announcement.visibility === 'students' ? 'Students Only' :
                         `Class: ${announcement.targetClasses?.join(', ') || 'N/A'}`}
                      </Text>
                      <Text style={styles.announcementDate}>
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.announcementCreator}>
                      By: {announcement.createdByRole} {announcement.createdBy}
                    </Text>
                  </View>
                ))
              )}
            </View>
            
            {/* Create New Announcement Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Create New Announcement</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={newAnnouncement.title}
                  onChangeText={(text) => setNewAnnouncement({...newAnnouncement, title: text})}
                  placeholder="Enter announcement title"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newAnnouncement.message}
                  onChangeText={(text) => setNewAnnouncement({...newAnnouncement, message: text})}
                  placeholder="Enter announcement message"
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.prioritySelector}>
                  {['normal', 'high', 'urgent'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        newAnnouncement.priority === priority && styles.priorityOptionActive
                      ]}
                      onPress={() => setNewAnnouncement({...newAnnouncement, priority})}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        newAnnouncement.priority === priority && styles.priorityOptionTextActive
                      ]}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Visibility</Text>
                <View style={styles.visibilitySelector}>
                  {['all', 'staff', 'students'].map((visibility) => (
                    <TouchableOpacity
                      key={visibility}
                      style={[
                        styles.visibilityOption,
                        newAnnouncement.visibility === visibility && styles.visibilityOptionActive
                      ]}
                      onPress={() => setNewAnnouncement({...newAnnouncement, visibility})}
                    >
                      <Text style={[
                        styles.visibilityOptionText,
                        newAnnouncement.visibility === visibility && styles.visibilityOptionTextActive
                      ]}>
                        {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddAnnouncement}
              >
                <Ionicons name="megaphone" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Post Announcement</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  activityContent: {
    marginLeft: 12,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
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
  placeholder: {
    width: 24,
  },
  studentList: {
    padding: 20,
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#666',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  // Form styles
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  announcementButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  // Announcement styles
  announcementContainer: {
    flex: 1,
    padding: 20,
  },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentBadge: {
    backgroundColor: '#ffebee',
  },
  highBadge: {
    backgroundColor: '#fff3e0',
  },
  normalBadge: {
    backgroundColor: '#e8f5e8',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  announcementMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementVisibility: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  announcementDate: {
    fontSize: 12,
    color: '#999',
  },
  announcementCreator: {
    fontSize: 11,
    color: '#ccc',
    fontStyle: 'italic',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: '#4a90e2',
  },
  priorityOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priorityOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  visibilitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  visibilityOptionActive: {
    backgroundColor: '#4CAF50',
  },
  visibilityOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  visibilityOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default AdminPortal;