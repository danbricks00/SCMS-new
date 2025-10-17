import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { QRCodeUtils } from '../utils/qrCodeUtils';

const QRCodeGenerator = ({ studentData, onClose, onPrint }) => {
  const [qrSize, setQrSize] = useState(200);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!studentData) return null;

  const qrData = QRCodeUtils.generateStudentQR(studentData);

  const handlePrint = async () => {
    setIsGenerating(true);
    
    try {
      const html = generatePrintableHTML(studentData, qrData);
      
      const { uri } = await Print.printToFileAsync({ 
        html,
        base64: false 
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Student QR Code - ${studentData.name}`
        });
      } else {
        Alert.alert('Success', 'QR Code PDF generated successfully');
      }

      if (onPrint) {
        onPrint(uri);
      }
    } catch (error) {
      console.error('Print Error:', error);
      Alert.alert('Error', 'Failed to generate printable QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePrintableHTML = (student, qrData) => {
    const photoUrl = student.photo || '';
    const hasPhoto = photoUrl && photoUrl.trim() !== '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Student QR Code - ${student.name}</title>
        <style>
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .container {
            max-width: 450px;
            margin: 0 auto;
            border: 3px solid #4a90e2;
            border-radius: 15px;
            overflow: hidden;
          }
          .header {
            background: #4a90e2;
            color: white;
            padding: 15px;
            text-align: center;
          }
          .school-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 14px;
            opacity: 0.9;
          }
          .main-content {
            padding: 20px;
            background: white;
          }
          .student-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
          }
          .photo-section {
            flex-shrink: 0;
          }
          .student-photo {
            width: 100px;
            height: 120px;
            border: 3px solid #4a90e2;
            border-radius: 8px;
            object-fit: cover;
            display: block;
          }
          .photo-placeholder {
            width: 100px;
            height: 120px;
            border: 3px dashed #ccc;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            color: #999;
            font-size: 12px;
            text-align: center;
            padding: 10px;
          }
          .info-section {
            flex: 1;
            margin-left: 20px;
          }
          .student-name {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
          }
          .info-row {
            display: flex;
            margin-bottom: 6px;
          }
          .label {
            font-weight: bold;
            color: #666;
            min-width: 90px;
          }
          .value {
            color: #333;
            font-weight: 500;
          }
          .qr-section {
            text-align: center;
            padding: 20px;
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            margin: 20px 0;
          }
          .qr-title {
            font-size: 16px;
            font-weight: bold;
            color: #4a90e2;
            margin-bottom: 15px;
          }
          .qr-code {
            margin: 0 auto;
            display: inline-block;
            padding: 15px;
            background: white;
            border: 2px dashed #4a90e2;
            border-radius: 10px;
          }
          .security-notice {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 12px;
            margin: 15px 0;
          }
          .security-notice h4 {
            margin: 0 0 8px 0;
            color: #856404;
            font-size: 14px;
            display: flex;
            align-items: center;
          }
          .security-notice h4::before {
            content: "⚠️";
            margin-right: 8px;
          }
          .security-notice p {
            margin: 0;
            color: #856404;
            font-size: 13px;
            line-height: 1.5;
          }
          .instructions {
            background: #e3f2fd;
            border: 2px solid #4a90e2;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
          }
          .instructions h4 {
            margin: 0 0 10px 0;
            color: #1976d2;
            font-size: 15px;
          }
          .instructions ul {
            margin: 0;
            padding-left: 20px;
          }
          .instructions li {
            color: #1976d2;
            font-size: 13px;
            margin-bottom: 5px;
            line-height: 1.4;
          }
          .footer {
            background: #f8f9fa;
            padding: 12px;
            font-size: 11px;
            color: #666;
            text-align: center;
            border-top: 2px solid #e0e0e0;
          }
          .verification-box {
            background: #e8f5e9;
            border: 2px solid #4caf50;
            border-radius: 8px;
            padding: 12px;
            margin: 15px 0;
            text-align: center;
          }
          .verification-box h4 {
            margin: 0 0 5px 0;
            color: #2e7d32;
            font-size: 14px;
          }
          .verification-box p {
            margin: 0;
            color: #2e7d32;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="school-name">🏫 School Class Management System</div>
            <div class="subtitle">Student Identification & Attendance Card</div>
          </div>
          
          <div class="main-content">
            <!-- Student Header with Photo -->
            <div class="student-header">
              <div class="photo-section">
                ${hasPhoto ? 
                  `<img src="${photoUrl}" alt="${student.name}" class="student-photo" />` :
                  `<div class="photo-placeholder">
                    <div style="font-size: 32px; margin-bottom: 5px;">👤</div>
                    <div>Student Photo</div>
                    <div style="font-size: 10px; margin-top: 5px;">Affix photo here</div>
                  </div>`
                }
              </div>
              <div class="info-section">
                <div class="student-name">${student.name}</div>
                <div class="info-row">
                  <span class="label">Student ID:</span>
                  <span class="value">${student.studentId}</span>
                </div>
                <div class="info-row">
                  <span class="label">Class:</span>
                  <span class="value">${student.class}</span>
                </div>
                <div class="info-row">
                  <span class="label">Issued:</span>
                  <span class="value">${new Date().toLocaleDateString('en-NZ', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>

            <!-- Verification Notice -->
            <div class="verification-box">
              <h4>✓ Teacher Verification Required</h4>
              <p>Compare photo with student before marking attendance</p>
            </div>

            <!-- QR Code Section -->
            <div class="qr-section">
              <div class="qr-title">📱 Scan for Attendance</div>
              <div class="qr-code">
                <div style="width: 180px; height: 180px; background: #f0f0f0; border: 2px dashed #4a90e2; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                  <div style="text-align: center; color: #999;">
                    <div style="font-size: 40px; margin-bottom: 5px;">📷</div>
                    <div style="font-size: 14px; font-weight: bold;">QR CODE</div>
                    <div style="font-size: 11px; margin-top: 5px;">${student.studentId}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Security Notice -->
            <div class="security-notice">
              <h4>Security Notice - Prevent Fraud</h4>
              <p><strong>Teachers:</strong> Always verify the student's face matches the photo on this card before marking attendance. This prevents students from signing in for their friends.</p>
            </div>

            <!-- Instructions -->
            <div class="instructions">
              <h4>📋 Instructions for Student:</h4>
              <ul>
                <li><strong>Keep this card safe</strong> and bring it to school daily</li>
                <li><strong>Laminate this card</strong> for durability (recommended)</li>
                <li>Present card with QR code and photo to teacher</li>
                <li><strong>Do NOT lend</strong> this card to classmates</li>
                <li>Report lost or damaged cards to admin immediately</li>
                <li>Keep a backup copy at home</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <strong>For Teachers:</strong> Use your phone camera to scan this QR code<br>
            Generated: ${new Date().toLocaleString('en-NZ')} • Valid for current academic year<br>
            © School Class Management System
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Generator</Text>
        <TouchableOpacity 
          onPress={handlePrint} 
          style={styles.printButton}
          disabled={isGenerating}
        >
          <Ionicons name="print" size={24} color="#4a90e2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* QR Code Display */}
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>Student QR Code</Text>
          <View style={styles.qrCodeContainer}>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={qrData}
                size={qrSize}
                color="#000000"
                backgroundColor="#FFFFFF"
                logoSize={30}
                logoMargin={2}
                logoBorderRadius={15}
              />
            </View>
          </View>
          <Text style={styles.qrNote}>
            This QR code contains encrypted student information
          </Text>
        </View>

        {/* Student Information */}
        <View style={styles.studentInfoContainer}>
          <Text style={styles.studentInfoTitle}>Student Details</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{studentData.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Student ID:</Text>
            <Text style={styles.infoValue}>{studentData.studentId}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Class:</Text>
            <Text style={styles.infoValue}>{studentData.class}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Generated:</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleString()}</Text>
          </View>
        </View>

        {/* Size Controls */}
        <View style={styles.sizeControlsContainer}>
          <Text style={styles.sizeControlsTitle}>QR Code Size</Text>
          <View style={styles.sizeButtons}>
            <TouchableOpacity
              style={[styles.sizeButton, qrSize === 150 && styles.sizeButtonActive]}
              onPress={() => setQrSize(150)}
            >
              <Text style={styles.sizeButtonText}>Small</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sizeButton, qrSize === 200 && styles.sizeButtonActive]}
              onPress={() => setQrSize(200)}
            >
              <Text style={styles.sizeButtonText}>Medium</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sizeButton, qrSize === 250 && styles.sizeButtonActive]}
              onPress={() => setQrSize(250)}
            >
              <Text style={styles.sizeButtonText}>Large</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.printActionButton]}
            onPress={handlePrint}
            disabled={isGenerating}
          >
            <Ionicons name="print" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              {isGenerating ? 'Generating...' : 'Print QR Code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.closeActionButton]}
            onPress={onClose}
          >
            <Text style={styles.closeActionButtonText}>Close</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  printButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  studentInfoContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  studentInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  sizeControlsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sizeControlsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sizeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  sizeButtonActive: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  sizeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  printActionButton: {
    backgroundColor: '#4a90e2',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeActionButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  closeActionButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default QRCodeGenerator;
