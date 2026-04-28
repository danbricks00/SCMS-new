import type { NfcPrepareResult } from './types';

/**
 * Safe NFC bootstrap: never throws — callers show QR fallback on failure.
 * Expo Go / missing native build: require() or native calls may fail; we catch everything.
 */
export async function prepareNfc(): Promise<NfcPrepareResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-nfc-manager');
    const NfcManager = mod.default ?? mod;
    if (!NfcManager || typeof NfcManager.isSupported !== 'function') {
      return {
        ok: false,
        supported: false,
        reason: 'module',
        message:
          'NFC native module is not available in this build. Use a development build with react-native-nfc-manager, or use QR code.',
      };
    }

    const supported = await NfcManager.isSupported();
    if (!supported) {
      return {
        ok: false,
        supported: false,
        reason: 'unsupported',
        message: 'This device does not support NFC. Use QR code scanning instead.',
      };
    }

    await NfcManager.start();
    return { ok: true, supported: true };
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === 'string'
          ? e
          : 'NFC could not be started. Use QR code scanning instead.';
    return {
      ok: false,
      supported: false,
      reason: 'error',
      message,
    };
  }
}

export async function shutdownNfcPrep(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-nfc-manager');
    const NfcManager = mod.default ?? mod;
    if (NfcManager?.cancelTechnologyRequest) {
      await NfcManager.cancelTechnologyRequest().catch(() => {});
    }
    if (NfcManager?.unregisterTagEvent) {
      await NfcManager.unregisterTagEvent().catch(() => {});
    }
  } catch {
    // ignore
  }
}
