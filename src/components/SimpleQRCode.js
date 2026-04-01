import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

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
  /**
   * On web, always render QR via `qrcode` (PNG data URL). SVG QR is unreliable under
   * prefers-color-scheme: dark / Chrome; RN's useColorScheme also stays "light" until
   * hydration, so a dark-only raster path never ran reliably in production.
   */
  const [webRasterUri, setWebRasterUri] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !qrCode) {
      setWebRasterUri(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('qrcode');
        const QRCodeLib = mod.default ?? mod;
        const dataUrl = await QRCodeLib.toDataURL(qrCode, {
          width: size,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        });
        if (!cancelled) {
          setWebRasterUri(dataUrl);
        }
      } catch (e) {
        console.warn('[SimpleQRCode] Web QR raster failed:', e?.message || e);
        if (!cancelled) setWebRasterUri(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qrCode, size]);

  // Pass PNG to parent for print
  useEffect(() => {
    if (!onQrImageDataUrl) return;
    if (Platform.OS === 'web') {
      if (webRasterUri) {
        onQrImageDataUrl(webRasterUri);
      }
      return;
    }
    if (!studentData || !qrCode) return;
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
      // Print can fall back to web-only logic in StudentPortal.
    }
  }, [webRasterUri, onQrImageDataUrl, studentData, qrCode, size]);

  const webQrClass = Platform.OS === 'web' ? 'scms-qr-light' : undefined;

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
          {Platform.OS === 'web' ? (
            webRasterUri ? (
              <Image
                accessibilityLabel="Student QR code"
                source={{ uri: webRasterUri }}
                style={{ width: size, height: size }}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.darkLoading, { width: size, height: size }]}>
                <ActivityIndicator size="large" color="#333" />
              </View>
            )
          ) : (
            <QRCode
              value={qrCode || ''}
              size={size}
              color="#000000"
              backgroundColor="#FFFFFF"
              getRef={(c) => {
                qrRef.current = c;
              }}
            />
          )}
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
  darkLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default SimpleQRCode;
