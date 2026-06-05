export const QR_FOREGROUND = '#000000';
export const QR_BACKGROUND = '#FFFFFF';
export const DEFAULT_QR_PIXEL_SIZE = 200;

/**
 * Rasterize encrypted QR payload to a PNG data URL (base64). Reliable on Blink + @media print.
 */
export async function qrPayloadToDataUrl(qrPayload, pixelSize = DEFAULT_QR_PIXEL_SIZE) {
  const size = Math.round(pixelSize);
  if (!qrPayload) {
    throw new Error('Missing QR payload');
  }
  const mod = await import('qrcode');
  const QRCodeLib = mod.default ?? mod;
  return QRCodeLib.toDataURL(qrPayload, {
    width: size,
    margin: 1,
    color: { dark: QR_FOREGROUND, light: QR_BACKGROUND },
    errorCorrectionLevel: 'M',
  });
}

/** CSS injected into printable HTML documents. */
export function qrPrintCssRules(pixelSize = DEFAULT_QR_PIXEL_SIZE) {
  const s = Math.round(pixelSize);
  return `
    .scms-print-qr {
      width: ${s}px;
      height: ${s}px;
      margin: 0 auto;
      padding: 10px;
      background: #ffffff !important;
      box-sizing: content-box;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
      color-scheme: light;
      forced-color-adjust: none;
    }
    .scms-print-qr img,
    .scms-print-qr-img {
      display: block !important;
      width: ${s}px !important;
      height: ${s}px !important;
      min-width: ${s}px !important;
      min-height: ${s}px !important;
      max-width: ${s}px !important;
      max-height: ${s}px !important;
      background-color: #ffffff !important;
      print-color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
      forced-color-adjust: none !important;
    }
    @media print {
      body {
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
        background: #ffffff !important;
      }
      .scms-print-qr,
      .scms-print-qr img,
      .scms-print-qr-img {
        visibility: visible !important;
        opacity: 1 !important;
        page-break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;
}

/** Base64 <img> for print HTML — Chrome print preview requires explicit dimensions. */
export function qrPrintImgTag(dataUrl, pixelSize = DEFAULT_QR_PIXEL_SIZE) {
  const s = Math.round(pixelSize);
  return `<img class="scms-print-qr-img scms-qr-light" src="${dataUrl}" alt="Student QR Code" width="${s}" height="${s}" />`;
}
