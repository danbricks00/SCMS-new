import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AbsenceRequestForm = ({ visible, onClose, onSubmit, parentName, children = [] }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: parentName || '',
    contactDetails: '',
    reason: '',
    startDate: '',
    endDate: '',
    additionalNotes: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Student name is required';
    }
    if (!formData.parentName.trim()) {
      newErrors.parentName = 'Parent name is required';
    }
    if (!formData.contactDetails.trim()) {
      newErrors.contactDetails = 'Contact details are required';
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }
    if (!formData.startDate.trim()) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate.trim()) {
      newErrors.endDate = 'End date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        ...formData,
        submittedAt: new Date().toISOString(),
        status: 'pending' // pending, approved, rejected
      });
      // Reset form
      setFormData({
        studentName: '',
        parentName: parentName || '',
        contactDetails: '',
        reason: '',
        startDate: '',
        endDate: '',
        additionalNotes: ''
      });
      setErrors({});
    }
  };

  const handleCancel = () => {
    setErrors({});
    onClose();
  };

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
            <Text style={styles.modalTitle}>Submit Absence Request</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll}>
            {/* Student Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Student Name *</Text>
              {children.length > 0 ? (
                <View style={styles.selectContainer}>
                  {children.map((child, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.childOption,
                        formData.studentName === child.name && styles.childOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, studentName: child.name })}
                    >
                      <Text style={[
                        styles.childOptionText,
                        formData.studentName === child.name && styles.childOptionTextSelected
                      ]}>
                        {child.name} - {child.class}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TextInput
                  style={[styles.input, errors.studentName && styles.inputError]}
                  placeholder="Enter student's full name"
                  value={formData.studentName}
                  onChangeText={(text) => setFormData({ ...formData, studentName: text })}
                />
              )}
              {errors.studentName && <Text style={styles.errorText}>{errors.studentName}</Text>}
            </View>

            {/* Parent Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Parent/Guardian Name *</Text>
              <TextInput
                style={[styles.input, errors.parentName && styles.inputError]}
                placeholder="Enter your full name"
                value={formData.parentName}
                onChangeText={(text) => setFormData({ ...formData, parentName: text })}
              />
              {errors.parentName && <Text style={styles.errorText}>{errors.parentName}</Text>}
            </View>

            {/* Contact Details */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Details *</Text>
              <TextInput
                style={[styles.input, errors.contactDetails && styles.inputError]}
                placeholder="Phone number or email"
                value={formData.contactDetails}
                onChangeText={(text) => setFormData({ ...formData, contactDetails: text })}
                keyboardType={Platform.OS === 'web' ? 'default' : 'phone-pad'}
              />
              {errors.contactDetails && <Text style={styles.errorText}>{errors.contactDetails}</Text>}
            </View>

            {/* Reason */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reason for Absence *</Text>
              <TextInput
                style={[styles.textArea, errors.reason && styles.inputError]}
                placeholder="e.g., Medical appointment, family emergency, illness"
                value={formData.reason}
                onChangeText={(text) => setFormData({ ...formData, reason: text })}
                multiline
                numberOfLines={3}
              />
              {errors.reason && <Text style={styles.errorText}>{errors.reason}</Text>}
            </View>

            {/* Start Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Date *</Text>
              <TextInput
                style={[styles.input, errors.startDate && styles.inputError]}
                placeholder="YYYY-MM-DD (e.g., 2025-10-25)"
                value={formData.startDate}
                onChangeText={(text) => setFormData({ ...formData, startDate: text })}
              />
              {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
            </View>

            {/* End Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date *</Text>
              <TextInput
                style={[styles.input, errors.endDate && styles.inputError]}
                placeholder="YYYY-MM-DD (e.g., 2025-10-25)"
                value={formData.endDate}
                onChangeText={(text) => setFormData({ ...formData, endDate: text })}
              />
              {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
            </View>

            {/* Additional Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Any additional information..."
                value={formData.additionalNotes}
                onChangeText={(text) => setFormData({ ...formData, additionalNotes: text })}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit Request</Text>
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
  selectContainer: {
    gap: 10,
  },
  childOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  childOptionSelected: {
    borderColor: '#4a90e2',
    backgroundColor: '#e6f2ff',
  },
  childOptionText: {
    fontSize: 14,
    color: '#333',
  },
  childOptionTextSelected: {
    color: '#4a90e2',
    fontWeight: '600',
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

export default AbsenceRequestForm;

