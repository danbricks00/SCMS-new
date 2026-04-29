import { Platform } from 'react-native';

import type { NfcPrepareResult } from './types';

/**
 * Platform switch: web never loads `react-native-nfc-manager` (avoids bundle / resolve errors).
 */
export async function prepareNfc(): Promise<NfcPrepareResult> {
  if (Platform.OS === 'web') {
    const { prepareNfc: prep } = await import('./nfcAdapter.web');
    return prep();
  }
  const { prepareNfc: prep } = await import('./nfcAdapter.native');
  return prep();
}

export async function shutdownNfcPrep(): Promise<void> {
  if (Platform.OS === 'web') {
    const { shutdownNfcPrep: shut } = await import('./nfcAdapter.web');
    return shut();
  }
  const { shutdownNfcPrep: shut } = await import('./nfcAdapter.native');
  return shut();
}
