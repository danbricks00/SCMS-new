import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EventManager = ({ visible, onClose, onSubmit, userRole, teacherClasses = [], allClasses = [] }) => {
  const isAdmin = userRole === 'admin';
  const availableClasses = isAdmin ? allClasses : teacherClasses;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    location: '',
    eventType: 'class', // class, staff, school-wide, student-parent
    targetClasses: [],
    includeParents: false
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.eventDate.trim()) {
      newErrors.eventDate = 'Event date is required';
    }
    if (!formData.startTime.trim()) {
      newErrors.startTime = 'Start time is required';
    }
    if (!formData.endTime.trim()) {
      newErrors.endTime = 'End time is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (formData.eventType === 'class' && formData.targetClasses.length === 0) {
      newErrors.targetClasses = 'Please select at least one class';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: userRole
      });
      // Reset form
      setFormData({
        title: '',
        description: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        location: '',
        eventType: 'class',
        targetClasses: [],
        includeParents: false
      });
      setErrors({});
    }
  };

  const handleCancel = () => {
    setErrors({});
    onClose();
  };

  const toggleClass = (className) => {
    if (formData.targetClasses.includes(className)) {
      setFormData({
        ...formData,
        targetClasses: formData.targetClasses.filter(c => c !== className)
      });
    } else {
      setFormData({
        ...formData,
        targetClasses: [...formData.targetClasses, className]
      });
    }
  };

  const eventTypeOptions = isAdmin ? [
    { value: 'class', label: 'Class Event', icon: 'people' },
    { value: 'staff', label: 'Staff Event', icon: 'briefcase' },
    { value: 'school-wide', label: 'School-Wide Event', icon: 'school' },
    { value: 'student-parent', label: 'Student/Parent Event', icon: 'home' }
  ] : [
    { value: 'class', label: 'Class Event', icon: 'people' }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Event</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll}>
            {/* Event Type (Admin Only) */}
            {isAdmin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Type *</Text>
                <View style={styles.eventTypeContainer}>
                  {eventTypeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.eventTypeOption,
                        formData.eventType === option.value && styles.eventTypeOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, eventType: option.value })}
                    >
                      <Ionicons 
                        name={option.icon} 
                        size={20} 
                        color={formData.eventType === option.value ? '#4a90e2' : '#666'} 
                      />
                      <Text style={[
                        styles.eventTypeText,
                        formData.eventType === option.value && styles.eventTypeTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Event Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g., Parent-Teacher Meeting"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                placeholder="Event details and information"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>

            {/* Event Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Date *</Text>
              <TextInput
                style={[styles.input, errors.eventDate && styles.inputError]}
                placeholder="YYYY-MM-DD (e.g., 2025-10-25)"
                value={formData.eventDate}
                onChangeText={(text) => setFormData({ ...formData, eventDate: text })}
              />
              {errors.eventDate && <Text style={styles.errorText}>{errors.eventDate}</Text>}
            </View>

            {/* Time Range */}
            <View style={styles.timeRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Start Time *</Text>
                <TextInput
                  style={[styles.input, errors.startTime && styles.inputError]}
                  placeholder="HH:MM (e.g., 09:00)"
                  value={formData.startTime}
                  onChangeText={(text) => setFormData({ ...formData, startTime: text })}
                />
                {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>End Time *</Text>
                <TextInput
                  style={[styles.input, errors.endTime && styles.inputError]}
                  placeholder="HH:MM (e.g., 11:00)"
                  value={formData.endTime}
                  onChangeText={(text) => setFormData({ ...formData, endTime: text })}
                />
                {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                placeholder="e.g., Main Hall, Room 101"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </View>

            {/* Target Classes (for class events) */}
            {formData.eventType === 'class' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Classes *</Text>
                <View style={styles.classesContainer}>
                  {availableClasses.map((cls, index) => {
                    const className = typeof cls === 'string' ? cls : cls.name;
                    const isSelected = formData.targetClasses.includes(className);
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.classChip,
                          isSelected && styles.classChipSelected
                        ]}
                        onPress={() => toggleClass(className)}
                      >
                        <Text style={[
                          styles.classChipText,
                          isSelected && styles.classChipTextSelected
                        ]}>
                          {className}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.targetClasses && <Text style={styles.errorText}>{errors.targetClasses}</Text>}
              </View>
            )}

            {/* Include Parents Toggle */}
            {(formData.eventType === 'class' || formData.eventType === 'student-parent') && (
              <View style={styles.inputGroup}>
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setFormData({ ...formData, includeParents: !formData.includeParents })}
                >
                  <Ionicons
                    name={formData.includeParents ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={formData.includeParents ? '#4a90e2' : '#666'}
                  />
                  <Text style={styles.toggleText}>Notify Parents</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  formScroll: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
  },
  eventTypeContainer: {
    gap: 10,
  },
  eventTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  eventTypeOptionSelected: {
    borderColor: '#4a90e2',
    backgroundColor: '#e6f2ff',
  },
  eventTypeText: {
    fontSize: 14,
    color: '#333',
  },
  eventTypeTextSelected: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
  },
  classesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  classChipSelected: {
    borderColor: '#4a90e2',
    backgroundColor: '#4a90e2',
  },
  classChipText: {
    fontSize: 14,
    color: '#333',
  },
  classChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleText: {
    fontSize: 14,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4a90e2',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EventManager;

