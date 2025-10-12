import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QRCodeUtils, QR_SCAN_RESULTS } from '../utils/qrCodeUtils';

const { width, height } = Dimensions.get('window');

// Check if it's a mobile browser (iPhone, Android browser, etc.)
const isMobileBrowser = () => {
  if (Platform.OS !== 'web') return false;
  
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
};

const isWeb = Platform.OS === 'web';
const isDesktopWeb = isWeb && !isMobileBrowser();

const QRScanner = ({ onScan, onClose, isVisible }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Only warn if on desktop web (not mobile browsers)
    if (isDesktopWeb) {
      Alert.alert(
        'Desktop Browser Detected',
        'QR code scanning works best on mobile phones. If you\'re on a phone, the camera should work. On desktop, please open this on your mobile device.',
        [{ text: 'OK' }]
      );
    }
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera permissions in your device settings to scan QR codes.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      setHasPermission(false);
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    console.log('Barcode scanned:', { type, data: data.substring(0, 50) + '...' });
    
    if (scanned || !isScanning) {
      console.log('Scan ignored - already scanned or not scanning');
      return;
    }
    
    setScanned(true);
    setIsScanning(false);

    // Haptic feedback for successful scan
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.log('Haptics not available');
    }

    try {
      console.log('Attempting to decrypt QR code...');
      // Decrypt and validate QR code
      const studentData = QRCodeUtils.decryptStudentQR(data);
      
      console.log('Decryption result:', studentData ? 'Success' : 'Failed');
      
      if (studentData) {
        // Successful scan
        console.log('Valid student QR code scanned:', studentData.name);
        onScan({
          result: QR_SCAN_RESULTS.SUCCESS,
          studentData,
          timestamp: new Date().toISOString()
        });
      } else {
        // Invalid QR code
        console.log('Invalid QR code format');
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {
          console.log('Haptics not available');
        }
        onScan({
          result: QR_SCAN_RESULTS.INVALID,
          error: 'Invalid QR code format',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('QR Scan Error:', error);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {
        console.log('Haptics not available');
      }
      onScan({
        result: QR_SCAN_RESULTS.ERROR,
        error: error.message || 'Failed to process QR code',
        timestamp: new Date().toISOString()
      });
    }

    // Reset scanner after 2 seconds
    setTimeout(() => {
      console.log('Resetting scanner...');
      setScanned(false);
      setIsScanning(true);
    }, 2000);
  };

  const resetScanner = () => {
    setScanned(false);
    setIsScanning(true);
  };

  if (!isVisible) return null;

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Ionicons name="camera-off" size={64} color="#ff6b6b" />
          <Text style={styles.messageText}>No access to camera</Text>
          <Text style={styles.messageSubtext}>
            Please enable camera permission to scan QR codes
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={getCameraPermissions}
          >
            <Text style={styles.retryButtonText}>Retry Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Desktop web only - show message (mobile browsers should use camera)
  if (isDesktopWeb) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Scanner - Desktop</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.webMessageContainer}>
          <Ionicons name="desktop" size={80} color="#4a90e2" />
          <Text style={styles.webMessageTitle}>Mobile Device Required</Text>
          <Text style={styles.webMessageText}>
            QR code scanning requires a mobile phone with a camera.
          </Text>
          <Text style={styles.webMessageSubtext}>
            The camera feature works on mobile browsers (Safari, Chrome on phone) but not on desktop browsers.
          </Text>
          
          <View style={styles.webInstructions}>
            <Text style={styles.webInstructionsTitle}>📱 To scan QR codes:</Text>
            <View style={styles.instructionItem}>
              <Text style={styles.bulletPoint}>1.</Text>
              <Text style={styles.instructionText}>Open this app on your iPhone or Android phone browser</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.bulletPoint}>2.</Text>
              <Text style={styles.instructionText}>Navigate to Teacher Portal</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.bulletPoint}>3.</Text>
              <Text style={styles.instructionText}>Click "Mark Present" - camera will open</Text>
            </View>
          </View>

          <View style={styles.webTestInfo}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.webTestInfoText}>
              On iPhone: Use Safari or Chrome. On Android: Use Chrome or Firefox.
            </Text>
          </View>

          <TouchableOpacity style={styles.webCloseButton} onPress={onClose}>
            <Text style={styles.webCloseButtonText}>Close Scanner</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Student QR Code</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Platform Notice for Mobile */}
      {(Platform.OS === 'ios' || Platform.OS === 'android') && (
        <View style={styles.platformNotice}>
          <Ionicons name="phone-portrait" size={16} color="#4CAF50" />
          <Text style={styles.platformNoticeText}>
            {Platform.OS === 'ios' ? '📱 iPhone' : '📱 Android'} - Perfect for scanning!
          </Text>
        </View>
      )}

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Scanning overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Scanning line animation */}
              {isScanning && (
                <View style={[styles.scanLine, scanned && styles.scanLineScanned]} />
              )}
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              {scanned ? 'Processing...' : 'Position QR code within the frame'}
            </Text>
            {scanned && (
              <TouchableOpacity onPress={resetScanner} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  platformNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e9',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  platformNoticeText: {
    color: '#2e7d32',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#4a90e2',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4a90e2',
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  scanLineScanned: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  messageText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  messageSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4a90e2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Web-specific styles
  webMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  webMessageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  webMessageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  webMessageSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  webInstructions: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  webInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a90e2',
    marginRight: 12,
    minWidth: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  webTestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 30,
    maxWidth: 400,
  },
  webTestInfoText: {
    fontSize: 13,
    color: '#e65100',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  webCloseButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  webCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRScanner;
