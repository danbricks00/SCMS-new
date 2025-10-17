import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { QRCodeUtils } from '../utils/qrCodeUtils';

const SimpleQRCode = ({ studentData, size = 200 }) => {
  const canvasRef = useRef(null);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  if (!studentData) {
    console.log('SimpleQRCode: No studentData provided');
    return null;
  }

  console.log('SimpleQRCode: studentData:', studentData);
  const qrData = QRCodeUtils.generateStudentQR(studentData);
  console.log('SimpleQRCode: Generated QR data:', qrData);

  // For web, use a different approach - generate QR as image URL
  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsLoading(true);
      
      // Try multiple QR generation methods
      const generateQR = async () => {
        try {
          // Method 1: Try QRCode.js with canvas
          if (window.QRCode) {
            const canvas = document.createElement('canvas');
            await window.QRCode.toCanvas(canvas, qrData, {
              width: size,
              height: size,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });
            const imageUrl = canvas.toDataURL('image/png');
            setQrImageUrl(imageUrl);
            setIsLoading(false);
            console.log('QR Code generated successfully with QRCode.js');
            return;
          }

          // Method 2: Try qrcode-generator library
          if (window.qrcode) {
            const qr = window.qrcode(0, 'M');
            qr.addData(qrData);
            qr.make();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const cellSize = size / qr.getModuleCount();
            canvas.width = size;
            canvas.height = size;
            
            for (let row = 0; row < qr.getModuleCount(); row++) {
              for (let col = 0; col < qr.getModuleCount(); col++) {
                ctx.fillStyle = qr.isDark(row, col) ? '#000000' : '#FFFFFF';
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
              }
            }
            
            const imageUrl = canvas.toDataURL('image/png');
            setQrImageUrl(imageUrl);
            setIsLoading(false);
            console.log('QR Code generated successfully with qrcode-generator');
            return;
          }

          // Method 3: Fallback to simple text representation
          console.log('No QR library available, using fallback');
          setQrImageUrl(null);
          setIsLoading(false);
        } catch (error) {
          console.error('QR Code generation error:', error);
          setQrImageUrl(null);
          setIsLoading(false);
        }
      };

      // Load QRCode.js library if not already loaded
      if (!window.QRCode) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        script.onload = () => {
          console.log('QRCode.js loaded');
          generateQR();
        };
        script.onerror = () => {
          console.log('Failed to load QRCode.js, trying alternative');
          generateQR();
        };
        document.head.appendChild(script);
      } else {
        generateQR();
      }
    }
  }, [qrData, size]);

  if (Platform.OS === 'web') {
    if (isLoading) {
      return (
        <View style={styles.container}>
          <View style={styles.qrWrapper}>
            <Text style={styles.loadingText}>Generating QR Code...</Text>
          </View>
        </View>
      );
    }

    if (qrImageUrl) {
      return (
        <View style={styles.container}>
          <View style={styles.qrWrapper}>
            <img
              src={qrImageUrl}
              alt="Student QR Code"
              width={size}
              height={size}
              style={{ display: 'block' }}
            />
          </View>
        </View>
      );
    }

    // Fallback: Show QR data as text
    return (
      <View style={styles.container}>
        <View style={styles.qrWrapper}>
          <Text style={styles.fallbackText}>QR Code</Text>
          <Text style={styles.fallbackData}>{qrData.substring(0, 20)}...</Text>
        </View>
      </View>
    );
  }

  // For native platforms, use react-native-qrcode-svg
  return (
    <View style={styles.container}>
      <View style={styles.qrWrapper}>
        <QRCode
          value={qrData}
          size={size}
          color="#000000"
          backgroundColor="#FFFFFF"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackData: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});

export default SimpleQRCode;
