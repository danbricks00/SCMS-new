import React from 'react';
import { Image } from 'react-native';

export default function QrRasterImage({ dataUrl, pixelSize }) {
  const size = Math.round(pixelSize);
  if (!dataUrl) return null;

  return (
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
  );
}
