import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProtectedRoute from '../components/ProtectedRoute';

const CustomReportPage = () => {
  const [reportName, setReportName] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [dateRange, setDateRange] = useState('week'); // week, month, year, custom
  const [reportType, setReportType] = useState('summary'); // summary, detailed, comparison

  const availableMetrics = [
    { id: 'attendance', label: 'Attendance Rate', icon: 'checkmark-circle', category: 'attendance' },
    { id: 'late_arrivals', label: 'Late Arrivals', icon: 'time', category: 'attendance' },
    { id: 'absences', label: 'Absences', icon: 'close-circle', category: 'attendance' },
    { id: 'student_count', label: 'Student Count', icon: 'people', category: 'enrollment' },
    { id: 'class_distribution', label: 'Class Distribution', icon: 'pie-chart', category: 'enrollment' },
    { id: 'teacher_count', label: 'Teacher Count', icon: 'briefcase', category: 'staff' },
    { id: 'events_held', label: 'Events Held', icon: 'calendar', category: 'events' },
    { id: 'announcements', label: 'Announcements', icon: 'megaphone', category: 'communications' },
    { id: 'absence_requests', label: 'Absence Requests', icon: 'document-text', category: 'administrative' },
  ];

  const toggleMetric = (metricId) => {
    if (selectedMetrics.includes(metricId)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metricId));
    } else {
      setSelectedMetrics([...selectedMetrics, metricId]);
    }
  };

  const generateReport = () => {
    if (selectedMetrics.length === 0) {
      if (Platform.OS === 'web') {
        alert('Please select at least one metric to include in your report.');
      }
      return;
    }

    const metricsLabels = selectedMetrics.map(id => 
      availableMetrics.find(m => m.id === id)?.label
    ).join(', ');

    if (Platform.OS === 'web') {
      alert(`Generating Custom Report...\n\nReport Name: ${reportName || 'Untitled Report'}\nType: ${reportType}\nDate Range: ${dateRange}\nMetrics: ${metricsLabels}\n\nThis will generate a customized PDF report with your selected parameters.`);
    }
  };

  const groupedMetrics = availableMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {});

  return (
    <ProtectedRoute requiredRole="admin">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Custom Report Builder</Text>
          <TouchableOpacity onPress={generateReport} style={styles.generateButton}>
            <Ionicons name="create-outline" size={20} color="#4a90e2" />
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Report Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter report name (optional)"
              value={reportName}
              onChangeText={setReportName}
            />
          </View>

          {/* Report Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Type</Text>
            <View style={styles.optionsGrid}>
              {['summary', 'detailed', 'comparison'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.optionCard, reportType === type && styles.optionCardSelected]}
                  onPress={() => setReportType(type)}
                >
                  <Ionicons 
                    name={type === 'summary' ? 'document' : type === 'detailed' ? 'list' : 'git-compare'} 
                    size={24} 
                    color={reportType === type ? '#4a90e2' : '#666'} 
                  />
                  <Text style={[styles.optionText, reportType === type && styles.optionTextSelected]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Range</Text>
            <View style={styles.optionsGrid}>
              {[
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'year', label: 'This Year' },
                { value: 'custom', label: 'Custom' }
              ].map((range) => (
                <TouchableOpacity
                  key={range.value}
                  style={[styles.optionCard, dateRange === range.value && styles.optionCardSelected]}
                  onPress={() => setDateRange(range.value)}
                >
                  <Text style={[styles.optionText, dateRange === range.value && styles.optionTextSelected]}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Metrics Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Metrics ({selectedMetrics.length})</Text>
            {Object.entries(groupedMetrics).map(([category, metrics]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                <View style={styles.metricsGrid}>
                  {metrics.map((metric) => (
                    <TouchableOpacity
                      key={metric.id}
                      style={[
                        styles.metricCard,
                        selectedMetrics.includes(metric.id) && styles.metricCardSelected
                      ]}
                      onPress={() => toggleMetric(metric.id)}
                    >
                      <Ionicons 
                        name={metric.icon} 
                        size={24} 
                        color={selectedMetrics.includes(metric.id) ? '#4a90e2' : '#666'} 
                      />
                      <Text style={[
                        styles.metricLabel,
                        selectedMetrics.includes(metric.id) && styles.metricLabelSelected
                      ]}>
                        {metric.label}
                      </Text>
                      {selectedMetrics.includes(metric.id) && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Preview</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Report: {reportName || 'Untitled Report'}</Text>
              <Text style={styles.previewLabel}>Type: {reportType}</Text>
              <Text style={styles.previewLabel}>Period: {dateRange}</Text>
              <Text style={styles.previewLabel}>Metrics: {selectedMetrics.length} selected</Text>
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4a90e2',
    gap: 4,
  },
  generateButtonText: {
    color: '#4a90e2',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
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
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionCardSelected: {
    borderColor: '#4a90e2',
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  metricCardSelected: {
    borderColor: '#4a90e2',
    backgroundColor: '#e3f2fd',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  metricLabelSelected: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

export default CustomReportPage;

