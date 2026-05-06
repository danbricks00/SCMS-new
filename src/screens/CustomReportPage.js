import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProtectedRoute from '../components/ProtectedRoute';
import ScreenGradient from '../components/ScreenGradient';
import { canUseServerPdf, generatePdfUrlFromHtml, openPrintDialogWithHtml } from '../utils/pdfFromHtml';

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

  const buildReportHtml = () => {
    const dateStr = new Date().toLocaleDateString('en-NZ');
    const dateRangeLabel = {
      week: 'This Week',
      month: 'This Month',
      year: 'This Year',
      custom: 'Custom Range',
    }[dateRange] || dateRange;

    const selectedMetricObjects = selectedMetrics
      .map(id => availableMetrics.find(m => m.id === id))
      .filter(Boolean);

    const grouped = selectedMetricObjects.reduce((acc, m) => {
      if (!acc[m.category]) acc[m.category] = [];
      acc[m.category].push(m);
      return acc;
    }, {});

    const groupedHtml = Object.entries(grouped).map(([cat, metrics]) => `
      <div class="category">
        <h3>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
        <ul>
          ${metrics.map(m => `<li>${m.label}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #222; padding: 40px; margin: 0; }
          .header { text-align: center; border-bottom: 3px solid #4a90e2; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { margin: 0; color: #4a90e2; font-size: 24px; }
          .header p { margin: 4px 0; color: #555; font-size: 12px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; font-size: 13px; margin-bottom: 24px; background: #f3f4f6; padding: 16px; border-radius: 8px; }
          .info-grid div span { color: #666; display: inline-block; width: 110px; font-weight: 600; }
          h2 { color: #4a90e2; font-size: 16px; border-left: 4px solid #4a90e2; padding-left: 8px; margin-top: 24px; margin-bottom: 12px; }
          .category { margin-bottom: 16px; padding: 12px 16px; background: #fafafa; border-radius: 6px; border-left: 3px solid #4a90e2; }
          .category h3 { margin: 0 0 8px 0; color: #4a90e2; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          .category ul { margin: 0; padding-left: 20px; font-size: 13px; }
          .category li { margin-bottom: 4px; color: #333; }
          .note { background: #fefce8; border-left: 4px solid #eab308; padding: 12px; font-size: 12px; font-style: italic; margin-top: 24px; color: #555; }
          .footer { text-align: center; font-size: 10px; color: #888; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SCMS — Custom Report</h1>
          <p>${reportName || 'Untitled Report'}</p>
        </div>

        <div class="info-grid">
          <div><span>Generated:</span> ${dateStr}</div>
          <div><span>Report Type:</span> ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}</div>
          <div><span>Date Range:</span> ${dateRangeLabel}</div>
          <div><span>Metrics:</span> ${selectedMetrics.length} selected</div>
        </div>

        <h2>Selected Metrics</h2>
        ${groupedHtml || '<p style="color:#888;">No metrics selected.</p>'}

        <div class="note">
          This is a configuration summary of the custom report. Detailed metric data will be populated once analytics integration is complete.
        </div>

        <div class="footer">
          Generated by SCMS · ${new Date().toLocaleString('en-NZ')}
        </div>
      </body>
    </html>`;
  };

  const generateReport = async () => {
    if (selectedMetrics.length === 0) {
      if (Platform.OS === 'web') {
        alert('Please select at least one metric to include in your report.');
      }
      return;
    }

    const html = buildReportHtml();

    try {
      if (canUseServerPdf()) {
        const url = await generatePdfUrlFromHtml(html);
        if (typeof window !== 'undefined') {
          window.open(url, '_blank');
        }
      } else {
        openPrintDialogWithHtml(html);
      }
    } catch (err) {
      console.warn('Server PDF failed, using print dialog fallback:', err);
      openPrintDialogWithHtml(html);
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
        <ScreenGradient>
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
        </ScreenGradient>
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