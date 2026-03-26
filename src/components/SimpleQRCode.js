import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const SimpleQRCode = ({ studentData, qrCode, size = 200, onQrImageDataUrl }) => {
  const qrRef = useRef(null);

  useEffect(() => {
    if (!studentData || !qrCode) return;
    if (!onQrImageDataUrl) return;
    if (!qrRef.current) return;
    if (typeof qrRef.current.toDataURL !== 'function') return;

    // Export the QR as a data URL for printing (Expo Go print dialog / HTML img tag).
    // react-native-qrcode-svg uses react-native-svg which provides `toDataURL(callback)`.
    try {
      qrRef.current.toDataURL((dataUrl) => {
        if (typeof onQrImageDataUrl === 'function') {
          // Some implementations return a full data URL, others return raw base64.
          let normalized = dataUrl;
          if (typeof normalized === 'string' && !normalized.startsWith('data:')) {
            normalized = `data:image/png;base64,${normalized}`;
          }
          onQrImageDataUrl(normalized);
        }
      });
    } catch (e) {
      // If export fails, printing can fall back to web-only logic.
    }
  }, [qrCode, size, onQrImageDataUrl]);

  if (!studentData || !qrCode) {
    return (
      <View style={styles.container}>
        <View style={styles.qrWrapper}>
          <Text style={styles.loadingText}>Loading QR Code...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.qrWrapper}>
        <QRCode
          value={qrCode || ''}
          size={size}
          color="#000000"
          backgroundColor="#FFFFFF"
          getRef={(c) => {
            qrRef.current = c;
          }}
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
});

export default SimpleQRCode;
