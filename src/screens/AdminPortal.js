import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnnouncementBanner from '../components/AnnouncementBanner';
import QRCodeGenerator from '../components/QRCodeGenerator';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService, SAMPLE_STUDENTS } from '../services/database';

const AdminPortal = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, students, teachers, classes, reports, settings
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    class: '',
    parentContact: '',
    address: '',
    emergencyContact: '',
    photo: ''
  });
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    department: '',
    photo: '',
    classes: []
  });
  const [newClass, setNewClass] = useState({
    name: '',
    teacherId: '',
    teacherName: '',
    subject: '',
    room: '',
    schedule: '',
    studentIds: []
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
    loadTeachers();
    loadClasses();
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

  const loadTeachers = async () => {
    try {
      const teachersData = await DatabaseService.getAllTeachers();
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error loading teachers:', error);
      // Keep empty array if database is not available
      setTeachers([]);
    }
  };

  const loadClasses = async () => {
    try {
      const classesData = await DatabaseService.getAllClasses();
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading classes:', error);
      // Keep empty array if database is not available
      setClasses([]);
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
        emergencyContact: '',
        photo: ''
      });
      
      setShowAddStudent(false);
      loadStudents();
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert('Error', 'Failed to add student');
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.firstName || !newTeacher.lastName || !newTeacher.email || !newTeacher.subject) {
      Alert.alert('Error', 'Please fill in all required fields (First Name, Last Name, Email, Subject)');
      return;
    }

    try {
      const teacherData = {
        ...newTeacher,
        name: `${newTeacher.firstName} ${newTeacher.lastName}`
      };

      await DatabaseService.addTeacher(teacherData);
      Alert.alert('Success', 'Teacher added successfully');
      
      // Reset form
      setNewTeacher({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        department: '',
        photo: '',
        classes: []
      });
      
      setShowAddTeacher(false);
      loadTeachers();
    } catch (error) {
      console.error('Error adding teacher:', error);
      Alert.alert('Error', 'Failed to add teacher');
    }
  };

  const handleAddClass = async () => {
    if (!newClass.name || !newClass.teacherId || !newClass.subject) {
      Alert.alert('Error', 'Please fill in all required fields (Class Name, Teacher, Subject)');
      return;
    }

    try {
      await DatabaseService.addClass(newClass);
      Alert.alert('Success', 'Class created successfully');
      
      // Reset form
      setNewClass({
        name: '',
        teacherId: '',
        teacherName: '',
        subject: '',
        room: '',
        schedule: '',
        studentIds: []
      });
      
      setShowAddClass(false);
      loadClasses();
    } catch (error) {
      console.error('Error adding class:', error);
      Alert.alert('Error', 'Failed to create class');
    }
  };

  const handleGenerateQR = (student) => {
    setSelectedStudent(student);
    setShowQRGenerator(true);
  };

  const handleRegenerateQR = async (student) => {
    Alert.alert(
      'Regenerate QR Code',
      `Are you sure you want to regenerate the QR code for ${student.name}? This will invalidate the old QR code and generate a new one.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Regenerate', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Invalidate old QR code and generate new one
              await DatabaseService.invalidateQRCode(student.studentId);
              setSelectedStudent(student);
              setShowQRGenerator(true);
              Alert.alert('Success', 'Old QR code invalidated. New QR code generated.');
            } catch (error) {
              console.error('Error regenerating QR code:', error);
              Alert.alert('Error', 'Failed to regenerate QR code');
            }
          }
        }
      ]
    );
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
    <ProtectedRoute requiredRole="admin">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Portal - {user?.name}</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={20} color="#e74c3c" />
            <Text style={styles.logoutText}>Logout</Text>
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
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowAddTeacher(true)}
            >
              <Ionicons name="person-add" size={32} color="#4CAF50" />
              <Text style={styles.actionText}>Add Teacher</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowAddClass(true)}
            >
              <Ionicons name="school" size={32} color="#FF9800" />
              <Text style={styles.actionText}>Create Class</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowAddStudent(true)}
            >
              <Ionicons name="person-add-outline" size={32} color="#9C27B0" />
              <Text style={styles.actionText}>Add Student</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowAnnouncements(true)}
            >
              <Ionicons name="megaphone" size={32} color="#00BCD4" />
              <Text style={styles.actionText}>Announcements</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="calendar" size={32} color="#607D8B" />
              <Text style={styles.actionText}>Reports</Text>
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
                  <View style={styles.studentActions}>
                    <TouchableOpacity
                      style={styles.qrButton}
                      onPress={() => handleGenerateQR(item)}
                    >
                      <Ionicons name="qr-code" size={20} color="#4a90e2" />
                      <Text style={styles.qrButtonText}>Generate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.regenerateButton}
                      onPress={() => handleRegenerateQR(item)}
                    >
                      <Ionicons name="refresh" size={20} color="#FF9800" />
                      <Text style={styles.regenerateButtonText}>Regenerate</Text>
                    </TouchableOpacity>
                  </View>
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
              <Text style={styles.inputLabel}>Student Photo (Optional)</Text>
              <TextInput
                style={styles.input}
                value={newStudent.photo}
                onChangeText={(text) => setNewStudent({...newStudent, photo: text})}
                placeholder="Photo URL (e.g., https://example.com/photo.jpg)"
              />
              <Text style={styles.helperText}>
                📷 Tip: Upload photo to a hosting service and paste URL here, or print and affix photo to QR card
              </Text>
            </View>

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

      {/* Add Teacher Modal */}
      <Modal
        visible={showAddTeacher}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddTeacher(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Teacher</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teacher Photo (Optional)</Text>
              <TextInput
                style={styles.input}
                value={newTeacher.photo}
                onChangeText={(text) => setNewTeacher({...newTeacher, photo: text})}
                placeholder="Photo URL (e.g., https://example.com/photo.jpg)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={newTeacher.firstName}
                onChangeText={(text) => setNewTeacher({...newTeacher, firstName: text})}
                placeholder="Enter first name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={newTeacher.lastName}
                onChangeText={(text) => setNewTeacher({...newTeacher, lastName: text})}
                placeholder="Enter last name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={newTeacher.email}
                onChangeText={(text) => setNewTeacher({...newTeacher, email: text})}
                placeholder="teacher@school.edu"
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={newTeacher.phone}
                onChangeText={(text) => setNewTeacher({...newTeacher, phone: text})}
                placeholder="+64 21 123 4567"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject *</Text>
              <TextInput
                style={styles.input}
                value={newTeacher.subject}
                onChangeText={(text) => setNewTeacher({...newTeacher, subject: text})}
                placeholder="e.g., Mathematics, English, Science"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Department</Text>
              <TextInput
                style={styles.input}
                value={newTeacher.department}
                onChangeText={(text) => setNewTeacher({...newTeacher, department: text})}
                placeholder="e.g., Mathematics Department"
              />
            </View>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddTeacher}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Teacher</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Class Modal */}
      <Modal
        visible={showAddClass}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddClass(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create New Class</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Class Name *</Text>
              <TextInput
                style={styles.input}
                value={newClass.name}
                onChangeText={(text) => setNewClass({...newClass, name: text})}
                placeholder="e.g., 10A, 9B, Advanced Math"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject *</Text>
              <TextInput
                style={styles.input}
                value={newClass.subject}
                onChangeText={(text) => setNewClass({...newClass, subject: text})}
                placeholder="e.g., Mathematics, English, Science"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Room</Text>
              <TextInput
                style={styles.input}
                value={newClass.room}
                onChangeText={(text) => setNewClass({...newClass, room: text})}
                placeholder="e.g., Room 101, Lab 2"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Schedule</Text>
              <TextInput
                style={styles.input}
                value={newClass.schedule}
                onChangeText={(text) => setNewClass({...newClass, schedule: text})}
                placeholder="e.g., Mon, Wed, Fri 9:00-10:00 AM"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Assign Teacher *</Text>
              <Text style={styles.helperText}>Select from existing teachers or enter teacher ID</Text>
              <TextInput
                style={styles.input}
                value={newClass.teacherId}
                onChangeText={(text) => setNewClass({...newClass, teacherId: text})}
                placeholder="e.g., TCH123456"
              />
              <TextInput
                style={[styles.input, styles.marginTop]}
                value={newClass.teacherName}
                onChangeText={(text) => setNewClass({...newClass, teacherName: text})}
                placeholder="Teacher Name (optional)"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Student IDs (Optional)</Text>
              <Text style={styles.helperText}>Comma-separated list of student IDs to assign to this class</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newClass.studentIds.join(', ')}
                onChangeText={(text) => setNewClass({...newClass, studentIds: text.split(',').map(id => id.trim()).filter(id => id)})}
                placeholder="STU10AJ1234, STU10BS5678, STU10CW9012"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddClass}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Create Class</Text>
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
    flex: 1,
    textAlign: 'center',
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
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '500',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addNewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statAction: {
    fontSize: 12,
    color: '#4a90e2',
    marginTop: 8,
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryAction: {
    backgroundColor: '#4CAF50',
  },
  secondaryAction: {
    backgroundColor: '#4a90e2',
  },
  accentAction: {
    backgroundColor: '#FF9800',
  },
  warningAction: {
    backgroundColor: '#9C27B0',
  },
  infoAction: {
    backgroundColor: '#00BCD4',
  },
  successAction: {
    backgroundColor: '#FF5722',
  },
  actionCardTitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
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
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  activityName: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  // Students View Styles
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 14,
    color: '#999',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterChipActive: {
    backgroundColor: '#4a90e2',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
  },
  filterChipTextActive: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  studentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  studentGridCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  studentGridName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  studentGridId: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  studentGridClass: {
    fontSize: 12,
    color: '#4a90e2',
    marginTop: 2,
    fontWeight: '500',
  },
  studentGridActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  studentGridAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Teachers View Styles
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  teacherIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherInfo: {
    flex: 1,
    marginLeft: 16,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  teacherSubject: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  teacherClasses: {
    fontSize: 12,
    color: '#4a90e2',
    marginTop: 4,
  },
  teacherAction: {
    padding: 4,
  },
  // Classes View Styles
  classCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  classIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInfo: {
    marginLeft: 12,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  classTeacher: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  classStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classStatText: {
    fontSize: 13,
    color: '#666',
  },
  classViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classViewButtonText: {
    fontSize: 13,
    color: '#4a90e2',
    fontWeight: '500',
  },
  // Reports View Styles
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reportCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  reportCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  reportCardDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickStat: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  // Settings View Styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTitle: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
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
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF9800',
    marginLeft: 8,
  },
  regenerateButtonText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  marginTop: {
    marginTop: 8,
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