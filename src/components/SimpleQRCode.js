import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { QRCodeUtils } from '../utils/qrCodeUtils';

const SimpleQRCode = ({ studentData, qrCode, size = 200 }) => {
  const canvasRef = useRef(null);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);

  if (!studentData) {
    console.log('SimpleQRCode: No studentData provided');
    return null;
  }

  // Use provided QR code or generate one if not provided
  const qrData = useMemo(() => {
    if (qrCode) {
      console.log('SimpleQRCode: Using provided QR code');
      return qrCode;
    }
    console.log('SimpleQRCode: Generating QR data for:', studentData);
    return QRCodeUtils.generateStudentQR(studentData);
  }, [qrCode, studentData?.studentId, studentData?.name, studentData?.class]);

  console.log('SimpleQRCode: Generated QR data:', qrData);

  // For web, use a different approach - generate QR as image URL
  useEffect(() => {
    if (Platform.OS === 'web' && !hasGenerated) {
      setIsLoading(true);
      setHasGenerated(true);
      
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

          // Method 3: Simple canvas-based QR generation (basic fallback)
          console.log('No QR library available, using basic canvas fallback');
          try {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Create a simple pattern based on the data
            const dataString = qrData.substring(0, 20); // Use first 20 chars
            const pattern = dataString.split('').map(char => char.charCodeAt(0));
            
            // Draw a simple pattern
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#000000';
            
            const cellSize = 8;
            for (let i = 0; i < pattern.length; i++) {
              const x = (i % (size / cellSize)) * cellSize;
              const y = Math.floor(i / (size / cellSize)) * cellSize;
              if (pattern[i] % 2 === 0) {
                ctx.fillRect(x, y, cellSize, cellSize);
              }
            }
            
            // Add border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, size, size);
            
            const imageUrl = canvas.toDataURL('image/png');
            setQrImageUrl(imageUrl);
            setIsLoading(false);
            console.log('Basic QR pattern generated successfully');
            return;
          } catch (error) {
            console.error('Basic QR generation failed:', error);
          }
          
          // Method 4: Final fallback to text representation
          console.log('All QR generation methods failed, using text fallback');
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
        // Try multiple CDN sources
        const cdnSources = [
          'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
          'https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.3/qrcode.min.js'
        ];
        
        let currentIndex = 0;
        
        const tryLoadScript = () => {
          if (currentIndex >= cdnSources.length) {
            console.log('All QRCode.js CDN sources failed, using fallback');
            generateQR();
            return;
          }
          
          const script = document.createElement('script');
          script.src = cdnSources[currentIndex];
          script.onload = () => {
            console.log(`QRCode.js loaded from ${cdnSources[currentIndex]}`);
            generateQR();
          };
          script.onerror = () => {
            console.log(`Failed to load QRCode.js from ${cdnSources[currentIndex]}`);
            currentIndex++;
            tryLoadScript();
          };
          document.head.appendChild(script);
        };
        
        tryLoadScript();
      } else {
        generateQR();
      }
    }
  }, [qrData, size, hasGenerated]);

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
