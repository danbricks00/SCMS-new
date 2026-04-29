import type { NfcPrepareResult } from './types';

export async function prepareNfc(): Promise<NfcPrepareResult> {
  return {
    ok: false,
    supported: false,
    reason: 'web',
    message:
      'NFC is not available in the browser. Use the mobile app on an NFC-capable Android device, or use QR code scanning.',
  };
}

export async function shutdownNfcPrep(): Promise<void> {
  // no-op on web
}
