import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseService } from '../services/database';

const TeacherAnnouncement = ({ isVisible, onClose, teacherId, teacherClasses = [] }) => {
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal',
    targetClasses: [],
    includeParents: false
  });
  const [availableClasses, setAvailableClasses] = useState([]);

  useEffect(() => {
    if (isVisible) {
      loadTeacherClasses();
    }
  }, [isVisible, teacherId]);

  const loadTeacherClasses = async () => {
    try {
      const classes = await DatabaseService.getTeacherClasses(teacherId);
      setAvailableClasses(classes);
    } catch (error) {
      console.error('Error loading teacher classes:', error);
      setAvailableClasses(teacherClasses);
    }
  };

  const handleClassToggle = (className) => {
    setNewAnnouncement(prev => ({
      ...prev,
      targetClasses: prev.targetClasses.includes(className)
        ? prev.targetClasses.filter(c => c !== className)
        : [...prev.targetClasses, className]
    }));
  };

  const handleSubmit = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }

    if (newAnnouncement.targetClasses.length === 0) {
      Alert.alert('Error', 'Please select at least one class');
      return;
    }

    try {
      const announcementData = {
        ...newAnnouncement,
        visibility: 'class',
        createdBy: teacherId,
        createdByRole: 'teacher'
      };

      await DatabaseService.addAnnouncement(announcementData);
      Alert.alert('Success', 'Announcement posted successfully');
      
      // Reset form
      setNewAnnouncement({
        title: '',
        message: '',
        priority: 'normal',
        targetClasses: [],
        includeParents: false
      });
      
      onClose();
    } catch (error) {
      console.error('Error posting announcement:', error);
      Alert.alert('Error', 'Failed to post announcement');
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Class Announcement</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Announcement Details</Text>
            
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
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Classes *</Text>
            <Text style={styles.helperText}>Select the classes that should see this announcement</Text>
            
            <View style={styles.classSelector}>
              {availableClasses.map((className) => (
                <TouchableOpacity
                  key={className}
                  style={[
                    styles.classOption,
                    newAnnouncement.targetClasses.includes(className) && styles.classOptionActive
                  ]}
                  onPress={() => handleClassToggle(className)}
                >
                  <Ionicons 
                    name={newAnnouncement.targetClasses.includes(className) ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={newAnnouncement.targetClasses.includes(className) ? "#4CAF50" : "#666"} 
                  />
                  <Text style={[
                    styles.classOptionText,
                    newAnnouncement.targetClasses.includes(className) && styles.classOptionTextActive
                  ]}>
                    Class {className}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parent Visibility</Text>
            
            <TouchableOpacity
              style={styles.parentToggle}
              onPress={() => setNewAnnouncement({...newAnnouncement, includeParents: !newAnnouncement.includeParents})}
            >
              <Ionicons 
                name={newAnnouncement.includeParents ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={newAnnouncement.includeParents ? "#4CAF50" : "#666"} 
              />
              <View style={styles.parentToggleText}>
                <Text style={styles.parentToggleTitle}>Include Parents</Text>
                <Text style={styles.parentToggleDescription}>
                  Parents of students in selected classes will also see this announcement
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Ionicons name="megaphone" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Post Announcement</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
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
  classSelector: {
    gap: 8,
  },
  classOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 12,
  },
  classOptionActive: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  classOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  classOptionTextActive: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  parentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  parentToggleText: {
    flex: 1,
  },
  parentToggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  parentToggleDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TeacherAnnouncement;
