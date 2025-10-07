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
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Student QR Code - ${student.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .container {
            max-width: 400px;
            margin: 0 auto;
            text-align: center;
          }
          .header {
            background: #4a90e2;
            color: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 10px;
          }
          .school-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .qr-container {
            background: white;
            padding: 20px;
            border: 2px solid #ddd;
            border-radius: 10px;
            margin-bottom: 20px;
          }
          .qr-code {
            margin: 0 auto;
            display: block;
          }
          .student-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: left;
          }
          .student-name {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          .label {
            font-weight: bold;
            color: #666;
          }
          .value {
            color: #333;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #999;
            text-align: center;
          }
          .instructions {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin-top: 20px;
            text-align: left;
          }
          .instructions h4 {
            margin: 0 0 10px 0;
            color: #856404;
          }
          .instructions p {
            margin: 5px 0;
            color: #856404;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="school-name">School Management System</div>
            <div>Student QR Code</div>
          </div>
          
          <div class="qr-container">
            <div class="qr-code">
              <!-- QR Code will be generated here -->
              <div style="width: ${qrSize}px; height: ${qrSize}px; background: #f0f0f0; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                <div style="text-align: center; color: #999;">
                  <div style="font-size: 24px; margin-bottom: 5px;">QR</div>
                  <div style="font-size: 12px;">Code</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="student-info">
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
              <span class="label">Generated:</span>
              <span class="value">${new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          <div class="instructions">
            <h4>Instructions for Student:</h4>
            <p>• Keep this QR code safe and bring it to school daily</p>
            <p>• Present QR code to teacher for attendance marking</p>
            <p>• Do not share or duplicate this QR code</p>
            <p>• Contact admin if QR code is lost or damaged</p>
          </div>
          
          <div class="footer">
            Generated by School Management System<br>
            ${new Date().toLocaleString()}
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
            <QRCode
              value={qrData}
              size={qrSize}
              color="#000"
              backgroundColor="#fff"
              logoSize={30}
              logoMargin={2}
              logoBorderRadius={15}
            />
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
