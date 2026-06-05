import React from 'react';

/**
 * Native HTML <img> on web — avoids react-native-qrcode-svg / RN Image Blink rendering bugs.
 */
export default function QrRasterImage({ dataUrl, pixelSize, className = 'scms-qr-light scms-qr-printable' }) {
  const size = Math.round(pixelSize);
  if (!dataUrl) return null;

  return (
    <img
      src={dataUrl}
      alt="Student QR code"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'block',
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        backgroundColor: '#FFFFFF',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      }}
    />
  );
}
