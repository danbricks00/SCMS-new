import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { QRCodeUtils } from '../utils/qrCodeUtils';

const SimpleQRCode = ({ studentData, size = 200 }) => {
  const canvasRef = useRef(null);

  if (!studentData) {
    console.log('SimpleQRCode: No studentData provided');
    return null;
  }

  console.log('SimpleQRCode: studentData:', studentData);
  const qrData = QRCodeUtils.generateStudentQR(studentData);
  console.log('SimpleQRCode: Generated QR data:', qrData);

  // For web, use canvas-based QR code generation
  useEffect(() => {
    if (Platform.OS === 'web' && canvasRef.current) {
      // Load QRCode.js library dynamically
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
      script.onload = () => {
        if (window.QRCode) {
          window.QRCode.toCanvas(canvasRef.current, qrData, {
            width: size,
            height: size,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          }, (error) => {
            if (error) {
              console.error('QR Code generation error:', error);
            } else {
              console.log('QR Code generated successfully on canvas');
            }
          });
        }
      };
      document.head.appendChild(script);

      return () => {
        // Cleanup
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [qrData, size]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.qrWrapper}>
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{ display: 'block' }}
          />
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
});

export default SimpleQRCode;
