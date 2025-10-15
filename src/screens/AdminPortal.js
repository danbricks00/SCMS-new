import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimeDisplay from '../components/DateTimeDisplay';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { DatabaseService, SAMPLE_STUDENTS } from '../services/database';

const AdminPortal = () => {
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, students, teachers, classes, reports, settings
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([
    { id: 'TCH001', name: 'Ms. Johnson', subject: 'Mathematics', classes: ['10A', '9B'] },
    { id: 'TCH002', name: 'Mr. Smith', subject: 'English', classes: ['10A', '10B'] },
    { id: 'TCH003', name: 'Dr. Williams', subject: 'Science', classes: ['9A', '9B', '9C'] }
  ]);
  const [classes, setClasses] = useState([
    { id: 'CLS001', name: '10A', students: 30, teacher: 'Ms. Johnson' },
    { id: 'CLS002', name: '10B', students: 28, teacher: 'Mr. Smith' },
    { id: 'CLS003', name: '9A', students: 32, teacher: 'Dr. Williams' }
  ]);
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
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal', // normal, high, urgent
    targetAudience: 'all' // all, teachers, students, parents
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

  const handleGenerateQR = (student) => {
    setSelectedStudent(student);
    setShowQRGenerator(true);
  };

  const handlePrintQR = (uri) => {
    console.log('QR Code printed:', uri);
    Alert.alert('Success', 'QR Code generated successfully');
  };

  const loadTeachers = async () => {
    try {
      const teachersData = await DatabaseService.getAllTeachers();
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error loading teachers:', error);
      // Keep sample data if database is not available
    }
  };

  const loadClasses = async () => {
    try {
      const classesData = await DatabaseService.getAllClasses();
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading classes:', error);
      // Keep sample data if database is not available
    }
  };

  const loadAnnouncements = async () => {
    try {
      const announcementsData = await DatabaseService.getActiveAnnouncements();
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error loading announcements:', error);
      // Keep empty array if database is not available
      setAnnouncements([]);
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

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }

    try {
      await DatabaseService.addAnnouncement(newAnnouncement);
      Alert.alert('Success', 'Announcement posted successfully');
      
      // Reset form
      setNewAnnouncement({
        title: '',
        message: '',
        priority: 'normal',
        targetAudience: 'all'
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
      </View>
      
      {/* Date and Time Display */}
      <View style={styles.dateTimeContainer}>
        <DateTimeDisplay />
      </View>
      
      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.tab, activeView === 'dashboard' && styles.activeTab]}
            onPress={() => setActiveView('dashboard')}
          >
            <Ionicons name="grid" size={20} color={activeView === 'dashboard' ? '#4a90e2' : '#666'} />
            <Text style={[styles.tabText, activeView === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeView === 'students' && styles.activeTab]}
            onPress={() => setActiveView('students')}
          >
            <Ionicons name="people" size={20} color={activeView === 'students' ? '#4a90e2' : '#666'} />
            <Text style={[styles.tabText, activeView === 'students' && styles.activeTabText]}>Students</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeView === 'teachers' && styles.activeTab]}
            onPress={() => setActiveView('teachers')}
          >
            <Ionicons name="school" size={20} color={activeView === 'teachers' ? '#4a90e2' : '#666'} />
            <Text style={[styles.tabText, activeView === 'teachers' && styles.activeTabText]}>Teachers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeView === 'classes' && styles.activeTab]}
            onPress={() => setActiveView('classes')}
          >
            <Ionicons name="book" size={20} color={activeView === 'classes' ? '#4a90e2' : '#666'} />
            <Text style={[styles.tabText, activeView === 'classes' && styles.activeTabText]}>Classes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeView === 'reports' && styles.activeTab]}
            onPress={() => setActiveView('reports')}
          >
            <Ionicons name="stats-chart" size={20} color={activeView === 'reports' ? '#4a90e2' : '#666'} />
            <Text style={[styles.tabText, activeView === 'reports' && styles.activeTabText]}>Reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeView === 'settings' && styles.activeTab]}
            onPress={() => setActiveView('settings')}
          >
            <Ionicons name="settings" size={20} color={activeView === 'settings' ? '#4a90e2' : '#666'} />
            <Text style={[styles.tabText, activeView === 'settings' && styles.activeTabText]}>Settings</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>School Overview</Text>
              <View style={styles.statsGrid}>
                <TouchableOpacity style={styles.statCard} onPress={() => setActiveView('students')}>
                  <Ionicons name="people" size={28} color="#4a90e2" />
                  <Text style={styles.statNumber}>{students.length || 450}</Text>
                  <Text style={styles.statLabel}>Students</Text>
                  <Text style={styles.statAction}>View All →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statCard} onPress={() => setActiveView('teachers')}>
                  <Ionicons name="school" size={28} color="#4CAF50" />
                  <Text style={styles.statNumber}>{teachers.length}</Text>
                  <Text style={styles.statLabel}>Teachers</Text>
                  <Text style={styles.statAction}>View All →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statCard} onPress={() => setActiveView('classes')}>
                  <Ionicons name="book" size={28} color="#FF9800" />
                  <Text style={styles.statNumber}>{classes.length}</Text>
                  <Text style={styles.statLabel}>Classes</Text>
                  <Text style={styles.statAction}>View All →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statCard} onPress={() => setActiveView('reports')}>
                  <Ionicons name="trending-up" size={28} color="#9C27B0" />
                  <Text style={styles.statNumber}>92%</Text>
                  <Text style={styles.statLabel}>Attendance</Text>
                  <Text style={styles.statAction}>View Report →</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionGrid}>
                <TouchableOpacity 
                  style={[styles.actionCard, styles.primaryAction]}
                  onPress={() => setShowAddStudent(true)}
                >
                  <Ionicons name="person-add" size={32} color="#fff" />
                  <Text style={styles.actionCardTitle}>Add Student</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionCard, styles.secondaryAction]}
                  onPress={() => setShowStudentList(true)}
                >
                  <Ionicons name="qr-code" size={32} color="#fff" />
                  <Text style={styles.actionCardTitle}>Generate QR</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionCard, styles.accentAction]}
                  onPress={() => setShowAddTeacher(true)}
                >
                  <Ionicons name="person-add-outline" size={32} color="#fff" />
                  <Text style={styles.actionCardTitle}>Add Teacher</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionCard, styles.warningAction]}
                  onPress={() => setShowAddClass(true)}
                >
                  <Ionicons name="add-circle" size={32} color="#fff" />
                  <Text style={styles.actionCardTitle}>Create Class</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionCard, styles.infoAction]}
                  onPress={() => setActiveView('reports')}
                >
                  <Ionicons name="document-text" size={32} color="#fff" />
                  <Text style={styles.actionCardTitle}>View Reports</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionCard, styles.successAction]}
                  onPress={() => setShowAnnouncements(true)}
                >
                  <Ionicons name="megaphone" size={32} color="#fff" />
                  <Text style={styles.actionCardTitle}>Announcements</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.activityList}>
                {[
                  { action: 'New student registered', name: 'John Doe', time: '10 minutes ago', icon: 'person-add', color: '#4CAF50' },
                  { action: 'Attendance marked', name: 'Class 10A', time: '1 hour ago', icon: 'checkmark-circle', color: '#4a90e2' },
                  { action: 'QR Code generated', name: 'Jane Smith', time: '2 hours ago', icon: 'qr-code', color: '#FF9800' },
                  { action: 'Report generated', name: 'Monthly Report', time: '3 hours ago', icon: 'document-text', color: '#9C27B0' },
                ].map((activity, index) => (
                  <TouchableOpacity key={index} style={styles.activityItem}>
                    <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                      <Ionicons name={activity.icon} size={24} color={activity.color} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>{activity.action}</Text>
                      <Text style={styles.activityName}>{activity.name}</Text>
                      <Text style={styles.activityTime}>{activity.time}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Students View */}
        {activeView === 'students' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>All Students ({students.length})</Text>
                <TouchableOpacity 
                  style={styles.addNewButton}
                  onPress={() => setShowAddStudent(true)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addNewButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#666" />
                <Text style={styles.searchPlaceholder}>Search students...</Text>
              </View>

              <View style={styles.filterBar}>
                <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
                  <Text style={styles.filterChipTextActive}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Class 10A</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Class 9B</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Active</Text>
                </TouchableOpacity>
              </View>
              
              {students.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyStateText}>No students yet</Text>
                  <TouchableOpacity 
                    style={styles.emptyStateButton}
                    onPress={() => setShowAddStudent(true)}
                  >
                    <Text style={styles.emptyStateButtonText}>Add First Student</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.studentGrid}>
                  {students.map((student) => (
                    <TouchableOpacity key={student.studentId} style={styles.studentGridCard}>
                      <Ionicons name="person-circle" size={48} color="#4a90e2" />
                      <Text style={styles.studentGridName}>{student.name}</Text>
                      <Text style={styles.studentGridId}>{student.studentId}</Text>
                      <Text style={styles.studentGridClass}>{student.class}</Text>
                      <View style={styles.studentGridActions}>
                        <TouchableOpacity 
                          style={styles.studentGridAction}
                          onPress={() => handleGenerateQR(student)}
                        >
                          <Ionicons name="qr-code" size={18} color="#4a90e2" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.studentGridAction}>
                          <Ionicons name="create" size={18} color="#FF9800" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* Teachers View */}
        {activeView === 'teachers' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>All Teachers ({teachers.length})</Text>
                <TouchableOpacity 
                  style={styles.addNewButton}
                  onPress={() => setShowAddTeacher(true)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addNewButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              
              {teachers.map((teacher) => (
                <TouchableOpacity key={teacher.id} style={styles.teacherCard}>
                  <View style={styles.teacherIcon}>
                    <Ionicons name="person" size={32} color="#fff" />
                  </View>
                  <View style={styles.teacherInfo}>
                    <Text style={styles.teacherName}>{teacher.name}</Text>
                    <Text style={styles.teacherSubject}>{teacher.subject}</Text>
                    <Text style={styles.teacherClasses}>Classes: {teacher.classes.join(', ')}</Text>
                  </View>
                  <TouchableOpacity style={styles.teacherAction}>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Classes View */}
        {activeView === 'classes' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>All Classes ({classes.length})</Text>
                <TouchableOpacity 
                  style={styles.addNewButton}
                  onPress={() => setShowAddClass(true)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addNewButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              
              {classes.map((classItem) => (
                <TouchableOpacity key={classItem.id} style={styles.classCard}>
                  <View style={styles.classHeader}>
                    <View style={styles.classIcon}>
                      <Ionicons name="book" size={24} color="#fff" />
                    </View>
                    <View style={styles.classInfo}>
                      <Text style={styles.className}>Class {classItem.name}</Text>
                      <Text style={styles.classTeacher}>Teacher: {classItem.teacher}</Text>
                    </View>
                  </View>
                  <View style={styles.classStats}>
                    <View style={styles.classStat}>
                      <Ionicons name="people" size={18} color="#4a90e2" />
                      <Text style={styles.classStatText}>{classItem.students} Students</Text>
                    </View>
                    <TouchableOpacity style={styles.classViewButton}>
                      <Text style={styles.classViewButtonText}>View Details</Text>
                      <Ionicons name="arrow-forward" size={16} color="#4a90e2" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Reports View */}
        {activeView === 'reports' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attendance Reports</Text>
              
              <View style={styles.reportGrid}>
                <TouchableOpacity style={styles.reportCard}>
                  <Ionicons name="calendar" size={32} color="#4a90e2" />
                  <Text style={styles.reportCardTitle}>Daily Report</Text>
                  <Text style={styles.reportCardDate}>Today</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.reportCard}>
                  <Ionicons name="calendar-outline" size={32} color="#4CAF50" />
                  <Text style={styles.reportCardTitle}>Weekly Report</Text>
                  <Text style={styles.reportCardDate}>This Week</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.reportCard}>
                  <Ionicons name="stats-chart" size={32} color="#FF9800" />
                  <Text style={styles.reportCardTitle}>Monthly Report</Text>
                  <Text style={styles.reportCardDate}>October 2025</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.reportCard}>
                  <Ionicons name="document-text" size={32} color="#9C27B0" />
                  <Text style={styles.reportCardTitle}>Custom Report</Text>
                  <Text style={styles.reportCardDate}>Generate</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Stats</Text>
              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>94%</Text>
                  <Text style={styles.quickStatLabel}>Today&apos;s Attendance</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>28</Text>
                  <Text style={styles.quickStatLabel}>Absent Today</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>15</Text>
                  <Text style={styles.quickStatLabel}>Late Arrivals</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Settings View */}
        {activeView === 'settings' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>System Settings</Text>
              
              {[
                { title: 'School Information', icon: 'business', color: '#4a90e2' },
                { title: 'Academic Year Settings', icon: 'calendar', color: '#4CAF50' },
                { title: 'User Management', icon: 'people', color: '#FF9800' },
                { title: 'Notification Settings', icon: 'notifications', color: '#9C27B0' },
                { title: 'Backup & Restore', icon: 'cloud-upload', color: '#00BCD4' },
                { title: 'System Logs', icon: 'list', color: '#607D8B' },
              ].map((setting, index) => (
                <TouchableOpacity key={index} style={styles.settingItem}>
                  <View style={[styles.settingIcon, { backgroundColor: setting.color + '20' }]}>
                    <Ionicons name={setting.icon} size={24} color={setting.color} />
                  </View>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
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

      {/* Create Class Modal */}
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

      {/* Announcements Modal */}
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
            <Text style={styles.modalTitle}>Announcements</Text>
            <TouchableOpacity onPress={() => {/* TODO: Add new announcement form */}}>
              <Ionicons name="add" size={24} color="#4a90e2" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.announcementContainer}>
            {announcements.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="megaphone-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>No announcements yet</Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={() => {/* TODO: Add new announcement form */}}
                >
                  <Text style={styles.emptyStateButtonText}>Create First Announcement</Text>
                </TouchableOpacity>
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
                    <Text style={styles.announcementTarget}>Target: {announcement.targetAudience}</Text>
                    <Text style={styles.announcementDate}>
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
            
            {/* Add New Announcement Form */}
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
                <Text style={styles.inputLabel}>Target Audience</Text>
                <View style={styles.audienceSelector}>
                  {['all', 'teachers', 'students', 'parents'].map((audience) => (
                    <TouchableOpacity
                      key={audience}
                      style={[
                        styles.audienceOption,
                        newAnnouncement.targetAudience === audience && styles.audienceOptionActive
                      ]}
                      onPress={() => setNewAnnouncement({...newAnnouncement, targetAudience: audience})}
                    >
                      <Text style={[
                        styles.audienceOptionText,
                        newAnnouncement.targetAudience === audience && styles.audienceOptionTextActive
                      ]}>
                        {audience.charAt(0).toUpperCase() + audience.slice(1)}
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
  marginTop: {
    marginTop: 8,
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
  },
  announcementTarget: {
    fontSize: 12,
    color: '#999',
  },
  announcementDate: {
    fontSize: 12,
    color: '#999',
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
  audienceSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  audienceOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  audienceOptionActive: {
    backgroundColor: '#4CAF50',
  },
  audienceOptionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  audienceOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default AdminPortal;