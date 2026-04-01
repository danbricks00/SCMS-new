import { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useColorScheme } from '../../hooks/use-color-scheme';

/** Web dark mode can make SVG strokes read as white on white; opt this block out of that. */
const QR_LIGHT_ENCLAVE = Platform.select({
  web: {
    backgroundColor: '#FFFFFF',
    colorScheme: 'light',
    forcedColorAdjust: 'none',
  },
  default: {},
});

const SimpleQRCode = ({ studentData, qrCode, size = 200, onQrImageDataUrl }) => {
  const qrRef = useRef(null);
  const colorScheme = useColorScheme();
  const [webRasterUri, setWebRasterUri] = useState(null);

  useEffect(() => {
    if (!studentData || !qrCode) return;
    if (!onQrImageDataUrl) return;
    if (!qrRef.current) return;
    if (typeof qrRef.current.toDataURL !== 'function') return;

    try {
      qrRef.current.toDataURL((dataUrl) => {
        if (typeof onQrImageDataUrl === 'function') {
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

  // Web + dark: SVG often renders wrong (white box). PNG from toDataURL is reliable on Vercel.
  useEffect(() => {
    if (Platform.OS !== 'web' || !studentData || !qrCode) {
      setWebRasterUri(null);
      return;
    }
    let cancelled = false;
    let attempts = 0;

    const tryCapture = () => {
      if (cancelled) return;
      attempts += 1;
      if (!qrRef.current || typeof qrRef.current.toDataURL !== 'function') {
        if (attempts < 50) {
          setTimeout(tryCapture, 40);
        }
        return;
      }
      try {
        qrRef.current.toDataURL((dataUrl) => {
          if (cancelled) return;
          let n = dataUrl;
          if (typeof n === 'string' && !n.startsWith('data:')) {
            n = `data:image/png;base64,${n}`;
          }
          setWebRasterUri(n);
        });
      } catch (e) {
        setWebRasterUri(null);
      }
    };

    const t = setTimeout(tryCapture, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [qrCode, size, studentData]);

  const webQrClass = Platform.OS === 'web' ? 'scms-qr-light' : undefined;
  const showWebDarkRaster =
    Platform.OS === 'web' && colorScheme === 'dark' && webRasterUri;

  if (!studentData || !qrCode) {
    return (
      <View style={styles.container}>
        <View className={webQrClass} style={[styles.qrWrapper, QR_LIGHT_ENCLAVE]}>
          <Text style={styles.loadingText}>Loading QR Code...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View className={webQrClass} style={[styles.qrWrapper, QR_LIGHT_ENCLAVE]}>
        <View
          style={{
            position: 'relative',
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ opacity: showWebDarkRaster ? 0 : 1 }}>
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
          {showWebDarkRaster ? (
            <Image
              accessibilityLabel="Student QR code"
              source={{ uri: webRasterUri }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: size,
                height: size,
              }}
              resizeMode="contain"
            />
          ) : null}
        </View>
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
