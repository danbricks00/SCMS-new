import React from 'react';
import { Image, Platform, View } from 'react-native';

const WEB_QR_CLASS = 'scms-qr-light scms-qr-printable';

/**
 * Raster QR display — uses RN View + Image (safe on Expo web bundle).
 * Do not use raw HTML <img> JSX; it crashes RN Web with an uncaught invariant error.
 */
export default function QrRasterImage({ dataUrl, pixelSize }) {
  const size = Math.round(pixelSize);
  if (!dataUrl) return null;

  return (
    <View
      className={Platform.OS === 'web' ? WEB_QR_CLASS : undefined}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        accessibilityLabel="Student QR code"
        source={{ uri: dataUrl }}
        style={{
          width: size,
          height: size,
          backgroundColor: '#FFFFFF',
        }}
        resizeMode="contain"
      />
    </View>
  );
}
