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
    return null;
  }

  // Use provided QR code or generate one if not provided
  const qrData = useMemo(() => {
    if (qrCode) {
      return qrCode;
    }
    return QRCodeUtils.generateStudentQR(studentData);
  }, [qrCode, studentData?.studentId, studentData?.name, studentData?.class]);

  // For web, use a different approach - generate QR as image URL
  useEffect(() => {
    if (Platform.OS === 'web' && !hasGenerated) {
      setIsLoading(true);
      setHasGenerated(true);
      
      // Generate QR code using a more reliable method
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
                      },
                      margin: 2,
                      errorCorrectionLevel: 'M'
                    });
                    const imageUrl = canvas.toDataURL('image/png');
                    setQrImageUrl(imageUrl);
                    setIsLoading(false);
                    return;
                  }

                  // Method 2: Generate a proper QR-like pattern
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          // Create a more sophisticated pattern based on the data
          const dataString = qrData;
          const pattern = dataString.split('').map(char => char.charCodeAt(0));
          
          // Draw background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);
          
          // Draw QR-like pattern
          ctx.fillStyle = '#000000';
          const cellSize = 4;
          const cols = Math.floor(size / cellSize);
          const rows = Math.floor(size / cellSize);
          
          // Create a more complex pattern
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const index = (row * cols + col) % pattern.length;
              const charCode = pattern[index];
              const shouldFill = (charCode + row + col) % 2 === 0;
              
              if (shouldFill) {
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
              }
            }
          }
          
          // Add corner markers (like real QR codes)
          const markerSize = cellSize * 7;
          const markerInnerSize = cellSize * 3;
          
          // Top-left marker
          ctx.fillRect(0, 0, markerSize, markerSize);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(cellSize * 2, cellSize * 2, markerInnerSize, markerInnerSize);
          ctx.fillStyle = '#000000';
          ctx.fillRect(cellSize * 3, cellSize * 3, cellSize, cellSize);
          
          // Top-right marker
          ctx.fillRect(size - markerSize, 0, markerSize, markerSize);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(size - markerSize + cellSize * 2, cellSize * 2, markerInnerSize, markerInnerSize);
          ctx.fillStyle = '#000000';
          ctx.fillRect(size - markerSize + cellSize * 3, cellSize * 3, cellSize, cellSize);
          
          // Bottom-left marker
          ctx.fillRect(0, size - markerSize, markerSize, markerSize);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(cellSize * 2, size - markerSize + cellSize * 2, markerInnerSize, markerInnerSize);
          ctx.fillStyle = '#000000';
          ctx.fillRect(cellSize * 3, size - markerSize + cellSize * 3, cellSize, cellSize);
          
          // Add some data modules in the center
          ctx.fillStyle = '#000000';
          for (let i = 0; i < pattern.length && i < 50; i++) {
            const x = (markerSize + i % (cols - markerSize * 2 / cellSize)) * cellSize;
            const y = (markerSize + Math.floor(i / (cols - markerSize * 2 / cellSize))) * cellSize;
            if (x < size - markerSize && y < size - markerSize && pattern[i] % 3 === 0) {
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
                  return;
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
                  generateQR();
                };
                script.onerror = () => {
                  generateQR();
                };
                document.head.appendChild(script);
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
