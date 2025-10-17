import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DatabaseService from '../services/database';

const TeacherAnnouncement = ({ visible, onClose, teacherId, teacherName, teacherClasses = [] }) => {
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal',
    targetClasses: [],
    includeParents: false,
  });

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (newAnnouncement.targetClasses.length === 0) {
      Alert.alert('Error', 'Please select at least one class');
      return;
    }

    try {
      const announcementData = {
        ...newAnnouncement,
        createdBy: teacherId,
        createdByRole: 'teacher',
        createdByName: teacherName,
        visibility: 'class',
        timestamp: new Date(),
        isActive: true,
      };

      await DatabaseService.addAnnouncement(announcementData);
      
      Alert.alert('Success', 'Announcement created successfully!');
      setNewAnnouncement({
        title: '',
        message: '',
        priority: 'normal',
        targetClasses: [],
        includeParents: false,
      });
      onClose();
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement. Please try again.');
    }
  };

  const toggleClass = (classId) => {
    setNewAnnouncement(prev => ({
      ...prev,
      targetClasses: prev.targetClasses.includes(classId)
        ? prev.targetClasses.filter(id => id !== classId)
        : [...prev.targetClasses, classId]
    }));
  };

  const resetForm = () => {
    setNewAnnouncement({
      title: '',
      message: '',
      priority: 'normal',
      targetClasses: [],
      includeParents: false,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Class Announcement</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={newAnnouncement.title}
              onChangeText={(text) => setNewAnnouncement({...newAnnouncement, title: text})}
              placeholder="Enter announcement title"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newAnnouncement.message}
              onChangeText={(text) => setNewAnnouncement({...newAnnouncement, message: text})}
              placeholder="Enter your message"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityContainer}>
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
                    styles.priorityText,
                    newAnnouncement.priority === priority && styles.priorityTextActive
                  ]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Classes *</Text>
            <Text style={styles.helperText}>Select the classes that should see this announcement</Text>
            {teacherClasses.map((classItem) => (
              <TouchableOpacity
                key={classItem.id}
                style={[
                  styles.classOption,
                  newAnnouncement.targetClasses.includes(classItem.id) && styles.classOptionActive
                ]}
                onPress={() => toggleClass(classItem.id)}
              >
                <View style={styles.classInfo}>
                  <Text style={[
                    styles.className,
                    newAnnouncement.targetClasses.includes(classItem.id) && styles.classNameActive
                  ]}>
                    {classItem.name}
                  </Text>
                  <Text style={[
                    styles.classSubject,
                    newAnnouncement.targetClasses.includes(classItem.id) && styles.classSubjectActive
                  ]}>
                    {classItem.subject}
                  </Text>
                </View>
                <Ionicons
                  name={newAnnouncement.targetClasses.includes(classItem.id) ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={newAnnouncement.targetClasses.includes(classItem.id) ? "#4CAF50" : "#ccc"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={[
                styles.checkboxContainer,
                newAnnouncement.includeParents && styles.checkboxContainerActive
              ]}
              onPress={() => setNewAnnouncement({...newAnnouncement, includeParents: !newAnnouncement.includeParents})}
            >
              <Ionicons
                name={newAnnouncement.includeParents ? "checkbox" : "square-outline"}
                size={20}
                color={newAnnouncement.includeParents ? "#4CAF50" : "#ccc"}
              />
              <Text style={[
                styles.checkboxText,
                newAnnouncement.includeParents && styles.checkboxTextActive
              ]}>
                Also notify parents of selected classes
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateAnnouncement}
          >
            <Ionicons name="megaphone" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Announcement</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
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
  priorityText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priorityTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  classOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  classOptionActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  classNameActive: {
    color: '#4CAF50',
  },
  classSubject: {
    fontSize: 14,
    color: '#666',
  },
  classSubjectActive: {
    color: '#4CAF50',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  checkboxContainerActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  checkboxText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  checkboxTextActive: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TeacherAnnouncement;